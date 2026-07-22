/** @format */

import React, { useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box } from "@mui/material";
import { Card, List, Input, message } from "antd";
import Form from "react-bootstrap/Form";
import { Row, Col } from "react-bootstrap";
import "./Service.css";
import Button from "@mui/material/Button";
import { BASE_URL_IMAGE } from "../../services/Host";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import DeleteIcon from "@mui/icons-material/Delete";
import { GetServiceById, UpdateService } from "../../services/Api/ServiceApi";

const EditService = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [serviceData, setServiceData] = useState({
        name: "",
        description: "",
        price: "",
        abbreviation: "",
        service_attachments: [],
    });
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [removeImageIds, setRemoveImageIds] = useState([]);
    const [newChecklist, setNewChecklist] = useState([]); // New tasks
    const [updatedChecklist, setUpdatedChecklist] = useState([]); // Edited tasks
    const [removeChecklistIds, setRemoveChecklistIds] = useState([]);
    const [newTask, setNewTask] = useState("");

    useLayoutEffect(() => {
        GetServiceById(id)
            .then((res) => {
                const data = res.data.data;
                setServiceData({
                    ...data,
                    service_checklist: data.service_checklist || [],
                });

                if (
                    res.data.data.service_attachments &&
                    res.data.data.service_attachments.length > 0
                ) {
                    const previews = res.data.data.service_attachments.map(
                        (attachment) => `${BASE_URL_IMAGE}${attachment.file_name}`
                    );
                    setImagePreviews(previews);
                }
            })
            .catch((err) => {
                console.log(err, "error");
            });
    }, [id]);

    const handleEditorChange = (event, editor) => {
        const data = editor.getData();
        setServiceData((prevData) => ({
            ...prevData,
            description: data,
        }));
    };

    const handleImageChange = (e) => {
        const selectedImages = Array.from(e.target.files);

        // Update state for image previews
        const newPreviews = selectedImages.map((image) =>
            URL.createObjectURL(image)
        );
        setImagePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);

        // Update state for images
        setImages(selectedImages);
    };

    const handleRemoveImage = (index) => {
        const removedImage = serviceData.service_attachments[index];
        const updatedImages = [...images];
        const updatedPreviews = [...imagePreviews];
        const updatedRemoveImageIds = [...removeImageIds]; // Assuming you have a state for removeImageIds

        updatedImages.splice(index, 1);
        updatedPreviews.splice(index, 1);

        // Add the ID to removeImageIds if available
        if (removedImage && removedImage.id) {
            updatedRemoveImageIds.push(removedImage.id);
        }

        setImages(updatedImages);
        setImagePreviews(updatedPreviews);
        setRemoveImageIds(updatedRemoveImageIds); // Set the updated removeImageIds in your state
    };
    // ✅ Handle updating checklist items
    const handleChecklistChange = (index, value) => {
        const updated = [...serviceData.service_checklist];
        updated[index].task = value;
        setServiceData({ ...serviceData, service_checklist: updated });

        setUpdatedChecklist((prev) => {
            const existingIndex = prev.findIndex(
                (item) => item.id === updated[index].id
            );
            if (existingIndex !== -1) {
                prev[existingIndex].task = value;
            } else {
                prev.push({ id: updated[index].id, task: value });
            }
            return [...prev];
        });
    };

    // ✅ Add new checklist items
    // ✅ Add new checklist item & show it immediately in the UI
    const addChecklistItem = (e) => {
        e.preventDefault(); // Prevents page refresh

        if (newTask.trim() === "") {
            message.error("Task cannot be empty");
            return;
        }

        // ✅ Add new task to the list & mark it as a new item (no ID yet)
        const newTaskItem = { id: null, task: newTask };

        // ✅ Update UI immediately
        setServiceData((prevData) => ({
            ...prevData,
            service_checklist: [...prevData.service_checklist, newTaskItem], // Append new task
        }));

        setNewChecklist([...newChecklist, newTask]); // ✅ Store separately for API submission
        setNewTask(""); // Clear input field
    };

    // ✅ Remove checklist items
    const removeChecklistItem = (index, item) => {
        const updatedChecklist = serviceData.service_checklist.filter(
            (_, i) => i !== index
        );
        setServiceData({ ...serviceData, service_checklist: updatedChecklist });

        if (item.id) {
            setRemoveChecklistIds((prev) => [...prev, item.id]);
        }
    };

    const onChange = (e) => {
        setServiceData({ ...serviceData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();

        // ✅ Append basic fields
        formData.append("name", serviceData?.name || "");
        formData.append("description", serviceData?.description || "");
        formData.append("price", serviceData?.price || "");
        formData.append("abbreviation", serviceData?.abbreviation || "");

        // ✅ Append images
        images.forEach((image) => {
            formData.append("images", image);
        });

        // ✅ Append removeImageIds
        removeImageIds.forEach((id) => {
            formData.append("removeImageIds", id);
        });

        // ✅ Convert checklist updates into JSON string format
        if (updatedChecklist.length > 0) {
            formData.append("updatedChecklist", JSON.stringify(updatedChecklist));
        }
        if (removeChecklistIds.length > 0) {
            formData.append("removeChecklistIds", JSON.stringify(removeChecklistIds));
        }
        if (newChecklist.length > 0) {
            formData.append("newChecklist", JSON.stringify(newChecklist));
        }

        // ✅ Send to API
        try {
            const res = await UpdateService(id, formData);
            if (res.status === 200) {
                message.success("Service updated successfully!");
                navigate("/services");
            }
        } catch (error) {
            message.error("Something went wrong");
        }
    };

    const navigateToService = () => {
        navigate("/services");
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
                    <h3 className="page-title">Update Service</h3>
                    <p className="page-sub-title">Edit Details of Service</p>
                </div>
                <div>
                    <Button
                        icon="pi pi-arrow-left"
                        severity="secondary"
                        onClick={navigateToService}
                        style={{ borderRadius: "5px", height: "47px" }}
                    >
                        <span style={{ marginLeft: "5px" }}>Return to Service</span>
                    </Button>
                </div>
            </Box>
            <Card style={{ width: "100%" }}>
                <Form>
                    <Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Service Name:</Form.Label>
                            <Form.Control
                                name="name"
                                defaultValue={serviceData?.name}
                                type="text"
                                onChange={(e) => onChange(e)}
                            />
                        </Form.Group>
                    </Row>

                    <Row>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>Abbreviation:</Form.Label>
                                <Form.Control
                                    name="abbreviation"
                                    defaultValue={serviceData?.abbreviation}
                                    type="text"
                                    onChange={(e) => onChange(e)}
                                />
                            </Form.Group>
                        </Col>

                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>Price:</Form.Label>
                                <Form.Control
                                    name="price"
                                    defaultValue={serviceData?.price}
                                    type="number"
                                    onChange={(e) => onChange(e)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Images:</Form.Label>
                            <Form.Control
                                type="file"
                                name="images"
                                onChange={handleImageChange}
                                multiple
                            />
                            {imagePreviews.map((preview, index) => (
                                <div
                                    key={index}
                                    style={{
                                        border: "1px solid #ccc",
                                        borderRadius: "5px",
                                        padding: "10px",
                                        marginBottom: "10px",
                                        marginTop: "20px",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <img
                                            src={preview}
                                            alt={`Preview ${index}`}
                                            crossOrigin="anonymous"
                                            style={{
                                                height: "80px",
                                                width: "80px",
                                                marginRight: "10px",
                                            }}
                                        />
                                        <span>{preview.name}</span>
                                        <DeleteIcon
                                            fontSize="large"
                                            color="warning"
                                            style={{ marginLeft: "auto", cursor: "pointer" }}
                                            onClick={() => handleRemoveImage(index)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </Form.Group>
                    </Row>

                    {/* ✅ Checklist Section */}
                    <Form.Group className="mb-3">
                        <Form.Label>Service Checklist:</Form.Label>
                        <List
                            dataSource={serviceData.service_checklist}
                            renderItem={(item, index) => (
                                <List.Item
                                    actions={[
                                        <DeleteOutlined
                                            onClick={() => removeChecklistItem(index, item)}
                                        />,
                                    ]}
                                >
                                    <Input
                                        value={item.task}
                                        onChange={(e) =>
                                            handleChecklistChange(index, e.target.value)
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Form.Group>

                    {/* ✅ New Task Input & Add Button */}
                    <Input
                        placeholder="New Task"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                addChecklistItem();
                            }
                        }}
                    />
                    <Button
                        type="button"
                        onClick={addChecklistItem}
                        style={{
                            marginTop: "10px",
                            height: "20px",
                            // padding: "10px",
                            borderRadius: "5px",
                            marginBottom: "10px",
                        }}
                        label="Add Task"
                        icon="pi pi-plus"
                        severity="info"
                    />

                    <Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Description:</Form.Label>
                            <CKEditor
                                editor={ClassicEditor}
                                onChange={handleEditorChange}
                                data={serviceData.description}
                                config={{
                                    height: "50%",
                                }}
                            />
                        </Form.Group>
                    </Row>

                    <div>
                        <Button
                            icon="pi pi-check"
                            severity="info"
                            onClick={handleSubmit}
                            style={{
                                height: "45px",
                                padding: "20px",
                                borderRadius: "5px",
                            }}
                        >
                            Save
                        </Button>

                        <Button
                            icon="pi pi-times"
                            severity="secondary"
                            onClick={navigateToService}
                            style={{
                                marginLeft: "10px",
                                marginTop: "10px",
                                height: "45px",
                                padding: "20px",
                                borderRadius: "5px",
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </Form>
            </Card>
        </Box>
    );
};

export default EditService;
