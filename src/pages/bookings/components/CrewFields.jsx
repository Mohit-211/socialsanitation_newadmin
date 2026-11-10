import { Form, Select } from "antd";
import { listEmployeeNames } from "@/services/api/employeeApi";
import { itemsOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { CREW_JOBS } from "../bookingForm";

/**
 * The crew of a booking, by job: cleaners, supervisors and quality
 * inspectors, each picked from the employees whose roles do that job. They
 * get the visit's group chat. Leaving a job empty books it without people.
 */
const CrewFields = () => {
  const { data: employees } = useApiQuery(() => listEmployeeNames().then(itemsOf), [], {
    initial: [],
    errorText: "Couldn't load the employees",
  });

  return (
    <div className="form-grid form-grid--3">
      {CREW_JOBS.map((job) => (
        <Form.Item key={job.field} label={job.label} name={job.field}>
          <Select
            mode="multiple"
            allowClear
            placeholder="No one yet"
            optionFilterProp="label"
            options={(employees || [])
              .filter((employee) => employee.roles?.some((role) => job.roles.includes(role.code)))
              .map((employee) => ({ value: employee.id, label: employee.name }))}
          />
        </Form.Item>
      ))}
    </div>
  );
};

export default CrewFields;
