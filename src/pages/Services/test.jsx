/** @format */
import React, { useState } from "react";
import { Form, Input, Button, Upload, message, Card, List } from "antd";
import {
    PlusOutlined,
    DeleteOutlined,
    ArrowLeftOutlined,
} from "@ant-design/icons";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";
import { CreateSerice } from "../../services/Api/ServiceApi";
import { Box } from "@mui/material";
const AddService = () => {
    const [form] = Form.useForm();
    const [images, setImages] = useState([]);
    const [disable, setDisable] = useState(false);
    const [checklist, setChecklist] = useState([]); // 🟢 Checklist state
    const [task, setTask] = useState(""); // 🟢 Task input
    const navigate = useNavigate();

    // 🟢 Handle adding checklist items
    const addChecklistItem = () => {
        if (task.trim() === "") {
            message.error("Task cannot be empty");
            return;
        }
        setChecklist([...checklist, task]);
        setTask("");
    };

    // 🟢 Handle removing checklist items
    const removeChecklistItem = (index) => {
        const updatedChecklist = checklist.filter((_, i) => i !== index);
        setChecklist(updatedChecklist);
    };

    const handleImageUpload = async ({ file, onSuccess, onError }) => {
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

        if (!allowedTypes.includes(file.type)) {
            message.error("Invalid file type. Only JPEG, JPG, and PNG are allowed.");
            onError();
            return;
        }

        try {
            const compressedFile =
                file.size <= 1024 * 1024
                    ? file
                    : await imageCompression(file, {
                            maxSizeMB: 1,
                            maxWidthOrHeight: 1920,
                      });

            setImages((prev) => [...prev, compressedFile]);
            onSuccess("ok");
        } catch (error) {
            message.error("Image compression failed.");
            onError(error);
        }
    };

    const handleRemoveImage = (file) => {
        setImages((prev) => prev.filter((img) => img !== file));
    };

    const handleSubmit = async (values) => {
        setDisable(true);
        const { name, abbreviation, price, description } = values;

        if (!/^[A-Za-z]{3}$/.test(abbreviation)) {
            message.error("Abbreviation must be exactly three alphabets");
            setDisable(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("abbreviation", abbreviation);
            formData.append("price", price);
            formData.append("description", description);

            // 🟢 Add checklist to form data (if provided)
            if (checklist.length > 0) {
                formData.append("checklist", JSON.stringify(checklist));
            }

            images.forEach((image, index) => {
                formData.append(`images`, image, `compressed_image_${index}.jpg`);
            });

            const response = await CreateSerice(formData);
            if (response.status === 201) {
                message.success("Service added successfully!");
                navigate("/services");
            }
        } catch (error) {
            if (error.response?.status === 401) {
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
        <Card bordered={false}>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                marginBottom="30px"
            >
                <div>
                    <h3 className="page-title">CREATE SERVICE</h3>
                    <p className="page-sub-title">Add a new service</p>
                </div>
                <div>
                    <Button
                        style={{ marginLeft: "10px",backgroundColor:"lightgray" }}
                        onClick={() => navigate("/services")}
                        icon={<ArrowLeftOutlined />}
                    >
                        Return to Services
                    </Button>
                </div>
            </Box>
            <Form layout="vertical" form={form} onFinish={handleSubmit}>
                <Form.Item
                    label="Service Name"
                    name="name"
                    rules={[{ required: true, message: "Please enter service name" }]}
                >
                    <Input placeholder="Enter Service Name" />
                </Form.Item>

                <Form.Item
                    label="Abbreviation"
                    name="abbreviation"
                    rules={[{ required: true, message: "Please enter abbreviation" }]}
                >
                    <Input placeholder="Enter Abbreviation" />
                </Form.Item>

                <Form.Item
                    label="Price"
                    name="price"
                    rules={[{ required: true, message: "Please enter price" }]}
                >
                    <Input type="number" placeholder="Enter Price" />
                </Form.Item>

                <Form.Item label="Image">
                    <Upload
                        customRequest={handleImageUpload}
                        listType="picture-card"
                        onRemove={handleRemoveImage}
                        multiple
                    >
                        {images.length < 5 && <PlusOutlined />}
                    </Upload>
                </Form.Item>

                <Form.Item label="Checklist">
                    <Input
                        placeholder="Enter Task"
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                        onPressEnter={addChecklistItem}
                    />
                    <Button
                        type="primary"
                        onClick={addChecklistItem}
                        style={{ marginTop: "10px" }}
                    >
                        Add Task
                    </Button>
                    <List
                        dataSource={checklist}
                        renderItem={(item, index) => (
                            <List.Item
                                actions={[
                                    <DeleteOutlined
                                        style={{ color: "red", cursor: "pointer" }}
                                        onClick={() => removeChecklistItem(index)}
                                    />,
                                ]}
                            >
                                {item}
                            </List.Item>
                        )}
                        style={{ marginTop: "10px" }}
                    />
                </Form.Item>

                <Form.Item label="Description" name="description">
                    <CKEditor
                        editor={ClassicEditor}
                        onChange={(event, editor) =>
                            form.setFieldsValue({ description: editor.getData() })
                        }
                    />
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={disable}
                        icon={<PlusOutlined />}
                    >
                        {disable ? "Saving..." : "Save"}
                    </Button>
                    <Button
                        style={{ marginLeft: "10px" }}
                        onClick={() => navigate("/services")}
                        icon={<DeleteOutlined />}
                    >
                        Cancel
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default AddService;
