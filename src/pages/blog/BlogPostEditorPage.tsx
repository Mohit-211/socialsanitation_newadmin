import { useState } from "react";
import { useNavigate } from "react-router";
import { Alert, Button, Card, Collapse, DatePicker, Form, Input, Select, Space, Spin, Tag, Upload, message } from "antd";
import { ArrowLeft, CalendarClock, EyeOff, ImagePlus, Send, Trash2 } from "lucide-react";
import dayjs from "@/lib/dayjs";
import type { Dayjs } from "dayjs";
import PageHeader from "@/components/PageHeader";
import RichTextEditor from "@/components/RichTextEditor";
import { useApiQuery } from "@/hooks/useApiQuery";
import {
  blogCategories,
  blogTags,
  createBlogPost,
  getBlogPost,
  publishBlogPost,
  unpublishBlogPost,
  updateBlogPost,
  uploadBlogImages,
} from "@/services/api/blogApi";
import { dataOf, errorMessage, itemsOf } from "@/services/apiResult";
import { formatDateTime } from "@/utils/datetime";
import { postStatus } from "./blogFields";
import { acceptOf } from "@/utils/uploads";
import "./blog.scss";
import { useRouteParam } from "@/hooks/useRouteParam";
import type { BlogPost, BlogPostInput } from "@/types";

/** The post form's fields. */
interface BlogFormValues {
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string;
  category_id?: number;
  tag_ids: number[];
  author_name: string;
  seo_title: string;
  seo_description: string;
  body: string;
}

const uploadOne = async (file: File) => itemsOf(await uploadBlogImages([file]))[0]?.url;

const valuesOf = (post: BlogPost | null): BlogFormValues => ({
  title: post?.title || "",
  slug: post?.slug || "",
  excerpt: post?.excerpt || "",
  cover_image: post?.cover_image || "",
  category_id: post?.category?.id ?? undefined,
  tag_ids: (post?.tags || []).map((tag) => tag.id),
  author_name: post?.author_name || "",
  seo_title: post?.seo_title || "",
  seo_description: post?.seo_description || "",
  body: post?.body || "",
});

const bodyOf = (values: BlogFormValues): BlogPostInput => ({
  title: values.title.trim(),
  ...(values.slug?.trim() ? { slug: values.slug.trim() } : {}),
  excerpt: values.excerpt?.trim() || null,
  cover_image: values.cover_image || null,
  category_id: values.category_id ?? null,
  tag_ids: values.tag_ids || [],
  author_name: values.author_name?.trim() || null,
  seo_title: values.seo_title?.trim() || null,
  seo_description: values.seo_description?.trim() || null,
  body: values.body,
});

