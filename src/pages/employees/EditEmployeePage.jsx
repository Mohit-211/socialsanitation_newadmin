import { useEffect, useRef, useState } from "react";
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
  Divider,
  Spin,
  Tag,
  Tooltip,
} from "antd";

import { useNavigate, useParams } from "react-router";

import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Check,
  Mail,
  User,
  Briefcase,
  ClipboardList,
  CircleCheck,
  Info,
  ChevronDown,
  Phone,
  Clock,
  Search,
} from "lucide-react";

import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import { geocodeAddress } from "@/utils/geocode";
import "./employeeForm.scss";

import { GetUserById, EditUserById, GetHiringFormsByEmail, ChangeEmployeeRole } from "@/services/api/userApi";
import { StateAPI, CityAPI, AddNewUserAddress, EditAddress, DeleteUserAddress } from "@/services/api/addressApi";

// US STATE ABBREVIATIONS

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

// COUNTRIES
// The hiring form now collects a country. Older submissions were
// taken before that field existed and come back with an empty
// string — those are treated as USA, matching what every existing
// hiring form actually was.

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

// Chevron used by every Select on this page.
const selectChevron = (
  <ChevronDown size={16} color="var(--color-text-secondary)" />
);

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

// COMPONENT

const EditEmployeePage = () => {
  const [form] = Form.useForm();
  const [addressForm] = Form.useForm();

  const navigate = useNavigate();
  const { id } = useParams();

  // GENERAL STATES

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [loading, setLoading] = useState(false);

  const [userAddresses, setUserAddresses] = useState([]);

  // ADDRESS MODAL

  const [addressModalVisible, setAddressModalVisible] =
    useState(false);

  const [editingAddress, setEditingAddress] =
    useState(null);

  const [addressCoordinates, setAddressCoordinates] =
    useState({
      lat: null,
      lng: null,
    });

  // HIRING FORM STATES

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

  // HIRING FORM SEARCH — decoupled from the Name/Email form
  // fields on purpose. These two only change when the admin
  // actually types into the Name or Email inputs (via their
  // onChange handlers below) — NOT when a hiring form selection
  // programmatically fills the Name field. That decoupling is
  // what stops "selecting a form" from immediately re-triggering
  // a search that would wipe the selection out again.

  const [emailQuery, setEmailQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");

  // Skips exactly one upcoming search-effect run — set right
  // before we seed emailQuery/nameQuery from the loaded employee,
  // since loadEmployee() already performs that initial search
  // itself (and needs to auto-select the employee's existing
  // hiring form, which a generic search wouldn't do).
  const skipNextAutoSearchRef = useRef(false);

  // ROLE (PROMOTE / REASSIGN)
  // Kept independent of the main Form — it saves immediately via
  // its own endpoint (same interaction as Employee Type on the
  // employee list page), not as part of the big Save button.
  // Bundling it into the main form would mean an admin couldn't
  // promote someone without also having a hiring form + resolved
  // location ready, which the main Save requires but role changes
  // don't need at all.

  const [roleValue, setRoleValue] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);

  // UI-only: lets the admin collapse the "How this works" note
  const [showHelp, setShowHelp] = useState(true);

  // ONLY ONE ADDRESS FOR EMPLOYEE

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

  // NAVIGATION

  const navigateToEmployees = () => {
    navigate("/employees");
  };

  // RESET HIRING FORM LOCATION

  const resetHiringFormLocation = () => {
    setHiringFormLocation({
      country_id: null,
      state_id: null,
      city_id: null,
      lat: null,
      lng: null,
    });
  };

  // FETCH STATES — FOR A GIVEN COUNTRY
  // The Add/Edit Address modal below lets the admin pick USA or
  // Canada, and the State dropdown needs to reflect whichever one
  // is currently selected there — so this fetches on demand rather
  // than once at mount for a hardcoded country.

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
  }, []);

  // FETCH CITIES

  const fetchCities = (stateId) => {
    return CityAPI(stateId).then((res) => {
      const citiesList =
        res?.data?.data?.all_city || [];

      setCities(citiesList);

      return citiesList;
    });
  };

  // GEOCODE ADDRESS

  const fetchCoordinates = async (address) => {
    if (!address) return;

    try {
      const data = await geocodeAddress(address);

      if (data.status === "OK") {
        const location =
          data.results[0]?.geometry?.location;

        if (!location) return;

        setAddressCoordinates({
          lat: location.lat,
          lng: location.lng,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // RESOLVE HIRING FORM LOCATION

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

      // COUNTRY
      // Empty/missing on older hiring forms — treated as USA,
      // since every hiring form was USA before the country field
      // was added.

      const countryId = resolveCountryId(hiringForm.country);

      // STATE

      const formState = hiringForm.state
        .trim()
        .toUpperCase();

      const normalizedStateName =
        STATE_ABBREVIATIONS[formState] ||
        hiringForm.state.trim();

      // FETCH STATES FRESH — FOR THE RESOLVED COUNTRY
      // Don't rely on the `states` state variable here — it's
      // populated by a separate useEffect that races against
      // this one on mount, and it's only ever prefetched for
      // USA. Fetching directly (same pattern as CityAPI below)
      // removes the race and gets the right country's states.

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

      // CITY

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

      // FULL ADDRESS

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

      // GOOGLE GEOCODING

      const data = await geocodeAddress(fullAddress);

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

      // FINAL LOCATION

      const locationData = {
        country_id: countryId,
        state_id: matchedState.id,
        city_id: matchedCity.id,
        lat: location.lat,
        lng: location.lng,
      };

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

  // FETCH HIRING FORMS BY EMAIL AND/OR NAME
  // Either value alone is enough — the backend matches on
  // email OR name, so we pass through whichever the caller
  // actually has.

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

        // IF EDITING AND EXISTING FORM EXISTS,
        // SELECT IT AUTOMATICALLY

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

        // OTHERWISE, DON'T AUTO SELECT
        // We let the admin explicitly select one.

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

  // LOAD EMPLOYEE

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        const response =
          await GetUserById(id);

        const data =
          response?.data?.data;

        if (!data) return;

        // USER DATA

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

        // CURRENT ROLE → "Role" SELECT VALUE
        // Role 9 (Cleaner / HouseKeeping) is split further by
        // sub_role_id, so it's represented as "9-10" / "9-11"
        // in the select, matching the Add Employee screen.

        setRoleValue(
          getRoleSelectValue(
            data?.role_id ?? null,
            data?.sub_role_id ?? null,
          ),
        );

        // USER ADDRESS

        setUserAddresses(
          data?.user_address || [],
        );

        // SEED THE SEARCH STATE
        // This will fire the search-effect below once, but
        // skipNextAutoSearchRef swallows that single run since
        // we're doing the equivalent search manually right here
        // (and need existingSubmissionId to auto-select).

        skipNextAutoSearchRef.current = true;

        setEmailQuery(employeeEmail);
        setNameQuery(employeeName);

        // EXISTING HIRING FORM

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

  // EMAIL / NAME INPUT CHANGES
  // These are the ONLY things that update emailQuery/nameQuery,
  // which is what makes them safe to watch below — selecting a
  // hiring form updates the form's "name" field programmatically
  // (via form.setFieldValue) without going through here, so it
  // never re-triggers a search.

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

  // SEARCH HIRING FORMS WHEN EMAIL OR NAME CHANGES

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

  // SELECT HIRING FORM

  const handleHiringFormSelect = async (
    hiringForm,
  ) => {
    // GUARD: BLOCK CROSS-EMAIL SELECTION
    // The account's email is fixed (this employee was already
    // created with it) — a hiring form submitted under a
    // different email can never actually be assigned to them.
    // The backend already rejects this on save, but that's a
    // confusing way to find out; catch it here instead so the
    // admin sees why immediately and nothing gets selected.

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

  // ROLE CHANGE — INSTANT, VIA DEDICATED ENDPOINT
  // Hits POST /change-employee-role/:id directly. Doesn't touch
  // the main Form at all, so it works regardless of whether a
  // hiring form or location has been resolved yet.

  const handleRoleChange = async (value) => {
    const previousValue = roleValue;

    setRoleValue(value);

    let role_id;
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

  // SAVE EMPLOYEE

  const handleSave = async (
    values,
  ) => {
    try {
      setLoading(true);

      // HIRING FORM REQUIRED

      if (!selectedHiringForm) {
        message.error(
          "Please select a hiring form",
        );

        setLoading(false);
        return;
      }

      // LOCATION REQUIRED

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

      // PAYLOAD
      // Role is intentionally NOT included here — it's saved
      // instantly by handleRoleChange above via its own endpoint.

      const payload = {
        name: values.name,

        email: values.email
          ?.trim()
          .toLowerCase(),

        employee_type:
          values.employee_type,

        // HIRING FORM

        hiring_form_submission_id:
          selectedHiringForm.submission_id,

        // LOCATION

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

  // REFRESH USER

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

  // OPEN ADD ADDRESS

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

  // OPEN EDIT ADDRESS

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

  // SAVE MANUAL ADDRESS

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

  // DELETE ADDRESS

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

  // DATE FORMAT

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

  // RENDER

  return (
    <div>
      {/* HEADER */}

      <PageHeader
        title="EMPLOYEE MANAGEMENT"
        subtitle="Update Employee Details"
        actions={
          <Button
            size="large"
            icon={<ArrowLeft size={16} />}
            onClick={navigateToEmployees}
          >
            Return to Employees
          </Button>
        }
      />

      {/* HOW THIS WORKS */}

      <section className="employee-help">
        <button
          type="button"
          className="employee-help__toggle"
          aria-expanded={showHelp}
          onClick={() => setShowHelp((v) => !v)}
        >
          <Info size={18} className="employee-help__icon" />

          <span className="employee-help__title">
            How the hiring form auto-fill & role change work
          </span>

          <ChevronDown
            size={18}
            className={
              showHelp
                ? "employee-help__chevron employee-help__chevron--open"
                : "employee-help__chevron"
            }
          />
        </button>

        {showHelp && (
          <div className="employee-help__steps">
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
              <div key={step.title} className="employee-help__step">
                <span className="employee-help__step-icon">{step.icon}</span>

                <div>
                  <p className="employee-help__step-title">{step.title}</p>

                  <p className="employee-help__step-text">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MAIN FORM */}

      <div className="surface employee-form__card">
        <Form layout="vertical" form={form} onFinish={handleSave}>
          {/* BASIC INFORMATION */}

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
                  prefix={<User size={14} color="var(--color-text-subtle)" style={{ marginRight: 4 }} />}
                  suffix={
                    loadingHiringForms && nameQuery.trim() ? (
                      <Spin size="small" />
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
                  prefix={<Mail size={14} color="var(--color-text-subtle)" style={{ marginRight: 4 }} />}
                  suffix={
                    loadingHiringForms && emailQuery.trim() ? (
                      <Spin size="small" />
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
                  suffix={selectChevron}
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

            {/* ROLE — laid out like any other field here, but
                NOT part of this Form: it saves immediately via
                ChangeEmployeeRole (handleRoleChange), the same
                interaction as Employee Type on the employee list
                page. It doesn't touch form values or the Save
                button below. The Form.Item has no `name`, so it
                only provides the label and help text. */}

            <Col xs={24} md={12}>
              <Form.Item
                label="Role"
                extra="Promotes or reassigns immediately — no need to press Save."
              >
                <Select
                  value={roleValue || undefined}
                  placeholder="Select Role"
                  style={{ width: "100%" }}
                  disabled={updatingRole}
                  suffix={
                    updatingRole ? <Spin size="small" /> : selectChevron
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
              </Form.Item>
            </Col>
          </Row>

          {/* HIRING FORMS */}

          <section className="surface surface--padded surface--flat employee-section">
            <div className="employee-section__header">
              <div>
                <h3 className="employee-eyebrow">
                  <ClipboardList size={14} />
                  Hiring Forms
                </h3>

                <p className="employee-section__description">
                  Select the hiring form associated with this employee — search by
                  either the name or the email above.
                </p>
              </div>

              {hiringForms.length > 0 && (
                <Tag color="success" variant="filled" className="hiring-forms__count">
                  {`${hiringForms.length} found`}
                </Tag>
              )}

              {loadingHiringForms && <Spin size="small" />}
            </div>

            {!hasSearchInput ? (
              <div className="hiring-forms__empty">
                Enter a name or email above to search hiring forms.
              </div>
            ) : loadingHiringForms && hiringForms.length === 0 ? (
              <div className="hiring-forms__status">
                <Spin size="small" />
                Searching hiring forms…
              </div>
            ) : hasSearched && hiringForms.length === 0 ? (
              <div className="hiring-forms__empty">
                No hiring forms found for that search.
              </div>
            ) : (
              // The group compares String(submission_id) on both sides —
              // the same comparison as `isSelected` below, which drives the
              // card's highlighted border — so the visual "which one is
              // picked" and the radio dot can never disagree.
              <Radio.Group
                name="hiring-form-selection"
                className="hiring-forms__group"
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
                <div className="hiring-forms__list">
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

                    const cardClassName = [
                      "hiring-forms__card",
                      isSelected ? "hiring-forms__card--selected" : "",
                      emailMismatch ? "hiring-forms__card--blocked" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <div
                        key={hiringForm.submission_id}
                        className={cardClassName}
                        onClick={() => handleHiringFormSelect(hiringForm)}
                      >
                        <Radio
                          className="hiring-forms__radio"
                          value={String(hiringForm.submission_id)}
                          disabled={emailMismatch}
                        >
                          <span className="hiring-forms__content">
                            <span className="hiring-forms__details">
                              <span className="hiring-forms__title-row">
                                <span className="hiring-forms__name">
                                  {hiringForm.name}
                                </span>

                                {isAssigned && (
                                  <Tag color="processing" variant="filled">
                                    Currently assigned
                                  </Tag>
                                )}

                                {emailMismatch && (
                                  <Tag color="warning" variant="filled">
                                    Different email — can't assign
                                  </Tag>
                                )}
                              </span>

                              {hiringForm.email && (
                                <span className="hiring-forms__meta">
                                  <Mail size={13} />
                                  {hiringForm.email}
                                </span>
                              )}

                              <span className="hiring-forms__meta">
                                <MapPin size={13} />
                                {hiringForm.full_address}
                              </span>

                              <span className="hiring-forms__meta">
                                <Phone size={13} />
                                {hiringForm.phone || "-"}
                              </span>
                            </span>

                            <span className="hiring-forms__date">
                              <Clock size={11} />
                              {formatSubmittedDate(hiringForm.submitted_at)}
                            </span>
                          </span>
                        </Radio>
                      </div>
                    );
                  })}
                </div>
              </Radio.Group>
            )}

            {/* SELECTED HIRING FORM LOCATION */}

            {selectedHiringForm && (
              <div className="hiring-forms__selected hiring-forms__selected--inset">
                <div className="hiring-forms__selected-title">
                  <CircleCheck size={16} className="hiring-forms__selected-icon" />
                  Selected Hiring Form
                </div>

                <Row gutter={[16, 12]}>
                  <Col xs={24} sm={12} md={6}>
                    <div className="hiring-forms__field-label">Country</div>

                    <div className="hiring-forms__field-value">
                      {loadingLocation
                        ? "Loading..."
                        : COUNTRY_NAMES_BY_ID[
                            hiringFormLocation.country_id
                          ] || "-"}
                    </div>
                  </Col>

                  <Col xs={24} sm={12} md={6}>
                    <div className="hiring-forms__field-label">State</div>

                    <div className="hiring-forms__field-value">
                      {loadingLocation
                        ? "Loading..."
                        : hiringFormLocation.state_id
                        ? "Matched"
                        : "-"}
                    </div>
                  </Col>

                  <Col xs={24} sm={12} md={6}>
                    <div className="hiring-forms__field-label">City</div>

                    <div className="hiring-forms__field-value">
                      {loadingLocation
                        ? "Loading..."
                        : hiringFormLocation.city_id
                        ? "Matched"
                        : "-"}
                    </div>
                  </Col>

                  <Col xs={24} sm={12} md={6}>
                    <div className="hiring-forms__field-label">Status</div>

                    <div
                      className={
                        locationReady
                          ? "hiring-forms__field-value hiring-forms__field-value--ready"
                          : "hiring-forms__field-value hiring-forms__field-value--muted"
                      }
                    >
                      {locationReady ? (
                        <CircleCheck size={14} />
                      ) : (
                        <Spin size="small" />
                      )}

                      {locationReady ? "Ready" : "Resolving…"}
                    </div>
                  </Col>

                  <Col span={24}>
                    <div className="hiring-forms__field-label">Coordinates</div>

                    <div className="hiring-forms__field-value">
                      {loadingLocation
                        ? "Loading..."
                        : hiringFormLocation.lat !== null && hiringFormLocation.lng !== null
                        ? `${hiringFormLocation.lat}, ${hiringFormLocation.lng}`
                        : "-"}
                    </div>
                  </Col>
                </Row>
              </div>
            )}
          </section>

          {/* EMPLOYEE ADDRESS */}

          <section className="surface surface--padded surface--flat employee-section">
            <div className="employee-section__header employee-address__header">
              <h3 className="employee-eyebrow">
                <MapPin size={16} className="employee-address__icon" />
                Employee Address
              </h3>

              <Tooltip
                title={
                  hasAddress
                    ? "An employee can only have one address. Delete the existing address to add a new one."
                    : ""
                }
              >
                <span className="employee-address__tooltip-target">
                  <Button
                    type="primary"
                    disabled={hasAddress}
                    icon={<Plus size={16} />}
                    onClick={openAddAddress}
                  >
                    Add Address
                  </Button>
                </span>
              </Tooltip>
            </div>

            {hasAddress ? (
              <div className="employee-address__grid">
                {userAddresses.map((addr) => (
                  <div key={addr.id} className="employee-address__card">
                    <div className="employee-address__line">
                      <MapPin size={16} className="employee-address__pin" />

                      <p className="employee-address__text">
                        {addr.address}, {addr.user_city?.name}, {addr.user_state?.name}, {addr.user_country?.name}
                      </p>
                    </div>

                    <Divider className="employee-address__divider" />

                    <div className="employee-address__actions">
                      <IconAction
                        icon={Pencil}
                        iconSize={14}
                        title="Edit Address"
                        onClick={() => openEditAddress(addr)}
                      />

                      <IconAction
                        icon={Trash2}
                        iconSize={14}
                        title="Delete Address"
                        danger
                        onClick={() => handleDeleteAddress(addr.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="employee-address__empty">
                <MapPin size={20} className="employee-address__empty-icon" />

                <p className="employee-address__empty-text">
                  No address added yet. This employee can have one address.
                </p>
              </div>
            )}
          </section>

          {/* ACTIONS */}

          <Form.Item style={{ marginTop: 8 }}>
            <div className="employee-form__actions">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                disabled={loadingLocation || loadingHiringForms}
                icon={<Check size={16} />}
              >
                Save
              </Button>

              <Button size="large" onClick={() => navigate("/employees")}>
                Cancel
              </Button>

              {selectedHiringForm && (
                <div
                  className={
                    locationReady
                      ? "employee-form__location employee-form__location--ready"
                      : "employee-form__location"
                  }
                >
                  {locationReady ? (
                    <>
                      <CircleCheck size={16} />
                      Location ready
                    </>
                  ) : (
                    <>
                      <Spin size="small" />
                      Resolving location…
                    </>
                  )}
                </div>
              )}
            </div>
          </Form.Item>
        </Form>

        {/* ADDRESS MODAL */}

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
                suffix={selectChevron}
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
                suffix={selectChevron}
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
                suffix={selectChevron}
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
              <div className="employee-address__map">
                {addressCoordinates.lat && addressCoordinates.lng ? (
                  <iframe
                    title="Map Preview"
                    src={`https://maps.google.com/maps?q=${addressCoordinates.lat},${addressCoordinates.lng}&z=16&output=embed`}
                    allowFullScreen
                  />
                ) : (
                  <p className="employee-address__map-placeholder">
                    Enter address to show map
                  </p>
                )}
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default EditEmployeePage;