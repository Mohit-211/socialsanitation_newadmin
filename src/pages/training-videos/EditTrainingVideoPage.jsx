import { useLayoutEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Form, Card, Button, Input, Space, message } from "antd";
import { ArrowLeft, Check, X } from "lucide-react";
import { getVideo, updateVideo } from "@/services/api/trainingVideoApi";
import PageHeader from "@/components/PageHeader";

const EditTrainingVideoPage = () => {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [disable, setDisable] = useState(false);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    getVideo(id)
      .then((res) => {
        const data = res.data.data;
        setTitle(data?.title || "");
        setVideoLink(data?.video_link || "");
      })
      .catch((err) => {
        console.error("Error fetching video:", err);
      });
  }, [id]);

  const handleSubmit = async () => {
    const payload = {
      title,
      video_link: videoLink,
    };

    setDisable(true);

    try {
      const res = await updateVideo(id, payload);
      if (res.status === 200) {
        message.success("Video updated successfully!");
        setTimeout(() => navigate("/training-videos"), 1000);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        message.error("Token expired");
        localStorage.removeItem("adminToken");
        setTimeout(() => navigate("/Login"), 1000);
      } else {
        message.error("Something went wrong");
      }
    }

    setDisable(false);
  };

  return (
    <div>
      <PageHeader
        title="TRAINING VIDEO MANAGEMENT"
        subtitle="Update this training video"
        actions={
          <Button
            size="large"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate("/training-videos")}
          >
            Return to Training Videos
          </Button>
        }
      />

      <Card>
        <Form layout="vertical" onFinish={handleSubmit}>
          {/* Title */}
          <Form.Item label="Title" required>
            <Input
              placeholder="Enter video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%" }}
            />
          </Form.Item>

          {/* Video Link */}
          <Form.Item label="Video Link" required>
            <Input
              placeholder="Enter video link (YouTube / direct link)"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={disable}
                icon={<Check size={16} />}
              >
                Save
              </Button>
              <Button
                type="default"
                onClick={() => navigate("/training-videos")}
                icon={<X size={16} />}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EditTrainingVideoPage;