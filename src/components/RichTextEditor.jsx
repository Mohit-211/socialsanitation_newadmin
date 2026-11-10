import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import { Button, Input, Popover, Select, Space, Tooltip, message } from "antd";
import {
  Bold,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import "./RichTextEditor.scss";

// Same block styles the old CKEditor toolbar offered ("Heading 1" = <h2>).
const BLOCK_OPTIONS = [
  { value: "paragraph", label: "Paragraph" },
  { value: "2", label: "Heading 1" },
  { value: "3", label: "Heading 2" },
  { value: "4", label: "Heading 3" },
];

const ToolbarButton = ({ icon: Icon, label, active = false, disabled, onClick }) => (
  <Tooltip title={label} mouseEnterDelay={0.4}>
    <Button
      type="text"
      size="small"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      className={`rte__btn${active ? " rte__btn--active" : ""}`}
      icon={<Icon size={16} />}
      // Keep the editor's selection when a toolbar button is clicked.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    />
  </Tooltip>
);

const LinkControl = ({ editor, active }) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  const handleOpenChange = (next) => {
    if (next) setUrl(editor.getAttributes("link").href || "");
    setOpen(next);
  };

  const applyLink = () => {
    const href = url.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (href) chain.setLink({ href }).run();
    else chain.unsetLink().run();
    setOpen(false);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
      trigger="click"
      placement="bottom"
      content={
        <Space.Compact className="rte__link-form">
          <Input
            autoFocus
            placeholder="https://example.com"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onPressEnter={applyLink}
          />
          <Button type="primary" onClick={applyLink}>
            Apply
          </Button>
          {active ? <Button onClick={removeLink}>Remove</Button> : null}
        </Space.Compact>
      }
    >
      <span>
        <ToolbarButton icon={Link2} label="Link" active={active} />
      </span>
    </Popover>
  );
};

/**
 * Rich-text field built on Tiptap. Works as a controlled input, so it can be
 * used directly inside antd <Form.Item> or with value/onChange state.
 * The value is HTML, the same format CKEditor produced before.
 */
const RichTextEditor = ({
  value = "",
  onChange,
  placeholder = "Write a description…",
  minHeight = 200,
  disabled = false,
  // Optional: (file) => Promise<url>. Turns on images (the blog uploads them first).
  onUploadImage,
}) => {
  const imageInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true },
      }),
      Placeholder.configure({ placeholder }),
      // Keeps tables that older descriptions may contain.
      TableKit.configure({ table: { resizable: false } }),
      ...(onUploadImage ? [Image.configure({ inline: false })] : []),
    ],
    content: value || "",
    editable: !disabled,
    onUpdate: ({ editor: current }) => {
      onChange?.(current.isEmpty ? "" : current.getHTML());
    },
  });

  // Load values that arrive after mount (for example on edit pages).
  useEffect(() => {
    if (!editor) return;
    const next = value || "";
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null;
      const level = [2, 3, 4].find((l) => e.isActive("heading", { level: l }));
      return {
        block: level ? String(level) : "paragraph",
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        strike: e.isActive("strike"),
        bulletList: e.isActive("bulletList"),
        orderedList: e.isActive("orderedList"),
        blockquote: e.isActive("blockquote"),
        link: e.isActive("link"),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      };
    },
  });

  if (!editor || !state) return null;

  const run = (command) => () => command(editor.chain().focus()).run();

  const insertImage = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      if (url) editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (error) {
      message.error(error?.response?.data?.message || "Couldn't upload the image");
    } finally {
      setUploading(false);
    }
  };

  const setBlock = (block) => {
    const chain = editor.chain().focus();
    if (block === "paragraph") chain.setParagraph().run();
    else chain.toggleHeading({ level: Number(block) }).run();
  };

  return (
    <div
      className={`rte${disabled ? " rte--disabled" : ""}`}
      style={{ "--rte-min-height": `${minHeight}px` }}
    >
      {!disabled && (
        <div className="rte__toolbar" role="toolbar" aria-label="Formatting">
          <Select
            size="small"
            variant="borderless"
            className="rte__block-select"
            value={state.block}
            options={BLOCK_OPTIONS}
            onChange={setBlock}
            popupMatchSelectWidth={false}
          />
          <span className="rte__divider" />
          <ToolbarButton
            icon={Bold}
            label="Bold"
            active={state.bold}
            onClick={run((c) => c.toggleBold())}
          />
          <ToolbarButton
            icon={Italic}
            label="Italic"
            active={state.italic}
            onClick={run((c) => c.toggleItalic())}
          />
          <ToolbarButton
            icon={Underline}
            label="Underline"
            active={state.underline}
            onClick={run((c) => c.toggleUnderline())}
          />
          <ToolbarButton
            icon={Strikethrough}
            label="Strikethrough"
            active={state.strike}
            onClick={run((c) => c.toggleStrike())}
          />
          <span className="rte__divider" />
          <ToolbarButton
            icon={List}
            label="Bulleted list"
            active={state.bulletList}
            onClick={run((c) => c.toggleBulletList())}
          />
          <ToolbarButton
            icon={ListOrdered}
            label="Numbered list"
            active={state.orderedList}
            onClick={run((c) => c.toggleOrderedList())}
          />
          <ToolbarButton
            icon={Quote}
            label="Quote"
            active={state.blockquote}
            onClick={run((c) => c.toggleBlockquote())}
          />
          <ToolbarButton
            icon={Minus}
            label="Divider line"
            onClick={run((c) => c.setHorizontalRule())}
          />
          <LinkControl editor={editor} active={state.link} />
          {onUploadImage && (
            <>
              <ToolbarButton
                icon={ImageIcon}
                label={uploading ? "Uploading…" : "Image"}
                disabled={uploading}
                onClick={() => imageInput.current?.click()}
              />
              <input
                ref={imageInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  insertImage(file);
                }}
              />
            </>
          )}
          <span className="rte__divider" />
          <ToolbarButton
            icon={Undo2}
            label="Undo"
            disabled={!state.canUndo}
            onClick={run((c) => c.undo())}
          />
          <ToolbarButton
            icon={Redo2}
            label="Redo"
            disabled={!state.canRedo}
            onClick={run((c) => c.redo())}
          />
        </div>
      )}
      <EditorContent editor={editor} className="rte__content" />
    </div>
  );
};

export default RichTextEditor;
