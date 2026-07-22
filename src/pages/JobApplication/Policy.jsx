import { Button, DatePicker, Form, Input, Space, Upload } from "antd";
import React, { useEffect } from "react";
import { UploadOutlined } from "@ant-design/icons";

const Policy = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);
  return (
    <>
      <p>
        In connection with your application as an Independent Contractor, we may
        procure a Background Investigative Report and/ or Background Report on
        you as part of the process of considering your candidacy as an
        Independent Contractor. In the event that information from the report is
        utilized in whole or in part in making an adverse decision with regard
        to our potential partnership, before making the adverse decision, we
        will provide you with a copy of the consumer report and a description in
        writing of your rights under the federal Fair Credit Reporting Act.
      </p>
      <p>
        The Fair Credit Reporting Act gives you specific rights in dealing with
        consumer reporting agencies. You will be given a summary of these rights
        together with this document.
      </p>
      <p>
        By your signature below, you hereby authorize us to obtain a consumer
        report and/or an investigative report about you in order to consider you
        as an Independent Contractor. The information requested below is being
        used strictly for pre-contract background screening purposes in order to
        obtain accurate results. The consumer report may include, but not be
        limited to, criminal history, verifications of employment and education,
        and driving records. A credit report detailing personal financial
        history will only be obtained for permissible purposes in consideration
        of jobs meeting specific criteria.
      </p>
      <div className="section_form_layout">
        <Form.Item
          label="Applicant's Name (Full Legal Name)"
          name="applicantName"
          rules={[
            {
              required: true,
              message: "Please enter your full legal name!",
            },
          ]}
        >
          <Input placeholder="Enter your full legal name" />
        </Form.Item>
        <Form.Item
          label="Applicant's Address"
          name="applicantAddress"
          rules={[{ required: true, message: "Please enter your address!" }]}
        >
          <Input placeholder="Enter your address" />
        </Form.Item>
        <Form.Item
          label="City/State/Zip"
          name="cityStateZip"
          rules={[
            {
              required: true,
              message: "Please enter your city, state, and zip code!",
            },
          ]}
        >
          <Input placeholder="Enter your city, state, and zip code" />
        </Form.Item>
        <Form.Item
          label="Upload Signature"
          name="signature"
          rules={[{ required: true, message: "Please upload your signature!" }]}
        >
          <Upload>
            <Button icon={<UploadOutlined />}>Click to Upload</Button>
          </Upload>
        </Form.Item>
        <Form.Item
          label="Social Security Number"
          name="ssn"
          rules={[{ required: true, message: "Please enter your SSN!" }]}
        >
          <Input placeholder="Enter your SSN" />
        </Form.Item>
        <Form.Item
          label="Date of Birth"
          name="dob"
          rules={[
            {
              required: true,
              message: "Please select your date of birth!",
            },
          ]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <p>
          The EEOC states for the purpose of pre-employment inquiries, under the
          Age Discrimination in Employment Act of 1967, Section 1625.5, "A
          request on the part of an employer for information such as 'Date of
          Birth' or 'State Age' on an employment application form is not, in
          itself, a violation of the Act."
        </p>
        <Form.Item
          label="Driver's License Number"
          name="licenseNumber"
          rules={[
            {
              required: true,
              message: "Please enter your driver's license number!",
            },
          ]}
        >
          <Input placeholder="Enter your driver's license number" />
        </Form.Item>
        <Form.Item
          label="State"
          name="state"
          rules={[{ required: true, message: "Please enter your state!" }]}
        >
          <Input placeholder="Enter your state" />
        </Form.Item>
      </div>

      <div>
        <p>To All Applicants:</p>
        <p>
          The information requested above is used to assist in the completion of
          a background investigation. The information will be maintained in a
          limited access file, detached from your application. The information
          will be used for the sole purpose of identification when conducting a
          background investigation.
        </p>
        <p>
          <b>
            I have received a copy of my Summary of Rights Under the Fair Credit
            Reporting Act.
          </b>
        </p>
        <Form.Item
          label="Upload Signature"
          name="signature"
          rules={[{ required: true, message: "Please upload your signature!" }]}
        >
          <Upload>
            <Button icon={<UploadOutlined />}>Click to Upload</Button>
          </Upload>
        </Form.Item>
      </div>
    </>
  );
};

export default Policy;
