import axios from "../axiosInstance";
import { BASE_URL } from "../Host";

export const CreateCostCalculator = async (body) => {
  try {
    const res = await axios.post(BASE_URL + "calculate/cost-calculator", body);

    return res;
  } catch (error) {
    console.error("Error creating cost calculator:", error);
    throw error;
  }
};

export const CreateBidMaximizer = async (body) => {
  try {
    const res = await axios.post(BASE_URL + "calculate/bid-maximizer", body);

    return res;
  } catch (error) {
    console.error("Error creating bid maximizer:", error);
    throw error;
  }
};


export const GetAllCostCalculations =
  async () => {
    try {
      const res = await axios.get(
        BASE_URL +
          "calculate/cost-calculator"
      );

      return res;
    } catch (error) {
      console.error(
        "Error fetching calculations:",
        error
      );

      throw error;
    }
  };

export const DeleteCostCalculation =
  async (id) => {
    try {
      const res = await axios.delete(
        BASE_URL +
          `calculate/cost-calculator/${id}`
      );

      return res;
    } catch (error) {
      console.error(
        "Error deleting calculation:",
        error
      );

      throw error;
    }
  };

  export const GetCostCalculationSettings = async (client_type) => {
  try {
    const res = await axios.get(
      BASE_URL + `calculate/cost-calculation-settings?client_type=${client_type}`
    );

    return res;
  } catch (error) {
    console.error("Error fetching settings:", error);
    throw error;
  }
};

export const UpdateCostCalculationSetting = async (body) => {
  try {
    const res = await axios.post(
      BASE_URL + "calculate/update-calculation-settings",
      body
    );

    return res;
  } catch (error) {
    console.error("Error updating setting:", error);
    throw error;
  }
};