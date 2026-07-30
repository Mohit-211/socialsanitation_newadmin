/** @format */

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import MuiButton from "@mui/material/Button";
import React, { useState } from "react";
import { Button, Card, Form, Input, Space, message } from "antd";
import { ArrowLeft, Check, X } from "lucide-react";
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
            {/* Header Section */}
            <Paper
                variant="outlined"
                sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: "10px",
                    borderColor: "#eef0f2",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 2,
                        flexWrap: { xs: "wrap", md: "nowrap" },
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography className="page-title" noWrap>
                            TRAINING VIDEO MANAGEMENT
                        </Typography>
                        <Typography
                            className="page-sub-title"
                            sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Add a new training video
                        </Typography>
                    </Box>

                    <MuiButton
                        variant="contained"
                        disableElevation
                        startIcon={<ArrowLeft size={18} />}
                        onClick={() => navigate("/training-videos")}
                        sx={{
                            height: 46,
                            px: 3,
                            borderRadius: "8px",
                            minWidth: 180,
                            textTransform: "none",
                            fontWeight: 600,
                            backgroundColor: "#2c3345",
                            flexShrink: 0,
                            "&:hover": {
                                backgroundColor: "#1f2433",
                            },
                        }}
                    >
                        Return to Training Videos
                    </MuiButton>
                </Box>
            </Paper>

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
                                icon={<Check size={15} />}
                            >
                                Save
                            </Button>
                            <Button
                                type="default"
                                onClick={() => navigate("/training-videos")}
                                icon={<X size={15} />}
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