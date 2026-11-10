import { useEffect, useState } from "react";
import {
    Button,
    Divider,
    Input,
    Radio,
    Select,
    Spin,
    Tag,
    message,
} from "antd";

import { AddUser, GetHiringFormsByEmail } from "@/services/api/userApi";
import { StateAPI, CityAPI } from "@/services/api/addressApi";

import { useNavigate } from "react-router";
import PageHeader from "@/components/PageHeader";
import { geocodeAddress } from "@/utils/geocode";
import "./employeeForm.scss";
import {
    ArrowLeft,
    Check,
    X,
    Mail,
    User,
    Briefcase,
    FileText,
    MapPin,
    ClipboardList,
    CircleCheck,
    Info,
    ChevronDown,
    Phone,
    Clock,
    Search,
    Globe,
} from "lucide-react";

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

// SELECT OPTIONS

const USER_TYPE_OPTIONS = [
    { value: "7", label: "Inspector/Supervisor" },
    { value: "8", label: "Quality Assurance Technician" },
    { value: "9-10", label: "Cleaner" },
    { value: "9-11", label: "HouseKeeping" },
];

const EMPLOYEE_TYPE_OPTIONS = [
    { value: "W2_BI_WEEKLY", label: "W2 Bi-Weekly" },
    { value: "1099", label: "1099 Contractor" },
];

