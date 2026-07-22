import React from "react";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { Modal, Space } from "antd";
import Button from "@mui/material/Button";
const { confirm } = Modal;
const Alert = ({ handleDelete, title }) => {
  const showDeleteConfirm = () => {
    confirm({
      title: `Are you sure you want to delete this ${title}?`,
      icon: <ExclamationCircleFilled />,
      content: "",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",

      onOk() {
        handleDelete(); // Call the handleDelete function provided via props
        // console.log('OK');
      },
      onCancel() {
        // console.log('Cancel');
      },
    });
  };
  return (
    <Space wrap>
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        style={{  borderRadius: "25px" }}
        onClick={showDeleteConfirm}
      ></Button>
    </Space>
  );
};
export default Alert;
