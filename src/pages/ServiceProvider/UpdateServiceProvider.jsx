/** @format */

import React, { useEffect, useRef, useState } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Row,
  Col,
  message,
  Modal,
  Radio,
} from "antd";

import {
  Box,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Button as MuiButton,
  Typography as MuiTypography,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Chip,
  Collapse,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { useNavigate, useParams } from "react-router-dom";

import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Check,
  Mail,
  User,
  Briefcase,
  ClipboardList,
  CheckCircle2,
  Info,
  ChevronDown,
  Phone,
  Clock,
  Search,
} from "lucide-react";

import { IoLocationOutline } from "react-icons/io5";

import {
  GetUserById,
  EditUserById,
  StateAPI,
  CityAPI,
  AddNewUserAddress,
  EditAddress,
  DeleteUserAddress,
  GetHiringFormsByEmail,
  ChangeEmployeeRole,
} from "../../services/Api/Api";

// =========================================================
// US STATE ABBREVIATIONS
// =========================================================

const STATE_ABBREVIATIONS = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

// =========================================================
// COUNTRIES
//
// The hiring form now collects a country. Older submissions were
// taken before that field existed and come back with an empty
// string — those are treated as USA, matching what every existing
// hiring form actually was.
// =========================================================

const COUNTRY_IDS = {
  USA: 233,
  CANADA: 39,
};

const COUNTRY_NAMES_BY_ID = {
  [COUNTRY_IDS.USA]: "USA",
  [COUNTRY_IDS.CANADA]: "Canada",
};

const resolveCountryId = (countryName) => {
  const normalized = String(countryName || "")
    .trim()
    .toUpperCase();

  if (!normalized) {
    // No country on the hiring form at all — an old submission
    // from before the field existed. Every one of those was USA.
    return COUNTRY_IDS.USA;
  }

  if (["CANADA"].includes(normalized)) {
    return COUNTRY_IDS.CANADA;
  }

  if (
    ["USA", "US", "UNITED STATES", "UNITED STATES OF AMERICA"].includes(
      normalized,
    )
  ) {
    return COUNTRY_IDS.USA;
  }

  // Unrecognized value — fall back to USA rather than blocking the
  // admin entirely; the resolved state will still need to match.
  console.warn(
    `Unrecognized hiring form country "${countryName}" — defaulting to USA`,
  );

  return COUNTRY_IDS.USA;
};

// =========================================================
// SHARED STYLE TOKENS (kept consistent with the rest of the
// admin panel — navy / green, outlined 10px paper, #eef0f2)
// =========================================================

const NAVY = "#16324f";
const NAVY_DARK = "#2c3345";
const GREEN = "#1b7a43";
const GREEN_LIGHT = "#3ea56f";
const BORDER = "#eef0f2";

const sectionPaper = {
  p: 2.5,
  mb: 3,
  borderRadius: "10px",
  borderColor: BORDER,
};

