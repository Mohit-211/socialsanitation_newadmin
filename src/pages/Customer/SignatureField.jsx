/** @format */

import React, { useRef, useState } from "react";
import SignaturePad from "react-signature-canvas";
import { Modal, Button } from "antd";

const SignatureField = ({ formData, setFormData }) => {
	const [modalVisible, setModalVisible] = useState(false);
	const sigPadRef = useRef();

	const openModal = () => setModalVisible(true);
	const closeModal = () => setModalVisible(false);

	const clearSignature = () => {
		sigPadRef.current.clear();
	};

	const saveSignature = () => {
		if (!sigPadRef.current.isEmpty()) {
			const dataUrl = sigPadRef.current.toDataURL();
			setFormData({ ...formData, signature: dataUrl });
			closeModal();
		}
	};

	return (
		<>
			{formData.signature ? (
				<img
					src={formData.signature}
					alt="Signature"
					style={{ marginTop: 10, width: 300, border: "1px solid #ccc" }}
				/>
			) : (
				<Button type="primary" onClick={openModal} style={{ marginTop: 10 }}>
					Click to Sign
				</Button>
			)}

			<Modal
				title="Draw Your Signature"
				open={modalVisible}
				onCancel={closeModal}
				footer={[
					<Button key="clear" onClick={clearSignature}>
						Clear
					</Button>,
					<Button key="cancel" onClick={closeModal}>
						Cancel
					</Button>,
					<Button key="save" type="primary" onClick={saveSignature}>
						Save
					</Button>,
				]}
			>
				<SignaturePad
					ref={sigPadRef}
					canvasProps={{
						width: 500,
						height: 200,
						style: { border: "1px solid #ccc", borderRadius: 4 },
					}}
				/>
			</Modal>
			<div className="signature-block" style={{ marginTop: 16 }}>
				Social Sanitation Legal Representative Signature{" "}
				<span style={{ color: "red" }}>*</span>
			</div>
		</>
	);
};

export default SignatureField;
