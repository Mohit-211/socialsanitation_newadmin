import { useState } from "react";
import { Button, Card, Form, Input, Space, message } from "antd";
import { ArrowLeft, Check, X } from "lucide-react";
import { useNavigate } from "react-router";
import { CreateVideos } from "@/services/api/trainingVideoApi";
import PageHeader from "@/components/PageHeader";

const AddTrainingVideoPage = () => {
    const [title, setTitle] = useState("");
    const [videoLink, setVideoLink] = useState("");
    const [disable, setDisable] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async () => {
        setDisable(true);

        const payload = {
            title,
            video_link: videoLink,
        };

        try {
            const response = await CreateVideos(payload);
            if (response.status === 201) {
                message.success("Video created successfully");
                setTimeout(() => navigate("/training-videos"), 1000);
            }
        } catch (error) {
            if (error.response?.status === 400) {
                message.error("Video already exists");
            } else if (error.response?.status === 401) {
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
                subtitle="Add a new training video"
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
                            placeholder="Enter Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </Form.Item>

                    {/* Video Link */}
                    <Form.Item label="Video Link" required>
                        <Input
                            placeholder="Enter Video URL (e.g. YouTube link)"
                            value={videoLink}
                            onChange={(e) => setVideoLink(e.target.value)}
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

export default AddTrainingVideoPage;