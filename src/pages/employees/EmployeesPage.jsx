import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Input, Modal, Select, Space, Switch, Table, Tag, Tooltip, message } from "antd";
import { Download, Eye, KeyRound, MapPin, Pencil, Plus, Search, Send, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import { useApiQuery } from "@/hooks/useApiQuery";
import { PERMISSION, useCan } from "@/lib/session";
import { sendTwoWeekSchedule } from "@/services/api/bookingApi";
import {
  EMPLOYEE_ROLES,
  EMPLOYEE_TYPES,
  deleteEmployee,
  listEmployees,
  setEmployeeRoles,
  setEmployeeType,
  toggleEmployeeLogoutImage,
} from "@/services/api/employeeApi";
import { dataOf, errorMessage, itemsOf } from "@/services/apiResult";
import { downloadBlob } from "@/utils/download";
import ResetCredentialsModal from "./components/ResetCredentialsModal";
import { homeOf, roleCodesOf, roleColor, roleLabel, searchTextOf } from "./employeeFields";
import "./EmployeesPage.scss";

const csvCell = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// Every employee: find them by name, email, role or home; change their roles,
// pay type and sign-out photo rule in place; open, edit or remove them.
const EmployeesPage = () => {
  const navigate = useNavigate();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState();
  const [selected, setSelected] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [resetFor, setResetFor] = useState(null);
  const [rolesFor, setRolesFor] = useState(null);
  const [roles, setRoles] = useState([]);

  const { data: employees, loading, reload, setData } = useApiQuery(() => listEmployees().then(itemsOf), [], {
    initial: [],
    errorText: "Couldn't load the employees",
  });

  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (employees || []).filter(
      (employee) =>
        (!needle || searchTextOf(employee).includes(needle)) &&
        (!roleFilter || roleCodesOf(employee).includes(roleFilter)),
    );
  }, [employees, search, roleFilter]);

  const patchRow = (id, changes) =>
    setData((rows) => rows.map((row) => (row.id === id ? { ...row, ...changes } : row)));

  const changeType = async (employee, type) => {
    setBusyId(employee.id);
    try {
      await setEmployeeType(employee.id, type);
      patchRow(employee.id, { employee_type: type });
      message.success("Pay type changed");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't change the pay type"));
    } finally {
      setBusyId(null);
    }
  };

  const togglePhoto = async (employee) => {
    setBusyId(employee.id);
    try {
      await toggleEmployeeLogoutImage(employee.id);
      patchRow(employee.id, { logout_image_required: !employee.logout_image_required });
    } catch (error) {
      message.error(errorMessage(error, "Couldn't change the sign-out photo rule"));
    } finally {
      setBusyId(null);
    }
  };

  const openRoles = (employee) => {
    setRolesFor(employee);
    setRoles(roleCodesOf(employee));
  };

  const saveRoles = async () => {
    try {
      const answer = dataOf(await setEmployeeRoles(rolesFor.id, roles));
      patchRow(rolesFor.id, { roles: answer?.user?.roles || roles.map((code) => ({ code })) });
      message.success("Roles changed; open visits moved with any change of job");
      setRolesFor(null);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't change the roles"));
    }
  };

  const sendSchedule = (employee) =>
    Modal.confirm({
      title: `Send ${employee.name || "their"}'s 2-week schedule?`,
      content: "They get an email with their visits for the next two weeks.",
      okText: "Send",
      onOk: async () => {
        try {
          const sent = dataOf(await sendTwoWeekSchedule(employee.id));
          message.success(sent?.count ? `Schedule sent: ${sent.count} visit(s)` : "Schedule sent");
        } catch (error) {
          message.error(errorMessage(error, "Couldn't send the schedule"));
        }
      },
    });

  const confirmDelete = (ids) =>
    Modal.confirm({
      title: ids.length > 1 ? `Delete ${ids.length} employees?` : "Delete this employee?",
      content: "They can no longer sign in. This can't be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const failed = [];
        for (const id of ids) {
          try {
            await deleteEmployee(id);
          } catch (error) {
            failed.push(errorMessage(error, "Couldn't delete"));
          }
        }
        if (failed.length) message.error(`${failed.length} not deleted: ${failed[0]}`);
        else message.success(ids.length > 1 ? "Employees deleted" : "Employee deleted");
        setSelected([]);
        reload();
      },
    });

  const exportCsv = () => {
    const rows = [["ID", "Name", "Email", "Phone", "Roles", "Pay Type", "Home"]];
    for (const employee of shown) {
      rows.push([
        employee.id,
        employee.name,
        employee.email,
        employee.phone,
        roleCodesOf(employee).map(roleLabel).join("; "),
        EMPLOYEE_TYPES.find((type) => type.value === employee.employee_type)?.label || "",
        homeOf(employee)?.oneLine || "",
      ]);
    }
    downloadBlob(new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv" }), "employees.csv");
  };

  const columns = [
    {
      title: "Employee",
      key: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (_, employee) => (
        <div className="employee-list__who">
          <Button type="link" className="table-link" onClick={() => navigate(`/viewEmployee/${employee.id}`)}>
            {employee.name || employee.email}
          </Button>
          <span className="text-subtle">{employee.email}</span>
        </div>
      ),
    },
    {
      title: "Roles",
      key: "roles",
      render: (_, employee) => (
        <Tooltip title="Change the roles">
          <button type="button" className="employee-list__roles" onClick={() => openRoles(employee)}>
            {roleCodesOf(employee).map((code) => (
              <Tag key={code} color={roleColor(code)}>
                {roleLabel(code)}
              </Tag>
            ))}
            <Pencil size={12} className="text-subtle" />
          </button>
        </Tooltip>
      ),
    },
    {
      title: "Pay Type",
      dataIndex: "employee_type",
      render: (type, employee) => (
        <Select
          value={type || undefined}
          placeholder="Pick"
          style={{ width: 160 }}
          options={EMPLOYEE_TYPES}
          disabled={busyId === employee.id}
          onChange={(value) => changeType(employee, value)}
        />
      ),
    },
    {
      title: "Sign-Out Photo",
      dataIndex: "logout_image_required",
      render: (required, employee) => (
        <Switch
          checked={Boolean(required)}
          loading={busyId === employee.id}
          checkedChildren="Required"
          unCheckedChildren="No"
          onChange={() => togglePhoto(employee)}
        />
      ),
    },
    {
      title: "Home",
      key: "home",
      render: (_, employee) => {
        const home = homeOf(employee);
        return home ? (
          <Tooltip title={home.oneLine}>
            <div className="employee-list__home">
              <span>{home.street || "—"}</span>
              <span className="text-subtle">{home.place}</span>
            </div>
          </Tooltip>
        ) : (
          <span className="text-subtle">No address</span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 230,
      render: (_, employee) => {
        const home = homeOf(employee);
        return (
          <Space size={4}>
            <IconAction icon={Eye} title="Open" onClick={() => navigate(`/viewEmployee/${employee.id}`)} />
            <IconAction icon={Pencil} title="Edit" onClick={() => navigate(`/editEmployee/${employee.id}`)} />
            <IconAction icon={Send} title="Send their 2-week schedule" onClick={() => sendSchedule(employee)} />
            <IconAction icon={KeyRound} title="New sign-in details" onClick={() => setResetFor(employee)} />
            {home?.lat && home?.lng && (
              <IconAction
                icon={MapPin}
                title="Home on the map"
                onClick={() =>
                  window.open(`https://www.google.com/maps/search/?api=1&query=${home.lat},${home.lng}`, "_blank", "noopener")
                }
              />
            )}
            {canDelete && <IconAction icon={Trash2} title="Delete" danger onClick={() => confirmDelete([employee.id])} />}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="EMPLOYEES"
        subtitle={`${(employees || []).length} employees. BDMs are employees with the BDM role.`}
        actions={
          <Space wrap>
            <Button size="large" icon={<Download size={16} />} onClick={exportCsv}>
              Export CSV
            </Button>
            {canDelete && selected.length > 0 && (
              <Button size="large" danger icon={<Trash2 size={16} />} onClick={() => confirmDelete(selected)}>
                Delete {selected.length}
              </Button>
            )}
            <Button type="primary" size="large" icon={<Plus size={16} />} onClick={() => navigate("/addEmployee")}>
              Add Employee
            </Button>
          </Space>
        }
      />
      <div className="employee-list__filters">
        <Input
          allowClear
          size="large"
          className="employee-list__search"
          prefix={<Search size={16} className="text-subtle" />}
          placeholder="Search by name, email, role or address"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          allowClear
          size="large"
          className="employee-list__role-filter"
          placeholder="Any role"
          value={roleFilter}
          onChange={setRoleFilter}
          options={EMPLOYEE_ROLES}
        />
      </div>
      <Table
        rowKey="id"
        size="middle"
        loading={loading}
        columns={columns}
        dataSource={shown}
        rowSelection={canDelete ? { selectedRowKeys: selected, onChange: setSelected } : undefined}
        pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: [20, 50, 100], showTotal: (total) => `${total} shown` }}
        scroll={{ x: "max-content" }}
      />
      <Modal
        open={Boolean(rolesFor)}
        title={`Roles of ${rolesFor?.name || rolesFor?.email || "the employee"}`}
        okText="Save Roles"
        okButtonProps={{ disabled: !roles.length }}
        onOk={saveRoles}
        onCancel={() => setRolesFor(null)}
        destroyOnHidden
      >
        <p className="text-secondary">
          A change of field job (say, Cleaner to Supervisor) moves their open visits with them. A BDM can't sign in to the
          panel.
        </p>
        <Select mode="multiple" style={{ width: "100%" }} value={roles} onChange={setRoles} options={EMPLOYEE_ROLES} />
      </Modal>
      {resetFor && <ResetCredentialsModal employee={resetFor} onClose={() => setResetFor(null)} onDone={reload} />}
    </>
  );
};

export default EmployeesPage;
