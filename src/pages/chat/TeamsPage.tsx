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
  type SelectProps,
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
  addTeamMembers,
  createTeam,
  deleteTeam,
  listTeamCandidates,
  listTeams,
  removeTeamMember,
} from "@/services/api/teamApi";
import { sendGroupMessage } from "@/services/api/groupChatApi";
import { errorMessage, itemsOf } from "@/services/apiResult";
import { PERMISSION, useCan } from "@/lib/session";
import db from "@/lib/firebase";
import { formatTime } from "@/utils/datetime";
import { MAX_UPLOAD_MB, acceptOf, uploadKindOf, type UploadKind } from "@/utils/uploads";
import type { Group, SessionUser, TeamParticipant } from "@/types";
import "./GroupChatPage.scss";
import "./TeamsPage.scss";

const { Text } = Typography;
const { TextArea } = Input;

const TEXTAREA_ID = "team-message-textarea";
const ACCEPTED_TYPES = acceptOf("image", "video", "pdf");
const MAX_FILE_SIZE_MB: Record<UploadKind, number> = { image: 10, video: MAX_UPLOAD_MB, pdf: 20 };

/** A file sent with a message through the API. */
interface MessageFile {
  url?: string;
  fileName?: string;
  type?: string;
}

/** A team message as Firebase keeps it. */
interface TeamMessage {
  id: string;
  sender?: string;
  sender_name?: string | null;
  message?: string | null;
  timestamp?: number | null;
  attachments?: Record<string, MessageFile> | null;
}

/** A team member as Firebase keeps them, under their key (admin_5, employee_12). */
interface TeamMember {
  id?: number;
  name?: string | null;
  role?: string | null;
  role_id?: number | string | null;
}

type KeyedMember = TeamMember & { key: string };

/** A team's live node in Firebase. */
interface TeamNode {
  name?: string;
  createdBy?: string;
  members?: Record<string, TeamMember>;
  messages?: Record<string, Omit<TeamMessage, "id">>;
}

/** A team in the list, under the key the page keeps it by. */
type TeamRow = Group & { groupId: string };
type OpenTeam = Pick<TeamRow, "groupId" | "name">;

/** A participant as a select option (a type, so antd's option index signature fits). */
type ParticipantOptionData = {
  value: string;
  label: string;
  name: string;
  role: string | number | null;
  participantType: string;
};

