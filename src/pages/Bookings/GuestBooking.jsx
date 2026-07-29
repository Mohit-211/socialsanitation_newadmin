/** @format */

import dayjs from "@/lib/dayjs";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
	Form,
	Input,
	Button,
	DatePicker,
	TimePicker,
	Select,
	InputNumber,
	message,
	Card,
	Checkbox,
	Tabs,
	Row,
	Col,
	Radio,
} from "antd";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import MuiButton from "@mui/material/Button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import {
	GetAllServiceNameByAdmin,
	CreateGuestBookingByAdmin,
} from "../../services/Api/BookingApi";
import { CityAPI, StateAPI } from "../../services/Api/Api";
import { debounce } from "lodash";
const { Option } = Select;
const { TextArea } = Input;

const WEEKDAY_LABELS = [
	{ label: "Sun", value: "Sun" },
	{ label: "Mon", value: "Mon" },
	{ label: "Tue", value: "Tue" },
	{ label: "Wed", value: "Wed" },
	{ label: "Thu", value: "Thu" },
	{ label: "Fri", value: "Fri" },
	{ label: "Sat", value: "Sat" },
];

const GuestBooking = () => {
	const navigate = useNavigate();
	const [form] = Form.useForm();
	const [bookingType, setBookingType] = useState(null); // null initially
	const [recurrenceEndType, setRecurrenceEndType] = useState("never");
	const [clientName, setClientName] = useState("");
	const [bookingName, setBookingName] = useState("");

	const [services, setServices] = useState([]);
	const [loading, setLoading] = useState(false);
	const [recurringType, setRecurringType] = useState("");
	const [repeatOnDays, setRepeatOnDays] = useState([]);
	const [address, setAddress] = useState("");
	const [states, setStates] = useState([]);
	const [cities, setCities] = useState([]);
	const [selectedState, setSelectedState] = useState(null);
	const [selectedCity, setSelectedCity] = useState(null);
	const [coordinates, setCoordinates] = useState({ lat: null, lng: null });

	useEffect(() => {
		GetAllServiceNameByAdmin().then((res) => setServices(res.data.data || []));
	}, []);

	useEffect(() => {
		StateAPI(233)
			.then((res) => setStates(res?.data?.data?.all_state || []))
			.catch((err) => console.log("Error fetching states:", err));
	}, []);

	const handleStateChange = (stateId) => {
		setSelectedState(stateId);
		setSelectedCity(null);
		setCities([]);
		setCoordinates({ lat: null, lng: null });

		CityAPI(stateId)
			.then((res) => {
				const newCities = res?.data?.data?.all_city || [];
				setCities(newCities);
			})
			.catch((err) => {
				console.log("Error fetching cities:", err);
				setCities([]);
			});
	};

	const fetchCoordinates = useCallback(async (address) => {
		if (!address) return;

		try {
			const res = await fetch(
				`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
					address
				)}&key=AIzaSyB45G8TScEmJSSG_PIzLJV2I6Ej1qgc_4o`
			);
			const data = await res.json();

			if (data.status === "OK") {
				const location = data.results[0].geometry.location;
				setCoordinates({ lat: location.lat, lng: location.lng });
			} else {
				setCoordinates({ lat: null, lng: null }); // reset if not found
			}
		} catch (error) {
			console.error("Error fetching coordinates:", error);
			setCoordinates({ lat: null, lng: null });
		}
	}, []);

	const debouncedFetchCoordinates = useMemo(
		() => debounce(fetchCoordinates, 1000),
		[fetchCoordinates]
	);

	useEffect(() => {
		debouncedFetchCoordinates(address);
	}, [address, debouncedFetchCoordinates]);

	const mapRef = React.useRef(null);
	const markerRef = React.useRef(null);
	const mapInstance = React.useRef(null);

	useEffect(() => {
		if (!window.google) {
			const script = document.createElement("script");
			script.src =
				"https://maps.googleapis.com/maps/api/js?key=AIzaSyB45G8TScEmJSSG_PIzLJV2I6Ej1qgc_4o&libraries=places";
			script.async = true;
			script.defer = true;
			document.head.appendChild(script);

			script.onload = () => {
				console.log("Google Maps script loaded");
			};
		}
	}, []);

	useEffect(() => {
		if (
			!coordinates.lat ||
			!coordinates.lng ||
			typeof window.google === "undefined" ||
			!mapRef.current
		)
			return;

		// Initialize map only once
		if (!mapInstance.current) {
			mapInstance.current = new window.google.maps.Map(mapRef.current, {
				center: coordinates,
				zoom: 16,
			});
		} else {
			mapInstance.current.setCenter(coordinates);
		}

		// Clear old marker
		if (markerRef.current) {
			markerRef.current.setMap(null);
		}

		// Add new draggable marker
		markerRef.current = new window.google.maps.Marker({
			position: coordinates,
			map: mapInstance.current,
			draggable: true,
		});

		markerRef.current.addListener("dragend", (event) => {
			const lat = event.latLng.lat();
			const lng = event.latLng.lng();
			setCoordinates({ lat, lng });
		});
	}, [coordinates]);

	const onFinish = async (values) => {
		setLoading(true);
		const payload = {
			booking_name: values.booking_name,
			client_name: values.client_name,
			service_id: values.service_id,
			date: dayjs(values.date).format("YYYY-MM-DD"),
			time: dayjs(values.time).format("HH:mm:ss"),
			end_time_by_admin: dayjs(values.end_time_by_admin).format("HH:mm:ss"),
			timezone: "America/New_York",
			address,
			state_id: selectedState,
			city_id: selectedCity,
			address_lat: coordinates.lat,
			address_long: coordinates.lng,
			type: values.type,
			notes: values.notes,
			is_recurring: values.type === "Recurring Booking",
		};

		if (payload.is_recurring) {
			payload.recurring_every = values.recurring_every;
			payload.recurring_type = values.recurring_type;
			payload.repeat_on_days = values.repeat_on_days || [];
			payload.recurrence_end_type = recurrenceEndType;
			if (recurrenceEndType === "on_date") {
				payload.recurrence_end_value = dayjs(
					values.recurrence_end_value_date
				).format("YYYY-MM-DD");
			} else if (recurrenceEndType === "after") {
				payload.recurrence_end_value = values.recurrence_end_value_count;
			} else {
				payload.recurrence_end_value = null;
			}
		}

		try {
			const res = await CreateGuestBookingByAdmin(payload);
			if (res.status === 201) {
				message.success("Booking created successfully!");
				setTimeout(() => {
					navigate(`/editBooking/${res.data?.data?.booking_id}`);
				}, 500);
			} else {
				message.error("Unexpected response. Please try again.");
			}
		} catch (err) {
			message.error("Failed to create booking. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (bookingType === "Recurring Booking") {
			setRecurringType("week"); // default unit
			setRepeatOnDays(["Mon", "Tue"]); // default weekdays
			form.setFieldValue("recurring_type", "week");
			form.setFieldValue("repeat_on_days", ["Mon", "Tue"]);
		}
	}, [bookingType]);

	return (
		<Box>
			{/* Header Section */}
			<Paper
				variant="outlined"
				sx={{
					p: 2.5,
					mb: 3,
					borderRadius: "10px",
					borderColor: "#eef0f2",
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						gap: 2,
					}}
				>
					<Box>
						<Typography className="page-title">BOOKING MANAGEMENT</Typography>
						<Typography className="page-sub-title">
							Create a new non-client booking
						</Typography>
					</Box>

					<MuiButton
						variant="contained"
						disableElevation
						startIcon={<ArrowLeft size={18} />}
						onClick={() => navigate("/bookings")}
						sx={{
							ml: "auto",
							height: 46,
							px: 3,
							borderRadius: "8px",
							minWidth: 180,
							textTransform: "none",
							fontWeight: 600,
							backgroundColor: "#2c3345",
							"&:hover": {
								backgroundColor: "#1f2433",
							},
						}}
					>
						Return to Bookings
					</MuiButton>
				</Box>
			</Paper>

			<Paper
				variant="outlined"
				sx={{
					px: 1,
					pt: 0.5,
					mb: 3,
					borderRadius: "10px",
					borderColor: "#eef0f2",
				}}
			>
				<Tabs
					defaultActiveKey="guest"
					onChange={(key) => {
						if (key === "client") {
							navigate("/create-client-booking"); // adjust route if needed
						}
					}}
					items={[
						{
							key: "client",
							label: "Client Booking",
							children: null,
						},
						{
							key: "guest",
							label: "Non-Client Booking",
							children: null,
						},
					]}
				/>
			</Paper>

			<Card title="Create New Booking">
				<Form
					layout="vertical"
					form={form}
					onFinish={onFinish}
					initialValues={{
						recurring_every: 1,
						recurring_type: "week",
					}}
				>
					<Row gutter={16}>
						<Col span={8}>
							<Form.Item name="client_name" label="Client Name(optional)">
								<Input placeholder="Enter Client Name" />
							</Form.Item>
						</Col>

						<Col span={8}>
							<Form.Item
								name="booking_name"
								label="Booking Name"
								rules={[
									{ required: true, message: "Please enter booking name" },
								]}
							>
								<Input placeholder="Enter Booking Name" />
							</Form.Item>
						</Col>
						<Col span={8}>
							<Form.Item
								name="service_id"
								label="Service"
								rules={[{ required: true }]}
							>
								<Select placeholder="Select service">
									{services.map((s) => (
										<Option key={s.id} value={s.id}>
											{s.name}
										</Option>
									))}
								</Select>
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label="State"
								name="state"
								rules={[
									({ getFieldValue }) => ({
										validator(_, value) {
											const addr = getFieldValue("address");
											if (!addr || value) return Promise.resolve();
											return Promise.reject(
												new Error("State is required when address is provided")
											);
										},
									}),
								]}
							>
								<Select
									value={selectedState}
									onChange={handleStateChange}
									placeholder="Select State"
								>
									{states.map((state) => (
										<Select.Option key={state.id} value={state.id}>
											{state.name}
										</Select.Option>
									))}
								</Select>
							</Form.Item>
						</Col>

						<Col span={12}>
							<Form.Item
								label="City"
								name="city"
								// rules={[{ required: true, message: "Please select a city" }]}
							>
								<Select
									value={selectedCity}
									onChange={(val) => setSelectedCity(val)}
									disabled={!selectedState}
									placeholder="Select City"
								>
									{cities.map((city) => (
										<Select.Option key={city.id} value={city.id}>
											{city.name}
										</Select.Option>
									))}
								</Select>
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={[24, 24]}>
						<Col span={12}>
							<Form.Item
								label="Address"
								name="address"
								// rules={[{ required: true, message: "Please enter address" }]}
							>
								<Input.TextArea
									rows={5}
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									placeholder="Enter complete address including city/state"
								/>
							</Form.Item>
						</Col>

						<Col span={12}>
							<Form.Item label="Map Preview">
								{!window.google ? (
									<div style={{ color: "red" }}>
										Google Maps script not loaded
									</div>
								) : (
									<div
										ref={mapRef}
										style={{
											border: "1px solid #d9d9d9",
											borderRadius: "8px",
											overflow: "hidden",
											height: "280px",
											boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
										}}
									/>
								)}
							</Form.Item>
						</Col>
					</Row>

					<Form.Item
						name="type"
						label="Booking Type"
						rules={[{ required: true }]}
					>
						<Select
							placeholder="Select booking type"
							onChange={(val) => setBookingType(val)}
						>
							<Option value="One Time Booking">One-time Booking</Option>
							<Option value="Recurring Booking">Recurring Booking</Option>
						</Select>
					</Form.Item>

					{bookingType === "One Time Booking" && (
						<Row gutter={16}>
							<Col span={8}>
								<Form.Item
									name="date"
									label="Date"
									rules={[{ required: true }]}
								>
									<DatePicker
										style={{ width: "100%" }}
										disabledDate={(current) =>
											current && current < dayjs().startOf("day")
										}
									/>
								</Form.Item>
							</Col>
							<Col span={8}>
								<Form.Item
									name="time"
									label="Time"
									rules={[{ required: true }]}
								>
									<TimePicker
										minuteStep={5}
										format="hh:mm A"
										use12Hours
										style={{ width: "100%" }}
									/>
								</Form.Item>
							</Col>
							<Col span={8}>
								<Form.Item
									name="end_time_by_admin"
									label="End Time"
									rules={[
										{ required: true, message: "Please select end time" },
									]}
								>
									<TimePicker
										minuteStep={5}
										format="hh:mm A"
										use12Hours
										style={{ width: "100%" }}
									/>
								</Form.Item>
							</Col>
						</Row>
					)}

					{bookingType === "Recurring Booking" && (
						<Card
							title="Custom Recurrence"
							style={{
								background: "#f9f9f9",
								borderRadius: "10px",
								padding: "24px",
								marginTop: 24,
								boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
							}}
						>
							<Row gutter={16}>
								<Col span={8}>
									<Form.Item
										name="date"
										label="Start date"
										rules={[{ required: true }]}
									>
										<DatePicker
											style={{ width: "100%" }}
											disabledDate={(current) =>
												current && current < dayjs().startOf("day")
											}
										/>
									</Form.Item>
								</Col>
								<Col span={8}>
									<Form.Item
										name="time"
										label="Start time"
										rules={[{ required: true }]}
									>
										<TimePicker
											minuteStep={5}
											format="hh:mm A"
											use12Hours
											style={{ width: "100%" }}
										/>
									</Form.Item>
								</Col>
								<Col span={8}>
									<Form.Item
										name="end_time_by_admin"
										label="End Time"
										rules={[
											{ required: true, message: "Please select end time" },
										]}
									>
										<TimePicker
											minuteStep={5}
											format="hh:mm A"
											use12Hours
											style={{ width: "100%" }}
										/>
									</Form.Item>
								</Col>
							</Row>

							<Row gutter={8}>
								<Col span={12}>
									<Form.Item
										name="recurring_every"
										label="Repeat every"
										// initialValues={1}
										rules={[{ required: true }]}
									>
										<InputNumber min={1} style={{ width: "100%" }} />
									</Form.Item>
								</Col>
								<Col span={12}>
									<Form.Item
										// label="Select Unit"
										name="recurring_type"
										// initialValue="week"
										rules={[{ required: true }]}
										style={{ marginTop: 33 }}
									>
										<Select
											onChange={(val) => {
												setRecurringType(val);
												form.setFieldValue("recurring_type", val);
												if (val !== "week") {
													setRepeatOnDays([]);
													form.setFieldValue("repeat_on_days", []);
												} else {
													setRepeatOnDays(["Mon", "Tue"]); // reapply default
													form.setFieldValue("repeat_on_days", ["Mon", "Tue"]);
												}
											}}
										>
											<Option value="day">day</Option>
											<Option value="week">week</Option>
											<Option value="month">month</Option>
											<Option value="year">year</Option>
										</Select>
									</Form.Item>
								</Col>
							</Row>

							{recurringType === "week" && (
								<Form.Item label="Repeat on" name="repeat_on_days">
									<Checkbox.Group
										options={WEEKDAY_LABELS}
										value={repeatOnDays}
										onChange={(days) => {
											setRepeatOnDays(days);
											form.setFieldValue("repeat_on_days", days);
										}}
									/>
								</Form.Item>
							)}

							<Form.Item label="Ends">
								<Radio.Group
									value={recurrenceEndType}
									onChange={(e) => {
										setRecurrenceEndType(e.target.value);
										form.setFieldsValue({
											recurrence_end_value_date: null,
											recurrence_end_value_count: null,
										});
									}}
								>
									<Row gutter={16} style={{ marginBottom: 8 }}>
										<Col span={6}>
											<Radio value="never">Never (max 100 entries)</Radio>
										</Col>
									</Row>

									<Row gutter={16} align="middle" style={{ marginBottom: 8 }}>
										<Col span={6}>
											<Radio value="on_date">On</Radio>
										</Col>
										<Col span={12}>
											<Form.Item
												name="recurrence_end_value_date"
												noStyle
												initialValue={dayjs()} // default today
												rules={
													recurrenceEndType === "on_date"
														? [
																{
																	required: true,
																	message: "Please select end date",
																},
														  ]
														: []
												}
											>
												<DatePicker
													disabled={recurrenceEndType !== "on_date"}
													style={{ width: "100%", marginLeft: "50px" }}
												/>
											</Form.Item>
										</Col>
									</Row>

									<Row gutter={16} align="middle">
										<Col span={6}>
											<Radio value="after">After</Radio>
										</Col>
										<Col span={6}>
											<Form.Item
												name="recurrence_end_value_count"
												noStyle
												initialValue={1}
												rules={
													recurrenceEndType === "after"
														? [
																{
																	required: true,
																	message: "Enter number of occurrences",
																},
														  ]
														: []
												}
											>
												<InputNumber
													min={1}
													max={52}
													disabled={recurrenceEndType !== "after"}
													style={{ width: "100%", marginLeft: "50px" }}
												/>
											</Form.Item>
										</Col>
										<Col style={{ paddingLeft: "50px" }}>occurrences</Col>
									</Row>
								</Radio.Group>
							</Form.Item>
						</Card>
					)}

					<Form.Item name="notes" label="Notes">
						<TextArea rows={3} />
					</Form.Item>

					<Form.Item>
						<Button type="primary" htmlType="submit" loading={loading}>
							Next
						</Button>
					</Form.Item>
				</Form>
			</Card>
		</Box>
	);
};

export default GuestBooking;