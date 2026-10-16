import { useEffect, useMemo, useRef, useState } from "react";
import {
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
	Empty,
} from "antd";
import {
	ArrowLeftOutlined,
	CloseCircleFilled,
	EditOutlined,
	FilePdfOutlined,
	InfoCircleOutlined,
	PaperClipOutlined,
	SendOutlined,
	SmileOutlined,
	TeamOutlined,
} from "@ant-design/icons";
import {
	ref as dbRef,
	onValue,
	query,
	orderByChild,
	push,
	serverTimestamp,
	get,
} from "firebase/database";
import {
	getStorage,
	ref as storageRef,
	uploadBytes,
	getDownloadURL,
} from "firebase/storage";
import { useNavigate } from "react-router";
import EmojiPicker from "emoji-picker-react";
import {
	DeleteGroup,
	GetGroupParticipants,
	MyGroups,
	UpdateGroupName,
} from "../../services/Api/GroupChatApi";
import { GetAdminProfile } from "../../services/Api/Api";
import db from "../Chat/Firebase";
import "./GroupChat.scss";

const storage = getStorage();
const { Text } = Typography;
const { TextArea } = Input;

const TEXTAREA_ID = "chat-message-textarea";
const ACCEPTED_TYPES = "image/*,video/*,application/pdf";
const MAX_FILE_SIZE_MB = { image: 10, video: 50, pdf: 20 };
const PLACEHOLDER = { image: "📷 Photo", video: "🎬 Video" };

const formatTime = (timestamp) =>
	new Date(timestamp).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});

