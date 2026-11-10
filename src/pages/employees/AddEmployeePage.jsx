import { useNavigate, useSearchParams } from "react-router";
import { Button, message } from "antd";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { createEmployee } from "@/services/api/employeeApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import EmployeeForm from "./components/EmployeeForm";
import "./employeeForm.scss";

const PLACE_FIELDS = ["country_id", "state_id", "city_id", "address_lat", "address_long"];

// A new employee, from their hiring form: their roles, pay type and home.
// ?role=bdm starts a new BDM (an employee with the BDM role).
const AddEmployeePage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const role = params.get("role");
  const isBdm = role === "bdm";

  const submit = async ({ values, hiring }) => {
    try {
      const res = await createEmployee({
        email: values.email.trim().toLowerCase(),
        name: values.name.trim(),
        roles: values.roles,
        employee_type: values.employee_type,
        hiring_form_submission_id: hiring.form.submission_id,
        ...Object.fromEntries(PLACE_FIELDS.map((field) => [field, hiring.place[field]])),
      });
      const employee = dataOf(res);
      // The employee is saved either way; the backend says whether their sign-in details went out.
      if (employee?.credentials_emailed === false) {
        message.warning(res.data?.message || "Employee added, but the welcome email didn't go out.", 8);
      } else {
        message.success("Employee added. Their sign-in details are on the way by email.");
      }
      navigate(employee?.id ? `/viewEmployee/${employee.id}` : "/employees");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't add the employee"));
    }
  };

  return (
    <>
      <PageHeader
        title={isBdm ? "ADD BDM" : "ADD EMPLOYEE"}
        subtitle={
          isBdm
            ? "A Business Development Manager is an employee with the BDM role"
            : "Start from the applicant's hiring form"
        }
        actions={
          <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => navigate(isBdm ? "/bdm-list" : "/employees")}>
            {isBdm ? "All BDMs" : "All Employees"}
          </Button>
        }
      />
      <div className="employee-form-page">
        <EmployeeForm
          isNew
          initialValues={{ roles: role ? [role] : [], employee_type: undefined }}
          submitLabel={isBdm ? "Add the BDM" : "Add the Employee"}
          onSubmit={submit}
        />
      </div>
    </>
  );
};

export default AddEmployeePage;
