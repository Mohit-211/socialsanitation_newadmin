import React, { useEffect, useState } from "react";
import "../TermsConditions/TermsAndCondition.scss";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { GetTermsAndConditions } from "../../../services/Api/ContentApi";

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const [contentData, setContentData] = useState([]);
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    try {
      setLoading(true);
      let result = await GetTermsAndConditions(
        localStorage.getItem("adminToken")
      );
      setContentData(result.data.data);
      console.log("GetTermsAndConditions==>", result.data.data);
    } catch (e) {
      console.log(e);
      if (e.response && e.response.status === 401) {
        navigate("/error401");

        console.log("You do not have access to this page as a sub-admin.");
      } else {
        console.log("Error loading data. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getData();
  }, []);

  const navigateToEditTAndC = (event, id) => {
    navigate(`/editTermsAndConditions/${id}`);
  };
  return (
    <div className="main_tc_container">
      {loading ? (
        <p style={{ fontSize: "16px" }}>Loading...</p>
      ) : (
        <>
          {contentData.length > 0 && (
            <div className="upper_tc_container">
              <h1>Terms & Conditions</h1>
              <p>
                We are on a mission to make the web a better place. The
                following <br /> terms, as well as our Policy and Terms of
                Service, apply to all users.
              </p>
              <p style={{ color: "#888" }}>
                Last update :{" "}
                {new Date(contentData[0].updated_at).toLocaleString()}
              </p>
            </div>
          )}
          {contentData.map((content) => (
            <div
              className="lower_tc_container"
              style={{ position: "relative", padding: "12px 0px 12px 12px " }}
            >
              <div>
                <h2>{contentData[0]?.heading}</h2>
                {/* <p>{contentData[0]?.description}</p> */}
                <p
                  dangerouslySetInnerHTML={{
                    __html: contentData[0]?.description,
                  }}
                ></p>
              </div>
              <div>
                <Button
                  label=" Edit T&C"
                  icon="pi pi-pencil"
                  severity="info"
                  // onClick={navigateToEditTAndC}
                  onClick={() => {
                    navigate("/editTermsAndConditions", {
                      state: { data: content },
                    });
                  }}
                  style={{
                    position: "absolute",
                    top: "0",
                    right: "0",
                    marginTop: "12px",
                    marginRight: "12px",
                  }}
                />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default TermsAndConditions;
