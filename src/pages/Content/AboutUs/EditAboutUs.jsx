import React, { useLayoutEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Box } from "@mui/material";
import { Card } from "antd";
import { Form, Input, message } from "antd";
import { Editor } from "@tinymce/tinymce-react";
import Button from "@mui/material/Button";
import { UpdateAboutUs } from "../../../services/Api/ContentApi";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const EditAboutUs = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = location.state;
  console.log("cardadta==>", data, data.id);

  const [contentData, setContentData] = useState({
    heading: data?.heading || "",
    description: data?.description || "",
  });
  const [editorData, setEditorData] = useState(contentData?.description || "");

  const onChange = (e) => {
    setContentData({ ...contentData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append(
      "heading",
      contentData?.heading ? contentData?.heading : ""
    );
    formData.append("description", editorData ? editorData : "");

    UpdateAboutUs(data.id, formData)
      .then((res) => {
        if (res.status === 200) {
          message.success("About us edited successfully!");
        }
        navigate("/aboutUs");
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          message.error("Token expired!");
          localStorage.removeItem("adminToken");
          setTimeout(() => {
            navigate("/Login");
          }, 3000);
        } else {
          message.error("Something went wrong");
        }
      });
  };

  const handleEditorChange = (event, editor) => {
    const data = editor.getData();
    setEditorData(data);
  };

  const navigateToService = () => {
    navigate("/aboutUs");
  };

  return (
    <Box>
      <Box style={{ marginBottom: "30px" }}>
        <h3 className="page-title">Update ABOUT US</h3>
      </Box>
      <Card style={{ width: "100%" }}>
        <Form
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 14 }}
          style={{ width: "1745px" }}
          layout="vertical"
        >
          {/* <Form.Item label="Heading:">
            <Input
              style={{ color: "black", height: "40px" }}
              value={contentData.heading}
              onChange={(e) => onChange(e)}
              name="heading"
            />
          </Form.Item> */}

          <Form.Item label="Description:" name="description">
            <CKEditor
              data={contentData?.description}
              editor={ClassicEditor}
              onChange={handleEditorChange}
              config={{
                height: "50%",
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              icon="pi pi-check"
              severity="success"
              htmlType="submit"
              onClick={handleSubmit}
              style={{
                borderRadius: "5px",
                margin: "0px 0px",
                height: "40px",
              }}
            >
              Save
            </Button>

            <Button
              icon="pi pi-times"
              severity="secondary"
              onClick={navigateToService}
              style={{
                borderRadius: "5px",
                marginLeft: "10px",
                height: "40px",
              }}
            >
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Box>
  );
};

export default EditAboutUs;
