import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button, Input, Select, Spin, message } from "antd";
import { ArrowLeft, Check, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { ADMIN_ROLES, getAdmin, updateAdmin, type AdminInput } from "@/services/api/adminApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { PERMISSION, updateSessionUser, useCan, useSession } from "@/lib/session";
import "./admins.scss";
import { useRouteParam } from "@/hooks/useRouteParam";
import type { Admin } from "@/types";

interface AdminForm {
	name: string;
	email: string;
	mobile: string;
	role?: string;
}

// Anyone edits their own name, mobile and email. Another admin, or anyone's
// role, needs admins.manage (Super Admin).
const EditAdminPage = () => {
	const id = useRouteParam();
	const navigate = useNavigate();
	const selfId = useSession()?.user?.id;
	const canManage = useCan(PERMISSION.MANAGE_ADMINS);
	const [original, setOriginal] = useState<Admin | null>(null);
	const [form, setForm] = useState<AdminForm>({ name: "", email: "", mobile: "", role: undefined });
	const [saving, setSaving] = useState(false);

	const isSelf = Number(id) === selfId;
	const canEdit = canManage || isSelf;
	// A role change is Super Admin only, and nobody changes their own here.
	const canChangeRole = canManage && !isSelf;

	useEffect(() => {
		getAdmin(id)
			.then((res) => {
				const admin = dataOf(res);
				setOriginal(admin);
				setForm({
					name: admin?.name || "",
					email: admin?.email || "",
					mobile: admin?.mobile || "",
					role: admin?.roles?.[0]?.code,
				});
			})
			.catch((error) => message.error(errorMessage(error, "Couldn't load the admin")));
	}, [id]);

	// Inputs hand over their event, the role select its value.
	const setField = (field: keyof AdminForm) => (event: ChangeEvent<HTMLInputElement> | string) =>
		setForm((current) => ({ ...current, [field]: typeof event === "string" ? event : event.target.value }));

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!form.name.trim() || !form.email.trim()) {
			message.error("Name and email can't be empty");
			return;
		}
		// Send only what changed.
		const changes: Partial<AdminInput> = {};
		if (form.name.trim() !== (original?.name || "")) changes.name = form.name.trim();
		if (form.email.trim() !== (original?.email || "")) changes.email = form.email.trim();
		if (form.mobile.trim() !== (original?.mobile || "")) changes.mobile = form.mobile.trim();
		if (canChangeRole && form.role && form.role !== original?.roles?.[0]?.code) changes.role = form.role;
		if (!Object.keys(changes).length) {
			navigate("/adminList");
			return;
		}
		setSaving(true);
		try {
			const res = await updateAdmin(id, changes);
			if (isSelf) updateSessionUser(dataOf(res) || changes);
			message.success("Admin updated");
			navigate("/adminList");
		} catch (error) {
			message.error(errorMessage(error, "Couldn't update the admin"));
		} finally {
			setSaving(false);
		}
	};

	const goBack = () => navigate("/adminList");

	return (
		<div>
			<PageHeader
				title="ADMIN MANAGEMENT"
				subtitle={isSelf ? "Update your details" : "Update this admin"}
				actions={
					<Button size="large" icon={<ArrowLeft size={16} />} onClick={goBack}>
						Return to Admin
					</Button>
				}
			/>

			<div className="surface admin-form__panel">
				{!original ? (
					<Spin />
				) : (
					<form onSubmit={handleSubmit}>
						<div className="admin-form__fields">
							<div>
								<label className="field-label" htmlFor="edit-admin-name">
									Name
								</label>
								<Input
									id="edit-admin-name"
									size="large"
									value={form.name}
									onChange={setField("name")}
									disabled={!canEdit}
								/>
							</div>

							<div>
								<label className="field-label" htmlFor="edit-admin-email">
									Email
								</label>
								<Input
									id="edit-admin-email"
									size="large"
									type="email"
									value={form.email}
									onChange={setField("email")}
									disabled={!canEdit}
								/>
							</div>

							<div>
								<label className="field-label" htmlFor="edit-admin-mobile">
									Mobile
								</label>
								<Input
									id="edit-admin-mobile"
									size="large"
									type="tel"
									value={form.mobile}
									onChange={setField("mobile")}
									disabled={!canEdit}
								/>
							</div>

							<div>
								<label className="field-label" htmlFor="edit-admin-role">
									Role
								</label>
								<Select
									id="edit-admin-role"
									size="large"
									value={form.role}
									onChange={setField("role")}
									options={ADMIN_ROLES}
									disabled={!canChangeRole}
									style={{ width: "100%" }}
								/>
							</div>

							{canEdit && (
								<div className="admin-form__actions">
									<Button
										type="primary"
										htmlType="submit"
										size="large"
										disabled={saving}
										icon={!saving ? <Check size={16} /> : null}
									>
										{saving ? "Saving..." : "Save"}
									</Button>
									<Button size="large" icon={<X size={16} />} onClick={goBack}>
										Cancel
									</Button>
								</div>
							)}
						</div>
					</form>
				)}
			</div>
		</div>
	);
};

export default EditAdminPage;