const formatFileSize = (bytes) => {
	if (!bytes) return "";
	if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const initial = (name) => (name || "U")[0].toUpperCase();

const getFileKind = (file) => {
	if (file.type.startsWith("image/")) return "image";
	if (file.type.startsWith("video/")) return "video";
	if (file.type === "application/pdf") return "pdf";
	return null;
};

const isAllowedFile = (file) => {
	const kind = getFileKind(file);
	return Boolean(kind) && file.size / (1024 * 1024) <= MAX_FILE_SIZE_MB[kind];
};

const focusTextArea = () =>
	setTimeout(() => document.getElementById(TEXTAREA_ID)?.focus(), 0);

const BDMGroupChat = () => {
	const navigate = useNavigate();
	const [groups, setGroups] = useState([]);
	const [loadingGroups, setLoadingGroups] = useState(true);
	const [selectedGroup, setSelectedGroup] = useState(null);
	const [messages, setMessages] = useState([]);
	const [newMessage, setNewMessage] = useState("");
	const [sending, setSending] = useState(false);
	const [userData, setUserData] = useState(null);
	const [isEditingGroupName, setIsEditingGroupName] = useState(false);
	const [editedGroupName, setEditedGroupName] = useState("");
	const [isGroupInfoVisible, setIsGroupInfoVisible] = useState(false);
	const [groupParticipants, setGroupParticipants] = useState([]);
	const [groupCreatedAt, setGroupCreatedAt] = useState(null);
	const [selectedFiles, setSelectedFiles] = useState([]);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);

	const messagesRef = useRef(null);

	const token = localStorage.getItem("adminToken");
	const roleId = localStorage.getItem("roleId");
	const groupId = selectedGroup?.groupId;
	const senderKey = userData
		? `${roleId === "1" ? "admin" : "bdm"}_${userData.id}`
		: null;

	const fetchGroups = async () => {
		try {
			const res = await MyGroups(token);
			const groupsFromApi = res.data?.data?.groups || [];

			const enrichedGroups = await Promise.all(
				groupsFromApi.map(async (group) => {
					const snap = await get(
						dbRef(db, `GroupChats/${group.groupId}/messages`)
					);
					const lastMsg = Object.values(snap.val() || {}).sort(
						(a, b) => (a.timestamp || 0) - (b.timestamp || 0)
					).at(-1);

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

	// Load profile and groups once.
	useEffect(() => {
		GetAdminProfile(token)
			.then((result) => setUserData(result.data?.data))
			.catch((error) => console.error("Failed to fetch admin profile:", error));
		// Async fetch: state is only set after the request resolves.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchGroups();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Live messages for the open group. The cleanup detaches the Firebase
	// listener when the group changes or the page unmounts — without it,
	// listeners pile up and keep firing after leaving the page.
	useEffect(() => {
		if (!groupId) return undefined;
		const messageQuery = query(
			dbRef(db, `GroupChats/${groupId}/messages`),
			orderByChild("timestamp")
		);
		const unsubscribe = onValue(messageQuery, (snapshot) => {
			const data = snapshot.val() || {};
			setMessages(Object.entries(data).map(([id, msg]) => ({ id, ...msg })));
		});
		return unsubscribe;
	}, [groupId]);

	// Scroll only the message pane (scrollIntoView would also scroll the page).
	useEffect(() => {
		const el = messagesRef.current;
		if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
	}, [messages]);

	// Preview URLs are created once per file list and released afterwards.
	const filePreviews = useMemo(
		() =>
			selectedFiles.map((file) => ({
				kind: getFileKind(file),
				name: file.name,
				url: URL.createObjectURL(file),
			})),
		[selectedFiles]
	);
	useEffect(
		() => () => filePreviews.forEach((preview) => URL.revokeObjectURL(preview.url)),
		[filePreviews]
	);

	const handleBeforeUpload = (file, fileList) => {
		// Called once per file; add the whole batch only on its first file.
		if (file === fileList[0]) {
			setSelectedFiles((prev) => [
				...prev,
				...fileList.filter(isAllowedFile),
			]);
			focusTextArea();
		}
		if (!isAllowedFile(file)) {
			const kind = getFileKind(file);
			message.error(
				kind
					? `${file.name} is larger than ${MAX_FILE_SIZE_MB[kind]} MB.`
					: `${file.name} is not a supported file type.`
			);
		}
		return false; // Prevent auto upload
	};

	const removeFile = (index) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const canSend = newMessage.trim() || selectedFiles.length > 0;

	const handleSend = async () => {
		if (!canSend || sending) return;

		setSending(true);
		const messagesPath = dbRef(db, `GroupChats/${groupId}/messages`);
		const base = { sender: senderKey, sender_name: userData.name };

		try {
			for (const file of selectedFiles) {
				const kind = getFileKind(file);
				const fileRef = storageRef(
					storage,
					`group_uploads/${groupId}/${Date.now()}_${file.name}`
				);
				await uploadBytes(fileRef, file, { contentType: file.type });
				const url = await getDownloadURL(fileRef);

				await push(messagesPath, {
					...base,
					type: kind,
					message:
						kind === "pdf" ? `📄 ${file.name}` : PLACEHOLDER[kind],
					file_url: url,
					file_name: file.name,
					file_size: file.size,
					// Kept for images so older consumers of image_url still work.
					...(kind === "image" && { image_url: url }),
					timestamp: serverTimestamp(),
				});
			}

			if (newMessage.trim()) {
				await push(messagesPath, {
					...base,
					message: newMessage.trim(),
					timestamp: serverTimestamp(),
				});
			}

			setSelectedFiles([]);
			setNewMessage("");
		} catch (err) {
			console.error("Send error:", err);
			message.error("Failed to send message or file.");
		} finally {
			setSending(false);
		}
	};

	const handleGroupClick = (group) => {
		if (group.groupId !== groupId) {
			setMessages([]);
			setIsEditingGroupName(false);
			setShowEmojiPicker(false);
		}
		setSelectedGroup(group);
	};

	const handleUpdateGroupName = async () => {
		const newName = editedGroupName.trim();
		if (!newName) return;

		try {
			const res = await UpdateGroupName(token, { groupId, newName });

			if (res.status === 200) {
				message.success("Group name updated successfully");
				setIsEditingGroupName(false);
				setSelectedGroup((prev) => ({ ...prev, name: newName }));
				fetchGroups();
			} else {
				message.error("Failed to update group name");
			}
		} catch (error) {
			console.error("Failed to update group name:", error);
			message.error("An error occurred while updating group name");
		}
	};

	const fetchGroupDetails = async () => {
		try {
			const snapshot = await get(dbRef(db, `GroupChats/${groupId}`));
			setGroupCreatedAt(snapshot.val()?.created_at);

			const res = await GetGroupParticipants(groupId);
			setGroupParticipants(res?.data?.data || []);
			setIsGroupInfoVisible(true);
		} catch (err) {
			console.error("Failed to fetch group info", err);
		}
	};

	const handleDeleteGroup = async () => {
		if (!groupId) return;

		try {
			const res = await DeleteGroup(token, groupId);

			if (res.status === 200) {
				message.success("Group deleted successfully");
				setIsGroupInfoVisible(false);
				setSelectedGroup(null);
				await fetchGroups();
			} else {
				message.error("Failed to delete group");
			}
		} catch (err) {
			console.error("Error deleting group:", err);
			message.error("An error occurred while deleting the group");
		}
	};

	// Resolves a message to its attachment, if any. Messages sent before
	// this update only carry image_url, so they fall back to type "image".
	const renderAttachment = (msg) => {
		const url = msg.file_url || msg.image_url;
		if (!url) return null;

		const type = msg.type || "image";

		if (type === "video") {
			return (
				<video
					className="group-chat__video"
					src={url}
					controls
					preload="metadata"
				/>
			);
		}

		if (type === "pdf") {
			return (
				<a
					className="group-chat__file"
					href={url}
					target="_blank"
					rel="noreferrer"
				>
					<span className="group-chat__file-icon">
						<FilePdfOutlined />
					</span>
					<span className="group-chat__file-info">
						<span className="group-chat__file-name">
							{msg.file_name || "Document.pdf"}
						</span>
						<span className="group-chat__file-meta">
							PDF{msg.file_size ? ` · ${formatFileSize(msg.file_size)}` : ""}
						</span>
					</span>
				</a>
			);
		}

		return (
			<a href={url} target="_blank" rel="noreferrer">
				<img className="group-chat__image" src={url} alt="Uploaded" />
			</a>
		);
	};

	const renderGroupList = () => {
		if (loadingGroups) {
			return (
				<div className="group-chat__center">
					<Spin />
				</div>
			);
		}
		if (groups.length === 0) {
			return (
				<div className="group-chat__center">
					<Empty description="No groups yet" />
				</div>
			);
		}
		return groups.map((group) => (
			<button
				type="button"
				key={group.groupId}
				className={`group-chat__item${
					group.groupId === groupId ? " group-chat__item--active" : ""
				}`}
				onClick={() => handleGroupClick(group)}
			>
				<Avatar className="group-chat__item-avatar" icon={<TeamOutlined />} />
				<div className="group-chat__item-body">
					<div className="group-chat__item-top">
						<span className="group-chat__item-name">{group.name}</span>
						{group.last_message_time && (
							<span className="group-chat__item-time">
								{formatTime(group.last_message_time)}
							</span>
						)}
					</div>
					<span className="group-chat__item-preview">
						{group.last_message || "No messages yet."}
					</span>
				</div>
			</button>
		));
	};

	const renderHeader = () => (
		<div className="group-chat__header">
			<Button
				className="chat-layout__back"
				type="text"
				aria-label="Back to chats"
				icon={<ArrowLeftOutlined />}
				onClick={() => setSelectedGroup(null)}
			/>
			<Avatar className="group-chat__item-avatar" icon={<TeamOutlined />} />

			{isEditingGroupName ? (
				<div className="group-chat__rename">
					<Input
						autoFocus
						value={editedGroupName}
						onChange={(e) => setEditedGroupName(e.target.value)}
						onPressEnter={handleUpdateGroupName}
					/>
					<Button
						type="primary"
						onClick={handleUpdateGroupName}
						disabled={!editedGroupName.trim()}
					>
						Save
					</Button>
					<Button onClick={() => setIsEditingGroupName(false)}>Cancel</Button>
				</div>
			) : (
				<>
					<h2 className="group-chat__title">{selectedGroup.name}</h2>
					<Tooltip title="Rename group">
						<Button
							type="text"
							icon={<EditOutlined />}
							onClick={() => {
								setEditedGroupName(selectedGroup.name);
								setIsEditingGroupName(true);
							}}
						/>
					</Tooltip>
					<Tooltip title="Group Info">
						<Button
							type="text"
							className="group-chat__header-end"
							icon={<InfoCircleOutlined />}
							onClick={fetchGroupDetails}
						/>
					</Tooltip>
				</>
			)}
		</div>
	);

	const renderMessages = () => (
		<div className="group-chat__messages" ref={messagesRef}>
			{messages.length === 0 ? (
				<div className="group-chat__center">
					<Text type="secondary">No messages yet.</Text>
				</div>
			) : (
				messages.map((msg) => {
					const isSender = msg.sender === senderKey;
					const attachment = renderAttachment(msg);
					return (
						<div
							key={msg.id}
							className={`group-chat__row${
								isSender ? " group-chat__row--mine" : ""
							}`}
						>
							{!isSender && (
								<Avatar size="small" className="group-chat__msg-avatar">
									{initial(msg.sender_name)}
								</Avatar>
							)}
							<div className="group-chat__bubble">
								{!isSender && (
									<span className="group-chat__sender">
										{msg.sender_name || msg.sender}
									</span>
								)}
								{attachment}
								{msg.message && !attachment && (
									<span className="group-chat__text">{msg.message}</span>
								)}
								<span className="group-chat__time">
									{msg.timestamp ? formatTime(msg.timestamp) : "Sending..."}
								</span>
							</div>
						</div>
					);
				})
			)}
		</div>
	);

	const renderComposer = () => (
		<div className="group-chat__composer">
			{selectedFiles.length > 0 && (
				<div className="group-chat__previews">
					{filePreviews.map((preview, index) => (
						<div key={preview.url} className="group-chat__preview">
							{preview.kind === "image" && (
								<img src={preview.url} alt="preview" />
							)}
							{preview.kind === "video" && (
								<video
									className="group-chat__preview-media"
									src={preview.url}
									muted
									preload="metadata"
								/>
							)}
							{preview.kind === "pdf" && (
								<div className="group-chat__preview-file">
									<FilePdfOutlined />
									<span className="group-chat__preview-name">
										{preview.name}
									</span>
								</div>
							)}
							<CloseCircleFilled
								className="group-chat__preview-remove"
								onClick={() => removeFile(index)}
							/>
						</div>
					))}
				</div>
			)}

			{showEmojiPicker && (
				<div className="group-chat__emoji">
					<EmojiPicker
						theme="light"
						onEmojiClick={(emojiData) => {
							setNewMessage((prev) => prev + emojiData.emoji);
							setShowEmojiPicker(false);
							focusTextArea();
						}}
					/>
				</div>
			)}

			<div className="group-chat__input-row">
				<Upload
					multiple
					accept={ACCEPTED_TYPES}
					showUploadList={false}
					beforeUpload={handleBeforeUpload}
				>
					<Tooltip title="Attach Images, Videos or PDFs">
						<Button shape="circle" type="text" icon={<PaperClipOutlined />} />
					</Tooltip>
				</Upload>
				<Tooltip title="Add Emoji">
					<Button
						shape="circle"
						type="text"
						icon={<SmileOutlined />}
						onClick={() => setShowEmojiPicker((open) => !open)}
					/>
				</Tooltip>

				<TextArea
					id={TEXTAREA_ID}
					className="group-chat__textarea"
					autoSize={{ minRows: 1, maxRows: 5 }}
					placeholder="Type a message"
					value={newMessage}
					onChange={(e) => setNewMessage(e.target.value)}
					onPressEnter={(e) => {
						if (!e.shiftKey) {
							e.preventDefault();
							handleSend();
						}
					}}
				/>

				<Button
					type="primary"
					shape="circle"
					icon={<SendOutlined />}
					aria-label="Send"
					onClick={handleSend}
					loading={sending}
					disabled={!canSend}
				/>
			</div>
		</div>
	);

	return (
		<div
			className={`group-chat chat-layout${
				selectedGroup ? " chat-layout--open" : ""
			}`}
		>
			{/* Left panel: groups — scrolls on its own */}
			<aside className="group-chat__panel group-chat__list chat-layout__list">
				<div className="group-chat__list-header">
					<h2 className="group-chat__title">Chats</h2>
					<Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/")}>
						Dashboard
					</Button>
				</div>
				<div className="group-chat__list-scroll">{renderGroupList()}</div>
			</aside>

			{/* Right panel: conversation — only the messages scroll */}
			<section className="group-chat__panel group-chat__conversation chat-layout__conversation">
				{selectedGroup ? (
					<>
						{renderHeader()}
						{renderMessages()}
						{renderComposer()}
					</>
				) : (
					<div className="group-chat__center">
						<Empty
							image={Empty.PRESENTED_IMAGE_SIMPLE}
							description="Select a group to start chatting."
						/>
					</div>
				)}
			</section>

			<Modal
				title="Group Info"
				open={isGroupInfoVisible}
				onCancel={() => setIsGroupInfoVisible(false)}
				footer={[
					<Button key="delete" danger onClick={handleDeleteGroup}>
						Delete Group
					</Button>,
					<Button key="close" onClick={() => setIsGroupInfoVisible(false)}>
						Close
					</Button>,
				]}
			>
				<p>
					<strong>Group Name:</strong> {selectedGroup?.name}
				</p>
				<p>
					<strong>Created At:</strong>{" "}
					{groupCreatedAt ? new Date(groupCreatedAt).toLocaleString() : "N/A"}
				</p>

				<Divider style={{ margin: "12px 0" }} />

				<h4>Participants</h4>
				<div className="group-chat__participants">
					{groupParticipants.map((p) => (
						<div key={p.key} className="group-chat__participant">
							<Avatar className="group-chat__participant-avatar">
								{initial(p.name)}
							</Avatar>
							<div>
								<div className="group-chat__participant-name">{p.name}</div>
								<div className="group-chat__participant-role">{p.role}</div>
							</div>
						</div>
					))}
				</div>
			</Modal>
		</div>
	);
};

export default BDMGroupChat;