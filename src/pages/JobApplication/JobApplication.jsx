/** @format */

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Container } from "react-bootstrap";
import { Steps, Button } from "antd";
import PersonalInformation from "./PersonalInformation";
import EmploymentEligibility from "./EmploymentEligibility";
import PreviousEmployment from "./PreviousEmployment";
import References from "./References";
import MilitaryService from "./MilitaryService";
import BackgroundCheckConsent from "./BackgroundCheckConsent";
import DisclouserAndAuthroization from "./DisclouserAndAuthroization";
import AuthorizationToObtain from "./AuthorizationToObtain";
import Policy from "./Policy";
import FloridaNonCompleleAgreement from "./FloridaNonCompleleAgreement";
import Education from "./Education";
import "./JobApplication.scss";
import EmployeeDirectDeposite from "./EmployeeDirectDeposite";
import { useNavigate, useParams } from "react-router";
import { GetHiringFormById } from "../../services/Api/HiringFormApi";
const { Step } = Steps;
const JobApplication = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [currentStep, setCurrentStep] = useState(0);
	const formRef = useRef(null);
	const [formData, setFormData] = useState({
		personalInfo: {},
		employmentEligibility: {}, // ✅ Ensure all fields exist
		education: {},
		previousEmployment: {},
		references: {},
		militaryService: {},
		backgroundCheck: {},
	});
	useEffect(() => {
		if (formRef.current) {
			formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}, [currentStep]);
	const handleNext = () => setCurrentStep((prev) => prev + 1);
	const handlePrev = () => setCurrentStep((prev) => prev - 1);

	useLayoutEffect(() => {
		GetHiringFormById(id)
			.then((res) => {
				setFormData(res.data.data);
				console.log(res.data.data);
			})
			.catch((err) => {
				console.log(err, "error");
			});
	}, [id]);

	const navigateToForm = () => {
		navigate("/hiring-form");
	};
	return (
		<Container>
			<div className="job-application-layout">
				{/* <div className="stepper-container">
          <Steps direction="vertical" current={currentStep}>
            <Step title="Disclosure & Authorization" />
            <Step title="Personal & Employment Info" />
            <Step title="Other Details" />
            <Step title="Non-Compete Agreement" />
            <Step title="Non-Compete Agreement1" />
          </Steps>
        </div> */}
				<div className="form-content" ref={formRef}>
					{currentStep === 0 && (
						<>
							<h5>
								DISCLOSURE AND AUTHORIZATION TO OBTAIN CONSUMER REPORTS AND/OR
								INVESTIGATIVE CONSUMER REPORTS
							</h5>
							<DisclouserAndAuthroization />
							<h5>
								AUTHORIZATION TO OBTAIN CONSUMER REPORTS AND/OR INVESTIGATIVE
								CONSUMER REPORTS
							</h5>
							<AuthorizationToObtain />
							<div className="top_left_heading">
								<p>DISCLOSURE TO INDEPENDENT</p>
								<p>CONTRACTOR REGARDING</p>
								<p>PROCUREMENT OF</p>
								<p>A CONSUMER REPORT</p>
							</div>
							<Policy />
						</>
					)}
					{currentStep === 1 && (
						<>
							<h4>EMPLOYMENT / JOB APPLICATION</h4>
							<div className="form_section">
								<div className="Form_section_heading">PERSONAL INFORMATION</div>
								<PersonalInformation
									formData={formData.personalInfo}
									// setFormData={updatePersonalInfo}
								/>
							</div>
							<div className="form_section">
								<div className="Form_section_heading">
									EMPLOYMENT ELIGIBILITY
								</div>
								<EmploymentEligibility
									formData={formData}
									setFormData={setFormData}
								/>
							</div>
						</>
					)}
					{currentStep === 2 && (
						<>
							<div className="form_section">
								<div className="Form_section_heading">EDUCATION</div>
								<Education formData={formData} setFormData={setFormData} />
							</div>
							<div className="form_section">
								<div className="Form_section_heading">PREVIOUS EMPLOYMENT</div>
								<PreviousEmployment
									formData={formData}
									setFormData={setFormData}
								/>
							</div>
							<div className="form_section">
								<div className="Form_section_heading">
									REFERENCES <small>(PROFESSIONAL ONLY)</small>
								</div>
								<References formData={formData} setFormData={setFormData} />
							</div>
							<div className="form_section">
								<div className="Form_section_heading">MILITARY SERVICE</div>
								<MilitaryService
									formData={formData}
									setFormData={setFormData}
								/>
							</div>
							<div className="form_section">
								<div className="Form_section_heading">
									BACKGROUND CHECK CONSENT
								</div>
								<BackgroundCheckConsent
									formData={formData}
									setFormData={setFormData}
								/>
							</div>
						</>
					)}
					{currentStep === 3 && (
						<>
							<h4>FLORIDA NON-COMPETE AGREEMENT</h4>
							<FloridaNonCompleleAgreement />
						</>
					)}
					{currentStep === 4 && (
						<>
							<h4>EMPLOYEE DIRECT DEPOSIT AUTHORIZATION FORM</h4>
							<EmployeeDirectDeposite />
						</>
					)}
					<div className="step-buttons">
						{currentStep > 0 && (
							<Button onClick={handlePrev} style={{ marginRight: "10px" }}>
								Previous
							</Button>
						)}
						{currentStep < 4 ? (
							<Button type="primary" onClick={handleNext}>
								Next
							</Button>
						) : (
							<Button type="primary" onClick={navigateToForm}>
								Close Application
							</Button>
						)}
					</div>
				</div>
			</div>
		</Container>
	);
};
export default JobApplication;
