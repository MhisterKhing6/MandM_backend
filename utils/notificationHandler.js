import admin from "firebase-admin";
import { getVendorFCMToken } from "./fcm-token.js";
const sendNewOrderNotification = async (vendorId, orderDetails) => {
  // Fetch the FCM token for the vendor from your database
  const vendorToken = await getVendorFCMToken(vendorId); // Define this function to get token by vendorId

  if (vendorToken) {
    const message = {
      token: vendorToken,
      notification: {
        title: "New Order Received!",
        body: `Order ${orderDetails._id} has been placed.`,
      },
      data: {
        orderId: `${orderDetails._id}`,
        orderStatus: `${orderDetails.vendorStatus}`,
      },
    };

    // Send the message via FCM
    try {
      const response = await admin.messaging().send(message);
      console.log("Notification sent successfully:", response);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  } else {
    console.log("No FCM token found for the vendor");
  }
};
// Assuming Vendor is your vendor model

export default sendNewOrderNotification;
