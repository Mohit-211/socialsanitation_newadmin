import React, { useEffect, useState } from "react";
import "./AddAboutUs";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { GetAboutUs } from "../../../services/Api/ContentApi";

const AboutUs = () => {
  const navigate = useNavigate();
  const [contentData, setContentData] = useState([]);
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    try {
      setLoading(true);
      let result = await GetAboutUs(localStorage.getItem("adminToken"));
      setContentData(result.data.data);
      console.log("GetAboutUs==>", result.data.data);
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

  return (
    <div className="main_tc_container">
      <>
        {contentData.length > 0 && (
          <div className="upper_tc_container">
            <h1 style={{ color: "lightblue" }}>ABOUT US</h1>

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
              {/* <h2>{contentData[0]?.heading}</h2> */}
              {/* <p>{contentData[0]?.description}</p> */}
              <p
                dangerouslySetInnerHTML={{
                  __html: contentData[0]?.description,
                }}
              ></p>
            </div>
            <div>
              <Button
                label=" Edit About Us"
                icon="pi pi-pencil"
                severity="info"
                // onClick={navigateToEditTAndC}
                onClick={() => {
                  navigate("/editAboutUs", {
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
    </div>
  );
};

export default AboutUs;
