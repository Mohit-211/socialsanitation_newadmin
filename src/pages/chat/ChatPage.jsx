import { useEffect, useRef, useState } from "react";
import { Button, Card, Spin, Input, Avatar, Tooltip, Upload, message } from "antd";
import { ArrowLeft, CircleX, Plus, Smile, User } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { ref as dbRef, onValue, push, set } from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import db from "@/lib/firebase";
import { GetUserChatList } from "@/services/api/chatApi";
import { IMAGE_BASE_URL } from "@/config/env";
import { useNavigate } from "react-router";
import "./ChatPage.scss";
const storage = getStorage();
const { TextArea } = Input;

const ChatPage = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [chatListData, setChatListData] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [chatListLoading, setChatListLoading] = useState(true);

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
      setChatListLoading(true);

      const token = localStorage.getItem("adminToken");
      const res = await GetUserChatList(token, "user");

      setChatListData(res.data.data || []);
    } catch (err) {
      console.error("Chat list fetch error", err);
      setChatListData([]);
    } finally {
      setChatListLoading(false);
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
    if (!newMessage.trim() && selectedImages.length === 0) return;
    if (!adminId || !selectedChat?.id) return;

    setSending(true);

    try {
      const uploadedUrls = [];
      // Upload all selected images to Firebase Storage
      for (const file of selectedImages) {
        if (!file || !file.name) {
          console.error("Skipping invalid file:", file);
          continue;
        }

        const imagePath = `one_to_one_uploads/${adminId}/${Date.now()}_${
          file.name
        }`;

        const imageRef = storageRef(storage, imagePath);
        await uploadBytes(imageRef, file);

        const downloadURL = await getDownloadURL(imageRef);
        uploadedUrls.push(downloadURL);
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
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div
      className={`chat-ui chat-layout${selectedChat ? " chat-layout--open" : ""}`}
    >
      {/* Left Panel */}
      <div className="chat-ui__panel chat-ui__list chat-layout__list">
        <div className="chat-ui__list-header">
          <h2 className="chat-ui__title">Chats</h2>
          <Button icon={<ArrowLeft size={16} />} onClick={() => navigate("/")}>
            Back
          </Button>
        </div>

        {chatListLoading ? (
          <Spin />
        ) : chatListData.length === 0 ? (
          <div className="chat-ui__empty">
            <User size={32} className="chat-ui__empty-icon" />

            <div className="chat-ui__empty-title">No users assigned</div>

            <div className="chat-ui__empty-text">
              Users assigned to you will appear here.
            </div>
          </div>
        ) : (
          chatListData.map((chat) => (
            <Card
              key={chat.id}
              className={`chat-ui__item${
                selectedChat?.id === chat.id ? " chat-ui__item--active" : ""
              }`}
              onClick={() => setSelectedChat(chat)}
              styles={{ body: { padding: "var(--space-3)" } }}
            >
              <div className="chat-ui__item-row">
                <Avatar
                  src={
                    chat.user_attachments?.[0]?.file_name
                      ? `${IMAGE_BASE_URL}${chat.user_attachments[0].file_name}`
                      : undefined
                  }
                  icon={<User size={18} />}
                />
                <div>
                  <div className="chat-ui__item-name">
                    {chat.user_profile?.name}
                  </div>
                  <div className="chat-ui__item-preview">
                    {chat.displayMessage}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Right Panel */}
      <div className="chat-ui__panel chat-ui__conversation chat-layout__conversation">
        {!selectedChat ? (
          <div className="chat-ui__placeholder">
            Select a user to start chatting.
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="chat-ui__header">
              <Button
                className="chat-layout__back"
                type="text"
                aria-label="Back to chats"
                icon={<ArrowLeft size={16} />}
                onClick={() => setSelectedChat(null)}
              />
              <Avatar
                size={40}
                src={
                  selectedChat.user_attachments?.[0]?.file_name
                    ? `${IMAGE_BASE_URL}${selectedChat.user_attachments[0].file_name}`
                    : undefined
                }
                icon={<User size={20} />}
                className="chat-ui__header-avatar"
              />
              <span className="chat-ui__header-name">
                {selectedChat.user_profile?.name}
              </span>
            </div>

            {/* Message Area */}
            <div className="chat-ui__messages">
              {messages.map((msg) => {
                const isSender = msg.source === "SENDER";
                return (
                  <div
                    key={msg.id}
                    className={`chat-ui__row${isSender ? " chat-ui__row--mine" : ""}`}
                  >
                    <div className="chat-ui__bubble">
                      {/* Render all images if available */}
                      {Array.isArray(msg.imageUrls) &&
                        msg.imageUrls.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`chat-img-${idx}`}
                            className="chat-ui__image"
                          />
                        ))}

                      {/* Render message text */}
                      <div className="chat-ui__text">{msg.message}</div>
                      <div className="chat-ui__time">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chat-ui__composer">
              <Upload
                multiple
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleBeforeUpload}
              >
                <Tooltip title="Attach Images">
                  <Button
                    shape="circle"
                    color="default"
                    variant="filled"
                    icon={<Plus size={16} />}
                  />
                </Tooltip>
              </Upload>

              <Tooltip title="Add Emoji">
                <Button
                  shape="circle"
                  color="default"
                  variant="filled"
                  icon={<Smile size={16} />}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                />
              </Tooltip>

              {/* Right-side input and preview */}
              <div className="chat-ui__input-box">
                {/* Image preview shown ABOVE TextArea */}
                {selectedImages.length > 0 && (
                  <div className="chat-ui__previews">
                    {selectedImages.map((file, index) => (
                      <div
                        key={`${file.name}_${index}`}
                        className="chat-ui__preview"
                      >
                        <img src={URL.createObjectURL(file)} alt="preview" />
                        <CircleX
                          size={16}
                          className="chat-ui__preview-remove"
                          onClick={() => removeImage(index)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Textarea */}
                <TextArea
                  id="chat-message-textarea"
                  className="chat-ui__textarea"
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
                  variant="borderless"
                />

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="chat-ui__emoji">
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

export default ChatPage;
