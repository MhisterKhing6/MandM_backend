import axios from "axios";
import { PaymentSchema } from "../models/payment.js";
// Adjust the path to your User model

class PaymentMethodController {
  static async addPaymentMethod(req, res) {
    const { email, paymentType, details } = req.body;
    console.log(req.body);
    try {
      let user = await PaymentSchema.findOne({ email });
      if (!user) {
        user = new PaymentSchema({ email, paymentMethods: [] });
      }

      if (paymentType === "card") {
        // Handle Card Payments
        const response = await axios.post(
          "https://api.paystack.co/tokenize/card",
          { card: details },
          {
            headers: {
              Authorization: `Bearer sk_test_1e8327a0f278bf0cf00342f5e853385bf71198f2`,
            },
          }
        );
        console.log(response);

        const token = response.data.data.authorization_code;
        const last4 = details.number.slice(-4);
        const brand = response.data.data.card_type || "Unknown";

        user.paymentMethods.push({ token, last4, brand });
      } else if (paymentType === "mobile_money") {
        console.log("Found here");
        // Handle Mobile Money Payments
        const response = await axios.post(
          "https://api.paystack.co/charge",
          {
            email,
            amount: 100, // Amount is optional for tokenization
            currency: "GHS",
            mobile_money: details,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer sk_test_83bcc7935f7cdd93a394877d946007c93f53f9b6`,
            },
          }
        );
        console.log("Cosdeee");
        const token = response.data.data.authorization_code;
        const network = details.provider;

        user.paymentMethods.push({ token, last4: "N/A", brand: network });
      }

      await user.save();
      res.json({ message: "Payment method added successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  }
  //   curl https://api.paystack.co/charge
  //   -H "Authorization: Bearer YOUR_SECRET_KEY"
  //   -H "Content-Type: application/json"
  //   -d '{ "amount": 100,
  //         "email": "customer@email.com",
  //         "currency": "GHS",
  //         "mobile_money": {
  //           "phone" : "0551234987",
  //           "provider" : "mtn"
  //         }
  //       }'
  static async getPaymentMethods(req, res) {
    const { email } = req.query;

    try {
      const user = await UserPaymentSchema.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user.paymentMethods);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
export { PaymentMethodController };
