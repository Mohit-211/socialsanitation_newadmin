import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { Switch } from "antd";
import { ChangeSyncWithCalandar, GetAdminProfile } from "../../../../services/Api/Api";

const SyncCalendar = () => {
  const [isSync, setIsSync] = useState(false);

  // Get admin profile
  const getData = async () => {
    try {
      let result = await GetAdminProfile(localStorage.getItem("adminToken"));
      const isSyncStatus = result.data.data.is_sync_by_google_calendar;
      setIsSync(isSyncStatus);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const onChange = async (checked) => {
    setIsSync(checked);

    // Call the API to update the sync status
    try {
      await ChangeSyncWithCalandar(); // No need to pass body if not required by the API
    } catch (error) {
      console.error("Error updating sync status:", error);
      // Optionally, revert the switch if the update fails
      setIsSync(!checked);
    }
  };

  return (
    <Box sx={{ m: "40px" }}>
      <div>
        <h6>Sync Bookings With Your Calendar:</h6>
        <Switch
          checked={isSync}
          onChange={onChange}
        />
      </div>
    </Box>
  );
};

export default SyncCalendar;