// A blog post: write it, add a cover and images, then publish it now or at a
// time; a live post can go back to a draft. The server cleans the body on
// save, and the editor shows what it kept.
const BlogPostEditorPage = () => {
  const id = useRouteParam();
  const navigate = useNavigate();
  const [form] = Form.useForm<BlogFormValues>();
  const [saving, setSaving] = useState(false);
  const [scheduleAt, setScheduleAt] = useState<Dayjs | null>(null);
  const cover = Form.useWatch("cover_image", form);

  const { data: post, loading, setData: setPost } = useApiQuery(() => getBlogPost(id).then(dataOf), [id], {
    skip: !id,
    errorText: "Couldn't load the post",
  });
  const { data: categories } = useApiQuery(() => blogCategories.list().then(itemsOf), [], { initial: [] });
  const { data: tags } = useApiQuery(() => blogTags.list().then(itemsOf), [], { initial: [] });

  // Saves the form; answers the saved post (or null when the form isn't ready).
  const save = async () => {
    let values: BlogFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return null;
    }
    setSaving(true);
    try {
      if (!id) {
        const created = dataOf(await createBlogPost(bodyOf(values)));
        message.success("Draft saved");
        navigate(`/blog/${created.id}`, { replace: true });
        return created;
      }
      const saved = dataOf(await updateBlogPost(id, bodyOf(values)));
      setPost(saved);
      form.setFieldsValue(valuesOf(saved));
      message.success("Post saved");
      return saved;
    } catch (error) {
      message.error(errorMessage(error, "Couldn't save the post"));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const publish = async (when: Dayjs | null) => {
    const saved = await save();
    if (!saved?.id) return;
    try {
      const published = dataOf(await publishBlogPost(saved.id, when ? when.toISOString() : undefined));
      if (published) setPost((current) => ({ ...current, ...published }));
      message.success(when ? `Scheduled for ${formatDateTime(when)}` : "Published");
      setScheduleAt(null);
      if (!id) navigate(`/blog/${saved.id}`, { replace: true });
    } catch (error) {
      message.error(errorMessage(error, "Couldn't publish the post"));
    }
  };

  const unpublish = async () => {
    try {
      const draft = dataOf(await unpublishBlogPost(id));
      setPost((current) => current && { ...current, ...draft, status: "draft" });
      message.success("Back to a draft, off the website");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't unpublish the post"));
    }
  };

  if (id && loading && !post) {
    return (
      <div className="page-loader">
        <Spin size="large" />
      </div>
    );
  }

  const status = postStatus(post?.status || "draft");
  const live = post?.status === "published" || post?.status === "scheduled";

  return (
    <>
      <PageHeader
        title={id ? "EDIT POST" : "NEW POST"}
        subtitle={
          <Space size={8} wrap>
            <Tag color={status.color}>{status.label}</Tag>
            {post?.published_at && post.status !== "draft" && <span>{formatDateTime(post.published_at)}</span>}
          </Space>
        }
        actions={
          <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => navigate("/blog")}>
            All Posts
          </Button>
        }
      />
      <Form
        key={post?.id || "new"}
        form={form}
        layout="vertical"
        requiredMark="optional"
        initialValues={valuesOf(post)}
        className="blog-editor"
      >
        <div className="blog-editor__main">
          <Card className="form-card">
            <Form.Item label="Title" name="title" rules={[{ required: true, whitespace: true, message: "Give the post a title" }]}>
              <Input size="large" maxLength={200} />
            </Form.Item>
            <Form.Item
              label="Body"
              name="body"
              rules={[{ required: true, message: "Write the post" }]}
              extra="Images come from the Image button; the server keeps text, links, lists, tables and those images."
            >
              <RichTextEditor placeholder="Write the post…" minHeight={360} onUploadImage={uploadOne} />
            </Form.Item>
            <Form.Item label="Excerpt" name="excerpt" extra="Shown in lists; written from the body when left empty.">
              <Input.TextArea rows={2} maxLength={500} showCount />
            </Form.Item>
          </Card>
        </div>
        <aside className="blog-editor__side">
          <Card title="Publish" size="small" className="form-card">
            <Space orientation="vertical" style={{ width: "100%" }}>
              <Button block onClick={save} loading={saving}>
                Save
              </Button>
              <Button block type="primary" icon={<Send size={16} />} onClick={() => publish(null)} disabled={saving}>
                {post?.status === "published" ? "Save and Keep Live" : "Publish Now"}
              </Button>
              <Space.Compact block>
                <DatePicker
                  showTime={{ format: "h:mm A", use12Hours: true }}
                  format="MM/DD/YYYY h:mm A"
                  placeholder="Publish later"
                  value={scheduleAt}
                  onChange={setScheduleAt}
                  disabledDate={(date) => date && date.isBefore(dayjs(), "day")}
                  style={{ width: "100%" }}
                />
                <Button icon={<CalendarClock size={16} />} disabled={!scheduleAt || saving} onClick={() => publish(scheduleAt)}>
                  Schedule
                </Button>
              </Space.Compact>
              {id && live && (
                <Button block icon={<EyeOff size={16} />} onClick={unpublish}>
                  Unpublish
                </Button>
              )}
            </Space>
          </Card>
          <Card title="Cover Image" size="small" className="form-card">
            <Form.Item name="cover_image" hidden>
              <Input />
            </Form.Item>
            {cover ? (
              <div className="blog-editor__cover">
                <img src={cover} alt="Cover" />
                <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => form.setFieldValue("cover_image", "")}>
                  Remove
                </Button>
              </div>
            ) : (
              <Upload
                accept={acceptOf("image")}
                showUploadList={false}
                beforeUpload={(file) => {
                  uploadOne(file)
                    .then((url) => url && form.setFieldValue("cover_image", url))
                    .catch((error) => message.error(errorMessage(error, "Couldn't upload the image")));
                  return false;
                }}
              >
                <Button icon={<ImagePlus size={16} />}>Upload a Cover</Button>
              </Upload>
            )}
          </Card>
          <Card title="Sorting" size="small" className="form-card">
            <Form.Item label="Category" name="category_id">
              <Select
                allowClear
                placeholder="None"
                options={(categories || []).map((category) => ({ value: category.id, label: category.name }))}
              />
            </Form.Item>
            <Form.Item label="Tags" name="tag_ids">
              <Select
                mode="multiple"
                optionFilterProp="label"
                placeholder="None"
                options={(tags || []).map((tag) => ({ value: tag.id, label: tag.name }))}
              />
            </Form.Item>
            <Button type="link" onClick={() => navigate("/blog/categories")}>
              Manage categories and tags
            </Button>
          </Card>
          <Collapse
            className="form-card"
            items={[
              {
                key: "more",
                label: "Address, Author and Search",
                children: (
                  <>
                    {post?.first_published_at && (
                      <Alert type="info" showIcon className="blog-editor__note" title="A post keeps its address once it has been published." />
                    )}
                    <Form.Item
                      label="Address (slug)"
                      name="slug"
                      extra="Lower-case words joined by dashes; made from the title when left empty."
                      rules={[{ pattern: /^[a-z0-9]+(-[a-z0-9]+)*$/, message: "Lower-case words joined by dashes" }]}
                    >
                      <Input disabled={Boolean(post?.first_published_at)} />
                    </Form.Item>
                    <Form.Item label="Author" name="author_name" extra="Your name when left empty.">
                      <Input maxLength={200} />
                    </Form.Item>
                    <Form.Item label="Search Title" name="seo_title">
                      <Input maxLength={200} />
                    </Form.Item>
                    <Form.Item label="Search Description" name="seo_description">
                      <Input.TextArea rows={3} maxLength={300} showCount />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />
        </aside>
      </Form>
    </>
  );
};

export default BlogPostEditorPage;
