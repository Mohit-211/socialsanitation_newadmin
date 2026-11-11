import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, Empty, Input, Modal, Space, Typography, message } from "antd";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import { useApiQuery } from "@/hooks/useApiQuery";
import { PERMISSION, useCan } from "@/lib/session";
import { blogCategories, blogTags, type BlogTaxonomy } from "@/services/api/blogApi";
import { errorMessage, itemsOf } from "@/services/apiResult";
import "./blog.scss";
import type { BlogTerm } from "@/types";

// One list of names (categories or tags): add, rename in place, delete.
const NamesCard = ({ title, api, deleteNote }: { title: string; api: BlogTaxonomy; deleteNote: string }) => {
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [name, setName] = useState("");
  const { data: rows, reload } = useApiQuery(() => api.list().then(itemsOf), [], {
    initial: [],
    errorText: `Couldn't load the ${title.toLowerCase()}`,
  });

  const add = async () => {
    if (!name.trim()) return;
    try {
      await api.create(name.trim());
      setName("");
      reload();
    } catch (error) {
      message.error(errorMessage(error, "Couldn't add it"));
    }
  };

  const rename = async (row: BlogTerm, next: string) => {
    if (!next.trim() || next.trim() === row.name) return;
    try {
      await api.rename(row.id, next.trim());
      reload();
    } catch (error) {
      message.error(errorMessage(error, "Couldn't rename it"));
    }
  };

  const confirmDelete = (row: BlogTerm) =>
    Modal.confirm({
      title: `Delete "${row.name}"?`,
      content: deleteNote,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await api.remove(row.id);
          reload();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete it"));
        }
      },
    });

  return (
    <Card title={title} className="form-card">
      <Space.Compact block className="blog-names__add">
        <Input placeholder={`A new ${title.slice(0, -1).toLowerCase()}`} value={name} onChange={(e) => setName(e.target.value)} onPressEnter={add} maxLength={120} />
        <Button type="primary" icon={<Plus size={16} />} onClick={add} disabled={!name.trim()}>
          Add
        </Button>
      </Space.Compact>
      {(rows || []).length === 0 ? (
        <Empty description="None yet." />
      ) : (
        <ul className="blog-names">
          {rows.map((row) => (
            <li key={row.id}>
              <Typography.Text editable={{ onChange: (next) => rename(row, next), tooltip: "Rename" }}>{row.name}</Typography.Text>
              {canDelete && <IconAction icon={Trash2} title="Delete" danger onClick={() => confirmDelete(row)} />}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

// The blog's categories and tags.
const BlogTaxonomyPage = () => {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        title="BLOG CATEGORIES AND TAGS"
        subtitle="A rename keeps each one's address on the website"
        actions={
          <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => navigate("/blog")}>
            All Posts
          </Button>
        }
      />
      <div className="blog-names__grid">
        <NamesCard title="Categories" api={blogCategories} deleteNote="Its posts stay, with no category." />
        <NamesCard title="Tags" api={blogTags} deleteNote="It comes off every post that has it." />
      </div>
    </>
  );
};

export default BlogTaxonomyPage;
