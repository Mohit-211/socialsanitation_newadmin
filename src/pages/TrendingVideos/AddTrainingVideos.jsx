/** @format */

import { Box } from "@mui/material";
import React, { useState } from "react";
import { Button, Card, Form, Input, Space, message } from "antd";
import { useNavigate } from "react-router-dom";
import { CreateVideos } from "../../services/Api/Api";

const AddTrainingVideos = () => {
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
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="30px">
                <div>
                    <h3 className="page-title">TRAINING VIDEO MANAGEMENT</h3>
                    <p className="page-sub-title">Add New Training Video</p>
                </div>
                <Button
                    icon={<i className="pi pi-arrow-left" />}
                    onClick={() => navigate("/training-videos")}
                    style={{ borderRadius: "5px", height: "47px" }}
                >
                    Return to Training Videos
                </Button>
            </Box>

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
                                icon={<i className="pi pi-check" />}
                            >
                                Save
                            </Button>
                            <Button
                                type="default"
                                onClick={() => navigate("/training-videos")}
                                icon={<i className="pi pi-times" />}
                            >
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </Box>
    );
};

export default AddTrainingVideos;
