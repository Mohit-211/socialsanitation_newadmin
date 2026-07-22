/** @format */
import React, { useEffect, useRef, useState } from "react";
import {
	Button,
	Card,
	Typography,
	Spin,
	Input,
	Avatar,
	Tooltip,
	Upload,
	message,
} from "antd";
import {
	SmileOutlined,
	PlusOutlined,
	CloseCircleFilled,
	UserOutlined,
} from "@ant-design/icons";
import EmojiPicker from "emoji-picker-react";
import {
	ref as dbRef,
	onValue,
	push,
	serverTimestamp,
	set,
} from "firebase/database";
import {
	getStorage,
	ref as storageRef,
	uploadBytes,
	getDownloadURL,
} from "firebase/storage";

import db from "./Firebase";
import { GetUserChatList } from "../../services/Api/ChatApi";
import { BASE_URL_IMAGE } from "../../services/Host";
import { useNavigate } from "react-router-dom";
const storage = getStorage();
const { TextArea } = Input;

const ChatUI = () => {
	const navigate = useNavigate();
	const messagesEndRef = useRef(null);

	const [chatListData, setChatListData] = useState([]);
	const [selectedChat, setSelectedChat] = useState(null);
	const [messages, setMessages] = useState([]);
	const [newMessage, setNewMessage] = useState("");
	const [selectedImages, setSelectedImages] = useState([]);
	const [sending, setSending] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [uploadingImages, setUploadingImages] = useState(false);

	const adminId = localStorage.getItem("adminId");

	useEffect(() => {
		getUserChatList();
	}, []);

	useEffect(() => {
		if (selectedChat?.id) {
			fetchMessagesLive(selectedChat.id);
		}
	}, [selectedChat]);

	const getUserChatList = async () => {
		try {
			const token = localStorage.getItem("adminToken");
			const res = await GetUserChatList(token, "user");
			setChatListData(res.data.data);
		} catch (err) {
			console.error("Chat list fetch error", err);
		}
	};

	const fetchMessagesLive = (userId) => {
		const chatPath = `USER_ADMIN_CHAT/messages/ADMIN_${adminId}/USER_${userId}`;
		const messagesRef = dbRef(db, chatPath);
		onValue(messagesRef, (snapshot) => {
			const data = snapshot.val() || {};
			const parsed = Object.entries(data).map(([id, msg]) => ({ id, ...msg }));
			setMessages(parsed);
		});
	};
	const handleBeforeUpload = (file) => {
		if (!file || !file.name) {
			console.error("Invalid file:", file);
			return Upload.LIST_IGNORE; // skip if invalid
		}

		setSelectedImages((prev) => [...prev, file]);

		// Refocus TextArea after delay
		setTimeout(() => {
			document.getElementById("chat-message-textarea")?.focus();
		}, 0);

		return false; // Prevent default upload behavior
	};

	const removeImage = (index) => {
		setSelectedImages((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSend = async () => {
		console.log("hello image function calling");
		if (!newMessage.trim() && selectedImages.length === 0) return;
		if (!adminId || !selectedChat?.id) return;
		console.log(selectedImages.length, adminId, selectedChat?.id, "data");

		setSending(true);
		setUploadingImages(true);

		try {
			const uploadedUrls = [];
			console.log("helo");
			// Upload all selected images to Firebase Storage
			for (const file of selectedImages) {
				console.log(file, "file");
				if (!file || !file.name) {
					console.error("Skipping invalid file:", file);
					continue;
				}

				const imagePath = `one_to_one_uploads/${adminId}/${Date.now()}_${
					file.name
				}`;
				console.log("Uploading to path:", imagePath);

				const imageRef = storageRef(storage, imagePath);
				console.log(imageRef, "imageRef");
				await uploadBytes(imageRef, file);
				console.log(uploadBytes, "uploadBytes");
				console.log(imageRef, file, "imageRef, file");

				const downloadURL = await getDownloadURL(imageRef);
				console.log(downloadURL, "downloadURL");
				uploadedUrls.push(downloadURL);
				console.log(uploadedUrls, "uploadedUrls");
			}

			// Construct chat message
			const senderPath = `USER_ADMIN_CHAT/messages/ADMIN_${adminId}/USER_${selectedChat.id}`;
			const receiverPath = `USER_ADMIN_CHAT/messages/USER_${selectedChat.id}/ADMIN_${adminId}`;

			const baseMessage = {
				message:
					newMessage.trim() || (uploadedUrls.length > 0 ? "📷 Photo" : ""),
				imageUrls: uploadedUrls,
				timestamp: Date.now(),
				read: true,
				source: "SENDER",
			};

			const receiverMessage = {
				...baseMessage,
				read: false,
				source: "RECEIVER",
			};

			// Save messages in both sender and receiver nodes
			await Promise.all([
				set(push(dbRef(db, senderPath)), baseMessage),
				set(push(dbRef(db, receiverPath)), receiverMessage),
			]);

			// Clear input
			setNewMessage("");
			setSelectedImages([]);
		} catch (err) {
			console.error("Firebase send error:", err);
			message.error("Send failed");
		} finally {
			setSending(false);
			setUploadingImages(false);
		}
	};

	const formatTime = (timestamp) => {
		if (!timestamp) return "";
		const date = new Date(timestamp);
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	};

	const getInitials = (name) => {
		if (!name) return "U";
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase();
	};

	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	return (
		<div
			style={{
				display: "flex",
				height: "100vh",
				gap: 20,
				padding: 20,
				background: "#f0f2f5",
			}}
		>
			{/* Left Panel */}
			<div
				style={{
					width: "30%",
					background: "#fff",
					padding: 16,
					borderRadius: 8,
					border: "1px solid #ddd",
					overflowY: "auto",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 20,
					}}
				>
					<h2 style={{ fontSize: 18, fontWeight: 600 }}>Chats</h2>
					<Button onClick={() => navigate("/")} style={{ fontWeight: 500 }}>
						← Back
					</Button>
				</div>

				{chatListData.length === 0 ? (
					<Spin />
				) : (
					chatListData.map((chat) => (
						<Card
							key={chat.id}
							style={{
								cursor: "pointer",
								backgroundColor:
									selectedChat?.id === chat.id ? "#e6f7ff" : "#fff",
								borderColor:
									selectedChat?.id === chat.id ? "#1890ff" : "#f0f0f0",
								marginBottom: 10,
							}}
							onClick={() => setSelectedChat(chat)}
							bodyStyle={{ padding: 12 }}
						>
							<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
								<Avatar
									src={
										chat.user_attachments?.[0]?.file_name
											? `${BASE_URL_IMAGE}${chat.user_attachments[0].file_name}`
											: undefined
									}
									icon={<UserOutlined />}
								/>
								<div>
									<div style={{ fontWeight: 500 }}>
										{chat.user_profile?.name}
									</div>
									<div style={{ fontSize: 12, color: "#888" }}>
										{chat.displayMessage}
									</div>
								</div>
							</div>
						</Card>
					))
				)}
			</div>

			{/* Right Panel */}
			<div
				style={{
					width: "70%",
					background: "#fff",
					borderRadius: 8,
					border: "1px solid #ddd",
					display: "flex",
					flexDirection: "column",
				}}
			>
				{!selectedChat ? (
					<div
						style={{
							flex: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: "#888",
							fontSize: "1.2rem",
							fontWeight: 500,
						}}
					>
						Select a user to start chatting.
					</div>
				) : (
					<>
						{/* Header */}
						<div
							style={{
								padding: "16px 20px",
								borderBottom: "1px solid #eee",
								display: "flex",
								alignItems: "center",
								position: "sticky",
								top: 0,
								backgroundColor: "#fff",
								zIndex: 10,
							}}
						>
							<Avatar
								size={40}
								src={
									selectedChat.user_attachments?.[0]?.file_name
										? `${BASE_URL_IMAGE}${selectedChat.user_attachments[0].file_name}`
										: undefined
								}
								icon={<UserOutlined />}
								style={{ marginRight: 12 }}
							/>
							<span style={{ fontWeight: 600, fontSize: 18 }}>
								{selectedChat.user_profile?.name}
							</span>
						</div>

						{/* Message Area */}
						<div
							style={{
								flex: 1,
								overflowY: "auto",
								padding: "20px",
								background: "#fafafa",
							}}
							// ref={messagesEndRef}
						>
							{messages.map((msg) => {
								const isSender = msg.source === "SENDER"; // <- USE THIS!
								return (
									<div
										key={msg.id}
										style={{
											display: "flex",
											justifyContent: isSender ? "flex-end" : "flex-start",
											marginBottom: 16,
										}}
									>
										<div
											style={{
												background: isSender ? "#DCF8C6" : "#fff",
												border: "1px solid #eee",
												padding: "10px 14px",
												borderRadius: 12,
												maxWidth: "70%",
												boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
											}}
										>
											{/* ✅ Render all images if available */}
											{Array.isArray(msg.imageUrls) &&
												msg.imageUrls.map((url, idx) => (
													<img
														key={idx}
														src={url}
														alt={`chat-img-${idx}`}
														style={{
															maxWidth: 200,
															borderRadius: 8,
															marginBottom: 6,
															display: "block",
														}}
													/>
												))}

											{/* ✅ Render message text */}
											<div style={{ fontSize: 14 }}>{msg.message}</div>
											<div
												style={{
													fontSize: 10,
													textAlign: "right",
													color: "#999",
													marginTop: 6,
												}}
											>
												{formatTime(msg.timestamp)}
											</div>
										</div>
									</div>
								);
							})}
							<div ref={messagesEndRef} />
						</div>

						{/* Input Area */}
						<div style={{ display: "flex", gap: 8, padding: "10px" }}>
							<Upload
								multiple
								accept="image/*"
								showUploadList={false}
								beforeUpload={handleBeforeUpload}
							>
								<Tooltip title="Attach Images">
									<Button
										icon={<PlusOutlined />}
										style={{
											width: 30,
											height: 30,
											borderRadius: "50%",
											padding: 0,
											background: "rgb(240, 240, 240)",
											border: "none",
										}}
									/>
								</Tooltip>
							</Upload>

							<Tooltip title="Add Emoji">
								<Button
									icon={<SmileOutlined />}
									style={{
										width: 30,
										height: 30,
										borderRadius: "50%",
										padding: 0,
										background: "rgb(240, 240, 240)",
										border: "none",
										alignSelf: "center",
									}}
									onClick={() => setShowEmojiPicker(!showEmojiPicker)}
								/>
							</Tooltip>

							{/* Right-side input and preview */}
							<div
								style={{
									flex: 1,
									display: "flex",
									flexDirection: "column",
									border: "1px solid #d9d9d9",
									borderRadius: 8,
									padding: 8,
									backgroundColor: "#fff",
								}}
							>
								{/* Image preview shown ABOVE TextArea */}
								{selectedImages.length > 0 && (
									<div
										style={{
											display: "flex",
											flexWrap: "wrap",
											gap: 10,
											marginBottom: 10,
										}}
									>
										{selectedImages.map((file, index) => (
											<div
												key={`${file.name}_${index}`}
												style={{ position: "relative" }}
											>
												<img
													src={URL.createObjectURL(file)}
													alt="preview"
													style={{
														width: 60,
														height: 60,
														objectFit: "cover",
														borderRadius: 6,
														border: "1px solid #ccc",
													}}
												/>
												<CloseCircleFilled
													onClick={() => removeImage(index)}
													style={{
														position: "absolute",
														top: -6,
														right: -6,
														color: "#ff4d4f",
														cursor: "pointer",
														fontSize: 14,
														background: "#fff",
														borderRadius: "50%",
													}}
												/>
											</div>
										))}
									</div>
								)}

								{/* Textarea */}
								<TextArea
									id="chat-message-textarea"
									rows={selectedImages.length > 0 ? 4 : 2}
									placeholder="Type a message"
									value={newMessage}
									onChange={(e) => setNewMessage(e.target.value)}
									onPressEnter={async (e) => {
										if (!e.shiftKey) {
											e.preventDefault();
											if (newMessage.trim() || selectedImages.length > 0) {
												await handleSend();
											}
										}
									}}
									bordered={false} // ❗️ This removes the border
									style={{
										resize: "none",
										boxShadow: "none", // ❗️ Removes the inner box shadow
										outline: "none", // ❗️ Removes focus outline
									}}
								/>

								{/* Emoji Picker */}
								{showEmojiPicker && (
									<div
										style={{
											position: "absolute",
											bottom: "100%",
											left: 0,
											zIndex: 10,
										}}
									>
										<EmojiPicker
											onEmojiClick={(emojiData) => {
												setNewMessage((prev) => prev + emojiData.emoji);
												setShowEmojiPicker(false);
												setTimeout(() => {
													document
														.getElementById("chat-message-textarea")
														?.focus();
												}, 0);
											}}
											theme="light"
										/>
									</div>
								)}
							</div>

							<Button
								style={{
									alignSelf: "center",
									backgroundColor: "#f0f0f0",
									color: "#333",
									border: "none",
									borderRadius: 6,
									padding: "6px 16px",
								}}
								type="primary"
								onClick={handleSend}
								loading={sending}
								disabled={
									selectedImages.length === 0 && !newMessage.trim()
									// uploadingImages
								}
							>
								Send
							</Button>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default ChatUI;
