import { useState } from "react";
import { Calculator as CalculatorIcon, History } from "lucide-react";
import CostCalculatorForm from "./components/CostCalculatorForm";
import CalculationHistory from "./components/CalculationHistory";
import "./costCalculator.scss";

const CostCalculatorPage = () => {
  const [activeTab, setActiveTab] = useState("calculator");

  return (
    <div className="calc-root">
      <div className="calc-container">
      <div className="calc-tab-bar">
        <button
          className={`calc-tab-btn ${activeTab === "calculator" ? "active" : ""}`}
          onClick={() => setActiveTab("calculator")}
        >
          <CalculatorIcon size={16} />
          <span>Cost Calculator</span>
        </button>
        <button
          className={`calc-tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <History size={16} />
          <span>History</span>
        </button>
        <div className={`calc-tab-indicator ${activeTab === "history" ? "right" : "left"}`} />
      </div>

      <div className="calc-tab-content">
        {activeTab === "calculator" ? <CostCalculatorForm /> : <CalculationHistory />}
      </div>
      </div>
    </div>
  );
};

export default CostCalculatorPage;