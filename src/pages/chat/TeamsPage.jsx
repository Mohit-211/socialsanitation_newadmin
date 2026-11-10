import { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Button,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import {
  ArrowLeft,
  CircleX,
  FileText,
  Paperclip,
  Plus,
  Search,
  Send,
  Smile,
  User,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { onValue, ref as dbRef } from "firebase/database";
import { useNavigate } from "react-router";
import EmojiPicker from "emoji-picker-react";
import { getProfile } from "@/services/api/authApi";
import {
  AddTeamMembers,
  CreateTeam,
  DeleteTeam,
  GetMyTeams,
  GetTeamCandidates,
  RemoveTeamMember,
  SendTeamMessage,
} from "@/services/api/teamApi";
import db from "@/lib/firebase";
import "./GroupChatPage.scss";
import "./TeamsPage.scss";

const { Text } = Typography;
const { TextArea } = Input;

const TEXTAREA_ID = "team-message-textarea";
const ACCEPTED_TYPES = "image/*,video/*,application/pdf";
const MAX_FILE_SIZE_MB = { image: 10, video: 50, pdf: 20 };
const TEAM_CREATOR_ROLES = [1, 3, 5];

// Mirrors the backend role names, used for members in the team list.
const ROLE_LABELS = {
  1: "Super Admin",
  3: "Operations Administrator",
  5: "BDM",
  6: "Client",
  7: "Supervisor",
  8: "Quality Inspector",
  9: "Cleaner",
  10: "Janitor",
  11: "Housekeeping",
};

// Badge colour (antd Tag preset) per participant type returned by the API.
const TYPE_COLORS = {
  admin: "processing",
  client: "success",
  employee: "warning",
};

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const initial = (name) => (name || "U")[0].toUpperCase();

const focusTextArea = () =>
  setTimeout(() => document.getElementById(TEXTAREA_ID)?.focus(), 0);

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

const getRoleLabel = (roleId) => ROLE_LABELS[Number(roleId)] || "Employee";

// Mirrors the backend getParticipantKey. Used only to recognise the
// logged-in user; participant keys otherwise come from the API.
const getParticipantKey = (id, roleId) => {
  if (roleId === 5) return `bdm_${id}`;
  if (roleId === 1 || roleId === 3) return `admin_${id}`;
  if (roleId === 6) return `user_${id}`;
  return `employee_${id}`;
};

// Option for the participant dropdown. The label includes the role so
// searching by role also works. The IDs are never shown.
const toOption = (participant) => ({
  value: participant.key,
  label: `${participant.name} ${participant.role}`,
  name: participant.name,
  role: participant.role,
  participantType: participant.participantType,
});

const ParticipantOption = ({ name, role, participantType }) => (
  <div className="team-chat__option">
    <Avatar size="small" className="team-chat__option-avatar">
      {initial(name)}
    </Avatar>
    <span className="team-chat__option-name">{name}</span>
    <Tag color={TYPE_COLORS[participantType]} className="team-chat__option-tag">
      {role}
    </Tag>
  </div>
);

const apiError = (err, fallback) => err?.response?.data?.message || fallback;

const TeamsPage = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null); // { groupId, name }
  const [teamData, setTeamData] = useState(null); // live: name, createdBy, members
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm] = Form.useForm();

  const [membersOpen, setMembersOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addSelection, setAddSelection] = useState([]); // participant keys
  const [addingMembers, setAddingMembers] = useState(false);

  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const messagesRef = useRef(null);

  const token = localStorage.getItem("adminToken");
  const groupId = selectedTeam?.groupId;
  const myRoleId = Number(userData?.role_id);
  const myKey = userData ? getParticipantKey(userData.id, myRoleId) : null;
  const canCreate = TEAM_CREATOR_ROLES.includes(myRoleId);
  const isCreator = Boolean(teamData && myKey && teamData.createdBy === myKey);
  const teamName = teamData?.name || selectedTeam?.name;

  const members = useMemo(
    () =>
      Object.entries(teamData?.members || {})
        .map(([key, member]) => ({ key, ...member }))
        .sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [teamData],
  );

  const memberKeys = useMemo(
    () => new Set(members.map((member) => member.key)),
    [members],
  );

  const candidatesByKey = useMemo(
    () => new Map(candidates.map((person) => [person.key, person])),
    [candidates],
  );

  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    if (!query) return members;
    return members.filter(
      (member) =>
        (member.name || "").toLowerCase().includes(query) ||
        getRoleLabel(member.role_id).toLowerCase().includes(query),
    );
  }, [members, memberSearch]);

  const createOptions = useMemo(
    () => candidates.filter((person) => person.key !== myKey).map(toOption),
    [candidates, myKey],
  );

  const addOptions = useMemo(
    () =>
      candidates
        .filter((person) => person.key !== myKey && !memberKeys.has(person.key))
        .map(toOption),
    [candidates, myKey, memberKeys],
  );

  // Converts selected dropdown keys into the { id, role_id } shape the API expects.
  const toParticipantIds = (keys) =>
    keys
      .map((key) => candidatesByKey.get(key))
      .filter(Boolean)
      .map(({ id, role_id }) => ({ id, role_id }));

  const fetchTeams = async () => {
    try {
      const res = await GetMyTeams(token);
      setTeams(res.data?.data?.teams || []);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    } finally {
      setLoadingTeams(false);
    }
  };

  // Load profile and teams once.
  useEffect(() => {
    getProfile()
      .then((result) => setUserData(result.data?.data))
      .catch((error) => console.error("Failed to fetch admin profile:", error));
    // Async fetch: state is only set after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live team node (name, members, messages) for the open team. The cleanup
  // detaches the listener when the team changes or the page unmounts.
  useEffect(() => {
    if (!groupId) return undefined;
    const unsubscribe = onValue(
      dbRef(db, `GroupChats/${groupId}`),
      (snapshot) => {
        const data = snapshot.val();

        // Team was deleted (here or elsewhere): close it and drop it from the list.
        if (!data) {
          setSelectedTeam(null);
          setTeamData(null);
          setMessages([]);
          setTeams((prev) => prev.filter((team) => team.groupId !== groupId));
          return;
        }

        const { messages: rawMessages, ...meta } = data;
        setTeamData(meta);
        setMessages(
          Object.entries(rawMessages || {})
            .map(([id, msg]) => ({ id, ...msg }))
            .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)),
        );
      },
    );
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
    [selectedFiles],
  );
  useEffect(
    () => () =>
      filePreviews.forEach((preview) => URL.revokeObjectURL(preview.url)),
    [filePreviews],
  );

  const loadCandidates = async () => {
    if (candidates.length > 0) return;
    setLoadingCandidates(true);
    try {
      setCandidates(await GetTeamCandidates(token));
    } catch (error) {
      console.error("Failed to load participants:", error);
      message.error(apiError(error, "Failed to load participants"));
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleTeamClick = (team) => {
    if (team.groupId !== groupId) {
      setMessages([]);
      setTeamData(null);
      setShowEmojiPicker(false);
      setMemberSearch("");
    }
    setSelectedTeam(team);
  };

  const openCreateTeam = () => {
    setCreateOpen(true);
    loadCandidates();
  };

  const handleCreateTeam = async () => {
    let values;
    try {
      values = await createForm.validateFields();
    } catch {
      return;
    }

    setCreating(true);
    try {
      const res = await CreateTeam(token, {
        name: values.name.trim(),
        participantIds: toParticipantIds(values.participants || []),
      });
      const created = res.data?.data;

      message.success("Team created");
      setCreateOpen(false);
      createForm.resetFields();
      await fetchTeams();

      if (created?.groupId) {
        handleTeamClick({ groupId: created.groupId, name: created.name });
      }
    } catch (error) {
      console.error("Failed to create team:", error);
      message.error(apiError(error, "Failed to create team"));
    } finally {
      setCreating(false);
    }
  };

  const handleAddMembers = async () => {
    if (addSelection.length === 0) return;

    setAddingMembers(true);
    try {
      await AddTeamMembers(token, {
        groupId,
        participantIds: toParticipantIds(addSelection),
      });
      message.success("Members added");
      setAddOpen(false);
      setAddSelection([]);
    } catch (error) {
      console.error("Failed to add members:", error);
      message.error(apiError(error, "Failed to add members"));
    } finally {
      setAddingMembers(false);
    }
  };

  const handleRemoveMember = async (member) => {
    try {
      await RemoveTeamMember(token, {
        groupId,
        participantId: member.id,
        role_id: member.role_id,
      });
      message.success(`${member.name} removed from team`);
    } catch (error) {
      console.error("Failed to remove member:", error);
      message.error(apiError(error, "Failed to remove member"));
    }
  };

  const handleDeleteTeam = async () => {
    setDeleting(true);
    try {
      await DeleteTeam(token, groupId);
      message.success("Team deleted");
      setMembersOpen(false);
      setSelectedTeam(null);
      setTeamData(null);
      setMessages([]);
      await fetchTeams();
    } catch (error) {
      console.error("Failed to delete team:", error);
      message.error(apiError(error, "Failed to delete team"));
    } finally {
      setDeleting(false);
    }
  };

  const handleBeforeUpload = (file, fileList) => {
    // Called once per file; add the whole batch only on its first file.
    if (file === fileList[0]) {
      setSelectedFiles((prev) => [...prev, ...fileList.filter(isAllowedFile)]);
      focusTextArea();
    }
    if (!isAllowedFile(file)) {
      const kind = getFileKind(file);
      message.error(
        kind
          ? `${file.name} is larger than ${MAX_FILE_SIZE_MB[kind]} MB.`
          : `${file.name} is not a supported file type.`,
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
    try {
      await SendTeamMessage(token, {
        groupId,
        message: newMessage.trim(),
        files: selectedFiles,
      });
      setSelectedFiles([]);
      setNewMessage("");
    } catch (error) {
      console.error("Send error:", error);
      message.error(apiError(error, "Failed to send message or file."));
    } finally {
      setSending(false);
    }
  };

  const renderAttachment = (attachment) => {
    const type = (attachment.type || "").toUpperCase();

    if (type === "VIDEO") {
      return (
        <video
          className="group-chat__video"
          src={attachment.url}
          controls
          preload="metadata"
        />
      );
    }

    if (type === "PDF") {
      return (
        <a
          className="group-chat__file"
          href={attachment.url}
          target="_blank"
          rel="noreferrer"
        >
          <span className="group-chat__file-icon">
            <FileText size={18} />
          </span>
          <span className="group-chat__file-info">
            <span className="group-chat__file-name">
              {attachment.fileName || "Document.pdf"}
            </span>
            <span className="group-chat__file-meta">PDF</span>
          </span>
        </a>
      );
    }

    return (
      <a href={attachment.url} target="_blank" rel="noreferrer">
        <img
          className="group-chat__image"
          src={attachment.url}
          alt="Uploaded"
        />
      </a>
    );
  };

  const renderTeamList = () => {
    if (loadingTeams) {
      return (
        <div className="group-chat__center">
          <Spin />
        </div>
      );
    }
    if (teams.length === 0) {
      return (
        <div className="group-chat__center">
          <Empty description="No teams yet" />
        </div>
      );
    }
    return teams.map((team) => (
      <button
        type="button"
        key={team.groupId}
        className={`group-chat__item${
          team.groupId === groupId ? " group-chat__item--active" : ""
        }`}
        onClick={() => handleTeamClick(team)}
      >
        <Avatar className="group-chat__item-avatar" icon={<Users size={18} />} />
        <div className="group-chat__item-body">
          <div className="group-chat__item-top">
            <span className="group-chat__item-name">{team.name}</span>
            {team.last_message_time && (
              <span className="group-chat__item-time">
                {formatTime(team.last_message_time)}
              </span>
            )}
          </div>
          <span className="group-chat__item-preview">
            {team.last_message
              ? `${team.last_message_by}: ${team.last_message}`
              : "No messages yet."}
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
        aria-label="Back to teams"
        icon={<ArrowLeft size={16} />}
        onClick={() => setSelectedTeam(null)}
      />
      <Avatar className="group-chat__item-avatar" icon={<Users size={18} />} />
      <div className="team-chat__heading">
        <h2 className="group-chat__title">{teamName}</h2>
        <span className="team-chat__subtitle">
          {members.length}{" "}
          {members.length === 1 ? "participant" : "participants"}
        </span>
      </div>
      <Tooltip title="Team members">
        <Button
          type="text"
          className="group-chat__header-end"
          aria-label="Team members"
          icon={<User size={16} />}
          onClick={() => setMembersOpen(true)}
        />
      </Tooltip>
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
          const isSender = msg.sender === myKey;
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
                    {msg.sender_name || "Unknown"}
                  </span>
                )}
                {Object.values(msg.attachments || {}).map(
                  (attachment, index) => (
                    <div key={`${msg.id}-${index}`}>
                      {renderAttachment(attachment)}
                    </div>
                  ),
                )}
                {msg.message && (
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
                  <FileText size={20} />
                  <span className="group-chat__preview-name">
                    {preview.name}
                  </span>
                </div>
              )}
              <CircleX
                size={16}
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
            <Button
              shape="circle"
              type="text"
              aria-label="Attach files"
              icon={<Paperclip size={18} />}
            />
          </Tooltip>
        </Upload>
        <Tooltip title="Add Emoji">
          <Button
            shape="circle"
            type="text"
            aria-label="Add emoji"
            icon={<Smile size={18} />}
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
          icon={<Send size={16} />}
          aria-label="Send"
          onClick={handleSend}
          loading={sending}
          disabled={!canSend}
        />
      </div>
    </div>
  );

  const renderParticipantTag = ({ value, closable, onClose }) => {
    const person = candidatesByKey.get(value);
    return (
      <Tag
        closable={closable}
        onClose={onClose}
        onMouseDown={(e) => e.preventDefault()}
      >
        {person?.name || "Unknown"}
      </Tag>
    );
  };

  const participantSelectProps = {
    mode: "multiple",
    showSearch: true,
    optionFilterProp: "label",
    placement: "topLeft", // open above the field so the modal footer stays visible
    listHeight: 240,
    maxTagCount: "responsive",
    tagRender: renderParticipantTag,
    loading: loadingCandidates,
    notFoundContent: loadingCandidates ? (
      <Spin size="small" />
    ) : (
      "No participants found"
    ),
    optionRender: (option) => <ParticipantOption {...option.data} />,
  };

  const membersModalFooter = [
    ...(isCreator
      ? [
          <Popconfirm
            key="delete"
            title="Delete this team?"
            description="All messages in this team will be lost."
            okText="Delete"
            okButtonProps={{ danger: true, loading: deleting }}
            onConfirm={handleDeleteTeam}
          >
            <Button danger>Delete Team</Button>
          </Popconfirm>,
        ]
      : []),
    <Button key="close" onClick={() => setMembersOpen(false)}>
      Close
    </Button>,
  ];

  return (
    <div
      className={`group-chat team-chat chat-layout${
        selectedTeam ? " chat-layout--open" : ""
      }`}
    >
      {/* Left panel: teams — scrolls on its own */}
      <aside className="group-chat__panel group-chat__list chat-layout__list">
        <div className="group-chat__list-header">
          <h2 className="group-chat__title">Teams</h2>
          <Button icon={<ArrowLeft size={16} />} onClick={() => navigate("/")}>
            Dashboard
          </Button>
        </div>
        {canCreate && (
          <div className="team-chat__toolbar">
            <Button
              type="primary"
              size="large"
              block
              icon={<Plus size={16} />}
              onClick={openCreateTeam}
            >
              New Team
            </Button>
          </div>
        )}
        <div className="group-chat__list-scroll">{renderTeamList()}</div>
      </aside>

      {/* Right panel: conversation — only the messages scroll */}
      <section className="group-chat__panel group-chat__conversation chat-layout__conversation">
        {selectedTeam ? (
          <>
            {renderHeader()}
            {renderMessages()}
            {renderComposer()}
          </>
        ) : (
          <div className="group-chat__center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Select a team to start chatting."
            />
          </div>
        )}
      </section>

      {/* Create team */}
      <Modal
        title="New Team"
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false);
          createForm.resetFields();
        }}
        onOk={handleCreateTeam}
        confirmLoading={creating}
        okText="Create Team"
        width={480}
      >
        <Form form={createForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="name"
            label="Team name"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Enter a team name",
              },
              { max: 100, message: "Team name cannot exceed 100 characters" },
            ]}
          >
            <Input placeholder="e.g. Downtown Deep Clean" />
          </Form.Item>
          <Form.Item name="participants" label="Members">
            <Select
              {...participantSelectProps}
              placeholder="Search and select participants"
              options={createOptions}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Team members */}
      <Modal
        title="Team Members"
        open={membersOpen}
        onCancel={() => {
          setMembersOpen(false);
          setMemberSearch("");
        }}
        footer={membersModalFooter}
        width={480}
      >
        <div className="team-chat__modal-toolbar">
          <Input
            className="team-chat__search"
            allowClear
            prefix={<Search size={16} className="text-subtle" />}
            placeholder="Search members"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
          />
          {isCreator && (
            <Button
              type="primary"
              icon={<UserPlus size={16} />}
              onClick={() => {
                setAddOpen(true);
                loadCandidates();
              }}
            >
              Add
            </Button>
          )}
        </div>

        <div className="team-chat__modal-count">
          {members.length}{" "}
          {members.length === 1 ? "participant" : "participants"}
        </div>

        <div className="team-chat__member-list">
          {filteredMembers.length === 0 ? (
            <Text type="secondary">No members match your search.</Text>
          ) : (
            filteredMembers.map((member) => {
              const isTeamCreator = member.key === teamData?.createdBy;
              return (
                <div key={member.key} className="group-chat__participant">
                  <Avatar className="group-chat__participant-avatar">
                    {initial(member.name)}
                  </Avatar>
                  <div className="team-chat__member-info">
                    <div className="team-chat__member-name">
                      <span>{member.name || "Unknown"}</span>
                      {isTeamCreator && <Tag color="processing">Creator</Tag>}
                    </div>
                    <div className="group-chat__participant-role">
                      {getRoleLabel(member.role_id)}
                    </div>
                  </div>
                  {isCreator && !isTeamCreator && (
                    <Popconfirm
                      title={`Remove ${member.name || "this member"}?`}
                      okText="Remove"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => handleRemoveMember(member)}
                    >
                      <Tooltip title="Remove from team">
                        <Button
                          danger
                          type="text"
                          aria-label="Remove from team"
                          icon={<UserMinus size={16} />}
                        />
                      </Tooltip>
                    </Popconfirm>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* Add members */}
      <Modal
        title="Add Members"
        open={addOpen}
        onCancel={() => {
          setAddOpen(false);
          setAddSelection([]);
        }}
        onOk={handleAddMembers}
        confirmLoading={addingMembers}
        okText="Add"
        okButtonProps={{ disabled: addSelection.length === 0 }}
        width={480}
      >
        <Select
          {...participantSelectProps}
          style={{ width: "100%" }}
          placeholder="Search and select participants"
          options={addOptions}
          value={addSelection}
          onChange={setAddSelection}
        />
      </Modal>
    </div>
  );
};

export default TeamsPage;
