// // PackagePaymentTest.jsx

// import React, { useState } from "react";
// import axios from "axios";
// import {
//   loadStripe
// } from "@stripe/stripe-js";
// import {
//   Elements,
//   CardElement,
//   useStripe,
//   useElements
// } from "@stripe/react-stripe-js";

// const stripePromise = loadStripe("pk_test_51THijjPAPHDAfE5AtqW6xB4A4p1NMK8lj02J1ZI2nhHtyQv38HoIaV6oUYI8oS0BGEzibKILAaRp44ciPSUZaaYA00J1hzG5W2");

// const TOKEN = "PUT_YOUR_TOKEN_HERE";

// const CheckoutForm = () => {
//   const stripe = useStripe();
//   const elements = useElements();

//   const [loading, setLoading] = useState(false);
//   const [packageName, setPackageName] = useState("publish_ready");

//   // 🔥 map package → amount
//   const PACKAGE_PRICE = {
//     publish_ready: 299,
//     professional_publish: 699,
//     author_brand: 1199,
//   };

//   const handlePayment = async () => {
//     try {
//       setLoading(true);

//       // 1️⃣ call backend
//       const res = await axios.post(
//         "https://api.turningpages.io:9090/api/v1/payments/intent/generate",
//         {
//           package_name: packageName,
//           amount: PACKAGE_PRICE[packageName],
//         },
//         {
//           headers: {
//             "x-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImlhdCI6MTc3NTE5NTMzMCwiZXhwIjoxNzc1ODAwMTMwLCJ0eXBlIjoiYWNjZXNzIiwicm9sZV9pZCI6Nn0.IsGruaW4Wr15HgaIB_nxFLgHfjs9p44vOpZir3PeQ70",
//           },
//         }
//       );

//       console.log("API RESPONSE:", res.data);

//       const clientSecret = res.data?.data?.client_secret;

//       // 2️⃣ confirm payment with card input
//       const result = await stripe.confirmCardPayment(clientSecret, {
//         payment_method: {
//           card: elements.getElement(CardElement),
//         },
//       });

//       if (result.error) {
//         alert(result.error.message);
//       } else if (result.paymentIntent.status === "succeeded") {
//         alert("✅ Payment successful 🎉");
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Error occurred");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ maxWidth: 400 }}>
//       <h3>Select Package</h3>

//       <select
//         value={packageName}
//         onChange={(e) => setPackageName(e.target.value)}
//       >
//         <option value="publish_ready">Publish Ready ($299)</option>
//         <option value="professional_publish">Professional Publish ($699)</option>
//         <option value="author_brand">Author Brand ($1199)</option>
//       </select>

//       <br /><br />

//       <CardElement />

//       <br />

//       <button onClick={handlePayment} disabled={!stripe || loading}>
//         {loading ? "Processing..." : "Pay Now"}
//       </button>
//     </div>
//   );
// };

// const PackagePaymentTest = () => {
//   return (
//     <div style={{ padding: 40 }}>
//       <h2>Test Package Payment</h2>
//       <Elements stripe={stripePromise}>
//         <CheckoutForm />
//       </Elements>
//     </div>
//   );
// };

// export default PackagePaymentTest;


// SubscriptionTest.jsx

import React, { useState } from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe("pk_test_51THijjPAPHDAfE5AtqW6xB4A4p1NMK8lj02J1ZI2nhHtyQv38HoIaV6oUYI8oS0BGEzibKILAaRp44ciPSUZaaYA00J1hzG5W2");

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [packageName, setPackageName] = useState("starter");

  const handleSubscribe = async () => {
    try {
      setLoading(true);

      // 🔥 1. Create subscription
      const res = await axios.post(
        "https://api.turningpages.io:9090/api/v1/payments/subscription/create",
        {
          package_name: packageName,
        },
        {
          headers: {
            "x-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImlhdCI6MTc3NTIxNjY0MiwiZXhwIjoxNzc1ODIxNDQyLCJ0eXBlIjoiYWNjZXNzIiwicm9sZV9pZCI6Nn0.Y47teP8ivc_aBIt0-LWBUDYXf_xUanEjuKUz2FE1UMA",
          },
        }
      );

      const { client_secret } = res.data.data;

      // 🔥 2. Confirm payment (VERY IMPORTANT)
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        alert(result.error.message);
      } else {
        if (result.paymentIntent.status === "succeeded") {
          alert("✅ Subscription started!");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400 }}>
      <h3>Select Subscription</h3>

      <select
        value={packageName}
        onChange={(e) => setPackageName(e.target.value)}
      >
        <option value="starter">Starter</option>
        <option value="author">Author</option>
        <option value="pro_author">Pro Author</option>
        <option value="studio">Studio</option>
      </select>

      <br /><br />

      <CardElement />

      <br />

      <button onClick={handleSubscribe} disabled={!stripe || loading}>
        {loading ? "Processing..." : "Subscribe"}
      </button>
    </div>
  );
};

const SubscriptionTest = () => {
  return (
    <div style={{ padding: 40 }}>
      <h2>Test Subscription</h2>
      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    </div>
  );
};

export default SubscriptionTest;