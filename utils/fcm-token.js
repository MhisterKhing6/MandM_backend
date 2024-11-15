import { UserModel } from "../models/user.js";
const getVendorFCMToken = async (userId) => {
  try {
    // Find the vendor in the database by ID and retrieve their FCM token
    console.log(userId);
    const vendor = await UserModel.findById(userId);
    console.log(vendor);
    // Check if vendor exists and has an FCM token
    if (!vendor || !vendor.fcmToken) {
      throw new Error("FCM token not found for the specified vendor.");
    }

    // Return the FCM token
    return vendor.fcmToken;
  } catch (error) {
    console.error("Error retrieving vendor FCM token:", error);
    throw error; // Handle the error appropriately in your application
  }
};

export { getVendorFCMToken };
