/** @format */

import { Box } from "@mui/material";
import React, { useLayoutEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Card, Button, Input, Space, message } from "antd";
import { GetVideoById, UpdateVideo } from "../../services/Api/Api";

const EditTrainingVideos = () => {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [disable, setDisable] = useState(false);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    GetVideoById(id)
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
      const res = await UpdateVideo(id, payload); // PUT/PATCH API call
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
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        marginBottom="20px"
      >
        <div>
          <h3 className="page-title">TRAINING VIDEO MANAGEMENT</h3>
          <p className="page-sub-title">Update Training Video</p>
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

export default EditTrainingVideos;
