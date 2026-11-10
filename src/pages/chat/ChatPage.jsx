import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Alert, Avatar, Badge, Button, Card, Input, Segmented, Spin, Tooltip, Upload, message } from "antd";
import { ArrowLeft, CircleX, Plus, Smile, User } from "lucide-react";
import { onValue, ref as dbRef } from "firebase/database";
import EmojiPicker from "emoji-picker-react";
import db from "@/lib/firebase";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useSession } from "@/lib/session";
import { listChats, markChatRead, sendChatMessage } from "@/services/api/chatApi";
import { errorMessage, itemsOf } from "@/services/apiResult";
import "./ChatPage.scss";

const { TextArea } = Input;

// Where each kind of thread lives in Firebase.
const THREADS = {
  employee: { path: "EMPLOYEE_ADMIN_CHAT", label: "Employees" },
  user: { path: "USER_ADMIN_CHAT", label: "Clients (read-only)" },
};

const formatTime = (timestamp) =>
  timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

// One-to-one chats with employees. Clients no longer chat: their old threads
// still read here, without a reply box.
const ChatPage = () => {
  const navigate = useNavigate();
  const session = useSession();
  const adminId = session?.user?.id;
  const messagesEndRef = useRef(null);
  const [kind, setKind] = useState("employee");
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const canReply = kind === "employee";

  const { data: chats, loading, reload } = useApiQuery(() => listChats(kind).then(itemsOf), [kind], {
    initial: [],
    errorText: "Couldn't load the chats",
  });

  // Live messages of the open thread; the listener goes when the thread changes.
  useEffect(() => {
    if (!selectedChat?.id || !adminId) return undefined;
    const path = `${THREADS[kind].path}/messages/ADMIN_${adminId}/USER_${selectedChat.id}`;
    return onValue(dbRef(db, path), (snapshot) => {
      const data = snapshot.val() || {};
      setMessages(
        Object.entries(data)
          .map(([id, msg]) => ({ id, ...msg }))
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)),
      );
    });
  }, [selectedChat?.id, adminId, kind]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const previews = useMemo(() => selectedImages.map((file) => URL.createObjectURL(file)), [selectedImages]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const openChat = (chat) => {
    setSelectedChat(chat);
    setMessages([]);
    if (chat.unread_count) markChatRead(chat.id).then(reload, () => {});
  };

  const switchKind = (value) => {
    setKind(value);
    setSelectedChat(null);
    setMessages([]);
  };

  const handleSend = async () => {
    if (!canReply || sending || (!newMessage.trim() && !selectedImages.length)) return;
    setSending(true);
    try {
      await sendChatMessage(selectedChat.id, { message: newMessage.trim(), images: selectedImages });
      setNewMessage("");
      setSelectedImages([]);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't send the message"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`chat-ui chat-layout${selectedChat ? " chat-layout--open" : ""}`}>
      <div className="chat-ui__panel chat-ui__list chat-layout__list">
        <div className="chat-ui__list-header">
          <h2 className="chat-ui__title">Chats</h2>
          <Button icon={<ArrowLeft size={16} />} onClick={() => navigate("/")}>
            Back
          </Button>
        </div>
        <Segmented
          block
          className="chat-ui__kinds"
          value={kind}
          onChange={switchKind}
          options={Object.entries(THREADS).map(([value, thread]) => ({ value, label: thread.label }))}
        />
        {loading ? (
          <Spin />
        ) : (chats || []).length === 0 ? (
          <div className="chat-ui__empty">
            <User size={32} className="chat-ui__empty-icon" />
            <div className="chat-ui__empty-title">No chats yet</div>
          </div>
        ) : (
          chats.map((chat) => (
            <Card
              key={chat.id}
              className={`chat-ui__item${selectedChat?.id === chat.id ? " chat-ui__item--active" : ""}`}
              onClick={() => openChat(chat)}
              styles={{ body: { padding: "var(--space-3)" } }}
            >
              <div className="chat-ui__item-row">
                <Badge count={chat.unread_count} size="small">
                  <Avatar src={chat.image_url || undefined} icon={<User size={18} />} />
                </Badge>
                <div>
                  <div className="chat-ui__item-name">{chat.name || "Unknown"}</div>
                  <div className="chat-ui__item-preview">{chat.last_message}</div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="chat-ui__panel chat-ui__conversation chat-layout__conversation">
        {!selectedChat ? (
          <div className="chat-ui__placeholder">Pick a chat to read it.</div>
        ) : (
          <>
            <div className="chat-ui__header">
              <Button
                className="chat-layout__back"
                type="text"
                aria-label="Back to chats"
                icon={<ArrowLeft size={16} />}
                onClick={() => setSelectedChat(null)}
              />
              <Avatar size={40} src={selectedChat.image_url || undefined} icon={<User size={20} />} className="chat-ui__header-avatar" />
              <span className="chat-ui__header-name">{selectedChat.name}</span>
            </div>

            <div className="chat-ui__messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`chat-ui__row${msg.source === "SENDER" ? " chat-ui__row--mine" : ""}`}>
                  <div className="chat-ui__bubble">
                    {(Array.isArray(msg.imageUrls) ? msg.imageUrls : []).map((url) => (
                      <img key={url} src={url} alt="" className="chat-ui__image" />
                    ))}
                    <div className="chat-ui__text">{msg.message}</div>
                    <div className="chat-ui__time">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {canReply ? (
              <div className="chat-ui__composer">
                <Upload
                  multiple
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    setSelectedImages((prev) => [...prev, file]);
                    return false;
                  }}
                >
                  <Tooltip title="Attach images">
                    <Button shape="circle" color="default" variant="filled" icon={<Plus size={16} />} />
                  </Tooltip>
                </Upload>
                <Tooltip title="Add an emoji">
                  <Button
                    shape="circle"
                    color="default"
                    variant="filled"
                    icon={<Smile size={16} />}
                    onClick={() => setShowEmojiPicker((open) => !open)}
                  />
                </Tooltip>
                <div className="chat-ui__input-box">
                  {selectedImages.length > 0 && (
                    <div className="chat-ui__previews">
                      {previews.map((url, index) => (
                        <div key={url} className="chat-ui__preview">
                          <img src={url} alt="" />
                          <CircleX
                            size={16}
                            className="chat-ui__preview-remove"
                            onClick={() => setSelectedImages((prev) => prev.filter((_, i) => i !== index))}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <TextArea
                    id="chat-message-textarea"
                    className="chat-ui__textarea"
                    rows={selectedImages.length > 0 ? 4 : 2}
                    placeholder="Type a message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    variant="borderless"
                  />
                  {showEmojiPicker && (
                    <div className="chat-ui__emoji">
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          setNewMessage((prev) => prev + emojiData.emoji);
                          setShowEmojiPicker(false);
                        }}
                        theme="light"
                      />
                    </div>
                  )}
                </div>
                <Button type="primary" onClick={handleSend} loading={sending} disabled={!newMessage.trim() && !selectedImages.length}>
                  Send
                </Button>
              </div>
            ) : (
              <Alert
                type="info"
                showIcon
                className="chat-ui__read-only"
                title="Clients don't use chat any more. Call or email them instead."
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
