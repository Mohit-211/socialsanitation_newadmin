import React, { useState } from "react";
import { CalculatorOutlined, HistoryOutlined } from "@ant-design/icons";
import CostCalculator from "./CostCalculator";
import CalculationHistory from "./CalculationHistory";
import "./Calculator.scss";

const Calculator = () => {
  const [activeTab, setActiveTab] = useState("calculator");

  return (
    <div className="calc-root">
      <div className="calc-container">
      <div className="calc-tab-bar">
        <button
          className={`calc-tab-btn ${activeTab === "calculator" ? "active" : ""}`}
          onClick={() => setActiveTab("calculator")}
        >
          <CalculatorOutlined />
          <span>Cost Calculator</span>
        </button>
        <button
          className={`calc-tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <HistoryOutlined />
          <span>History</span>
        </button>
        <div className={`calc-tab-indicator ${activeTab === "history" ? "right" : "left"}`} />
      </div>

      <div className="calc-tab-content">
        {activeTab === "calculator" ? <CostCalculator /> : <CalculationHistory />}
      </div>
      </div>
    </div>
  );
};

export default Calculator;