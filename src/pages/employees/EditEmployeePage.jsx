import { useNavigate, useParams } from "react-router";
import { Button, Space, Spin, message } from "antd";
import { ArrowLeft, Eye } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useApiQuery } from "@/hooks/useApiQuery";
import { getEmployee, getHiringApplication, updateEmployee } from "@/services/api/employeeApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import EmployeeForm from "./components/EmployeeForm";
import { roleCodesOf } from "./employeeFields";
import "./employeeForm.scss";

const PLACE_FIELDS = ["country_id", "state_id", "city_id", "address_lat", "address_long"];
const sameRoles = (a = [], b = []) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

// One employee's details. Saving sends only what changed; another hiring
// form brings its address as their new home.
const EditEmployeePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: employee, loading } = useApiQuery(() => getEmployee(id).then(dataOf), [id], {
    errorText: "Couldn't load the employee",
  });
  const hiringId = employee?.hiring_form_submission_id;
  const { data: hiring } = useApiQuery(() => getHiringApplication(hiringId).then(dataOf), [hiringId], {
    skip: !hiringId,
    silent: true,
  });

  const submit = async ({ values, hiring: newHiring }) => {
    const changes = {};
    if (values.name.trim() !== (employee.name || "")) changes.name = values.name.trim();
    if (values.email.trim().toLowerCase() !== employee.email) changes.email = values.email.trim().toLowerCase();
    if (values.employee_type !== employee.employee_type) changes.employee_type = values.employee_type;
    if (!sameRoles(values.roles, roleCodesOf(employee))) changes.roles = values.roles;
    if (newHiring && newHiring.form.submission_id !== hiringId) {
      changes.hiring_form_submission_id = newHiring.form.submission_id;
      for (const field of PLACE_FIELDS) changes[field] = newHiring.place[field];
    }
    if (!Object.keys(changes).length) {
      navigate(`/viewEmployee/${id}`);
      return;
    }
    try {
      await updateEmployee(id, changes);
      message.success("Employee saved");
      navigate(`/viewEmployee/${id}`);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't save the employee"));
    }
  };

  if (loading && !employee) {
    return (
      <div className="page-loader">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`EDIT ${employee?.name || "EMPLOYEE"}`.toUpperCase()}
        subtitle={employee?.email}
        actions={
          <Space wrap>
            <Button size="large" icon={<Eye size={16} />} onClick={() => navigate(`/viewEmployee/${id}`)}>
              Their Page
            </Button>
            <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => navigate("/employees")}>
              All Employees
            </Button>
          </Space>
        }
      />
      {employee && (
        <div className="employee-form-page">
          <EmployeeForm
            key={employee.id}
            initialValues={{
              name: employee.name || "",
              email: employee.email,
              roles: roleCodesOf(employee),
              employee_type: employee.employee_type || undefined,
            }}
            currentHiring={
              hiring && {
                name: hiring.applicant_name,
                email: hiring.applicant_email,
                pdf_url: hiring.pdf_url,
              }
            }
            submitLabel="Save the Employee"
            onSubmit={submit}
          />
        </div>
      )}
    </>
  );
};

export default EditEmployeePage;
