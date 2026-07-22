/** @format */

import React from "react";
import logo from "../../src/assets/New-Logo.webp";

const DeleteAccountPage = () => {
	return (
		<div className="max-w-4xl mx-auto px-5 py-9 text-gray-800">
			{/* Logo */}
			<div className="flex justify-center mb-8">
				<img
					src={logo} // Update with your actual logo path
					alt="Logo"
					style={{ width: "150px" }}
				/>
			</div>

			<h1 className="text-3xl font-bold mb-6 text-center">
				How to Delete Your Account
			</h1>

			<p className="mb-6 text-lg">
				We believe in transparency and giving users control over their data.
				Below are the steps and policies for deleting accounts based on your
				role—whether you're a <strong>User</strong> or an{" "}
				<strong>Employee</strong>.
			</p>

			{/* User Section */}
			<section className="mb-12">
				<h2
					className="text-2xl font-semibold mb-4"
					style={{ fontSize: "1.25rem", textDecoration: "underline" }}
				>
					For Users
				</h2>
				<p className="mb-4">
					If you are using our platform as a customer and wish to delete your
					account, you can do so easily through the app. Please note that this
					action is permanent and irreversible.
				</p>
				<h3 className="font-semibold mb-2" style={{ fontSize: "1.25rem" }}>
					Steps to Delete Your User Account:
				</h3>
				<ol className="list-decimal list-inside space-y-2 mb-4">
					<li>
						<strong>Open the App</strong>: Launch the app on your device and
						ensure you're logged in to the account you want to delete.
					</li>
					<li>
						<strong>Go to the Profile Tab</strong>: Navigate to the bottom
						navigation bar and tap on the Profile tab.
					</li>
					<li>
						<strong>Select "Delete Account"</strong>: Scroll to find the Delete
						Account option and tap on it.
					</li>
					<li>
						<strong>Confirm Deletion</strong>: A confirmation prompt will appear
						detailing what will be lost. Review the information carefully and
						tap Delete to confirm.
					</li>
				</ol>

				<h3 className="font-semibold mb-2" style={{ fontSize: "1.25rem" }}>
					Important Information:
				</h3>
				<p className="mb-2">
					Once deleted, your account and all associated data will be permanently
					removed, including:
				</p>
				<ul className="list-disc list-inside ml-4 space-y-1">
					<li>Personal information</li>
					<li>Booking history</li>
					<li>Upcoming bookings</li>
					<li>Payment history</li>
					<li>Chat history</li>
				</ul>
				<p className="mt-2 text-red-600">
					<strong>This action cannot be undone.</strong> If you wish to use the
					app again, a new account will need to be created from scratch.
				</p>
			</section>

			{/* Employee Section */}
			<section className="mb-12">
				<h2
					className="text-2xl font-semibold mb-4"
					style={{ fontSize: "1.25rem", textDecoration: "underline" }}
				>
					For Employees
				</h2>
				<p className="mb-4">
					Account management for employees is handled internally by our
					administrative team. Employees do not have the ability to create or
					delete accounts through the app or website.
				</p>

				<h3 className="font-semibold mb-2" style={{ fontSize: "1.25rem" }}>
					Employee Account Deletion Policy:
				</h3>
				<ul className="list-disc list-inside ml-4 space-y-2">
					<li>
						Creation and deletion of employee accounts are managed solely by
						authorized company personnel.
					</li>
					<li>
						If your role has ended, your account will be deactivated and removed
						by the company’s operations or HR department.
					</li>
					<li>
						All employee data is handled securely and in accordance with
						internal data retention and privacy policies.
					</li>
					<li>
						If you have questions, please contact your supervisor or the HR
						department.
					</li>
				</ul>
			</section>

			{/* Support Section */}
			<section>
				<h2
					className="text-2xl font-semibold mb-4"
					style={{ fontSize: "1.25rem" }}
				>
					Need Help?
				</h2>
				<p>
					If you encounter any issues during the process or have questions about
					data privacy, please contact our support team at{" "}
					<a
						href="mailto:socialsanitation@gmail.com"
						className="text-blue-600 underline"
					>
						socialsanitation@gmail.com
					</a>{" "}
					or use the in-app chat to get assistance.
				</p>
			</section>
		</div>
	);
};

export default DeleteAccountPage;
