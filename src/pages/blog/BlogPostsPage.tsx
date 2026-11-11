import { useNavigate } from "react-router";
import { Button, Input, Modal, Select, Space, Table, Tag, message, type TableColumnsType } from "antd";
import { Pencil, Plus, Search, Tags, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import { usePagedList } from "@/hooks/usePagedList";
import { PERMISSION, useCan } from "@/lib/session";
import { deleteBlogPost, listBlogPosts } from "@/services/api/blogApi";
import { errorMessage } from "@/services/apiResult";
import { formatDate, formatDateTime } from "@/utils/datetime";
import { POST_STATUSES, postStatus } from "./blogFields";
import type { BlogPostSummary } from "@/types";

// The website's blog posts, latest edit first: write, schedule, publish.
const BlogPostsPage = () => {
  const navigate = useNavigate();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const list = usePagedList((query) => listBlogPosts(query), { limit: 20, errorText: "Couldn't load the posts" });

  const confirmDelete = (post: BlogPostSummary) =>
    Modal.confirm({
      title: `Delete "${post.title}"?`,
      content: "It comes off the website, and its address is never reused. This can't be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteBlogPost(post.id);
          message.success("Post deleted");
          list.reload();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete the post"));
        }
      },
    });

  const columns: TableColumnsType<BlogPostSummary> = [
    {
      title: "Post",
      dataIndex: "title",
      render: (title: string, post) => (
        <Button type="link" className="table-link" onClick={() => navigate(`/blog/${post.id}`)}>
          {title}
        </Button>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_value, post) => {
        const status = postStatus(post.status);
        return (
          <Space orientation="vertical" size={0}>
            <Tag color={status.color}>{status.label}</Tag>
            {post.published_at && post.status !== "draft" && (
              <span className="text-subtle">{formatDateTime(post.published_at)}</span>
            )}
          </Space>
        );
      },
    },
    { title: "Category", key: "category", render: (_value, post) => post.category?.name || "—" },
    { title: "Author", dataIndex: "author_name", render: (name: string | null) => name || "—" },
    { title: "Edited", dataIndex: "updated_at", render: (date: string) => formatDate(date) },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      render: (_value, post) => (
        <Space size={4}>
          <IconAction icon={Pencil} title="Edit" onClick={() => navigate(`/blog/${post.id}`)} />
          {canDelete && <IconAction icon={Trash2} title="Delete" danger onClick={() => confirmDelete(post)} />}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="BLOG"
        subtitle="Posts on the website. A new post is a draft until it is published."
        actions={
          <Space wrap>
            <Input
              allowClear
              size="large"
              prefix={<Search size={16} className="text-subtle" />}
              placeholder="Search posts"
              value={list.searchText}
              onChange={(e) => list.setSearchText(e.target.value)}
              style={{ width: 220 }}
            />
            <Select
              allowClear
              size="large"
              placeholder="Any status"
              value={list.filters.status}
              onChange={(value) => list.setFilter("status", value)}
              options={POST_STATUSES}
              style={{ width: 150 }}
            />
            <Button size="large" icon={<Tags size={16} />} onClick={() => navigate("/blog/categories")}>
              Categories and Tags
            </Button>
            <Button type="primary" size="large" icon={<Plus size={16} />} onClick={() => navigate("/blog/new")}>
              New Post
            </Button>
          </Space>
        }
      />
      <Table rowKey="id" size="middle" columns={columns} scroll={{ x: "max-content" }} {...list.tableProps} />
    </>
  );
};

export default BlogPostsPage;
