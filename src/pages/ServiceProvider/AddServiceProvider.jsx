import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  FormLabel,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  Divider,
  Collapse,
} from "@mui/material";

import {
    AddUser,
    GetHiringFormsByEmail,
    StateAPI,
    CityAPI,
} from "../../services/Api/Api";

import { useNavigate } from "react-router-dom";
import { message } from "antd";
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
    CheckCircle2,
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

// SHARED STYLE TOKENS (kept consistent with the rest of the
// admin panel — navy / green, outlined 10px paper, #eef0f2)

const NAVY = "#16324f";
const NAVY_DARK = "#2c3345";
const GREEN = "#1b7a43";
const GREEN_LIGHT = "#3ea56f";
const BORDER = "#eef0f2";

const sectionCard = {
    borderRadius: "10px",
    borderColor: BORDER,
    p: 3,
};

const fieldLabel = {
    display: "flex",
    alignItems: "center",
    gap: 0.75,
    fontWeight: 600,
    color: "#374151",
    mb: 1,
    fontSize: "0.9rem",
};

const inputSx = {
    "& .MuiOutlinedInput-root": {
        height: "45px",
        borderRadius: "8px",
        backgroundColor: "#fff",
    },
};

const AddServiceProvider = () => {
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

            const geocodeResponse =
                await fetch(
                    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                        fullAddress,
                    )}&key=AIzaSyB45G8TScEmJSSG_PIzLJV2I6Ej1qgc_4o`,
                );

            const geocodeData =
                await geocodeResponse.json();

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
        <Box>
            {/* HEADER */}

            <Paper
                variant="outlined"
                sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: "10px",
                    borderColor: BORDER,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: { xs: "wrap", md: "nowrap" },
                        alignItems: "center",
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
                            <Typography className="page-title">
                                EMPLOYEE MANAGEMENT
                            </Typography>

                            <Typography className="page-sub-title">
                                Create New Employee
                            </Typography>
                        </Box>
                    </Box>

                    <Button
                        variant="contained"
                        disableElevation
                        startIcon={<ArrowLeft size={18} />}
                        onClick={navigateToUser}
                        sx={{
                            ml: "auto",
                            height: 46,
                            px: 3,
                            borderRadius: "8px",
                            minWidth: 180,
                            textTransform: "none",
                            fontWeight: 600,
                            backgroundColor: NAVY_DARK,
                            "&:hover": {
                                backgroundColor: "#1f2433",
                            },
                        }}
                    >
                        Return to Employees
                    </Button>
                </Box>
            </Paper>

            {/* HOW THIS WORKS */}

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

                    <Typography
                        sx={{
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            color: NAVY,
                            flexGrow: 1,
                        }}
                    >
                        How the hiring form auto-fill works
                    </Typography>

                    <ChevronDown
                        size={18}
                        color="#6b7280"
                        style={{
                            transform: showHelp
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                            transition: "transform 150ms ease",
                        }}
                    />
                </Box>

                <Collapse in={showHelp}>
                    <Divider sx={{ borderColor: "#d7ecdf" }} />

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: "repeat(3, 1fr)",
                            },
                            gap: 2,
                            px: 2.5,
                            py: 2,
                        }}
                    >
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
                            <Box
                                key={step.title}
                                sx={{
                                    display: "flex",
                                    gap: 1.25,
                                    alignItems: "flex-start",
                                }}
                            >
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
                                    <Typography
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: "0.82rem",
                                            color: NAVY,
                                            mb: 0.25,
                                        }}
                                    >
                                        {step.title}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            fontSize: "0.8rem",
                                            color: "#6b7280",
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {step.text}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Collapse>
            </Paper>

            {/* FORM */}

            <Paper variant="outlined" sx={sectionCard}>
                <form onSubmit={handleSubmit}>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                        }}
                    >
                        {/* BASIC INFO */}

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    md: "1fr 1fr",
                                },
                                gap: 2.5,
                            }}
                        >
                            <FormControl fullWidth>
                                <FormLabel sx={fieldLabel}>
                                    <User size={15} color="#6b7280" />
                                    Full Name
                                    <Typography
                                        component="span"
                                        sx={{
                                            fontSize: "0.72rem",
                                            fontWeight: 500,
                                            color: "#9ca3af",
                                        }}
                                    >
                                        (searches hiring forms too)
                                    </Typography>
                                </FormLabel>

                                <Box sx={{ position: "relative" }}>
                                    <TextField
                                        fullWidth
                                        placeholder="Enter name"
                                        value={name}
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            setName(value);
                                            setNameQuery(value);
                                        }}
                                        size="small"
                                        sx={inputSx}
                                    />

                                    {loadingHiringForms && nameQuery.trim() && (
                                        <CircularProgress
                                            size={18}
                                            sx={{
                                                position: "absolute",
                                                right: 14,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                color: GREEN,
                                            }}
                                        />
                                    )}
                                </Box>
                            </FormControl>

                            <FormControl fullWidth>
                                <FormLabel sx={fieldLabel}>
                                    <Mail size={15} color="#6b7280" />
                                    Email address
                                    <Typography
                                        component="span"
                                        sx={{
                                            fontSize: "0.72rem",
                                            fontWeight: 500,
                                            color: "#9ca3af",
                                        }}
                                    >
                                        (searches hiring forms too)
                                    </Typography>
                                </FormLabel>

                                <Box sx={{ position: "relative" }}>
                                    <TextField
                                        fullWidth
                                        type="email"
                                        placeholder="Enter email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        size="small"
                                        sx={inputSx}
                                    />

                                    {loadingHiringForms && email.trim() && (
                                        <CircularProgress
                                            size={18}
                                            sx={{
                                                position: "absolute",
                                                right: 14,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                color: GREEN,
                                            }}
                                        />
                                    )}
                                </Box>
                            </FormControl>
                        </Box>

                        {/* HIRING FORMS */}

                        {hasSearchInput && (
                            <Box>
                                <FormLabel sx={{ ...fieldLabel, mb: 1.5 }}>
                                    <ClipboardList size={15} color="#6b7280" />
                                    Select Hiring Form
                                    {hiringForms.length > 0 && (
                                        <Chip
                                            size="small"
                                            label={`${hiringForms.length} found`}
                                            sx={{
                                                ml: 0.5,
                                                height: 20,
                                                fontSize: "0.7rem",
                                                fontWeight: 600,
                                                backgroundColor: "#e7f5ec",
                                                color: GREEN,
                                            }}
                                        />
                                    )}
                                </FormLabel>

                                {loadingHiringForms && hiringForms.length === 0 ? (
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
                                            p: 2.5,
                                            textAlign: "center",
                                            backgroundColor: "#fafbfc",
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                color: "#9ca3af",
                                                fontSize: "0.88rem",
                                            }}
                                        >
                                            No hiring forms match that email or name.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <RadioGroup
                                        value={
                                            selectedHiringForm?.submission_id || ""
                                        }
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
                                        <Box
                                            sx={{
                                                display: "grid",
                                                gap: 1.25,
                                            }}
                                        >
                                            {hiringForms.map((form) => {
                                                const isSelected =
                                                    selectedHiringForm?.submission_id ===
                                                    form.submission_id;

                                                return (
                                                    <Paper
                                                        key={form.submission_id}
                                                        variant="outlined"
                                                        onClick={() =>
                                                            handleHiringFormSelect(form)
                                                        }
                                                        sx={{
                                                            p: 1.75,
                                                            borderRadius: "10px",
                                                            borderColor: isSelected
                                                                ? GREEN_LIGHT
                                                                : "#e5e7eb",
                                                            borderWidth: isSelected
                                                                ? "1.5px"
                                                                : "1px",
                                                            backgroundColor: isSelected
                                                                ? "#f4fbf7"
                                                                : "#fff",
                                                            cursor: "pointer",
                                                            transition:
                                                                "border-color 120ms ease, background-color 120ms ease",
                                                            "&:hover": {
                                                                borderColor: isSelected
                                                                    ? GREEN_LIGHT
                                                                    : "#c7cdd6",
                                                            },
                                                        }}
                                                    >
                                                        <FormControlLabel
                                                            value={String(
                                                                form.submission_id,
                                                            )}
                                                            control={
                                                                <Radio
                                                                    size="small"
                                                                    disabled={
                                                                        loadingLocation &&
                                                                        isSelected
                                                                    }
                                                                    sx={{
                                                                        color: "#c7cdd6",
                                                                        "&.Mui-checked": {
                                                                            color: GREEN,
                                                                        },
                                                                    }}
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
                                                                        alignItems:
                                                                            "flex-start",
                                                                        justifyContent:
                                                                            "space-between",
                                                                        flexWrap: { xs: "wrap", md: "nowrap" },
                                                                        gap: 1,
                                                                        width: "100%",
                                                                        pl: 0.5,
                                                                    }}
                                                                >
                                                                    <Box>
                                                                        <Typography
                                                                            sx={{
                                                                                fontWeight: 700,
                                                                                color: "#1f2937",
                                                                                fontSize: "0.92rem",
                                                                            }}
                                                                        >
                                                                            {form.name}
                                                                        </Typography>

                                                                        {form.email && (
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
                                                                                {form.email}
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
                                                                            {form.full_address}
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
                                                                            {form.phone}
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
                                                                            <Globe size={13} />
                                                                            {/* Older hiring forms predate the country
                                                                                field entirely — shown as USA rather
                                                                                than blank, to stay consistent with
                                                                                how that's resolved everywhere else. */}
                                                                            {form.country || "USA"}
                                                                        </Box>
                                                                    </Box>

                                                                    <Box
                                                                        sx={{
                                                                            textAlign: "right",
                                                                            flexShrink: 0,
                                                                        }}
                                                                    >
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
                                                                            {formatSubmittedDate(
                                                                                form.submitted_at,
                                                                            )}
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
                            </Box>
                        )}

                        {/* SELECTED HIRING FORM DETAILS */}

                        {selectedHiringForm && (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2.25,
                                    borderRadius: "10px",
                                    backgroundColor: "#f8fafc",
                                    borderColor: "#dbeafe",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.75,
                                        mb: 1.75,
                                    }}
                                >
                                    <CheckCircle2 size={17} color={GREEN} />

                                    <Typography
                                        sx={{ fontWeight: 700, color: "#1f2937" }}
                                    >
                                        Selected Hiring Form
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: {
                                            xs: "1fr 1fr",
                                            md: "repeat(4, 1fr)",
                                        },
                                        gap: 2,
                                    }}
                                >
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
                                        <Box
                                            key={field.label}
                                            sx={{
                                                gridColumn: field.span
                                                    ? { xs: "1 / -1", md: "1 / -1" }
                                                    : "auto",
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize: "0.72rem",
                                                    color: "#9ca3af",
                                                    fontWeight: 600,
                                                    mb: 0.25,
                                                }}
                                            >
                                                {field.label}
                                            </Typography>

                                            <Typography
                                                sx={{
                                                    fontWeight: 600,
                                                    fontSize: "0.88rem",
                                                    color:
                                                        field.good === false
                                                            ? "#9ca3af"
                                                            : "#1f2937",
                                                }}
                                            >
                                                {field.value}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Paper>
                        )}

                        <Divider sx={{ borderColor: BORDER }} />

                        {/* ROLE / TYPE */}

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    md: "1fr 1fr",
                                },
                                gap: 2.5,
                            }}
                        >
                            <FormControl fullWidth>
                                <FormLabel sx={fieldLabel}>
                                    <Briefcase size={15} color="#6b7280" />
                                    User Type
                                </FormLabel>

                                <Select
                                    displayEmpty
                                    value={roleId}
                                    onChange={(e) => setRoleId(e.target.value)}
                                    size="small"
                                    IconComponent={(props) => (
                                        <ChevronDown
                                            {...props}
                                            size={16}
                                            color={NAVY_DARK}
                                        />
                                    )}
                                    sx={{
                                        height: "45px",
                                        borderRadius: "8px",
                                        backgroundColor: "#fff",
                                    }}
                                >
                                    <MenuItem value="" disabled>
                                        <Typography sx={{ color: "text.secondary" }}>
                                            Select User Type
                                        </Typography>
                                    </MenuItem>

                                    <MenuItem value="7">
                                        Inspector/Supervisor
                                    </MenuItem>

                                    <MenuItem value="8">
                                        Quality Assurance Technician
                                    </MenuItem>

                                    <MenuItem value="9-10">Cleaner</MenuItem>

                                    <MenuItem value="9-11">
                                        HouseKeeping
                                    </MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <FormLabel sx={fieldLabel}>
                                    <FileText size={15} color="#6b7280" />
                                    Employee Type
                                </FormLabel>

                                <Select
                                    displayEmpty
                                    value={employeeType}
                                    onChange={(e) =>
                                        setEmployeeType(e.target.value)
                                    }
                                    size="small"
                                    IconComponent={(props) => (
                                        <ChevronDown
                                            {...props}
                                            size={16}
                                            color={NAVY_DARK}
                                        />
                                    )}
                                    sx={{
                                        height: "45px",
                                        borderRadius: "8px",
                                        backgroundColor: "#fff",
                                    }}
                                >
                                    <MenuItem value="" disabled>
                                        <Typography sx={{ color: "text.secondary" }}>
                                            Select Employee Type
                                        </Typography>
                                    </MenuItem>

                                    <MenuItem value="W2_BI_WEEKLY">
                                        W2 Bi-Weekly
                                    </MenuItem>

                                    <MenuItem value="1099">
                                        1099 Contractor
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* ACTION BUTTONS */}

                        <Box
                            sx={{
                                display: "flex",
                                gap: 1.5,
                                mt: 0.5,
                            }}
                        >
                            <Button
                                variant="contained"
                                disableElevation
                                type="submit"
                                disabled={
                                    disable ||
                                    loadingLocation ||
                                    loadingHiringForms
                                }
                                startIcon={
                                    disable ? (
                                        <CircularProgress
                                            size={16}
                                            sx={{ color: "#fff" }}
                                        />
                                    ) : (
                                        <Check size={18} />
                                    )
                                }
                                sx={{
                                    height: 44,
                                    px: 3.5,
                                    borderRadius: "8px",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    backgroundColor: GREEN,
                                    "&:hover": {
                                        backgroundColor: "#156437",
                                    },
                                }}
                            >
                                {disable
                                    ? "Saving..."
                                    : loadingLocation
                                    ? "Loading Location..."
                                    : "Save Employee"}
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<X size={18} />}
                                onClick={navigateToUser}
                                sx={{
                                    height: 44,
                                    px: 3,
                                    borderRadius: "8px",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    borderColor: "#d1d5db",
                                    color: "#4b5563",
                                    "&:hover": {
                                        borderColor: "#9ca3af",
                                        backgroundColor: "#f9fafb",
                                    },
                                }}
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
                                        color: locationReady
                                            ? GREEN
                                            : "#9ca3af",
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
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default AddServiceProvider;