const AddEmployeePage = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    // Search is driven by `email` and `nameQuery` — NOT by `name` itself.
    // `name` doubles as the field that gets submitted for the new
    // employee, and handleHiringFormSelect below auto-fills it from
    // whichever form the admin picks. If the search effect depended on
    // `name` directly, that auto-fill would immediately re-trigger a
    // search that adds name-matches on top of whatever the admin was
    // actually searching by (e.g. searched by email, got 1 match,
    // selected it, and suddenly see 4 results because the selected
    // form's name is now also being searched). `nameQuery` only
    // changes when the admin types into the Name field themselves.
    const [nameQuery, setNameQuery] = useState("");

    const [roleId, setRoleId] = useState("");
    const [disable, setDisable] = useState(false);
    const [employeeType, setEmployeeType] = useState("");

    // HIRING FORM STATES

    const [hiringForms, setHiringForms] = useState([]);
    const [selectedHiringForm, setSelectedHiringForm] =
        useState(null);
    const [loadingHiringForms, setLoadingHiringForms] =
        useState(false);
    // Tracks whether at least one search has completed, so we only
    // show "no forms found" after a real attempt (not on first render).
    const [hasSearched, setHasSearched] = useState(false);

    // LOCATION STATES

    const [hiringFormLocation, setHiringFormLocation] =
        useState({
            country_id: null,
            state_id: null,
            city_id: null,
            lat: null,
            lng: null,
        });

    const [loadingLocation, setLoadingLocation] =
        useState(false);

    // UI-only: lets the admin collapse the "How this works" note
    const [showHelp, setShowHelp] = useState(true);

    const navigate = useNavigate();

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

    // FETCH HIRING FORMS WHEN EMAIL OR NAME CHANGES
    // Either field alone is enough to search — the backend matches
    // on email OR name, so we send whichever (or both) are filled in.

    useEffect(() => {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedName = nameQuery.trim().toLowerCase();

        // Clear results if both name and email are empty
        if (!normalizedEmail && !normalizedName) {
            setHiringForms([]);
            setSelectedHiringForm(null);
            resetHiringFormLocation();
            setHasSearched(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setLoadingHiringForms(true);

                const response = await GetHiringFormsByEmail(
                    normalizedEmail || undefined,
                    normalizedName || undefined,
                );

                if (response.status === 200) {
                    const forms = response.data?.data || [];

                    setHiringForms(forms);

                    // Reset selected form whenever the search changes
                    setSelectedHiringForm(null);
                    resetHiringFormLocation();
                    setHasSearched(true);

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

                if (error.response?.status === 401) {
                    message.error("Token expired");

                    localStorage.removeItem("adminToken");

                    setTimeout(() => {
                        navigate("/Login");
                    }, 3000);
                }
            } finally {
                setLoadingHiringForms(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [email, nameQuery, navigate]);

    // RESOLVE HIRING FORM LOCATION

    const resolveHiringFormLocation = async (
        form,
    ) => {
        try {
            setLoadingLocation(true);

            resetHiringFormLocation();

            // VALIDATE STATE / CITY

            if (!form?.state) {
                throw new Error(
                    "State is missing from hiring form",
                );
            }

            if (!form?.city) {
                throw new Error(
                    "City is missing from hiring form",
                );
            }

            // RESOLVE COUNTRY
            // Empty/missing on older hiring forms — treated as
            // USA, since every hiring form was USA before the
            // country field was added.

            const countryId = resolveCountryId(form.country);

            // NORMALIZE STATE
            // Example:
            // FL -> Florida
            // fl -> Florida
            // Florida -> Florida

            const formState = form.state
                .trim()
                .toUpperCase();

            const normalizedStateName =
                STATE_ABBREVIATIONS[
                    formState
                ] || form.state.trim();

            // FETCH STATES FRESH — FOR THE RESOLVED COUNTRY
            // Don't rely on the `states` state variable here —
            // it's populated by a separate useEffect that could
            // still be in flight, and it's only ever prefetched
            // for USA. Fetching directly (same pattern as CityAPI
            // below) removes any race and gets the right country's
            // state list.

            const stateResponse = await StateAPI(countryId);

            const stateList =
                stateResponse?.data?.data
                    ?.all_state || [];

            // MATCH STATE WITH OUR STATE LIST

            const matchedState = stateList.find(
                (state) =>
                    state.name
                        ?.trim()
                        .toLowerCase() ===
                    normalizedStateName
                        .trim()
                        .toLowerCase(),
            );

            if (!matchedState) {
                throw new Error(
                    `State "${form.state}" was not found`,
                );
            }

            // FETCH CITIES FOR MATCHED STATE

            const cityResponse = await CityAPI(
                matchedState.id,
            );

            const cityList =
                cityResponse?.data?.data
                    ?.all_city || [];

            // NORMALIZE CITY

            const normalizedCityName =
                form.city
                    .trim()
                    .replace(/\s+/g, " ")
                    .toLowerCase();

            // MATCH CITY

            const matchedCity =
                cityList.find(
                    (city) =>
                        city.name
                            ?.trim()
                            .replace(
                                /\s+/g,
                                " ",
                            )
                            .toLowerCase() ===
                        normalizedCityName,
                );

            if (!matchedCity) {
                throw new Error(
                    `City "${form.city}" was not found in ${matchedState.name}`,
                );
            }

            // BUILD FULL ADDRESS

            const fullAddress = [
                form.address,
                form.city,
                normalizedStateName,
                form.zip_code,
            ]
                .filter(Boolean)
                .join(", ");

            if (!fullAddress) {
                throw new Error(
                    "Address is missing from hiring form",
                );
            }

            // GOOGLE GEOCODING

            const geocodeData =
                await geocodeAddress(fullAddress);

            if (
                geocodeData.status !==
                "OK"
            ) {
                throw new Error(
                    "Unable to get coordinates for hiring form address",
                );
            }

            const location =
                geocodeData.results?.[0]
                    ?.geometry?.location;

            if (
                !location ||
                location.lat ===
                    undefined ||
                location.lng ===
                    undefined
            ) {
                throw new Error(
                    "Coordinates were not found for hiring form address",
                );
            }

            // FINAL LOCATION DATA

            const locationData = {
                country_id: countryId,

                state_id:
                    matchedState.id,

                city_id:
                    matchedCity.id,

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

    // SELECT HIRING FORM

    const handleHiringFormSelect = async (
        form,
    ) => {
        setSelectedHiringForm(form);

        // Automatically populate employee name — deliberately setName()
        // only, NOT setNameQuery(). This keeps the search scoped to
        // whichever field the admin was actually searching by (email or
        // name) instead of silently adding the selected form's name as
        // an extra search term once it lands in the Name field.
        if (form.name) {
            setName(form.name);
        }

        try {
            await resolveHiringFormLocation(
                form,
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

    // SUBMIT

    const handleSubmit = async (event) => {
        event.preventDefault();

        setDisable(true);

        // BASIC VALIDATION

        if (!name?.trim()) {
            message.error(
                "Please enter name",
            );

            setDisable(false);
            return;
        }

        if (!email?.trim()) {
            message.error(
                "Please enter email",
            );

            setDisable(false);
            return;
        }

        if (!roleId) {
            message.error(
                "Please select a user type",
            );

            setDisable(false);
            return;
        }

        if (!employeeType) {
            message.error(
                "Please select employee type",
            );

            setDisable(false);
            return;
        }

        // HIRING FORM REQUIRED FOR EMPLOYEES

        if (!selectedHiringForm) {
            message.error(
                "Please select a hiring form for this employee",
            );

            setDisable(false);
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
                "Unable to determine the selected hiring form location. Please select the hiring form again.",
            );

            setDisable(false);
            return;
        }

        // ROLE / SUB ROLE

        let finalRoleId;
        let subRoleId = null;

        if (roleId.includes("-")) {
            const [role, subRole] =
                roleId.split("-");

            finalRoleId =
                parseInt(role, 10);

            subRoleId =
                parseInt(subRole, 10);
        } else {
            finalRoleId =
                parseInt(roleId, 10);
        }

        try {
            // ADD USER PAYLOAD

            const payload = {
                email: email
                    .trim()
                    .toLowerCase(),

                name: name.trim(),

                role_id: finalRoleId,

                sub_role_id: subRoleId,

                // Every employee role (7, 8, 9) requires an employee
                // type — validated as required above regardless of
                // which role is selected — so it's always sent here.
                // (Previously this was gated on `finalRoleId === 7`,
                // which silently sent null for Cleaner/HouseKeeping/QA
                // even though the dropdown showed a value selected.)
                employee_type: employeeType,

                // SELECTED HIRING FORM

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

            const response =
                await AddUser(payload);

            if (response.status === 200) {
                message.success(
                    "Employee added successfully",
                );

                setTimeout(() => {
                    navigate(
                        "/employees",
                    );
                }, 1000);
            }

            setDisable(false);
        } catch (error) {
            console.error(
                "Error adding employee:",
                error,
            );

            if (
                error.response &&
                error.response.status ===
                    400
            ) {
                message.error(
                    error.response?.data
                        ?.message ||
                        "Invalid employee details",
                );
            } else if (
                error.response?.status ===
                401
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
            } else {
                message.error(
                    error.response?.data
                        ?.message ||
                        "Something went wrong",
                );
            }

            setDisable(false);
        }
    };

    // NAVIGATION

    const navigateToUser = () => {
        navigate("/employees");
    };

    // DATE FORMAT

    const formatSubmittedDate = (
        date,
    ) => {
        if (!date) return "";

        return new Date(
            date,
        ).toLocaleString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // DERIVED — UI ONLY

    const locationReady =
        !loadingLocation &&
        hiringFormLocation.state_id &&
        hiringFormLocation.city_id &&
        hiringFormLocation.lat !== null &&
        hiringFormLocation.lng !== null;

    // Search is "active" the moment email or nameQuery has something
    // typed in it — deliberately checks nameQuery, not name, since name
    // can hold a value auto-filled from a selected hiring form with no
    // active search behind it (e.g. admin searched by email only).
    const hasSearchInput = Boolean(
        email.trim() || nameQuery.trim(),
    );

    return (
        <div>
            {/* HEADER */}

            <PageHeader
                title="EMPLOYEE MANAGEMENT"
                subtitle="Create New Employee"
                actions={
                    <Button
                        size="large"
                        icon={<ArrowLeft size={16} />}
                        onClick={navigateToUser}
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
                        How the hiring form auto-fill works
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
                                text: "Type either the employee's email or their name above — you don't need both. We look up every hiring form that matches.",
                            },
                            {
                                icon: <ClipboardList size={16} />,
                                title: "2. Pick the hiring form",
                                text: "Matching submissions appear below. Choose the one that belongs to this employee.",
                            },
                            {
                                icon: <MapPin size={16} />,
                                title: "3. Details auto-fill",
                                text: "Name, address, city, state and coordinates are pulled from the form automatically.",
                            },
                        ].map((step) => (
                            <div
                                key={step.title}
                                className="employee-help__step"
                            >
                                <span className="employee-help__step-icon">
                                    {step.icon}
                                </span>

                                <div>
                                    <p className="employee-help__step-title">
                                        {step.title}
                                    </p>

                                    <p className="employee-help__step-text">
                                        {step.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* FORM */}

            <div className="surface employee-form__card">
                <form onSubmit={handleSubmit}>
                    <div className="employee-form__body">
                        {/* BASIC INFO */}

                        <div className="employee-form__grid">
                            <div>
                                <label
                                    htmlFor="employee-name"
                                    className="field-label employee-form__label"
                                >
                                    <User size={15} color="var(--color-text-muted)" />
                                    Full Name
                                    <span className="employee-form__label-hint">
                                        (searches hiring forms too)
                                    </span>
                                </label>

                                {/* The suffix is always rendered (an empty
                                    span when idle) so the input keeps its
                                    DOM node — and focus — when the
                                    spinner appears. */}
                                <Input
                                    id="employee-name"
                                    size="large"
                                    placeholder="Enter name"
                                    value={name}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        setName(value);
                                        setNameQuery(value);
                                    }}
                                    suffix={
                                        loadingHiringForms && nameQuery.trim() ? (
                                            <Spin size="small" />
                                        ) : (
                                            <span />
                                        )
                                    }
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="employee-email"
                                    className="field-label employee-form__label"
                                >
                                    <Mail size={15} color="var(--color-text-muted)" />
                                    Email address
                                    <span className="employee-form__label-hint">
                                        (searches hiring forms too)
                                    </span>
                                </label>

                                <Input
                                    id="employee-email"
                                    size="large"
                                    type="email"
                                    placeholder="Enter email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    suffix={
                                        loadingHiringForms && email.trim() ? (
                                            <Spin size="small" />
                                        ) : (
                                            <span />
                                        )
                                    }
                                />
                            </div>
                        </div>

                        {/* HIRING FORMS */}

                        {hasSearchInput && (
                            <div>
                                <div className="field-label employee-form__label employee-form__label--spaced">
                                    <ClipboardList size={15} color="var(--color-text-muted)" />
                                    Select Hiring Form
                                    {hiringForms.length > 0 && (
                                        <Tag
                                            color="success"
                                            variant="filled"
                                            className="hiring-forms__count"
                                        >
                                            {`${hiringForms.length} found`}
                                        </Tag>
                                    )}
                                </div>

                                {loadingHiringForms && hiringForms.length === 0 ? (
                                    <div className="hiring-forms__status">
                                        <Spin size="small" />
                                        Searching hiring forms…
                                    </div>
                                ) : hasSearched && hiringForms.length === 0 ? (
                                    <div className="hiring-forms__empty">
                                        No hiring forms match that email or name.
                                    </div>
                                ) : (
                                    <Radio.Group
                                        className="hiring-forms__group"
                                        value={String(
                                            selectedHiringForm?.submission_id || "",
                                        )}
                                        onChange={(e) => {
                                            const selected = hiringForms.find(
                                                (form) =>
                                                    String(form.submission_id) ===
                                                    e.target.value,
                                            );

                                            if (selected) {
                                                handleHiringFormSelect(selected);
                                            }
                                        }}
                                    >
                                        <div className="hiring-forms__list">
                                            {hiringForms.map((form) => {
                                                const isSelected =
                                                    selectedHiringForm?.submission_id ===
                                                    form.submission_id;

                                                return (
                                                    <div
                                                        key={form.submission_id}
                                                        className={
                                                            isSelected
                                                                ? "hiring-forms__card hiring-forms__card--selected"
                                                                : "hiring-forms__card"
                                                        }
                                                        onClick={() =>
                                                            handleHiringFormSelect(form)
                                                        }
                                                    >
                                                        <Radio
                                                            className="hiring-forms__radio"
                                                            value={String(
                                                                form.submission_id,
                                                            )}
                                                            disabled={
                                                                loadingLocation &&
                                                                isSelected
                                                            }
                                                        >
                                                            <span className="hiring-forms__content">
                                                                <span className="hiring-forms__details">
                                                                    <span className="hiring-forms__name">
                                                                        {form.name}
                                                                    </span>

                                                                    {form.email && (
                                                                        <span className="hiring-forms__meta">
                                                                            <Mail size={13} />
                                                                            {form.email}
                                                                        </span>
                                                                    )}

                                                                    <span className="hiring-forms__meta">
                                                                        <MapPin size={13} />
                                                                        {form.full_address}
                                                                    </span>

                                                                    <span className="hiring-forms__meta">
                                                                        <Phone size={13} />
                                                                        {form.phone}
                                                                    </span>

                                                                    <span className="hiring-forms__meta">
                                                                        <Globe size={13} />
                                                                        {/* Older hiring forms predate the country
                                                                            field entirely — shown as USA rather
                                                                            than blank, to stay consistent with
                                                                            how that's resolved everywhere else. */}
                                                                        {form.country || "USA"}
                                                                    </span>
                                                                </span>

                                                                <span className="hiring-forms__date">
                                                                    <Clock size={11} />
                                                                    {formatSubmittedDate(
                                                                        form.submitted_at,
                                                                    )}
                                                                </span>
                                                            </span>
                                                        </Radio>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Radio.Group>
                                )}
                            </div>
                        )}

                        {/* SELECTED HIRING FORM DETAILS */}

                        {selectedHiringForm && (
                            <div className="hiring-forms__selected">
                                <div className="hiring-forms__selected-title">
                                    <CircleCheck
                                        size={17}
                                        className="hiring-forms__selected-icon"
                                    />
                                    Selected Hiring Form
                                </div>

                                <div className="hiring-forms__selected-grid">
                                    {[
                                        {
                                            label: "Name",
                                            value: selectedHiringForm.name,
                                        },
                                        {
                                            label: "Email",
                                            value:
                                                selectedHiringForm.email || "-",
                                        },
                                        {
                                            label: "Phone",
                                            value:
                                                selectedHiringForm.phone || "-",
                                        },
                                        {
                                            label: "Submitted",
                                            value: formatSubmittedDate(
                                                selectedHiringForm.submitted_at,
                                            ),
                                        },
                                        {
                                            label: "Address",
                                            value: selectedHiringForm.full_address,
                                            span: true,
                                        },
                                        {
                                            label: "Country",
                                            value: loadingLocation
                                                ? "Loading…"
                                                : COUNTRY_NAMES_BY_ID[
                                                      hiringFormLocation.country_id
                                                  ] || "-",
                                            good: hiringFormLocation.country_id,
                                        },
                                        {
                                            label: "State",
                                            value: loadingLocation
                                                ? "Loading…"
                                                : hiringFormLocation.state_id
                                                ? "Matched"
                                                : "-",
                                            good: hiringFormLocation.state_id,
                                        },
                                        {
                                            label: "City",
                                            value: loadingLocation
                                                ? "Loading…"
                                                : hiringFormLocation.city_id
                                                ? "Matched"
                                                : "-",
                                            good: hiringFormLocation.city_id,
                                        },
                                        {
                                            label: "Coordinates",
                                            value: loadingLocation
                                                ? "Loading…"
                                                : hiringFormLocation.lat !== null &&
                                                  hiringFormLocation.lng !== null
                                                ? `${hiringFormLocation.lat}, ${hiringFormLocation.lng}`
                                                : "-",
                                            good:
                                                hiringFormLocation.lat !== null,
                                        },
                                    ].map((field) => (
                                        <div
                                            key={field.label}
                                            className={
                                                field.span
                                                    ? "hiring-forms__field hiring-forms__field--span"
                                                    : "hiring-forms__field"
                                            }
                                        >
                                            <div className="hiring-forms__field-label">
                                                {field.label}
                                            </div>

                                            <div
                                                className={
                                                    field.good === false
                                                        ? "hiring-forms__field-value hiring-forms__field-value--muted"
                                                        : "hiring-forms__field-value"
                                                }
                                            >
                                                {field.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Divider className="employee-form__divider" />

                        {/* ROLE / TYPE */}

                        <div className="employee-form__grid">
                            <div>
                                <label
                                    htmlFor="employee-role"
                                    className="field-label employee-form__label"
                                >
                                    <Briefcase size={15} color="var(--color-text-muted)" />
                                    User Type
                                </label>

                                <Select
                                    id="employee-role"
                                    size="large"
                                    className="employee-form__select"
                                    placeholder="Select User Type"
                                    value={roleId || undefined}
                                    onChange={(value) => setRoleId(value)}
                                    suffix={
                                        <ChevronDown
                                            size={16}
                                            color="var(--color-text-secondary)"
                                        />
                                    }
                                    options={USER_TYPE_OPTIONS}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="employee-type"
                                    className="field-label employee-form__label"
                                >
                                    <FileText size={15} color="var(--color-text-muted)" />
                                    Employee Type
                                </label>

                                <Select
                                    id="employee-type"
                                    size="large"
                                    className="employee-form__select"
                                    placeholder="Select Employee Type"
                                    value={employeeType || undefined}
                                    onChange={(value) => setEmployeeType(value)}
                                    suffix={
                                        <ChevronDown
                                            size={16}
                                            color="var(--color-text-secondary)"
                                        />
                                    }
                                    options={EMPLOYEE_TYPE_OPTIONS}
                                />
                            </div>
                        </div>

                        {/* ACTION BUTTONS */}

                        <div className="employee-form__actions">
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                disabled={
                                    disable ||
                                    loadingLocation ||
                                    loadingHiringForms
                                }
                                loading={disable}
                                icon={<Check size={16} />}
                            >
                                {disable
                                    ? "Saving..."
                                    : loadingLocation
                                    ? "Loading Location..."
                                    : "Save Employee"}
                            </Button>

                            <Button
                                size="large"
                                icon={<X size={16} />}
                                onClick={navigateToUser}
                            >
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
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployeePage;