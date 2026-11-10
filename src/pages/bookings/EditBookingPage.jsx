import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import "./bookings.scss";
import {
	message,
	Spin,
	Form,
	Select,
	InputNumber,
	Input,
	DatePicker,
	Checkbox,
	Radio,
	TimePicker,
	Col,
	Row,
	Modal,
	Button,
	Space,
} from "antd";
import { GetAllSupervisorByAdmin, GetAllCleanerByAdmin, GetAllQualityInspectorByAdmin } from "@/services/api/userApi";
import { GetBookingById, UpdateBooking } from "@/services/api/bookingApi";
import dayjs from "@/lib/dayjs";

const EditBookingPage = () => {
	const { id } = useParams();
	const [form] = Form.useForm();
	const navigate = useNavigate();
	const [supervisorList, setSupervisorList] = useState([]);
	const [cleanerList, setCleanerList] = useState([]);
	const [qualityInspectorList, setQualityInspectorList] = useState([]);
	const [bookingEmployeeDetails, setBookingEmployeeDetails] = useState([]);
	const [removeEmployees, setRemoveEmployees] = useState([]);
	const [mapLink, setMapLink] = useState("");
	const [recurringType, setRecurringType] = useState("");
	const [repeatEvery, setRepeatEvery] = useState(1);
	const [repeatOnDays, setRepeatOnDays] = useState([]);
	const [recurrenceEndType, setRecurrenceEndType] = useState("");
	const [recurrenceEndValue, setRecurrenceEndValue] = useState(null);

	const [bookingData, setBookingData] = useState({
		booking_status: "",
		time: "",
		end_time_by_admin: "",
		booking_name: "",
		client_name: "",
		booking_id: "",
		google_map_link: "",
		booking_employee_details: [],
	});
	const [editMode, setEditMode] = useState("this");
	const [editModeModalOpen, setEditModeModalOpen] = useState(false);

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (bookingData?.type === "Recurring Booking") {
			// Only set these if they are NOT null
			if (bookingData.recurring_type)
				setRecurringType(bookingData.recurring_type);
			if (bookingData.recurring_every)
				setRepeatEvery(bookingData.recurring_every);
			if (bookingData.repeat_on_days)
				setRepeatOnDays(bookingData.repeat_on_days);
			if (bookingData.recurrence_end_type)
				setRecurrenceEndType(bookingData.recurrence_end_type);
			if (bookingData.recurrence_end_value)
				setRecurrenceEndValue(bookingData.recurrence_end_value);
		}
	}, [bookingData]);

	// Fetch employee lists (supervisors, cleaners, and quality inspectors)
	const getSupervisorList = async () => {
		setLoading(true);
		try {
			const res = await GetAllSupervisorByAdmin(id);
			setSupervisorList(res.data.data);
		} catch (error) {
			console.error("Error fetching supervisors:", error);
			message.error("Failed to fetch supervisor list. Please try again later.");
		} finally {
			setLoading(false);
		}
	};

	const getCleanerList = async () => {
		setLoading(true);
		try {
			const res = await GetAllCleanerByAdmin(id);
			setCleanerList(res.data.data);
		} catch (error) {
			console.error("Error fetching cleaners:", error);
			message.error("Failed to fetch cleaner list. Please try again later.");
		} finally {
			setLoading(false);
		}
	};

	const getQualityInspectorList = async () => {
		setLoading(true);
		try {
			const res = await GetAllQualityInspectorByAdmin(id);
			setQualityInspectorList(res.data.data);
		} catch (error) {
			console.error("Error fetching quality inspectors:", error);
			message.error(
				"Failed to fetch quality inspector list. Please try again later."
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		getSupervisorList();
		getCleanerList();
		getQualityInspectorList();
	}, []);

	// Get booking data by ID
	useLayoutEffect(() => {
		const fetchBookingData = async () => {
			try {
				const res = await GetBookingById(id);
				setBookingData(res.data.data);
				form.setFieldsValue({
					...res.data.data,
					time: res.data.data.time
						? dayjs(res.data.data.time, "HH:mm:ss")
						: null,
					end_time_by_admin: res.data.data.end_time_by_admin
						? dayjs(res.data.data.end_time_by_admin, "HH:mm:ss")
						: null,
				});

				setBookingEmployeeDetails(res.data.data.booking_employee_details);
			} catch (error) {
				console.error("Failed to fetch booking data:", error);
			}
		};

		fetchBookingData();
	}, [id]);

	useEffect(() => {
		if (bookingEmployeeDetails.length > 0) {
			// Pre-select existing employees in the form
			form.setFieldsValue({
				supervisors: bookingEmployeeDetails
					.filter((emp) => emp.role_id === 7)
					.map((emp) => emp.employee_profile?.user_profile?.name), // Make sure to use the correct field

				quality_inspectors: bookingEmployeeDetails
					.filter((emp) => emp.role_id === 8)
					.map((emp) => emp.employee_profile?.user_profile?.name),

				cleaners: bookingEmployeeDetails
					.filter((emp) => emp.role_id === 9)
					.map((emp) => emp.employee_profile?.user_profile?.name),
			});
		}
	}, [bookingEmployeeDetails]); // Runs when bookingEmployeeDetails is updated

	const [bookingStatus, setBookingStatus] = useState(
		bookingData?.booking_status || ""
	);

	const [bookingName, setBookingName] = useState(
		bookingData?.booking_name || ""
	);

	const [clientName, setClientName] = useState(bookingData?.client_name || "");

	// Handle Employee Change Correctly
	const handleEmployeeChange = (selectedValues, roleId) => {
		const previousSelection =
			bookingEmployeeDetails?.filter((emp) => emp.role_id === roleId) || [];

		// Find removed employees (previously selected but not selected now)
		const removed = previousSelection.filter(
			(emp) =>
				!selectedValues.includes(emp.employee_profile?.user_profile?.name)
		);

		// Ensure only unique removals
		setRemoveEmployees((prev) => [
			...prev.filter(
				(emp) => !removed.some((r) => r.employee_id === emp.employee_id)
			),
			...removed,
		]);

		// Update assigned employees
		const updatedIds = selectedValues.map(
			(name) =>
				[...supervisorList, ...qualityInspectorList, ...cleanerList].find(
					(emp) => emp.user_profile?.name === name
				)?.id
		);

		setBookingData((prevData) => ({
			...prevData,
			...(roleId === 7 && { supervisor_ids: updatedIds }),
			...(roleId === 8 && { quality_inspector_ids: updatedIds }),
			...(roleId === 9 && { cleaner_ids: updatedIds }),
		}));
	};

	// Handle Removing Employees
	const handleEmployeeRemove = (employeeId) => {
		setBookingEmployeeDetails((prevDetails) =>
			prevDetails.filter((emp) => emp.employee_id !== employeeId)
		);

		setRemoveEmployees((prev) =>
			prev.some((emp) => emp.employee_id === employeeId)
				? prev
				: [...prev, { employee_id: employeeId }]
		);
	};
	useEffect(() => {
		if (bookingData?.recurring_type) {
			setRecurringType(bookingData.recurring_type);
			form.setFieldValue("recurring_type", bookingData.recurring_type);
		}
	}, [bookingData]);

	const handleSave = () => {
		if (
			bookingData?.type === "Recurring Booking" &&
			bookingData?.recurrence_id
		) {
			// Open the modal and wait for user action
			setEditModeModalOpen(true);
		} else {
			// Directly submit for non-recurring bookings
			handleSubmit();
		}
	};

	const handleSubmit = () => {
		setIsSubmitting(true);
		const formValues = form.getFieldsValue();
		const formData = {
			edit_mode: editMode,
			booking_id: bookingData?.id,
		};

		// Compare and add booking_name
		if (bookingName && bookingName !== bookingData.booking_name) {
			formData.booking_name = bookingName;
		}

		// Compare and add booking_status
		if (bookingStatus && bookingStatus !== bookingData.booking_status) {
			formData.booking_status = bookingStatus;
		}

		// Compare and add client_name
		if (
			clientName &&
			clientName.trim() !== (bookingData.client_name ?? "").trim()
		) {
			formData.client_name = clientName;
		}

		// Compare and add google_map_link
		if (
			mapLink &&
			mapLink.trim() !== (bookingData.google_map_link ?? "").trim()
		) {
			formData.google_map_link = mapLink;
		}

		// Compare and add time
		const newTime = formValues.time
			? dayjs(formValues.time).format("HH:mm:ss")
			: null;
		if (newTime && newTime !== bookingData.time) {
			formData.time = newTime;
		}

		// Compare and add end_time_by_admin
		const newEndTime = formValues.end_time_by_admin
			? dayjs(formValues.end_time_by_admin).format("HH:mm:ss")
			: null;

		if (newEndTime !== bookingData.end_time_by_admin) {
			formData.end_time_by_admin = newEndTime;
		}

		// EMPLOYEE COMPARISONS
		const getIdsByRole = (role_id) =>
			bookingEmployeeDetails
				.filter((emp) => emp.role_id === role_id)
				.map((emp) => emp.employee_id);

		const prevSupervisors = getIdsByRole(7);
		const prevQualityInspectors = getIdsByRole(8);
		const prevCleaners = getIdsByRole(9);

		const getSelectedIds = (list, fieldName) =>
			list
				.filter((emp) =>
					form.getFieldValue(fieldName)?.includes(emp.user_profile?.name)
				)
				.map((emp) => emp.id);

		const newSupervisors = getSelectedIds(supervisorList, "supervisors");
		const newQualityInspectors = getSelectedIds(
			qualityInspectorList,
			"quality_inspectors"
		);
		const newCleaners = getSelectedIds(cleanerList, "cleaners");

		if (JSON.stringify(newSupervisors) !== JSON.stringify(prevSupervisors)) {
			formData.supervisors = newSupervisors;
		}

		if (
			JSON.stringify(newQualityInspectors) !==
			JSON.stringify(prevQualityInspectors)
		) {
			formData.quality_inspectors = newQualityInspectors;
		}

		if (JSON.stringify(newCleaners) !== JSON.stringify(prevCleaners)) {
			formData.cleaners = newCleaners;
		}

		// Remove employees if any
		const removeEmployeeIds = removeEmployees.map((emp) => emp.employee_id);
		if (removeEmployeeIds.length > 0) {
			formData.remove_employees = removeEmployeeIds;
		}

		// HANDLE RECURRING FIELDS ONLY IF TYPE IS "Recurring Booking"
		const isRecurring = bookingData?.type === "Recurring Booking";

		if (isRecurring) {
			formData.edit_mode = editMode;
			formData.is_recurring = true;
			formData.recurring_type = recurringType;
			formData.end_time_by_admin = bookingData?.end_time_by_admin;

			if (repeatEvery || repeatEvery !== bookingData.recurring_every) {
				formData.recurring_every = repeatEvery;
			}
			if (recurringType && recurringType !== bookingData.recurring_type) {
				formData.recurring_type = recurringType;
			}

			// weekly repeat_on_days comparison
			if (recurringType === "week") {
				const newRepeatOn = repeatOnDays?.length ? repeatOnDays : [];
				const oldRepeatOn = bookingData?.repeat_on_days
					? JSON.parse(bookingData.repeat_on_days)
					: [];

				if (JSON.stringify(newRepeatOn) !== JSON.stringify(oldRepeatOn)) {
					formData.repeat_on_days = newRepeatOn; // ✅ correct
				}
			}
			// Recurrence end comparison
			if (
				recurrenceEndType ||
				recurrenceEndType !== bookingData.recurrence_end_type
			) {
				formData.recurrence_end_type = recurrenceEndType;
			}

			if (recurrenceEndValue) {
				const newVal =
					recurrenceEndType === "on_date"
						? dayjs(recurrenceEndValue).format("YYYY-MM-DD")
						: recurrenceEndType === "after"
						? Number(recurrenceEndValue)
						: null;

				const oldVal = bookingData.recurrence_end_value;
				if (newVal && newVal !== oldVal) {
					formData.recurrence_end_value = newVal;
				}
			}
		}

		UpdateBooking(formData)
			.then((res) => {
				if (res.status === 201) {
					message.success("Booking updated successfully!");
				}
				navigate("/bookings");
			})
			.catch((err) => {
				if (err.response?.status === 401) {
					message.error("Token expired!");
					localStorage.removeItem("adminToken");
					setTimeout(() => navigate("/Login"), 3000);
				} else {
					message.error("Something went wrong");
					setTimeout(() => navigate("/bookings"), 1000);
				}
			})
			.finally(() => {
				setIsSubmitting(false); // ✅ always stop loader
			});
	};

	const navigateToBooking = () => {
		navigate("/bookings");
	};

	const [isSubmitting, setIsSubmitting] = useState(false);

	return (
		<div>
			<PageHeader
				title="BOOKING MANAGEMENT"
				subtitle="Edit user's booking details by assigning employees or updating the status."
				actions={
					<Button
						size="large"
						icon={<ArrowLeft size={16} />}
						onClick={navigateToBooking}
					>
						Return to Bookings
					</Button>
				}
			/>
			<Spin spinning={isSubmitting} description="Updating..." size="large">
				<Form form={form} layout="vertical">
					<div className="booking-edit">
						<div className="surface booking-edit__side">
							<div className="booking-edit__info">
								<h4 className="booking-edit__title">General Information :</h4>
								<h5 className="booking-edit__label">Booking Id:</h5>
								<p className="booking-edit__value">
									{bookingData?.booking_unique_id}
								</p>
								<h5 className="booking-edit__label">User Name:</h5>
								<p className="booking-edit__value">
									{bookingData?.booking_user?.user_profile?.name ||
										bookingData?.client_name ||
										"--"}
								</p>

								<h5 className="booking-edit__label">Booking Name:</h5>
								<p className="booking-edit__value">
									{bookingData?.booking_name || "--"}
								</p>

								<h5 className="booking-edit__label">Service Name:</h5>
								<p className="booking-edit__value">
									{bookingData?.service_booking?.name}
								</p>
								<h5 className="booking-edit__label">Booking Type:</h5>
								<p className="booking-edit__value">{bookingData?.type}</p>

								<h5 className="booking-edit__label">Date:</h5>
								<p className="booking-edit__value">
									{bookingData?.date &&
										(() => {
											const [y, m, d] = bookingData.date.split("T")[0].split("-");
											return `${m}/${d}/${y}`;
										})()}
								</p>
								<h5 className="booking-edit__label">Time:</h5>
								<p className="booking-edit__value">
									{bookingData?.time &&
										(() => {
											let [h, min] = bookingData.time.split(":");
											h = parseInt(h, 10);
											const ampm = h >= 12 ? "PM" : "AM";
											h = h % 12 || 12;
											return `${h}:${min} ${ampm}`;
										})()}
								</p>
								<h5 className="booking-edit__label">Address:</h5>

								{(() => {
									const address =
										bookingData?.booking_address?.address ||
										bookingData?.booking_non_client_address?.[0]?.address ||
										"--";
									const city =
										bookingData?.booking_address?.user_city?.name ||
										bookingData?.booking_non_client_address?.[0]
											?.non_client_user_city?.name ||
										"";
									const state =
										bookingData?.booking_address?.user_state?.name ||
										bookingData?.booking_non_client_address?.[0]
											?.non_client_user_state?.name ||
										"";
									const country =
										bookingData?.booking_address?.user_country?.name ||
										bookingData?.booking_non_client_address?.[0]
											?.non_client_user_country?.name ||
										"";

									const fullAddress = `${address}, ${city}, ${state}, ${country}`;

									return (
										<p className="booking-edit__value">
											{fullAddress !== "--, , , " ? fullAddress : "--"}
											{fullAddress !== "--, , , " && (
												<a
													href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
														fullAddress
													)}`}
													target="_blank"
													rel="noopener noreferrer"
													className="booking-edit__map-link"
												>
													(Search it on map)
												</a>
											)}
										</p>
									);
								})()}

								<h5 className="booking-edit__label">Booking Status:</h5>
								<p className="booking-edit__value">
									{bookingData?.booking_status}
								</p>
								<h5 className="booking-edit__label">Notes:</h5>
								{bookingData?.notes ? (
									<p className="booking-edit__value">{bookingData.notes}</p>
								) : (
									<p className="booking-edit__value text-muted">--</p>
								)}

								<Button
									type="link"
									className="booking-edit__details-link"
									onClick={() => navigate(`/viewBooking/${id}`)}
								>
									View Detailed Information
								</Button>
							</div>
						</div>
						<div className="surface booking-edit__main">
							<h4 className="booking-edit__title">
								Update Booking Status and Assign Employees:
							</h4>
							{loading ? (
								<Spin
									style={{
										display: "flex",
										justifyContent: "center",
										height: "100vh",
									}}
								/>
							) : (
								<>
									<Form.Item
										label="Select Booking Status:"
										name="booking_status"
										labelCol={{ span: 24 }}
									>
										<Select
											style={{ width: "100%" }}
											placeholder="Select booking status"
											onChange={(value) => {
												setBookingStatus(value);
											}}
											defaultValue={bookingData?.booking_status}
											options={[
												{
													value: "PENDING",
													label: "PENDING",
													disabled: true,
												},
												{
													value: "ACCEPTED",
													label: "ACCEPTED",
												},
												{
													value: "REJECTED",
													label: "REJECTED",
												},
											]}
										/>
									</Form.Item>

									{bookingData?.user_id === null ? (
										<Row gutter={8}>
											<Col xs={24} md={12}>
												<Form.Item label="Client Name" name="client_name">
													<Input
														value={bookingData?.client_name}
														placeholder="Enter Client Name"
														onChange={(e) => setClientName(e.target.value)}
													/>
												</Form.Item>
											</Col>
											<Col xs={24} md={12}>
												<Form.Item label="Booking Name" name="booking_name">
													<Input
														placeholder="Enter Booking Name"
														value={bookingData?.booking_name}
														onChange={(e) => setBookingName(e.target.value)}
													/>
												</Form.Item>
											</Col>
										</Row>
									) : (
										<Row gutter={8}>
											<Col span={24}>
												<Form.Item label="Booking Name" name="booking_name">
													<Input
														placeholder="Enter Booking Name"
														value={bookingData?.booking_name}
														onChange={(e) => setBookingName(e.target.value)}
													/>
												</Form.Item>
											</Col>
										</Row>
									)}

									{bookingData?.type === "One Time Booking" && (
										<>
											<Row gutter={8}>
												<Col xs={24} sm={12} md={8}>
													<Form.Item label="Date">
														{bookingData?.date ? (
															<DatePicker
																style={{ width: "100%" }}
																value={
																	bookingData?.date
																		? dayjs(bookingData.date, "YYYY-MM-DD")
																		: null
																}
																format="YYYY-MM-DD"
																onChange={(date) => {
																	const formatted = date
																		? date.format("YYYY-MM-DD")
																		: null;
																	setBookingData((prev) => ({
																		...prev,
																		date: formatted,
																	}));
																	form.setFieldValue("date", formatted);
																}}
																disabledDate={(current) =>
																	current && current < dayjs().startOf("day")
																}
															/>
														) : (
															<Spin />
														)}
													</Form.Item>
												</Col>

												<Col xs={24} sm={12} md={8}>
													<Form.Item name="time" label="Time">
														<TimePicker
															use12Hours
															format="hh:mm A"
															minuteStep={5}
															style={{ width: "100%" }}
														/>
													</Form.Item>
												</Col>

												<Col xs={24} sm={12} md={8}>
													<Form.Item name="end_time_by_admin" label="End Time">
														<TimePicker
															minuteStep={5}
															use12Hours
															format="hh:mm A"
															style={{ width: "100%" }}
														/>
													</Form.Item>
												</Col>
											</Row>
										</>
									)}

									{/* Supervisors */}
									<Form.Item
										label="Assign Inspector/ Supervisor:"
										name="supervisors"
									>
										<Select
											mode="multiple"
											allowClear
											className="booking-edit__employee-select"
											placeholder="Select Inspector/ Supervisor"
											maxTagCount="responsive"
											onChange={(values) => handleEmployeeChange(values, 7)}
											defaultValue={bookingEmployeeDetails
												?.filter((emp) => emp.role_id === 7)
												.map((emp) => emp.employee_profile?.user_profile?.name)} // This should be the correct array
											tagRender={(props) => {
												const { label, onClose } = props;

												const employeeId = bookingEmployeeDetails?.find(
													(emp) =>
														emp.employee_profile?.user_profile?.name === label
												)?.employee_id;

												const handleRemove = () => {
													// Call the function to handle employee removal
													handleEmployeeRemove(employeeId);

													onClose();
												};
												return (
													<span className="booking-edit__tag">
														{label}
														<span
															onClick={handleRemove}
															className="booking-edit__tag-close"
														>
															&times;
														</span>
													</span>
												);
											}}
										>
											{supervisorList.map((emp) => (
												<Select.Option
													key={emp.id}
													value={emp.user_profile?.name} // This value should match the names in defaultValue
													disabled={emp.is_service_provider}
												>
													{emp.user_profile?.name}
												</Select.Option>
											))}
										</Select>
									</Form.Item>

									{/* Quality Assurance */}
									<Form.Item
										label="Assign Quality Assurance Technician:"
										name="quality_inspectors"
									>
										<Select
											mode="multiple"
											maxTagCount="responsive"
											className="booking-edit__employee-select"
											placeholder="Select Quality Assurance Technician"
											onChange={(values) => handleEmployeeChange(values, 8)}
											defaultValue={bookingEmployeeDetails
												?.filter((emp) => emp.role_id === 8)
												.map((emp) => emp.employee_profile?.user_profile?.name)}
											tagRender={(props) => {
												const { label, onClose } = props;

												const employeeId = bookingEmployeeDetails?.find(
													(emp) =>
														emp.employee_profile?.user_profile?.name === label
												)?.employee_id;

												const handleRemove = () => {
													// Call the function to handle employee removal
													handleEmployeeRemove(employeeId);

													onClose();
												};
												return (
													<span className="booking-edit__tag">
														{label}
														<span
															onClick={handleRemove}
															className="booking-edit__tag-close"
														>
															&times;
														</span>
													</span>
												);
											}}
										>
											{qualityInspectorList.map((emp) => (
												<Select.Option
													key={emp.id}
													value={emp.user_profile?.name}
													disabled={emp.is_service_provider}
												>
													{emp.user_profile?.name}
												</Select.Option>
											))}
										</Select>
									</Form.Item>

									{/* Cleaners */}
									<Form.Item label="Assign Cleaners:" name="cleaners">
										<Select
											maxTagCount="responsive"
											mode="multiple"
											className="booking-edit__employee-select"
											placeholder="Select Cleaners"
											onChange={(values) => handleEmployeeChange(values, 9)}
											defaultValue={bookingEmployeeDetails
												?.filter((emp) => emp.role_id === 9)
												.map((emp) => emp.employee_profile?.user_profile?.name)}
											tagRender={(props) => {
												const { label, onClose } = props;

												const employeeId = bookingEmployeeDetails?.find(
													(emp) =>
														emp.employee_profile?.user_profile?.name === label
												)?.employee_id;

												const handleRemove = () => {
													// Call the function to handle employee removal
													handleEmployeeRemove(employeeId);

													onClose();
												};
												return (
													<span className="booking-edit__tag">
														{label}
														<span
															onClick={handleRemove}
															className="booking-edit__tag-close"
														>
															&times;
														</span>
													</span>
												);
											}}
										>
											{cleanerList.map((emp) => (
												<Select.Option
													key={emp.id}
													value={emp.user_profile?.name}
													disabled={emp.is_service_provider}
												>
													{emp.user_profile?.name}
												</Select.Option>
											))}
										</Select>
									</Form.Item>

									{bookingData?.type === "Recurring Booking" && (
										<div className="booking-edit__recurrence">
											<h4 className="section-title booking-edit__recurrence-title">
												Custom Recurrence
											</h4>

											{/* Start Date */}
											<Row gutter={8}>
												<Col xs={24} sm={12} md={8}>
													<Form.Item label="Start Date">
														{bookingData?.date ? (
															<DatePicker
																style={{ width: "100%" }}
																value={
																	bookingData?.date
																		? dayjs(bookingData.date, "YYYY-MM-DD")
																		: null
																}
																format="YYYY-MM-DD"
																onChange={(date) => {
																	const formatted = date
																		? date.format("YYYY-MM-DD")
																		: null;
																	setBookingData((prev) => ({
																		...prev,
																		date: formatted,
																	}));
																	form.setFieldValue("date", formatted);
																}}
																disabledDate={(current) =>
																	current && current < dayjs().startOf("day")
																}
															/>
														) : (
															<Spin />
														)}
													</Form.Item>
												</Col>

												<Col xs={24} sm={12} md={8}>
													<Form.Item name="time" label="Start Time">
														{bookingData?.time ? (
															<TimePicker
																minuteStep={5}
																use12Hours
																format="hh:mm A"
																style={{ width: "100%" }}
																onChange={(time) => {
																	form.setFieldValue("time", time);
																	setBookingData((prev) => ({
																		...prev,
																		time: time ? time.format("HH:mm:ss") : null,
																	}));
																}}
															/>
														) : (
															<Spin />
														)}
													</Form.Item>
												</Col>

												<Col xs={24} sm={12} md={8}>
													<Form.Item name="end_time_by_admin" label="End Time">
														<TimePicker
															minuteStep={5}
															use12Hours
															format="hh:mm A"
															style={{ width: "100%" }}
															onChange={(time) => {
																form.setFieldValue("end_time_by_admin", time);
																setBookingData((prev) => ({
																	...prev,
																	end_time_by_admin: time
																		? time.format("HH:mm:ss")
																		: null,
																}));
															}}
														/>
													</Form.Item>
												</Col>
											</Row>

											{/* Repeat Every */}
											<Form.Item label="Repeat every:">
												<Space.Compact block>
													<InputNumber
														min={1}
														max={365}
														value={repeatEvery ?? null}
														onChange={(val) => {
															setRepeatEvery(val);
															form.setFieldValue("occurence", val);
															setBookingData((prev) => ({
																...prev,
																occurence: val,
															}));
														}}
														style={{ width: "30%" }}
													/>

													<Select
														value={recurringType}
														onChange={(val) => {
															setRecurringType(val);
															form.setFieldValue("recurring_type", val);
															setBookingData((prev) => ({
																...prev,
																recurring_type: val,
															}));

															// Reset repeat on days if not week
															if (val !== "week") {
																setRepeatOnDays([]);
																form.setFieldValue("repeat_on_days", []);
															}
														}}
														style={{ width: "70%" }}
													>
														<Select.Option value="day">Day</Select.Option>
														<Select.Option value="week">Week</Select.Option>
														<Select.Option value="month">Month</Select.Option>
														<Select.Option value="year">Year</Select.Option>
													</Select>
												</Space.Compact>
											</Form.Item>

											{/* Repeat on Days (for Weekly only) */}
											{recurringType === "week" && (
												<Form.Item label="Repeat on">
													<Checkbox.Group
														options={[
															"Sun",
															"Mon",
															"Tue",
															"Wed",
															"Thu",
															"Fri",
															"Sat",
														]}
														value={repeatOnDays}
														onChange={(checked) => {
															setRepeatOnDays(checked);
															form.setFieldValue("repeat_on_days", checked);
														}}
													/>
												</Form.Item>
											)}

											{/* Ends Section (Radio Group) */}
											<Form.Item label="Ends">
												<Radio.Group
													onChange={(e) => {
														setRecurrenceEndType(e.target.value);
														form.setFieldValue(
															"recurrence_end_type",
															e.target.value
														);
													}}
													value={recurrenceEndType}
													style={{
														display: "flex",
														flexDirection: "column",
														gap: 12,
													}}
												>
													{/* Never */}
													<Radio value="never">Never (max 100 entries)</Radio>

													{/* On */}
													<Radio value="on_date">
														On &nbsp;
														<DatePicker
															style={{ width: 180, marginLeft: "30px" }}
															disabled={recurrenceEndType !== "on_date"}
															value={
																recurrenceEndValue &&
																recurrenceEndType === "on_date"
																	? dayjs(recurrenceEndValue)
																	: null
															}
															onChange={(date) => {
																const formatted = date
																	? date.format("YYYY-MM-DD")
																	: null;
																setRecurrenceEndValue(formatted);
																form.setFieldValue(
																	"recurrence_end_value",
																	formatted
																);
															}}
														/>
													</Radio>

													{/* After */}
													<Radio value="after">
														After &nbsp;
														<InputNumber
															min={1}
															max={365}
															style={{ width: 100, marginLeft: "20px" }}
															disabled={recurrenceEndType !== "after"}
															value={
																recurrenceEndType === "after"
																	? recurrenceEndValue
																	: null
															}
															onChange={(val) => {
																setRecurrenceEndValue(val);
																form.setFieldValue("recurrence_end_value", val);
															}}
														/>{" "}
														occurrences
													</Radio>
												</Radio.Group>
											</Form.Item>
										</div>
									)}

									<Form.Item
										label="Enter Google Map Link"
										name="google_map_link"
										style={{ marginTop: "24px", marginBottom: "24px" }}
									>
										<Input
											placeholder="Enter Google Map Link"
											value={mapLink}
											onChange={(e) => setMapLink(e.target.value)}
										/>
									</Form.Item>

									<Form.Item>
										<Button
											type="primary"
											size="large"
											block
											className="booking-edit__save"
											onClick={handleSave}
										>
											Save Changes
										</Button>
									</Form.Item>
								</>
							)}
						</div>
					</div>
				</Form>
			</Spin>

			<Modal
				title="Update Recurring Booking"
				open={editModeModalOpen}
				onCancel={() => setEditModeModalOpen(false)}
				footer={null}
			>
				<p>Do you want to update:</p>
				<div className="booking-edit__modes">
					<Button
						type="default"
						onClick={() => {
							setEditMode("this");
							setEditModeModalOpen(false);
							setTimeout(() => {
								handleSubmit(); // Now editMode = "this"
							}, 0);
						}}
					>
						Only This Event
					</Button>
					<Button
						type="default"
						onClick={() => {
							setEditMode("following");
							setEditModeModalOpen(false);
							setTimeout(() => {
								handleSubmit(); // Now editMode = "following"
							}, 0);
						}}
					>
						This and Following Events
					</Button>
					<Button
						type="default"
						onClick={() => {
							setEditMode("all");
							setEditModeModalOpen(false);
							setTimeout(() => {
								handleSubmit(); // Now editMode = "all"
							}, 0);
						}}
					>
						All Events
					</Button>
				</div>
			</Modal>
		</div>
	);
};

export default EditBookingPage;
