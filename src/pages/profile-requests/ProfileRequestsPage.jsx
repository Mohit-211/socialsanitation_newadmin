import PageHeader from "@/components/PageHeader";
import ProfileRequestsTable from "./components/ProfileRequestsTable";
import "./profileRequests.scss";

// What clients ask the office to change about their account. The app no
// longer edits a client's name, email or phone itself.
const ProfileRequestsPage = () => (
  <>
    <PageHeader
      title="ACCOUNT REQUESTS"
      subtitle="Clients ask here to change their name, email or phone, or to delete their account"
    />
    <ProfileRequestsTable />
  </>
);

export default ProfileRequestsPage;
