import { Button, Table, message, Space, Modal, Tag, type TableColumnsType } from "antd";
import { useNavigate } from "react-router";
import { LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import { listAdmins, deleteAdmin, endAdminSessions } from "@/services/api/adminApi";
import { errorMessage, itemsOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { PERMISSION, useCan, useSession } from "@/lib/session";
import type { Admin } from "@/types";

const isSuperAdmin = (admin: Admin) => admin.roles?.some((role) => role.code === "super_admin");

// Admin accounts. Only admins with admins.manage (Super Admin) add, change or
// remove other admins and end their sessions; anyone may edit their own record.
const AdminsPage = () => {
	const navigate = useNavigate();
	const selfId = useSession()?.user?.id;
	const canManage = useCan(PERMISSION.MANAGE_ADMINS);
	const {
		data: admins,
		loading,
		reload: load,
	} = useApiQuery(() => listAdmins().then(itemsOf), [], {
		initial: [],
		errorText: "Couldn't load the admins",
	});

	const confirmDelete = (admin: Admin) => {
		Modal.confirm({
			title: `Delete ${admin.name || "this admin"}?`,
			content: "They are signed out and can't sign in again.",
			okText: "Delete",
			okType: "danger",
			onOk: async () => {
				try {
					await deleteAdmin(admin.id);
					message.success("Admin deleted");
					load();
				} catch (error) {
					message.error(errorMessage(error, "Couldn't delete the admin"));
				}
			},
		});
	};

	const confirmEndSessions = (admin: Admin) => {
		Modal.confirm({
			title: `Sign ${admin.name || "this admin"} out everywhere?`,
			content: "Every browser they are signed in on is signed out.",
			okText: "Sign out everywhere",
			onOk: async () => {
				try {
					await endAdminSessions(admin.id);
					message.success("Signed out on every device");
				} catch (error) {
					message.error(errorMessage(error, "Couldn't end their sessions"));
				}
			},
		});
	};

	const columns: TableColumnsType<Admin> = [
		{
			title: "S.No.",
			key: "index",
			width: 80,
			render: (_value, _admin, index) => index + 1,
		},
		{ title: "Name", dataIndex: "name", key: "name" },
		{ title: "Email", dataIndex: "email", key: "email" },
		{
			title: "Role",
			key: "roles",
			render: (_value, admin) =>
				admin.roles?.length
					? admin.roles.map((role) => (
							<Tag key={role.code} color={role.code === "super_admin" ? "blue" : "default"}>
								{role.name}
							</Tag>
						))
					: "—",
		},
		{
			title: "Actions",
			key: "action",
			width: 160,
			render: (_value, admin) => {
				const isSelf = admin.id === selfId;
				return (
					<Space>
						{(canManage || isSelf) && (
							<IconAction
								icon={Pencil}
								title="Edit Admin"
								onClick={() => navigate(`/editAdmin/${admin.id}`)}
							/>
						)}
						{canManage && !isSelf && (
							<IconAction
								icon={LogOut}
								title="Sign Out Everywhere"
								onClick={() => confirmEndSessions(admin)}
							/>
						)}
						{canManage && !isSelf && !isSuperAdmin(admin) && (
							<IconAction
								icon={Trash2}
								title="Delete Admin"
								danger
								onClick={() => confirmDelete(admin)}
							/>
						)}
					</Space>
				);
			},
		},
	];

	return (
		<div>
			<PageHeader
				title="ADMIN MANAGEMENT"
				subtitle={canManage ? "View, edit, delete, and create admins" : "The panel's admin accounts"}
				actions={
					canManage && (
						<Button
							type="primary"
							size="large"
							icon={<Plus size={16} />}
							onClick={() => navigate("/addAdmin")}
						>
							Add New Admin
						</Button>
					)
				}
			/>

			<Table
				dataSource={admins}
				columns={columns}
				rowKey="id"
				pagination={{ pageSize: 20, hideOnSinglePage: true }}
				loading={loading}
				bordered
				size="middle"
				scroll={{ x: "max-content" }}
			/>
		</div>
	);
};

export default AdminsPage;
