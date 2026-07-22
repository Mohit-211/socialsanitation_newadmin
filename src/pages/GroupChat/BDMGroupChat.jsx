/** @format */

import React, { useEffect, useRef, useState } from "react";
import {
	Card,
	Typography,
	Spin,
	Input,
	Button,
	Divider,
	Avatar,
	message,
	Modal,
	Tooltip,
	Upload,
	Image,
} from "antd";
import "./Groupchat.css";
import {
	DeleteGroup,
	GetGroupParticipants,
	MyGroups,
	UpdateGroupName,
} from "../../services/Api/GroupChatApi";
import {
	ref as dbRef,
	onValue,
	query,
	orderByChild,
	push,
	serverTimestamp,
	get,
} from "firebase/database";
import db from "../Chat/Firebase";
import {
	CloseCircleFilled,
	EditOutlined,
	PlusOutlined,
	UploadOutlined,
	UserOutlined,
} from "@ant-design/icons";
import { GetAdminProfile } from "../../services/Api/Api";
import { useNavigate } from "react-router";
import { InfoCircleOutlined } from "@ant-design/icons";
import EmojiPicker from "emoji-picker-react";
import { SmileOutlined } from "@ant-design/icons";

import {
	getStorage,
	ref as storageRef,
	uploadBytes,
	getDownloadURL,
} from "firebase/storage";
const storage = getStorage();

const { Text } = Typography;
const { TextArea } = Input;

