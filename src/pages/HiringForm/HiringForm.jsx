import { useEffect, useState } from "react";
import { Table, Input, Modal, message, Space, Button } from "antd";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import dayjs from "@/lib/dayjs";
import {
  DeleteHiringForm,
  GetAllHiringForm,
} from "../../services/Api/HiringFormApi";

const HiringForm = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 100,
    },
    sortField: null,
    sortOrder: null,
  });

  // 🔹 Shared helper — pulls the personalInfo submission once so every
  // getter below stays cheap and consistent.
  const getPersonalInfo = (record) => {
    const personalInfoSubmission = record.details_form_submission?.find(
      (sub) => sub.section_name === "personalInfo",
    );
    if (!personalInfoSubmission) return null;
    try {
      return JSON.parse(personalInfoSubmission.data);
    } catch {
      return null;
    }
  };

  // Coerces any value (string, number, null, undefined, etc.) into a
  // trimmed string, so callers never crash on a non-string field.
  const safeTrim = (value) =>
    typeof value === "string" ? value.trim() : String(value ?? "").trim();

  const getFullName = (record) => {
    const info = getPersonalInfo(record);
    if (!info) return "";
    const { firstName = "", middleName = "", lastName = "" } = info;
    return [safeTrim(firstName), safeTrim(middleName), safeTrim(lastName)]
      .filter(Boolean)
      .join(" ");
  };

  const getEmail = (record) => {
    const info = getPersonalInfo(record);
    return info?.email ? safeTrim(info.email) : "";
  };

  // The hiring form only started collecting a country recently — older
  // submissions simply don't have the field. Every one of those was
  // filled out before Canada was an option, so they were all USA.
  const getCountry = (record) => {
    const info = getPersonalInfo(record);
    const raw = info?.country ? safeTrim(info.country) : "";
    return raw || "USA";
  };

  // Combines street + apt/suite + city + state + zip into one display
  // string. This is the only address stored on the hiring form — the
  // "policy" (Florida non-compete) section repeats the same values into
  // the agreement text, it isn't a separate address. Country is shown
  // in its own column rather than folded in here, so it stays easy to
  // scan and sort on its own.
  const getFullAddress = (record) => {
    const info = getPersonalInfo(record);
    if (!info) return "";
    const {
      streetAddress = "",
      aptSuite = "",
      city = "",
      state = "",
      zipCode = "",
    } = info;
    const street = safeTrim(streetAddress);
    const apt = safeTrim(aptSuite);
    const cityStr = safeTrim(city);
    const stateStr = safeTrim(state);
    const zip = safeTrim(zipCode);

    const line1 = [street, apt ? `#${apt}` : ""].filter(Boolean).join(" ");
    const line2 = [cityStr, stateStr].filter(Boolean).join(", ");
    return [line1, [line2, zip].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", ");
  };

  // Unified delete handler — always sends an array of ids to the API,
  // e.g. { ids: [12, 15, 18, 21] }. Works for both single-row delete
  // and bulk delete from the selection toolbar.
  const handleDelete = (ids) => {
    const count = ids.length;
    Modal.confirm({
      title: count > 1 ? "Delete Forms" : "Delete Form",
      content:
        count > 1
          ? `Are you sure you want to delete these ${count} forms?`
          : "Are you sure you want to delete this form?",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        await DeleteHiringForm(ids);
        message.success(count > 1 ? "Forms deleted" : "Form deleted");
        setSelectedRowKeys((prev) => prev.filter((key) => !ids.includes(key)));
        getData();
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) return;
    handleDelete(selectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const columns = [
    {
      title: "S.No.",
      dataIndex: "index",
      width: "5%",
      sorter: (a, b) => a.index - b.index,
    },
    {
      title: "User's Name",
      dataIndex: "details_form_submission",
      render: (_, record) => getFullName(record) || "N/A",
      sorter: (a, b) => getFullName(a).localeCompare(getFullName(b)),
      width: "17%",
    },
    {
      title: "Email",
      dataIndex: "details_form_submission",
      render: (_, record) => getEmail(record) || "N/A",
      width: "18%",
    },
    {
      title: "Address",
      dataIndex: "details_form_submission",
      render: (_, record) => getFullAddress(record) || "N/A",
      width: "22%",
    },
    {
      title: "Country",
      dataIndex: "details_form_submission",
      render: (_, record) => getCountry(record),
      sorter: (a, b) => getCountry(a).localeCompare(getCountry(b)),
      width: "10%",
    },
    {
      title: "Date",
      dataIndex: "created_at",
      width: "18%",
      render: (date) => dayjs(date).format("MM/DD/YYYY HH:mm A"),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            outlined
            primary
            onClick={(event) => navigateToEditService(event, record.id)}
            size="small"
          >
            View Form
          </Button>
          <Button
            danger
            size="small"
            outlined
            onClick={() => handleDelete([record.id])}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const getData = async (params = {}) => {
    try {
      setLoading(true);
      let result = await GetAllHiringForm(
        localStorage.getItem("adminToken"),
        params,
      );
      const newData = result.data.data.map((item, index) => ({
        ...item,
        index: index + 1,
      }));
      setData(newData);
      setFilteredData(newData);
    } catch (e) {
      console.error(e);
      if (e.response && e.response.status === 401) {
        navigate("/error401");
        console.error("You do not have access to this page as a sub-admin.");
      } else {
        console.error("Error loading data. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData({
      page: tableParams.pagination.current,
      pageSize: tableParams.pagination.pageSize,
      sortField: tableParams.sortField,
      sortOrder: tableParams.sortOrder,
    });
  }, [tableParams]);

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      pagination,
      filters,
      sortField: sorter.field,
      sortOrder: sorter.order,
    });
  };

  const navigateToEditService = (event, id) => {
    navigate(`/view-form/${id}`);
  };

  // 🔍 Filter data when search changes — matches name, email, country, or
  // ANY part of the address (street, apt/suite, city, state, or zip),
  // since getFullAddress() concatenates the address parts into one
  // searchable string and getCountry() covers country separately.
  useEffect(() => {
    const lowerSearch = searchText.toLowerCase();
    const filtered = data.filter((item) => {
      const name = getFullName(item).toLowerCase();
      const email = getEmail(item).toLowerCase();
      const address = getFullAddress(item).toLowerCase();
      const country = getCountry(item).toLowerCase();
      return (
        name.includes(lowerSearch) ||
        email.includes(lowerSearch) ||
        address.includes(lowerSearch) ||
        country.includes(lowerSearch)
      );
    });
    setFilteredData(filtered);
  }, [searchText, data]);

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: "10px",
          borderColor: "#eef0f2",
        }}
      >
        <Stack useFlexGap
          direction="row"
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography className="page-title">
              EMPLOYEE HIRING FORM MANAGEMENT
            </Typography>

            <Typography className="page-sub-title">
              View Employee Hiring Form
            </Typography>
          </Box>

          <Stack
            useFlexGap
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: "center",
              flexWrap: { xs: "wrap", md: "nowrap" },
              width: { xs: "100%", md: "auto" },
            }}
          >
            {selectedRowKeys.length > 0 && (
              <Button
                danger
                type="primary"
                icon={<Trash2 size={14} />}
                onClick={handleBulkDelete}
                style={{
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                Delete Selected ({selectedRowKeys.length})
              </Button>
            )}

            <Input
              allowClear
              placeholder="Search by name, email, address, or country..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                width: 320,
                maxWidth: "100%",
                height: 44,
              }}
            />
          </Stack>
        </Stack>
      </Paper>

      <Table
        columns={columns}
        rowKey={(record) => record.id}
        dataSource={filteredData}
        pagination={tableParams.pagination}
        loading={loading}
        onChange={handleTableChange}
        rowSelection={rowSelection}
      />
    </Box>
  );
};

export default HiringForm;