const eyebrow = {
  display: "flex",
  alignItems: "center",
  gap: 0.75,
  fontSize: "0.8rem",
  fontWeight: 700,
  color: "#6c757d",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

// 🔹 Combines role_id + sub_role_id into the single value the Role
// <Select> uses — "7", "8", "9-10" (Cleaner), "9-11" (HouseKeeping).
const getRoleSelectValue = (role_id, sub_role_id) => {
  if (role_id === 9) {
    return `9-${sub_role_id || 10}`;
  }

  return role_id !== null && role_id !== undefined
    ? String(role_id)
    : "";
};

// =========================================================
// COMPONENT
// =========================================================

const UpdateServiceProvider = () => {
  const [form] = Form.useForm();
  const [addressForm] = Form.useForm();

  const navigate = useNavigate();
  const { id } = useParams();

  // =========================================================
  // GENERAL STATES
  // =========================================================

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [coordinates, setCoordinates] = useState({
    lat: null,
    lng: null,
  });

  const [loading, setLoading] = useState(false);

  const [userAddresses, setUserAddresses] = useState([]);

  // =========================================================
  // ADDRESS MODAL
  // =========================================================

  const [addressModalVisible, setAddressModalVisible] =
    useState(false);

  const [editingAddress, setEditingAddress] =
    useState(null);

  const [addressCoordinates, setAddressCoordinates] =
    useState({
      lat: null,
      lng: null,
    });

  // =========================================================
  // HIRING FORM STATES
  // =========================================================

  const [hiringForms, setHiringForms] = useState([]);

  const [selectedHiringForm, setSelectedHiringForm] =
    useState(null);

  // The hiring_form_submission_id this employee was actually saved with,
  // captured once on load. Kept separate from selectedHiringForm so the
  // "currently on file" tag doesn't disappear if the admin clicks around
  // other search results to compare before deciding what to do.
  const [assignedSubmissionId, setAssignedSubmissionId] =
    useState(null);

  const [loadingHiringForms, setLoadingHiringForms] =
    useState(false);

  const [hasSearched, setHasSearched] = useState(false);

  const [loadingLocation, setLoadingLocation] =
    useState(false);

  const [hiringFormLocation, setHiringFormLocation] =
    useState({
      country_id: null,
      state_id: null,
      city_id: null,
      lat: null,
      lng: null,
    });

  // =========================================================
  // HIRING FORM SEARCH — decoupled from the Name/Email form
  // fields on purpose. These two only change when the admin
  // actually types into the Name or Email inputs (via their
  // onChange handlers below) — NOT when a hiring form selection
  // programmatically fills the Name field. That decoupling is
  // what stops "selecting a form" from immediately re-triggering
  // a search that would wipe the selection out again.
  // =========================================================

  const [emailQuery, setEmailQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");

  // Skips exactly one upcoming search-effect run — set right
  // before we seed emailQuery/nameQuery from the loaded employee,
  // since loadEmployee() already performs that initial search
  // itself (and needs to auto-select the employee's existing
  // hiring form, which a generic search wouldn't do).
  const skipNextAutoSearchRef = useRef(false);

  // =========================================================
  // ROLE (PROMOTE / REASSIGN)
  //
  // Kept independent of the main Form — it saves immediately via
  // its own endpoint (same interaction as Employee Type on the
  // employee list page), not as part of the big Save button.
  // Bundling it into the main form would mean an admin couldn't
  // promote someone without also having a hiring form + resolved
  // location ready, which the main Save requires but role changes
  // don't need at all.
  // =========================================================

  const [roleValue, setRoleValue] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);

  // UI-only: lets the admin collapse the "How this works" note
  const [showHelp, setShowHelp] = useState(true);

  // =========================================================
  // ONLY ONE ADDRESS FOR EMPLOYEE
  // =========================================================

  const hasAddress =
    (userAddresses?.length || 0) >= 1;

  const locationReady =
    !loadingLocation &&
    hiringFormLocation.country_id &&
    hiringFormLocation.state_id &&
    hiringFormLocation.city_id &&
    hiringFormLocation.lat !== null &&
    hiringFormLocation.lng !== null;

  const hasSearchInput = Boolean(
    emailQuery.trim() || nameQuery.trim(),
  );

  // Reactive read of the account's current email, for flagging hiring
  // forms in the list that belong to a different email (see the guard
  // in handleHiringFormSelect above for why that matters).
  const currentAccountEmail = (
    Form.useWatch("email", form) || ""
  )
    .trim()
    .toLowerCase();

  // =========================================================
  // NAVIGATION
  // =========================================================

  const navigateToEmployees = () => {
    navigate("/employees");
  };

  // =========================================================
  // RESET HIRING FORM LOCATION
  // =========================================================

  const resetHiringFormLocation = () => {
    setHiringFormLocation({
      country_id: null,
      state_id: null,
      city_id: null,
      lat: null,
      lng: null,
    });
  };

  // =========================================================
  // FETCH STATES — FOR A GIVEN COUNTRY
  //
  // The Add/Edit Address modal below lets the admin pick USA or
  // Canada, and the State dropdown needs to reflect whichever one
  // is currently selected there — so this fetches on demand rather
  // than once at mount for a hardcoded country.
  // =========================================================

  const fetchStatesForCountry = (countryId) => {
    return StateAPI(countryId)
      .then((response) => {
        const stateList =
          response?.data?.data?.all_state || [];

        setStates(stateList);

        return stateList;
      })
      .catch((error) => {
        console.error(
          "Error fetching states:",
          error,
        );

        setStates([]);

        return [];
      });
  };

  // Prefetch USA states so the modal's State dropdown isn't empty on
  // first open, before the admin has touched the Country field.
  useEffect(() => {
    fetchStatesForCountry(COUNTRY_IDS.USA);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================================
  // FETCH CITIES
  // =========================================================

  const fetchCities = (stateId) => {
    return CityAPI(stateId).then((res) => {
      const citiesList =
        res?.data?.data?.all_city || [];

      setCities(citiesList);

      return citiesList;
    });
  };

  // =========================================================
  // GEOCODE ADDRESS
  // =========================================================

  const fetchCoordinates = async (address) => {
    if (!address) return;

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address,
        )}&key=AIzaSyB45G8TScEmJSSG_PIzLJV2I6Ej1qgc_4o`,
      );

      const data = await res.json();

      if (data.status === "OK") {
        const location =
          data.results[0]?.geometry?.location;

        if (!location) return;

        setCoordinates({
          lat: location.lat,
          lng: location.lng,
        });

        setAddressCoordinates({
          lat: location.lat,
          lng: location.lng,
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  // =========================================================
  // RESOLVE HIRING FORM LOCATION
  // =========================================================

  const resolveHiringFormLocation = async (
    hiringForm,
  ) => {
    try {
      setLoadingLocation(true);

      resetHiringFormLocation();

      if (!hiringForm?.state) {
        throw new Error(
          "State is missing from hiring form",
        );
      }

      if (!hiringForm?.city) {
        throw new Error(
          "City is missing from hiring form",
        );
      }

      // =====================================================
      // COUNTRY
      //
      // Empty/missing on older hiring forms — treated as USA,
      // since every hiring form was USA before the country field
      // was added.
      // =====================================================

      const countryId = resolveCountryId(hiringForm.country);

      // =====================================================
      // STATE
      // =====================================================

      const formState = hiringForm.state
        .trim()
        .toUpperCase();

      const normalizedStateName =
        STATE_ABBREVIATIONS[formState] ||
        hiringForm.state.trim();

      // =====================================================
      // FETCH STATES FRESH — FOR THE RESOLVED COUNTRY
      //
      // Don't rely on the `states` state variable here — it's
      // populated by a separate useEffect that races against
      // this one on mount, and it's only ever prefetched for
      // USA. Fetching directly (same pattern as CityAPI below)
      // removes the race and gets the right country's states.
      // =====================================================

      const stateResponse = await StateAPI(countryId);

      const stateList =
        stateResponse?.data?.data?.all_state || [];

      const matchedState = stateList.find(
        (state) =>
          state.name
            ?.trim()
            .toLowerCase() ===
          normalizedStateName
            ?.trim()
            .toLowerCase(),
      );

      if (!matchedState) {
        throw new Error(
          `State "${hiringForm.state}" was not found`,
        );
      }

      // =====================================================
      // CITY
      // =====================================================

      const cityResponse = await CityAPI(
        matchedState.id,
      );

      const cityList =
        cityResponse?.data?.data?.all_city || [];

      const normalizedCityName =
        hiringForm.city
          .trim()
          .replace(/\s+/g, " ")
          .toLowerCase();

      const matchedCity = cityList.find(
        (city) =>
          city.name
            ?.trim()
            .replace(/\s+/g, " ")
            .toLowerCase() ===
          normalizedCityName,
      );

      if (!matchedCity) {
        throw new Error(
          `City "${hiringForm.city}" was not found in ${matchedState.name}`,
        );
      }

      // =====================================================
      // FULL ADDRESS
      // =====================================================

      const fullAddress = [
        hiringForm.address,
        hiringForm.city,
        normalizedStateName,
        hiringForm.zip_code,
      ]
        .filter(Boolean)
        .join(", ");

      if (!fullAddress) {
        throw new Error(
          "Address is missing from hiring form",
        );
      }

      // =====================================================
      // GOOGLE GEOCODING
      // =====================================================

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          fullAddress,
        )}&key=AIzaSyB45G8TScEmJSSG_PIzLJV2I6Ej1qgc_4o`,
      );

      const data = await response.json();

      if (data.status !== "OK") {
        throw new Error(
          "Unable to get coordinates for hiring form address",
        );
      }

      const location =
        data.results?.[0]?.geometry?.location;

      if (
        !location ||
        location.lat === undefined ||
        location.lng === undefined
      ) {
        throw new Error(
          "Coordinates were not found for hiring form address",
        );
      }

      // =====================================================
      // FINAL LOCATION
      // =====================================================

      const locationData = {
        country_id: countryId,
        state_id: matchedState.id,
        city_id: matchedCity.id,
        lat: location.lat,
        lng: location.lng,
      };

      console.log(
        "Resolved hiring form location:",
        locationData,
      );

      setHiringFormLocation(
        locationData,
      );

      return locationData;
    } catch (error) {
      console.error(
        "Error resolving hiring form location:",
        error,
      );

      resetHiringFormLocation();

      throw error;
    } finally {
      setLoadingLocation(false);
    }
  };

  // =========================================================
  // FETCH HIRING FORMS BY EMAIL AND/OR NAME
  //
  // Either value alone is enough — the backend matches on
  // email OR name, so we pass through whichever the caller
  // actually has.
  // =========================================================

  const fetchHiringForms = async (
    email,
    name,
    existingSubmissionId = null,
  ) => {
    const normalizedEmail =
      email?.trim().toLowerCase();

    const normalizedName =
      name?.trim().toLowerCase();

    if (!normalizedEmail && !normalizedName) {
      setHiringForms([]);
      setSelectedHiringForm(null);
      resetHiringFormLocation();
      setHasSearched(false);
      return;
    }

    try {
      setLoadingHiringForms(true);

      const response =
        await GetHiringFormsByEmail(
          normalizedEmail || undefined,
          normalizedName || undefined,
        );

      if (response.status === 200) {
        const forms =
          response.data?.data || [];

        setHiringForms(forms);
        setHasSearched(true);

        // ===================================================
        // IF EDITING AND EXISTING FORM EXISTS,
        // SELECT IT AUTOMATICALLY
        // ===================================================

        if (existingSubmissionId) {
          const existingForm =
            forms.find(
              (item) =>
                String(
                  item.submission_id,
                ) ===
                String(
                  existingSubmissionId,
                ),
            );

          if (existingForm) {
            setSelectedHiringForm(
              existingForm,
            );

            try {
              await resolveHiringFormLocation(
                existingForm,
              );
            } catch (error) {
              message.error(
                error.message ||
                  "Unable to resolve hiring form location",
              );
            }

            return;
          }
        }

        // ===================================================
        // OTHERWISE, DON'T AUTO SELECT
        // We let the admin explicitly select one.
        // ===================================================

        setSelectedHiringForm(null);
        resetHiringFormLocation();

        if (forms.length === 0) {
          message.info(
            "No hiring forms found for that search",
          );
        }
      }
    } catch (error) {
      console.error(
        "Error fetching hiring forms:",
        error,
      );

      setHiringForms([]);
      setSelectedHiringForm(null);
      resetHiringFormLocation();
      setHasSearched(true);

      if (
        error.response?.status === 401
      ) {
        message.error(
          "Token expired",
        );

        localStorage.removeItem(
          "adminToken",
        );

        setTimeout(() => {
          navigate("/Login");
        }, 3000);
      }
    } finally {
      setLoadingHiringForms(false);
    }
  };

  // =========================================================
  // LOAD EMPLOYEE
  // =========================================================

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        const response =
          await GetUserById(id);

        const data =
          response?.data?.data;

        if (!data) return;

        // ===================================================
        // USER DATA
        // ===================================================

        const employeeEmail =
          data?.email || "";

        const employeeName =
          data?.user_profile?.name || "";

        form.setFieldsValue({
          name: employeeName,

          employee_type:
            data?.employee_type,

          email: employeeEmail,
        });

        // ===================================================
        // CURRENT ROLE → "Role" SELECT VALUE
        //
        // Role 9 (Cleaner / HouseKeeping) is split further by
        // sub_role_id, so it's represented as "9-10" / "9-11"
        // in the select, matching the Add Employee screen.
        // ===================================================

        setRoleValue(
          getRoleSelectValue(
            data?.role_id ?? null,
            data?.sub_role_id ?? null,
          ),
        );

        // ===================================================
        // USER ADDRESS
        // ===================================================

        setUserAddresses(
          data?.user_address || [],
        );

        // ===================================================
        // SEED THE SEARCH STATE
        //
        // This will fire the search-effect below once, but
        // skipNextAutoSearchRef swallows that single run since
        // we're doing the equivalent search manually right here
        // (and need existingSubmissionId to auto-select).
        // ===================================================

        skipNextAutoSearchRef.current = true;

        setEmailQuery(employeeEmail);
        setNameQuery(employeeName);

        // ===================================================
        // EXISTING HIRING FORM
        // ===================================================

        const existingSubmissionId =
          data?.hiring_form_submission_id;

        setAssignedSubmissionId(existingSubmissionId ?? null);

        if (employeeEmail || employeeName) {
          await fetchHiringForms(
            employeeEmail,
            employeeName,
            existingSubmissionId,
          );
        }
      } catch (error) {
        console.error(
          "Error loading employee:",
          error,
        );

        message.error(
          "Failed to load employee details",
        );
      }
    };

    loadEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // =========================================================
  // EMAIL / NAME INPUT CHANGES
  //
  // These are the ONLY things that update emailQuery/nameQuery,
  // which is what makes them safe to watch below — selecting a
  // hiring form updates the form's "name" field programmatically
  // (via form.setFieldValue) without going through here, so it
  // never re-triggers a search.
  // =========================================================

  const handleEmailChange = (event) => {
    const email = event.target.value;

    setEmailQuery(email);

    setSelectedHiringForm(null);
    setHiringForms([]);
    resetHiringFormLocation();
  };

  const handleNameChange = (event) => {
    const name = event.target.value;

    setNameQuery(name);

    setSelectedHiringForm(null);
    setHiringForms([]);
    resetHiringFormLocation();
  };

  // =========================================================
  // SEARCH HIRING FORMS WHEN EMAIL OR NAME CHANGES
  // =========================================================

  useEffect(() => {
    if (skipNextAutoSearchRef.current) {
      skipNextAutoSearchRef.current = false;
      return;
    }

    const normalizedEmail =
      emailQuery.trim().toLowerCase();

    const normalizedName =
      nameQuery.trim().toLowerCase();

    if (!normalizedEmail && !normalizedName) {
      setHiringForms([]);
      setSelectedHiringForm(null);
      resetHiringFormLocation();
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchHiringForms(
        normalizedEmail,
        normalizedName,
      );
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailQuery, nameQuery]);

  // =========================================================
  // SELECT HIRING FORM
  // =========================================================

  const handleHiringFormSelect = async (
    hiringForm,
  ) => {
    // =====================================================
    // GUARD: BLOCK CROSS-EMAIL SELECTION
    //
    // The account's email is fixed (this employee was already
    // created with it) — a hiring form submitted under a
    // different email can never actually be assigned to them.
    // The backend already rejects this on save, but that's a
    // confusing way to find out; catch it here instead so the
    // admin sees why immediately and nothing gets selected.
    // =====================================================

    const accountEmail = (
      form.getFieldValue("email") || ""
    )
      .trim()
      .toLowerCase();

    const formEmail = (hiringForm.email || "")
      .trim()
      .toLowerCase();

    if (accountEmail && formEmail && formEmail !== accountEmail) {
      message.error(
        `This hiring form was submitted under ${hiringForm.email}, not this employee's email (${form.getFieldValue("email")}). It can't be assigned — pick one submitted under the employee's own email instead.`,
      );

      return;
    }

    setSelectedHiringForm(
      hiringForm,
    );

    // Automatically update name — programmatic, so it does NOT
    // touch nameQuery / re-trigger the search effect above. Email
    // is deliberately never touched here — the account's email is
    // fixed; the guard above already keeps mismatched forms out.
    if (hiringForm.name) {
      form.setFieldValue(
        "name",
        hiringForm.name,
      );
    }

    try {
      await resolveHiringFormLocation(
        hiringForm,
      );

      message.success(
        "Hiring form location loaded",
      );
    } catch (error) {
      message.error(
        error.message ||
          "Unable to resolve hiring form location",
      );
    }
  };

  // =========================================================
  // ROLE CHANGE — INSTANT, VIA DEDICATED ENDPOINT
  //
  // Hits POST /change-employee-role/:id directly. Doesn't touch
  // the main Form at all, so it works regardless of whether a
  // hiring form or location has been resolved yet.
  // =========================================================

  const handleRoleChange = async (value) => {
    const previousValue = roleValue;

    setRoleValue(value);

    let role_id = value;
    let sub_role_id = null;

    if (String(value).includes("-")) {
      const [role, subRole] =
        String(value).split("-");

      role_id = parseInt(role, 10);
      sub_role_id = parseInt(subRole, 10);
    } else {
      role_id = parseInt(value, 10);
    }

    try {
      setUpdatingRole(true);

      const res = await ChangeEmployeeRole(id, {
        role_id,
        sub_role_id,
      });

      message.success(
        res?.data?.message ||
          "Employee role updated successfully",
      );
    } catch (error) {
      console.error(
        "Error updating role:",
        error,
      );

      message.error(
        error.response?.data?.message ||
          "Failed to update employee role",
      );

      // Roll back the select if the request failed, so the
      // dropdown doesn't show a role that was never actually saved.
      setRoleValue(previousValue);
    } finally {
      setUpdatingRole(false);
    }
  };

  // =========================================================
  // SAVE EMPLOYEE
  // =========================================================

  const handleSave = async (
    values,
  ) => {
    try {
      setLoading(true);

      // =====================================================
      // HIRING FORM REQUIRED
      // =====================================================

      if (!selectedHiringForm) {
        message.error(
          "Please select a hiring form",
        );

        setLoading(false);
        return;
      }

      // =====================================================
      // LOCATION REQUIRED
      // =====================================================

      if (
        !hiringFormLocation.country_id ||
        !hiringFormLocation.state_id ||
        !hiringFormLocation.city_id ||
        hiringFormLocation.lat === null ||
        hiringFormLocation.lng === null
      ) {
        message.error(
          "Unable to determine the hiring form location. Please select the hiring form again.",
        );

        setLoading(false);
        return;
      }

      // =====================================================
      // PAYLOAD
      //
      // Role is intentionally NOT included here — it's saved
      // instantly by handleRoleChange above via its own endpoint.
      // =====================================================

      const payload = {
        name: values.name,

        email: values.email
          ?.trim()
          .toLowerCase(),

        employee_type:
          values.employee_type,

        // ===================================================
        // HIRING FORM
        // ===================================================

        hiring_form_submission_id:
          selectedHiringForm.submission_id,

        // ===================================================
        // LOCATION
        // ===================================================

        country_id:
          hiringFormLocation.country_id,

        state_id:
          hiringFormLocation.state_id,

        city_id:
          hiringFormLocation.city_id,

        address_lat:
          hiringFormLocation.lat,

        address_long:
          hiringFormLocation.lng,
      };

      console.log(
        "========================================",
      );

      console.log(
        "UPDATE EMPLOYEE PAYLOAD",
      );

      console.log(
        JSON.stringify(
          payload,
          null,
          2,
        ),
      );

      console.log(
        "========================================",
      );

      await EditUserById(
        id,
        payload,
      );

      message.success(
        "Employee updated successfully",
      );

      setTimeout(() => {
        navigate("/employees");
      }, 1000);
    } catch (error) {
      console.error(
        "Error updating employee:",
        error,
      );

      message.error(
        error.response?.data
          ?.message ||
          "Update failed",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // REFRESH USER
  // =========================================================

  const refreshUser = async () => {
    try {
      const response =
        await GetUserById(id);

      const data =
        response?.data?.data;

      setUserAddresses(
        data?.user_address || [],
      );
    } catch (error) {
      console.error(
        "Error refreshing user:",
        error,
      );
    }
  };

  // =========================================================
  // OPEN ADD ADDRESS
  // =========================================================

  const openAddAddress = () => {
    if (hasAddress) return;

    setEditingAddress(null);

    addressForm.resetFields();

    // Default to USA — the admin can switch to Canada, which reloads
    // the State dropdown for that country (see onValuesChange below).
    addressForm.setFieldsValue({
      country_id: COUNTRY_IDS.USA,
    });

    fetchStatesForCountry(COUNTRY_IDS.USA);

    setAddressCoordinates({
      lat: null,
      lng: null,
    });

    setAddressModalVisible(true);
  };

  // =========================================================
  // OPEN EDIT ADDRESS
  // =========================================================

  const openEditAddress = (
    addr,
  ) => {
    setEditingAddress(addr);

    setAddressModalVisible(true);

    // Existing addresses predate the country field on some rows —
    // treated as USA, same convention used everywhere else.
    const addressCountryId =
      addr.country_id || COUNTRY_IDS.USA;

    setTimeout(() => {
      addressForm.resetFields();

      addressForm.setFieldsValue({
        address: addr.address,
        country_id: addressCountryId,
        state_id: addr.state_id,
      });

      setAddressCoordinates({
        lat: addr.address_lat,
        lng: addr.address_long,
      });

      fetchStatesForCountry(addressCountryId).then(() => {
        addressForm.setFieldsValue({
          state_id: addr.state_id,
        });
      });

      fetchCities(
        addr.state_id,
      ).then(() => {
        addressForm.setFieldsValue({
          city_id:
            addr.city_id,
        });
      });

      setTimeout(() => {
        fetchCoordinates(
          addr.address,
        );
      }, 200);
    }, 100);
  };

  // =========================================================
  // SAVE MANUAL ADDRESS
  // =========================================================

  const handleSaveAddress =
    async () => {
      try {
        const values =
          await addressForm.validateFields();

        if (
          addressCoordinates.lat ===
            null ||
          addressCoordinates.lng ===
            null
        ) {
          message.error(
            "Unable to get address coordinates",
          );

          return;
        }

        const basePayload = {
          address:
            values.address,

          state_id:
            values.state_id,

          city_id:
            values.city_id,

          // Was hardcoded to USA (233) regardless of what the admin
          // actually selected — now takes whichever country the Select
          // below the address field was set to.
          country_id:
            values.country_id,

          address_lat:
            addressCoordinates.lat,

          address_long:
            addressCoordinates.lng,
        };

        if (editingAddress) {
          const editPayload = {
            user_address_id:
              editingAddress.id,

            ...basePayload,
          };

          await EditAddress(
            editPayload,
          );

          message.success(
            "Address updated",
          );
        } else {
          const addPayload = {
            user_id: id,

            ...basePayload,
          };

          await AddNewUserAddress(
            addPayload,
          );

          message.success(
            "Address added",
          );
        }

        await refreshUser();

        setAddressModalVisible(
          false,
        );

        setEditingAddress(null);

        addressForm.resetFields();

        setAddressCoordinates({
          lat: null,
          lng: null,
        });
      } catch (error) {
        console.error(
          "Error saving address:",
          error,
        );

        if (
          error?.errorFields
        ) {
          return;
        }

        message.error(
          error.response?.data
            ?.message ||
            "Failed to save address",
        );
      }
    };

  // =========================================================
  // DELETE ADDRESS
  // =========================================================

  const handleDeleteAddress = (
    addressId,
  ) => {
    Modal.confirm({
      title: "Delete Address",

      content:
        "Are you sure you want to delete this address?",

      okText: "Delete",

      okType: "danger",

      onOk: async () => {
        try {
          await DeleteUserAddress(
            addressId,
          );

          message.success(
            "Address deleted successfully",
          );

          await refreshUser();
        } catch (error) {
          console.error(
            error,
          );

          message.error(
            "Failed to delete address",
          );
        }
      },
    });
  };

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatSubmittedDate = (
    date,
  ) => {
    if (!date) return "";

    return new Date(
      date,
    ).toLocaleString(
      "en-US",
      {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Box>
      {/* =====================================================
          HEADER
      ====================================================== */}

      <Paper variant="outlined" sx={{ ...sectionPaper, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `linear-gradient(135deg, ${NAVY} 0%, ${GREEN} 100%)`,
                flexShrink: 0,
              }}
            >
              <User size={22} color="#fff" />
            </Box>

            <Box>
              <MuiTypography className="page-title">
                EMPLOYEE MANAGEMENT
              </MuiTypography>

              <MuiTypography className="page-sub-title">
                Update Employee Details
              </MuiTypography>
            </Box>
          </Box>

          <MuiButton
            variant="contained"
            disableElevation
            startIcon={<ArrowBackIcon />}
            onClick={navigateToEmployees}
            sx={{
              height: 47,
              px: 3,
              borderRadius: "8px",
              minWidth: 180,
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: NAVY_DARK,
              flexShrink: 0,
              ml: "auto",
              "&:hover": {
                backgroundColor: "#1f2433",
              },
            }}
          >
            Return to Employees
          </MuiButton>
        </Box>
      </Paper>

      {/* =====================================================
          HOW THIS WORKS
      ====================================================== */}

      <Paper
        variant="outlined"
        sx={{
          borderRadius: "10px",
          borderColor: "#d7ecdf",
          backgroundColor: "#f5faf7",
          mb: 3,
          overflow: "hidden",
        }}
      >
        <Box
          onClick={() => setShowHelp((v) => !v)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2.5,
            py: 1.5,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <Info size={18} color={GREEN} />

          <MuiTypography
            sx={{
              fontWeight: 700,
              fontSize: "0.9rem",
              color: NAVY,
              flexGrow: 1,
            }}
          >
            How the hiring form auto-fill & role change work
          </MuiTypography>

          <ChevronDown
            size={18}
            color="#6b7280"
            style={{
              transform: showHelp ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 150ms ease",
            }}
          />
        </Box>

        <Collapse in={showHelp}>
          <Divider sx={{ borderColor: "#d7ecdf" }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
              gap: 2,
              px: 2.5,
              py: 2,
            }}
          >
            {[
              {
                icon: <Search size={16} />,
                title: "1. Search by email or name",
                text: "Editing either field re-checks for hiring forms that match — you don't need both filled in.",
              },
              {
                icon: <ClipboardList size={16} />,
                title: "2. Pick the hiring form",
                text: "Matching submissions are listed below — the one already on file is pre-selected.",
              },
              {
                icon: <MapPin size={16} />,
                title: "3. Details auto-fill",
                text: "Name, address, city, state and coordinates are pulled from the selected form.",
              },
              {
                icon: <Briefcase size={16} />,
                title: "4. Promote or reassign",
                text: "The Role field below saves immediately — no need to press Save for a role change.",
              },
            ].map((step) => (
              <Box key={step.title} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: "8px",
                    backgroundColor: "#e7f5ec",
                    color: GREEN,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {step.icon}
                </Box>

                <Box>
                  <MuiTypography sx={{ fontWeight: 700, fontSize: "0.82rem", color: NAVY, mb: 0.25 }}>
                    {step.title}
                  </MuiTypography>

                  <MuiTypography sx={{ fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.5 }}>
                    {step.text}
                  </MuiTypography>
                </Box>
              </Box>
            ))}
          </Box>
        </Collapse>
      </Paper>

      {/* =====================================================
          MAIN FORM
      ====================================================== */}

      <Paper variant="outlined" sx={{ p: 3, borderRadius: "10px", borderColor: BORDER }}>
        <Form layout="vertical" form={form} onFinish={handleSave}>
          {/* =================================================
              BASIC INFORMATION
          ================================================== */}

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Full Name"
                extra="Also used to search hiring forms."
                rules={[
                  {
                    required: true,
                    message: "Please enter name",
                  },
                ]}
              >
                <Input
                  onChange={handleNameChange}
                  placeholder="Enter name"
                  prefix={<User size={14} color="#9ca3af" style={{ marginRight: 4 }} />}
                  suffix={
                    loadingHiringForms && nameQuery.trim() ? (
                      <CircularProgress size={14} sx={{ color: GREEN }} />
                    ) : null
                  }
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="Email"
                extra="Also used to search hiring forms."
                rules={[
                  {
                    required: true,
                    message: "Please enter email",
                  },
                  {
                    type: "email",
                    message: "Please enter a valid email",
                  },
                ]}
              >
                <Input
                  onChange={handleEmailChange}
                  placeholder="Enter email"
                  prefix={<Mail size={14} color="#9ca3af" style={{ marginRight: 4 }} />}
                  suffix={
                    loadingHiringForms && emailQuery.trim() ? (
                      <CircularProgress size={14} sx={{ color: GREEN }} />
                    ) : null
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="employee_type"
                label="Employee Type"
                rules={[
                  {
                    required: true,
                    message: "Please select employee type",
                  },
                ]}
              >
                <Select
                  placeholder="Select Employee Type"
                  suffixIcon={<ChevronDown size={16} color={NAVY_DARK} />}
                >
                  <Select.Option value="W2_BI_WEEKLY">
                    W2 Bi-Weekly
                  </Select.Option>

                  <Select.Option value="1099">
                    1099 Contractor
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>

            {/* =============================================
                ROLE — laid out like any other field here, but
                NOT part of this Form: it saves immediately via
                ChangeEmployeeRole (handleRoleChange), the same
                interaction as Employee Type on the employee list
                page. It doesn't touch form values or the Save
                button below.
            ============================================== */}

            <Col xs={24} md={12}>
              <Box sx={{ mb: "24px" }}>
                <MuiTypography
                  component="label"
                  sx={{
                    display: "block",
                    fontSize: "14px",
                    color: "rgba(0, 0, 0, 0.88)",
                    mb: "8px",
                  }}
                >
                  Role
                </MuiTypography>

                <Select
                  value={roleValue || undefined}
                  placeholder="Select Role"
                  style={{ width: "100%" }}
                  disabled={updatingRole}
                  suffixIcon={
                    updatingRole ? (
                      <CircularProgress size={14} sx={{ color: GREEN }} />
                    ) : (
                      <ChevronDown size={16} color={NAVY_DARK} />
                    )
                  }
                  onChange={handleRoleChange}
                >
                  <Select.Option value="7">
                    Inspector / Supervisor
                  </Select.Option>

                  <Select.Option value="8">
                    Quality Assurance Technician
                  </Select.Option>

                  <Select.Option value="9-10">
                    Cleaner
                  </Select.Option>

                  <Select.Option value="9-11">
                    HouseKeeping
                  </Select.Option>
                </Select>

                <MuiTypography
                  sx={{
                    fontSize: "0.75rem",
                    color: "#9ca3af",
                    mt: "4px",
                  }}
                >
                  Promotes or reassigns immediately — no need to press Save.
                </MuiTypography>
              </Box>
            </Col>
          </Row>

          {/* =================================================
              HIRING FORMS
          ================================================== */}

          <Paper variant="outlined" sx={sectionPaper}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Box>
                <MuiTypography sx={eyebrow}>
                  <ClipboardList size={14} />
                  Hiring Forms
                </MuiTypography>

                <MuiTypography sx={{ fontSize: "0.85rem", color: "#9ca3af", mt: 0.5 }}>
                  Select the hiring form associated with this employee — search by
                  either the name or the email above.
                </MuiTypography>
              </Box>

              {hiringForms.length > 0 && (
                <Chip
                  size="small"
                  label={`${hiringForms.length} found`}
                  sx={{
                    height: 22,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    backgroundColor: "#e7f5ec",
                    color: GREEN,
                  }}
                />
              )}

              {loadingHiringForms && <CircularProgress size={20} sx={{ color: GREEN }} />}
            </Box>

            {!hasSearchInput ? (
              <Box
                sx={{
                  border: "1px dashed #e5e7eb",
                  borderRadius: "10px",
                  padding: "20px",
                  textAlign: "center",
                  background: "#fafbfc",
                }}
              >
                <MuiTypography sx={{ color: "#9ca3af", fontSize: "0.9rem" }}>
                  Enter a name or email above to search hiring forms.
                </MuiTypography>
              </Box>
            ) : loadingHiringForms && hiringForms.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  color: "#6b7280",
                  fontSize: "0.85rem",
                  py: 2,
                }}
              >
                <CircularProgress size={16} sx={{ color: GREEN }} />
                Searching hiring forms…
              </Box>
            ) : hasSearched && hiringForms.length === 0 ? (
              <Box
                sx={{
                  border: "1px dashed #e5e7eb",
                  borderRadius: "10px",
                  padding: "20px",
                  textAlign: "center",
                  background: "#fafbfc",
                }}
              >
                <MuiTypography sx={{ color: "#9ca3af", fontSize: "0.9rem" }}>
                  No hiring forms found for that search.
                </MuiTypography>
              </Box>
            ) : (
              <RadioGroup
                name="hiring-form-selection"
                value={String(selectedHiringForm?.submission_id ?? "")}
                onChange={(event) => {
                  const selected = hiringForms.find(
                    (item) => String(item.submission_id) === event.target.value,
                  );

                  if (selected) {
                    handleHiringFormSelect(selected);
                  }
                }}
              >
                <Box sx={{ display: "grid", gap: 1.25 }}>
                  {hiringForms.map((hiringForm) => {
                    const isSelected =
                      String(selectedHiringForm?.submission_id) ===
                      String(hiringForm.submission_id);

                    const isAssigned =
                      assignedSubmissionId !== null &&
                      String(assignedSubmissionId) ===
                        String(hiringForm.submission_id);

                    const emailMismatch = Boolean(
                      currentAccountEmail &&
                        hiringForm.email &&
                        hiringForm.email.trim().toLowerCase() !==
                          currentAccountEmail,
                    );

                    return (
                      <Paper
                        key={hiringForm.submission_id}
                        variant="outlined"
                        onClick={() => handleHiringFormSelect(hiringForm)}
                        sx={{
                          p: 1.75,
                          borderRadius: "10px",
                          borderColor: isSelected ? GREEN_LIGHT : "#e5e7eb",
                          borderWidth: isSelected ? "1.5px" : "1px",
                          backgroundColor: isSelected ? "#f4fbf7" : "#fff",
                          opacity: emailMismatch ? 0.65 : 1,
                          cursor: emailMismatch ? "not-allowed" : "pointer",
                          transition: "border-color 120ms ease, background-color 120ms ease",
                          "&:hover": {
                            borderColor: isSelected ? GREEN_LIGHT : "#c7cdd6",
                          },
                        }}
                      >
                        <FormControlLabel
                          value={String(hiringForm.submission_id)}
                          control={
                            <Radio
                              // Explicit, rather than left to the RadioGroup's
                              // own value-comparison — this is the exact same
                              // boolean driving the card's highlighted border,
                              // so the visual "which one is picked" and the
                              // radio dot can never disagree or both light up.
                              checked={isSelected}
                              disabled={emailMismatch}
                              style={{ marginTop: 2 }}
                            />
                          }
                          sx={{
                            width: "100%",
                            alignItems: "flex-start",
                            m: 0,
                          }}
                          label={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                gap: 1,
                                width: "100%",
                                pl: 0.5,
                              }}
                            >
                              <Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: 0.75,
                                  }}
                                >
                                  <MuiTypography sx={{ fontWeight: 700, color: "#1f2937", fontSize: "0.92rem" }}>
                                    {hiringForm.name}
                                  </MuiTypography>

                                  {isAssigned && (
                                    <Chip
                                      size="small"
                                      label="Currently assigned"
                                      sx={{
                                        height: 20,
                                        fontSize: "0.68rem",
                                        fontWeight: 600,
                                        backgroundColor: "#dbeafe",
                                        color: "#1d4ed8",
                                      }}
                                    />
                                  )}

                                  {emailMismatch && (
                                    <Chip
                                      size="small"
                                      label="Different email — can't assign"
                                      sx={{
                                        height: 20,
                                        fontSize: "0.68rem",
                                        fontWeight: 600,
                                        backgroundColor: "#fef3c7",
                                        color: "#92400e",
                                      }}
                                    />
                                  )}
                                </Box>

                                {hiringForm.email && (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.75,
                                      mt: 0.5,
                                      color: "#6b7280",
                                      fontSize: "0.82rem",
                                    }}
                                  >
                                    <Mail size={13} />
                                    {hiringForm.email}
                                  </Box>
                                )}

                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.75,
                                    mt: 0.5,
                                    color: "#6b7280",
                                    fontSize: "0.82rem",
                                  }}
                                >
                                  <MapPin size={13} />
                                  {hiringForm.full_address}
                                </Box>

                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.75,
                                    mt: 0.35,
                                    color: "#6b7280",
                                    fontSize: "0.82rem",
                                  }}
                                >
                                  <Phone size={13} />
                                  {hiringForm.phone || "-"}
                                </Box>
                              </Box>

                              <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                    gap: 0.5,
                                    color: "#9ca3af",
                                    fontSize: "0.72rem",
                                  }}
                                >
                                  <Clock size={11} />
                                  {formatSubmittedDate(hiringForm.submitted_at)}
                                </Box>
                              </Box>
                            </Box>
                          }
                        />
                      </Paper>
                    );
                  })}
                </Box>
              </RadioGroup>
            )}

            {/* =================================================
                SELECTED HIRING FORM LOCATION
            ================================================== */}

            {selectedHiringForm && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  border: "1px solid #dbeafe",
                  borderRadius: "10px",
                  backgroundColor: "#f8fafc",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.25 }}>
                  <CheckCircle2 size={16} color={GREEN} />

                  <MuiTypography sx={{ fontWeight: 700, color: "#1f2937" }}>
                    Selected Hiring Form
                  </MuiTypography>
                </Box>

                <Row gutter={16}>
                  <Col span={6}>
                    <MuiTypography variant="caption" color="text.secondary">
                      Country
                    </MuiTypography>

                    <MuiTypography fontWeight={600}>
                      {loadingLocation
                        ? "Loading..."
                        : COUNTRY_NAMES_BY_ID[
                            hiringFormLocation.country_id
                          ] || "-"}
                    </MuiTypography>
                  </Col>

                  <Col span={6}>
                    <MuiTypography variant="caption" color="text.secondary">
                      State
                    </MuiTypography>

                    <MuiTypography fontWeight={600}>
                      {loadingLocation
                        ? "Loading..."
                        : hiringFormLocation.state_id
                        ? "Matched"
                        : "-"}
                    </MuiTypography>
                  </Col>

                  <Col span={6}>
                    <MuiTypography variant="caption" color="text.secondary">
                      City
                    </MuiTypography>

                    <MuiTypography fontWeight={600}>
                      {loadingLocation
                        ? "Loading..."
                        : hiringFormLocation.city_id
                        ? "Matched"
                        : "-"}
                    </MuiTypography>
                  </Col>

                  <Col span={6}>
                    <MuiTypography variant="caption" color="text.secondary">
                      Status
                    </MuiTypography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {locationReady ? (
                        <CheckCircle2 size={14} color={GREEN} />
                      ) : (
                        <CircularProgress size={12} />
                      )}

                      <MuiTypography fontWeight={600} sx={{ color: locationReady ? GREEN : "#9ca3af" }}>
                        {locationReady ? "Ready" : "Resolving…"}
                      </MuiTypography>
                    </Box>
                  </Col>

                  <Col span={24}>
                    <MuiTypography variant="caption" color="text.secondary">
                      Coordinates
                    </MuiTypography>

                    <MuiTypography fontWeight={600}>
                      {loadingLocation
                        ? "Loading..."
                        : hiringFormLocation.lat !== null && hiringFormLocation.lng !== null
                        ? `${hiringFormLocation.lat}, ${hiringFormLocation.lng}`
                        : "-"}
                    </MuiTypography>
                  </Col>
                </Row>
              </Box>
            )}
          </Paper>

          {/* =================================================
              EMPLOYEE ADDRESS
          ================================================== */}

          <Paper variant="outlined" sx={sectionPaper}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2.5,
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              <MuiTypography sx={eyebrow}>
                <IoLocationOutline size={16} color="#667eea" />
                Employee Address
              </MuiTypography>

              <Tooltip
                title={
                  hasAddress
                    ? "An employee can only have one address. Delete the existing address to add a new one."
                    : ""
                }
              >
                <span>
                  <MuiButton
                    variant="contained"
                    disableElevation
                    size="small"
                    disabled={hasAddress}
                    startIcon={<Plus size={16} />}
                    onClick={openAddAddress}
                    sx={{
                      borderRadius: "8px",
                      textTransform: "none",
                      fontWeight: 600,
                      height: 36,
                      backgroundColor: GREEN,
                      "&:hover": { backgroundColor: "#156437" },
                    }}
                  >
                    Add Address
                  </MuiButton>
                </span>
              </Tooltip>
            </Box>

            {hasAddress ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "16px",
                }}
              >
                {userAddresses.map((addr) => (
                  <Box
                    key={addr.id}
                    sx={{
                      border: "1px solid #eef0f2",
                      borderRadius: "12px",
                      padding: "16px",
                      background: "#fafbfc",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.25,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <MapPin size={16} color="#667eea" style={{ marginTop: 2, flexShrink: 0 }} />

                      <MuiTypography
                        sx={{ fontSize: "13.5px", color: "#2c3e50", fontWeight: 500, lineHeight: 1.5 }}
                      >
                        {addr.address}, {addr.user_city?.name}, {addr.user_state?.name}, {addr.user_country?.name}
                      </MuiTypography>
                    </Box>

                    <Divider sx={{ my: 0.5 }} />

                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Edit Address">
                        <IconButton
                          size="small"
                          sx={{
                            width: 32,
                            height: 32,
                            border: "1px solid #6366F1",
                            color: "#6366F1",
                            "&:hover": { backgroundColor: "#6366F114" },
                          }}
                          onClick={() => openEditAddress(addr)}
                        >
                          <Pencil size={14} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete Address">
                        <IconButton
                          size="small"
                          sx={{
                            width: 32,
                            height: 32,
                            border: "1px solid #EF4444",
                            color: "#EF4444",
                            "&:hover": { backgroundColor: "#EF444414" },
                          }}
                          onClick={() => handleDeleteAddress(addr.id)}
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box
                sx={{
                  border: "1px dashed #e5e7eb",
                  borderRadius: "12px",
                  padding: "24px",
                  textAlign: "center",
                  background: "#fafbfc",
                }}
              >
                <MapPin size={20} color="#c4c9d4" style={{ marginBottom: 8 }} />

                <MuiTypography sx={{ color: "#9ca3af", fontSize: "0.9rem" }}>
                  No address added yet. This employee can have one address.
                </MuiTypography>
              </Box>
            )}
          </Paper>

          {/* =================================================
              ACTIONS
          ================================================== */}

          <Form.Item style={{ marginTop: "8px" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={loadingLocation || loadingHiringForms}
                icon={!loading ? <Check size={16} /> : null}
                style={{
                  backgroundColor: GREEN,
                  borderColor: GREEN,
                  height: 40,
                  borderRadius: 8,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                Save
              </Button>

              <Button
                onClick={() => navigate("/employees")}
                style={{ height: 40, borderRadius: 8, fontWeight: 600 }}
              >
                Cancel
              </Button>

              {selectedHiringForm && (
                <Box
                  sx={{
                    ml: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    color: locationReady ? GREEN : "#9ca3af",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  {locationReady ? (
                    <>
                      <CheckCircle2 size={16} />
                      Location ready
                    </>
                  ) : (
                    <>
                      <CircularProgress size={14} />
                      Resolving location…
                    </>
                  )}
                </Box>
              )}
            </Box>
          </Form.Item>
        </Form>

        {/* =====================================================
            ADDRESS MODAL
        ====================================================== */}

        <Modal
          title={editingAddress ? "Edit Address" : "Add New Address"}
          open={addressModalVisible}
          onCancel={() => {
            setAddressModalVisible(false);
            setEditingAddress(null);
            addressForm.resetFields();
            setCities([]);
            setAddressCoordinates({ lat: null, lng: null });
          }}
          onOk={handleSaveAddress}
          okText={editingAddress ? "Save Changes" : "Add Address"}
          okButtonProps={{ style: { backgroundColor: GREEN, borderColor: GREEN } }}
          forceRender
        >
          <Form
            form={addressForm}
            layout="vertical"
            onValuesChange={(changedValues, allValues) => {
              if (changedValues.country_id) {
                // Switching country invalidates whatever state/city were
                // picked for the old one — clear both and reload states
                // for the newly selected country.
                addressForm.setFieldsValue({
                  state_id: undefined,
                  city_id: undefined,
                });

                setCities([]);

                fetchStatesForCountry(changedValues.country_id);
              }

              if (changedValues.state_id) {
                addressForm.setFieldsValue({ city_id: undefined });
                fetchCities(changedValues.state_id);
              }

              if (changedValues.address) {
                const fullAddress = `${changedValues.address}, ${
                  states.find((s) => s.id === allValues.state_id)?.name || ""
                }, ${cities.find((c) => c.id === allValues.city_id)?.name || ""}`;

                fetchCoordinates(fullAddress);
              }
            }}
          >
            {/* Address */}

            <Form.Item
              name="address"
              label="Address"
              rules={[{ required: true, message: "Please enter the address" }]}
            >
              <Input placeholder="Enter address" />
            </Form.Item>

            {/* Country */}

            <Form.Item
              name="country_id"
              label="Country"
              rules={[{ required: true, message: "Please select a country" }]}
            >
              <Select
                placeholder="Select Country"
                suffixIcon={<ChevronDown size={16} color={NAVY_DARK} />}
              >
                <Select.Option value={COUNTRY_IDS.USA}>USA</Select.Option>
                <Select.Option value={COUNTRY_IDS.CANADA}>
                  Canada
                </Select.Option>
              </Select>
            </Form.Item>

            {/* State */}

            <Form.Item
              name="state_id"
              label="State"
              rules={[{ required: true, message: "Please select a state" }]}
            >
              <Select
                showSearch
                placeholder="Select State"
                optionFilterProp="children"
                suffixIcon={<ChevronDown size={16} color={NAVY_DARK} />}
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
                filterSort={(optionA, optionB) =>
                  optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
                }
              >
                {states.map((state) => (
                  <Select.Option key={state.id} value={state.id}>
                    {state.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* City */}

            <Form.Item
              name="city_id"
              label="City"
              rules={[{ required: true, message: "Please select a city" }]}
            >
              <Select
                showSearch
                placeholder="Select City"
                disabled={!addressForm.getFieldValue("state_id")}
                optionFilterProp="children"
                suffixIcon={<ChevronDown size={16} color={NAVY_DARK} />}
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
                filterSort={(optionA, optionB) =>
                  optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
                }
              >
                {cities.map((city) => (
                  <Select.Option key={city.id} value={city.id}>
                    {city.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Map */}

            <Form.Item label="Map Preview">
              <div style={{ border: "1px solid #eef0f2", height: 220, borderRadius: 8, overflow: "hidden" }}>
                {addressCoordinates.lat && addressCoordinates.lng ? (
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: "none" }}
                    src={`https://maps.google.com/maps?q=${addressCoordinates.lat},${addressCoordinates.lng}&z=16&output=embed`}
                    allowFullScreen
                  />
                ) : (
                  <p style={{ textAlign: "center", paddingTop: 80, color: "#999" }}>
                    Enter address to show map
                  </p>
                )}
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </Paper>
    </Box>
  );
};

export default UpdateServiceProvider;