const BDMGroupChat = () => {
	const navigate = useNavigate();
	const [groups, setGroups] = useState([]);
	const [selectedGroup, setSelectedGroup] = useState(null);
	const [messages, setMessages] = useState([]);
	const [loadingGroups, setLoadingGroups] = useState(true);
	const [newMessage, setNewMessage] = useState("");
	const [sending, setSending] = useState(false);
	const [userData, setUserData] = useState(null);
	const [isEditingGroupName, setIsEditingGroupName] = useState(false);
	const [editedGroupName, setEditedGroupName] = useState("");
	const [isGroupInfoVisible, setIsGroupInfoVisible] = useState(false);
	const [groupParticipants, setGroupParticipants] = useState([]);
	const [groupCreatedAt, setGroupCreatedAt] = useState(null);
	const [selectedImages, setSelectedImages] = useState([]);
	const [uploadingImages, setUploadingImages] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);

	const messagesEndRef = useRef(null);

	const token = localStorage.getItem("adminToken");
	const roleId = localStorage.getItem("roleId");
	useEffect(() => {
		const token = localStorage.getItem("adminToken");

		const fetchProfileAndGroups = async () => {
			try {
				const result = await GetAdminProfile(token);
				setUserData(result.data?.data); // adjust based on your API response
				fetchGroups();
			} catch (error) {
				console.error("Failed to fetch admin profile:", error);
			}
		};

		fetchProfileAndGroups();
	}, []);

	useEffect(() => {
		fetchGroups();
	}, []);

	const handleBeforeUpload = (file, fileList) => {
		setSelectedImages((prev) => [...prev, ...fileList]);

		// Wait a tick, then focus the text area
		setTimeout(() => {
			document.getElementById("chat-message-textarea")?.focus();
		}, 0);

		return false; // Prevent auto upload
	};

	const removeImage = (index) => {
		setSelectedImages((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSend = async () => {
		if (!newMessage.trim() && selectedImages.length === 0) return;

		setSending(true);
		setUploadingImages(true);

		try {
			// Upload all images first
			const uploadedUrls = [];

			for (const file of selectedImages) {
				const imagePath = `group_uploads/${
					selectedGroup.groupId
				}/${Date.now()}_${file.name}`;
				const imageRef = storageRef(storage, imagePath);
				await uploadBytes(imageRef, file);
				const downloadURL = await getDownloadURL(imageRef);
				uploadedUrls.push(downloadURL);
			}

			// Send a single message per image or bundle them
			for (const url of uploadedUrls) {
				await push(dbRef(db, `GroupChats/${selectedGroup.groupId}/messages`), {
					sender:
						roleId === "1" ? `admin_${userData.id}` : `bdm_${userData.id}`,

					sender_name: userData.name,
					message: "📷 Photo",
					image_url: url,
					timestamp: serverTimestamp(),
				});
			}

			// Send text message if available
			if (newMessage.trim()) {
				await push(dbRef(db, `GroupChats/${selectedGroup.groupId}/messages`), {
					sender:
						roleId === "1" ? `admin_${userData.id}` : `bdm_${userData.id}`,

					sender_name: userData.name,
					message: newMessage.trim(),
					timestamp: serverTimestamp(),
				});
			}

			// Clear after send
			setSelectedImages([]);
			setNewMessage("");
		} catch (err) {
			console.error("Send error:", err);
			message.error("Failed to send message or image.");
		} finally {
			setSending(false);
			setUploadingImages(false);
		}
	};

	const fetchGroups = async () => {
		try {
			const res = await MyGroups(token);
			const groupsFromApi = res.data?.data?.groups || [];

			const enrichedGroups = await Promise.all(
				groupsFromApi.map(async (group) => {
					const messagesSnap = await get(
						dbRef(db, `GroupChats/${group.groupId}/messages`)
					);
					const messagesData = messagesSnap.val() || {};
					const messagesList = Object.values(messagesData);

					const sortedMessages = messagesList.sort(
						(a, b) => (a.timestamp || 0) - (b.timestamp || 0)
					);
					const lastMsg = sortedMessages[sortedMessages.length - 1];

					return {
						...group,
						last_message: lastMsg?.message || "",
						last_message_time: lastMsg?.timestamp || null,
					};
				})
			);

			setGroups(enrichedGroups);
		} catch (error) {
			console.error("Failed to fetch groups:", error);
		} finally {
			setLoadingGroups(false);
		}
	};

	const fetchMessagesLive = (groupId) => {
		const messageRef = query(
			dbRef(db, `GroupChats/${groupId}/messages`),
			orderByChild("timestamp")
		);
		onValue(messageRef, (snapshot) => {
			const data = snapshot.val() || {};
			const parsed = Object.entries(data).map(([id, msg]) => ({
				id,
				...msg,
			}));
			setMessages(parsed);
		});
	};

	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	const handleGroupClick = (group) => {
		setSelectedGroup(group);
		fetchMessagesLive(group.groupId);
	};

	const handleUpdateGroupName = async () => {
		try {
			const payload = {
				groupId: selectedGroup.groupId,
				newName: editedGroupName.trim(),
			};

			const res = await UpdateGroupName(token, payload);

			if (res.status === 200) {
				message.success("Group name updated successfully");
				setIsEditingGroupName(false);

				// Update local UI
				setSelectedGroup((prev) => ({
					...prev,
					name: editedGroupName.trim(),
				}));

				fetchGroups(); // Refresh group list
			} else {
				message.error("Failed to update group name");
			}
		} catch (error) {
			console.error("Failed to update group name:", error);
			message.error("An error occurred while updating group name");
		}
	};

	const fetchGroupDetails = async (groupId) => {
		try {
			const groupRef = dbRef(db, `GroupChats/${groupId}`);
			const snapshot = await get(groupRef);
			const groupData = snapshot.val();

			setGroupCreatedAt(groupData?.created_at);

			// Fetch participant names/roles via API
			const res = await GetGroupParticipants(groupId);
			setGroupParticipants(res?.data?.data || []);
			console.log(res?.data?.data, "GROUP");
			setIsGroupInfoVisible(true);
		} catch (err) {
			console.error("Failed to fetch group info", err);
		}
	};

	const handleDeleteGroup = async (groupId) => {
		if (!groupId) return;

		try {
			const res = await DeleteGroup(token, groupId);

			if (res.status === 200) {
				message.success("Group deleted successfully");
				setIsGroupInfoVisible(false);
				setSelectedGroup(null); // clear chat view
				await fetchGroups(); // refresh group list
			} else {
				message.error("Failed to delete group");
			}
		} catch (err) {
			console.error("Error deleting group:", err);
			message.error("An error occurred while deleting the group");
		}
	};

	return (
		<div
			style={{
				display: "flex",
				height: "100vh",
				padding: 20,
				gap: 20,
				background: "#f0f2f5",
			}}
		>
			{/* Left Panel: Groups */}
			<div
				style={{
					width: "30%",
					background: "#fff",
					border: "1px solid #ddd",
					borderRadius: 8,
					padding: 16,
					overflowY: "auto",
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						justifyContent: "space-between",
					}}
				>
					<h2 style={{ fontSize: 18, fontWeight: "600", marginBottom: 20 }}>
						Chats
					</h2>
					<div>
						<Button
							onClick={() => navigate("/")}
							style={{
								backgroundColor: "#d9d9d9",
								border: "none",
								borderRadius: 6,
								padding: "4px 12px",
								fontWeight: 500,
							}}
						>
							← Back to Dashboard
						</Button>
					</div>
				</div>
				{loadingGroups ? (
					<Spin />
				) : (
					<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
						{groups.map((group) => (
							<Card
								key={group.groupId}
								style={{
									cursor: "pointer",
									borderColor:
										selectedGroup?.groupId === group.groupId
											? "#1890ff"
											: "#f0f0f0",
									backgroundColor:
										selectedGroup?.groupId === group.groupId
											? "#e6f7ff"
											: "#fff",
								}}
								onClick={() => handleGroupClick(group)}
								bodyStyle={{ padding: 12 }}
							>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
									}}
								>
									<div
										style={{ display: "flex", alignItems: "center", gap: 10 }}
									>
										<Avatar
											style={{ backgroundColor: "#87d068" }}
											icon={<UserOutlined />}
										/>
										<div>
											<Text strong>{group.name}</Text>
											<p
												style={{
													fontSize: 12,
													color: "#888",
													marginBottom: 0,
													marginTop: 4,
													maxWidth: 150,
													whiteSpace: "nowrap",
													overflow: "hidden",
													textOverflow: "ellipsis",
												}}
											>
												{group.last_message || "No messages yet."}
											</p>
										</div>
									</div>
									{group.last_message_time && (
										<Text style={{ fontSize: 12, color: "#999" }}>
											{new Date(group.last_message_time).toLocaleTimeString(
												[],
												{
													hour: "2-digit",
													minute: "2-digit",
												}
											)}
										</Text>
									)}
								</div>
							</Card>
						))}
					</div>
				)}
			</div>

			{/* Right Panel: Chat */}
			<div
				style={{
					width: "70%",
					background: "#fff",
					borderRadius: 8,
					padding: 20,
					display: "flex",
					flexDirection: "column",
					border: "1px solid #ddd",
				}}
			>
				{!selectedGroup ? (
					<div
						style={{
							flex: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: "#999",
						}}
					>
						<p>Select a group to start chatting.</p>
					</div>
				) : (
					<>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								marginBottom: 16,
							}}
						>
							{isEditingGroupName ? (
								<>
									<Input
										style={{ maxWidth: 300, marginRight: 8 }}
										value={editedGroupName}
										onChange={(e) => setEditedGroupName(e.target.value)}
										onPressEnter={async () => {
											await handleUpdateGroupName();
										}}
									/>
									<Button
										type="primary"
										size="small"
										onClick={handleUpdateGroupName}
										disabled={!editedGroupName.trim()}
									>
										Save
									</Button>
									<Button
										style={{ marginLeft: 6 }}
										size="small"
										onClick={() => setIsEditingGroupName(false)}
									>
										Cancel
									</Button>
								</>
							) : (
								<>
									<div
										style={{
											display: "flex",
											flexDirection: "row",
											justifyContent: "space-between",
											width: "100%",
										}}
									>
										<div
											style={{
												display: "flex",
												flexDirection: "row",
												justifyContent: "space-between",
											}}
										>
											<h2
												style={{ fontSize: 16, fontWeight: "600", margin: 0 }}
											>
												{selectedGroup?.name}
											</h2>
											<EditOutlined
												style={{
													marginLeft: 10,
													cursor: "pointer",
													color: "#1890ff",
												}}
												onClick={() => {
													setEditedGroupName(selectedGroup?.name);
													setIsEditingGroupName(true);
												}}
											/>
										</div>
										<div>
											<Tooltip title="Group Info">
												<InfoCircleOutlined
													style={{
														marginLeft: 10,
														cursor: "pointer",
														color: "#1890ff",
													}}
													onClick={() =>
														fetchGroupDetails(selectedGroup?.groupId)
													}
												/>
											</Tooltip>
										</div>
									</div>
								</>
							)}
						</div>

						<Divider style={{ margin: "0 0 16px 0" }} />
						<div
							style={{
								flex: 1,
								overflowY: "auto",
								paddingRight: 10,
								marginBottom: 16,
								display: "flex",
								flexDirection: "column",
								gap: 12,
							}}
						>
							{messages.length === 0 ? (
								<p style={{ textAlign: "center", color: "#aaa" }}>
									No messages yet.
								</p>
							) : (
								messages.map((msg) => {
									const expectedSenderKey =
										userData?.role_id === 1
											? `admin_${userData.id}`
											: `bdm_${userData.id}`;

									const isSender = msg.sender === expectedSenderKey;

									const bubbleStyles = {
										alignSelf: isSender ? "flex-end" : "flex-start",
										backgroundColor: isSender ? "#DCF8C6" : "#f1f0f0",
										padding: "10px 14px",
										borderRadius: 16,
										borderTopLeftRadius: isSender ? 16 : 4,
										borderTopRightRadius: isSender ? 4 : 16,
										maxWidth: "70%",
										display: "flex",
										flexDirection: "column",
									};

									return (
										<div
											key={msg.id}
											style={{
												display: "flex",
												flexDirection: isSender ? "row-reverse" : "row",
												gap: 10,
												alignItems: "flex-end",
											}}
										>
											{!isSender && (
												<Avatar
													size="small"
													style={{ backgroundColor: "#ccc" }}
												>
													{(msg.sender_name || "U")[0].toUpperCase()}
												</Avatar>
											)}

											<div style={bubbleStyles}>
												<Text style={{ fontWeight: 500, marginBottom: 4 }}>
													{msg.sender_name || msg.sender}
												</Text>
												{/* 🔍 If there's an image, show it */}
												{msg.image_url && (
													<img
														src={msg.image_url}
														alt="Uploaded"
														style={{
															maxWidth: 200,
															borderRadius: 8,
															marginBottom: 8,
														}}
													/>
												)}

												{/* Text message fallback */}
												{msg.message && <Text>{msg.message}</Text>}

												{/* <Text>{msg.message}</Text> */}
												<Text
													type="secondary"
													style={{
														fontSize: 10,
														marginTop: 4,
														textAlign: "right",
													}}
												>
													{msg.timestamp
														? new Date(msg.timestamp).toLocaleTimeString([], {
																hour: "2-digit",
																minute: "2-digit",
														  })
														: "Sending..."}
												</Text>
											</div>
										</div>
									);
								})
							)}

							{/* ✅ Invisible anchor for scrolling */}
							<div ref={messagesEndRef} />
						</div>

						<div style={{ display: "flex", gap: 8 }}>
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

							{/* TextArea with emoji picker below */}
							<div style={{ position: "relative", flex: 1 }}>
								<TextArea
									id="chat-message-textarea"
									rows={selectedImages.length > 0 ? 6 : 2}
									placeholder="Type a message"
									value={newMessage}
									onChange={(e) => setNewMessage(e.target.value)}
									onPressEnter={(e) => {
										if (!e.shiftKey) {
											e.preventDefault();
											if (newMessage.trim() || selectedImages.length > 0) {
												handleSend();
											}
										}
									}}
								/>

								{/* Emoji Picker */}
								{showEmojiPicker && (
									<div
										style={{
											position: "absolute",
											bottom: 50,
											left: 0,
											zIndex: 10,
										}}
									>
										<EmojiPicker
											onEmojiClick={(emojiData) => {
												setNewMessage((prev) => prev + emojiData.emoji);
												setShowEmojiPicker(false);
												// ✅ Refocus the TextArea
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

								{/* Image preview stays the same */}
								{selectedImages.length > 0 && (
									<div
										style={{
											position: "absolute",
											top: "50%",
											left: 12,
											transform: "translateY(-50%)",
											background: "rgba(255, 255, 255, 0.95)",
											padding: "8px 12px",
											borderRadius: 8,
											boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
											display: "flex",
											gap: 8,
											flexWrap: "wrap",
											zIndex: 2,
											maxWidth: "calc(100% - 40px)",
										}}
									>
										{selectedImages.map((file, index) => (
											<div
												key={`${file.name}_${index}`}
												style={{
													position: "relative",
													display: "inline-block",
												}}
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
									(selectedImages.length === 0 && !newMessage.trim()) ||
									uploadingImages
								}
							>
								Send
							</Button>
						</div>
					</>
				)}
			</div>

			<Modal
				title="Group Info"
				open={isGroupInfoVisible}
				onCancel={() => setIsGroupInfoVisible(false)}
				footer={[
					<Button
						key="delete"
						danger
						onClick={() => handleDeleteGroup(selectedGroup?.groupId)}
					>
						Delete Group
					</Button>,
					<Button key="close" onClick={() => setIsGroupInfoVisible(false)}>
						Close
					</Button>,
				]}
			>
				<p style={{ marginBottom: 8 }}>
					<strong>Group Name:</strong> {selectedGroup?.name}
				</p>
				<p style={{ marginBottom: 16 }}>
					<strong>Created At:</strong>{" "}
					{groupCreatedAt ? new Date(groupCreatedAt).toLocaleString() : "N/A"}
				</p>

				<Divider style={{ margin: "12px 0" }} />

				<h4 style={{ marginBottom: 12 }}>Participants</h4>
				<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
					{groupParticipants.map((p) => (
						<div
							key={p.key}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 12,
								padding: "8px 12px",
								border: "1px solid #f0f0f0",
								borderRadius: 6,
								background: "#fafafa",
							}}
						>
							<Avatar
								style={{
									backgroundColor: "#1890ff",
									verticalAlign: "middle",
								}}
							>
								{(p.name || "U")[0].toUpperCase()}
							</Avatar>
							<div>
								<div style={{ fontWeight: 500 }}>{p.name}</div>
								<div style={{ fontSize: 12, color: "#888" }}>{p.role}</div>
							</div>
						</div>
					))}
				</div>
			</Modal>
		</div>
	);
};

export default BDMGroupChat;
