import { useLayoutEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { GetAdminById, UpdateAdmin } from "../../services/Api/Api.jsx";
import { Button, Input, Select, message } from "antd";
import { ArrowLeft, Check, X } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import "./AdminManagement.scss";

const ROLE_OPTIONS = [
	{ value: "5", label: "BDM" },
	{ value: "3", label: "OPERATIONS ADMINISTRATOR" },
	{ value: "1", label: "SUPER ADMIN" },
];

const EditAdmin = () => {
	const { id } = useParams();
	const [idData, setIdData] = useState("");
	const [disable, setDisable] = useState(false);
	const navigate = useNavigate();

	//get role By ID
	useLayoutEffect(() => {
		GetAdminById(id)
			.then((res) => {
				setIdData(res.data.data);
			})
			.catch((err) => {
				console.error(err, "error");
			});
	}, [id]);

	//update role api implementation
	const handleNameChange = (e) => {
		setIdData({ ...idData, [e.target?.name]: e.target?.value });
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		setDisable(true);

		const formData = new FormData();
		formData.append("admin_id", id);
		formData.append("name", idData?.name ? idData?.name : "");
		formData.append("role_id", idData?.role_id ? idData?.role_id : "");

		UpdateAdmin(formData)
			.then((res) => {
				if (res.status === 200) {
					message.success("Admin updated successfully!");
				}
				navigate("/adminList");
			})
			.catch((err) => {
				if (err.response && err.response.status === 401) {
					message.error("Token expired!");
					localStorage.removeItem("adminToken");
					setTimeout(() => {
						navigate("/Login");
					}, 3000);
				} else {
					message.error("Something went wrong");
				}
			})
			.finally(() => {
				setDisable(false);
			});
	};

	const navigateToRole = () => {
		navigate("/adminList");
	};

	return (
		<div>
			<PageHeader
				title="ADMIN MANAGEMENT"
				subtitle="Update this admin"
				actions={
					<Button
						size="large"
						icon={<ArrowLeft size={16} />}
						onClick={navigateToRole}
					>
						Return to Admin
					</Button>
				}
			/>

			<div className="surface admin-form__panel">
				<form onSubmit={handleSubmit}>
					<div className="admin-form__fields">
						<div>
							<label className="field-label" htmlFor="edit-admin-name">
								Name
							</label>
							<Input
								id="edit-admin-name"
								size="large"
								name="name"
								value={idData?.name || ""}
								onChange={handleNameChange}
							/>
						</div>

						<div>
							<label className="field-label text-subtle" htmlFor="edit-admin-email">
								Email
							</label>
							<Input
								id="edit-admin-email"
								size="large"
								disabled
								name="email"
								value={idData?.email || ""}
							/>
						</div>

						<div>
							<label className="field-label" htmlFor="edit-admin-role">
								Select Role
							</label>
							{idData && (
								// role_id comes back as a number; the options use string values
								<Select
									id="edit-admin-role"
									size="large"
									defaultValue={idData?.role_id ? String(idData.role_id) : undefined}
									onChange={(value) =>
										handleNameChange({
											target: { name: "role_id", value },
										})
									}
									options={ROLE_OPTIONS}
									style={{ width: "100%" }}
								/>
							)}
						</div>

						<div className="admin-form__actions">
							<Button
								type="primary"
								htmlType="submit"
								size="large"
								disabled={disable}
								icon={!disable ? <Check size={16} /> : null}
							>
								{disable ? "Saving..." : "Save"}
							</Button>

							<Button
								size="large"
								icon={<X size={16} />}
								onClick={navigateToRole}
							>
								Cancel
							</Button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

export default EditAdmin;
