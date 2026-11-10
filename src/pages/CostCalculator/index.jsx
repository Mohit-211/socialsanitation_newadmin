import { useState } from "react";
import { Calculator as CalculatorIcon, History } from "lucide-react";
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
        {activeTab === "calculator" ? <CostCalculator /> : <CalculationHistory />}
      </div>
      </div>
    </div>
  );
};

export default Calculator;