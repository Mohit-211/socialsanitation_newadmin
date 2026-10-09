const SQUARE_APP_ID = "sandbox-sq0idb-0fh-GlFXmDH722JTEO50Sg";
const SQUARE_LOCATION_ID = "L1PAJAD5B00WT";

let paymentsInstance = null;

const loadSquareSdk = () => {
  return new Promise((resolve, reject) => {
    if (window.Square) {
      resolve(window.Square);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://sandbox.web.squarecdn.com/v1/square.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        resolve(window.Square);
      });

      existingScript.addEventListener("error", reject);

      return;
    }

    const script = document.createElement("script");

    script.src = "https://sandbox.web.squarecdn.com/v1/square.js";
    script.type = "text/javascript";

    script.onload = () => {
      if (!window.Square) {
        reject(new Error("Square.js loaded but window.Square is unavailable."));
        return;
      }

      resolve(window.Square);
    };

    script.onerror = () => {
      reject(new Error("Failed to load Square.js."));
    };

    document.head.appendChild(script);
  });
};

export const getSquarePayments = async () => {
  if (paymentsInstance) {
    return paymentsInstance;
  }

  if (!SQUARE_APP_ID || !SQUARE_LOCATION_ID) {
    throw new Error("Square App ID or Location ID is missing.");
  }

  const Square = await loadSquareSdk();

  paymentsInstance = Square.payments(
    SQUARE_APP_ID,
    SQUARE_LOCATION_ID
  );

  return paymentsInstance;
};