// Mirrors the backend role names, used for members in the team list.
const ROLE_LABELS: Record<number, string> = {
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
const TYPE_COLORS: Record<string, string> = {
  admin: "processing",
  client: "success",
  employee: "warning",
};

const initial = (name: string | null | undefined) => (name || "U")[0].toUpperCase();

const focusTextArea = () =>
  setTimeout(() => document.getElementById(TEXTAREA_ID)?.focus(), 0);

// Only what the API takes, by extension: .mp4 and .mov videos, not any video.
const getFileKind = uploadKindOf;

const isAllowedFile = (file: File) => {
  const kind = getFileKind(file);
  return kind !== null && file.size / (1024 * 1024) <= MAX_FILE_SIZE_MB[kind];
};

// A member's role in words: what the API saved, or the old role number.
const getRoleLabel = (member: TeamMember) => member?.role || ROLE_LABELS[Number(member?.role_id)] || "Employee";

// The users.id a member key names (admin_5, employee_12; older bdm_ keys too).
const idOfKey = (key: string) => Number(String(key).split("_")[1]) || null;

// Option for the participant dropdown. The label includes the role so
// searching by role also works. The IDs are never shown.
const toOption = (participant: TeamParticipant): ParticipantOptionData => ({
  value: participant.key,
  label: `${participant.name} ${participant.role}`,
  name: participant.name,
  role: participant.role,
  participantType: participant.participant_type,
});

const ParticipantOption = ({ name, role, participantType }: Pick<ParticipantOptionData, "name" | "role" | "participantType">) => (
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

const TeamsPage = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<OpenTeam | null>(null);
  const [teamData, setTeamData] = useState<Omit<TeamNode, "messages"> | null>(null); // live: name, createdBy, members
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [userData, setUserData] = useState<SessionUser | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm] = Form.useForm<{ name: string; participants?: string[] }>();

  const [membersOpen, setMembersOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addSelection, setAddSelection] = useState<string[]>([]); // participant keys
  const [addingMembers, setAddingMembers] = useState(false);

  const [candidates, setCandidates] = useState<TeamParticipant[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);

  const groupId = selectedTeam?.groupId;
  // Admins are users: their key is admin_<users.id>.
  const myKey = userData ? `admin_${userData.id}` : null;
  const canCreate = useCan(PERMISSION.MANAGE_TEAMS);
  const isCreator = Boolean(teamData && myKey && teamData.createdBy === myKey);
  const teamName = teamData?.name || selectedTeam?.name;

  const members = useMemo<KeyedMember[]>(
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
        getRoleLabel(member).toLowerCase().includes(query),
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

  // The picked people as the user ids the API takes.
  const toParticipantIds = (keys: string[]) =>
    keys
      .map((key) => candidatesByKey.get(key))
      .filter((person) => person !== undefined)
      .map((person) => person.id);

  const fetchTeams = async () => {
    try {
      const res = await listTeams();
      setTeams(itemsOf(res).map((team) => ({ ...team, groupId: team.id })));
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
  }, []);

  // Live team node (name, members, messages) for the open team. The cleanup
  // detaches the listener when the team changes or the page unmounts.
  useEffect(() => {
    if (!groupId) return undefined;
    const unsubscribe = onValue(
      dbRef(db, `GroupChats/${groupId}`),
      (snapshot) => {
        const data: TeamNode | null = snapshot.val();

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
      setCandidates(itemsOf(await listTeamCandidates()));
    } catch (error) {
      console.error("Failed to load participants:", error);
      message.error(errorMessage(error, "Failed to load participants"));
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleTeamClick = (team: OpenTeam) => {
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
    let values: { name: string; participants?: string[] };
    try {
      values = await createForm.validateFields();
    } catch {
      return;
    }

    setCreating(true);
    try {
      const res = await createTeam({
        name: values.name.trim(),
        participantIds: toParticipantIds(values.participants || []),
      });
      const created = res.data?.data;

      message.success("Team created");
      setCreateOpen(false);
      createForm.resetFields();
      await fetchTeams();

      if (created?.id) {
        handleTeamClick({ groupId: created.id, name: created.name });
      }
    } catch (error) {
      console.error("Failed to create team:", error);
      message.error(errorMessage(error, "Failed to create team"));
    } finally {
      setCreating(false);
    }
  };

  const handleAddMembers = async () => {
    if (!groupId || addSelection.length === 0) return;

    setAddingMembers(true);
    try {
      await addTeamMembers(groupId, toParticipantIds(addSelection));
      message.success("Members added");
      setAddOpen(false);
      setAddSelection([]);
    } catch (error) {
      console.error("Failed to add members:", error);
      message.error(errorMessage(error, "Failed to add members"));
    } finally {
      setAddingMembers(false);
    }
  };

  const handleRemoveMember = async (member: KeyedMember) => {
    const memberId = member.id ?? idOfKey(member.key);
    if (!groupId || !memberId) return;
    try {
      await removeTeamMember(groupId, memberId);
      message.success(`${member.name} removed from team`);
    } catch (error) {
      console.error("Failed to remove member:", error);
      message.error(errorMessage(error, "Failed to remove member"));
    }
  };

  const handleDeleteTeam = async () => {
    if (!groupId) return;
    setDeleting(true);
    try {
      await deleteTeam(groupId);
      message.success("Team deleted");
      setMembersOpen(false);
      setSelectedTeam(null);
      setTeamData(null);
      setMessages([]);
      await fetchTeams();
    } catch (error) {
      console.error("Failed to delete team:", error);
      message.error(errorMessage(error, "Failed to delete team"));
    } finally {
      setDeleting(false);
    }
  };

  const handleBeforeUpload = (file: File, fileList: File[]) => {
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
          : `${file.name} can't be sent: only JPG, PNG, GIF or WEBP images, MP4 or MOV videos, and PDFs.`,
      );
    }
    return false; // Prevent auto upload
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend = newMessage.trim() || selectedFiles.length > 0;

  const handleSend = async () => {
    if (!groupId || !canSend || sending) return;

    setSending(true);
    try {
      await sendGroupMessage(groupId, { message: newMessage.trim(), files: selectedFiles });
      setSelectedFiles([]);
      setNewMessage("");
    } catch (error) {
      console.error("Send error:", error);
      message.error(errorMessage(error, "Failed to send message or file."));
    } finally {
      setSending(false);
    }
  };

  const renderAttachment = (attachment: MessageFile) => {
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

  const renderParticipantTag: SelectProps["tagRender"] = ({ value, closable, onClose }) => {
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

  const participantSelectProps: SelectProps<string[], ParticipantOptionData> = {
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
                      {getRoleLabel(member)}
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
