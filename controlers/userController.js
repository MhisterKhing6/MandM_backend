//handle user functions
import { UserModel } from "../models/user.js";
import axios from "axios";
import {
  sendEmailVerification,
  sendResetPassword,
} from "../utils/EmailHandler.js";
import {
  generateSecretNumber,
  TwoHourPass,
} from "../utils/VerificationFunctions.js";
import { VerifyTokenModel } from "../models/verifyToken.js";
import sha1 from "sha1";
import { generateToken } from "../utils/WebTokenController.js";
import { VerifyIdentityModel } from "../models/verifyIdentity.js";
import { StoreModel } from "../models/stores.js";
import { CategoriesModel } from "../models/categories.js";
import Cart from "../models/cart.js";
import { ItemModel } from "../models/items.js";
import { OrderItemModel } from "../models/orderItems.js";
import { OrderModel } from "../models/orders.js";
import { riderOrdersModel } from "../models/riderOrders.js";
import { response } from "express";
class UserController {
  //register user functions
  static register = async (req, res) => {
    let regDetails = req.body;
    if (
      !(
        regDetails.name &&
        regDetails.email &&
        regDetails.password &&
        regDetails.phoneNumber &&
        regDetails.role
      )
    )
      return res.status(400).json({ message: "not all fields given" });

    if (
      !["customer", "vendor", "admin", "dispatcher"].includes(regDetails.role)
    )
      return res.status(400).json({ message: "wrong type" });
    try {
      //check a user with the same phone number is registered
      let savedUser = await UserModel.findOne({
        email: regDetails.email,
      });

      if (savedUser)
        return res.status(400).json({ message: "user is already registered" });
      let user = new UserModel({
        ...regDetails,
        password: sha1(regDetails.password),
      });
      let message = { message: "user created successfully" };
      //check if the user is type vendor

      if (regDetails.role !== "customer") {
        //send email verification
        let verificationCode = generateSecretNumber();
        //save verification entry
        let verificationEntry = await VerifyTokenModel({
          userId: user._id,
          verificationCode,
        }).save();
        sendEmailVerification(regDetails, verificationCode);
        message.verificationId = verificationEntry._id;
      }
      await user.save();
      return res.status(201).json({
        ...message,
        user: {
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
        },
      });
    } catch (err) {
      console.log(err);
      return res.status(501).json({ message: "internal error" });
    }
  };

  static sendVerificationNumber = async (req, res) => {
    /**
     * sendVerification : sends verification details to user email
     * @param {object} req: request object
     * @param {object} res: response
     */
    let userEmail = req.params.email;
    try {
      //check if the user is registered
      let customer = await UserModel.findOne({ email: userEmail });
      if (!customer)
        return res.status(401).json({ message: "user isn't registered" });
      //delete old verification entry
      await VerifyTokenModel.deleteOne({ userId: customer._id.toString() });
      //generate verification entry and save
      let verificationDetails = {
        userId: customer._id.toString(),
        verificationCode: generateSecretNumber(),
      };
      let verificationEntry = await new VerifyTokenModel(
        verificationDetails
      ).save();
      //check the type to determine the type of message to send
      sendResetPassword(
        { email: customer.email, name: customer.name },
        verificationDetails.verificationCode
      );
      //send verification id to user_id to user
      res.status(200).json({
        verificationId: verificationEntry._id.toString(),
        userId: customer._id.toString(),
      });
    } catch (err) {
      console.log(err);
      res.status(501).json({ message: "internal server error" });
    }
  };

  static verify = async (req, res) => {
    /**
     * resetPassword : reset user passwords
     * @param {object} req: request object
     * @param {object} res: response
     */

    let verificationDetails = req.body;
    //check if all details fields are given
    if (
      !(
        verificationDetails.verificationId &&
        verificationDetails.verificationCode
      )
    )
      return res.status(400).json({ message: "fields missing" });
    try {
      //check for verification entry
      let verificationEntry = await VerifyTokenModel.findById(
        verificationDetails.verificationId
      );
      if (!verificationEntry)
        return res.status(401).json({ message: "no verification entry found" });
      //check if token has expired
      if (TwoHourPass(verificationEntry.createdDate)) {
        //delete token entry
        await VerifyTokenModel.deleteOne({ _id: verificationEntry._id });
        return res.status(401).json({ message: "token expired" });
      }
      //check if user secrete number matches the one sent via email
      if (
        verificationDetails.verificationCode !==
        verificationEntry.verificationCode
      )
        return res.status(401).json({ message: "wrong verification code" });
      //update verification entry
      verificationEntry.verified = true;
      await verificationEntry.save();

      return res.status(200).json({
        verificationId: verificationEntry._id.toString(),
        message: "success",
      });
    } catch (err) {
      console.log(err);
      res.status(501).json({ message: "internal server error" });
    }
  };

  static updatePassword = async (req, res) => {
    /**
     * updatePassword : update user passwords
     * @param {object} req: request object
     * @param {object} res: response
     */
    //update history
    let updateDetails = req.body;
    //check if all user details are given
    if (!(updateDetails.password && updateDetails.verificationId))
      return res.status(400).json({ message: "fields missing" });
    //check for verification database entry
    try {
      //check for verification entry
      let verificationEntry = await VerifyTokenModel.findById(
        updateDetails.verificationId
      );
      if (!verificationEntry)
        return res.status(401).json({ message: "no verification entry found" });
      //check if user has verify and the type of verification is reset password
      if (!verificationEntry.verified)
        return res.status(401).json({ message: "user not verified" });
      //get and verify user
      let user = await UserModel.findById(verificationEntry.userId);
      if (!user)
        return await res.status(401).json({ message: "user not registered" });
      //update user's password
      user.password = sha1(updateDetails.password);
      await user.save();
      //delete token entry
      await VerifyTokenModel.deleteOne({ _id: verificationEntry._id });
      //return response to user
      return res
        .status(200)
        .json({ id: user._id.toString(), message: "password changed" });
    } catch (err) {
      console.log(err);
      res.status(501).json({ message: "internal server error" });
    }
  };

  static login = async (req, res) => {
    let loginDetails = req.body;
    console.log(loginDetails);
    if (!(loginDetails.id && loginDetails.password))
      return res.status(400).json({ message: "not all fields given" });
    //check if id is or phone number
    let query = {};
    let search = loginDetails.id.search(/@/g);
    query =
      search > 0
        ? { email: loginDetails.id }
        : { phoneNumber: loginDetails.id };
    //search for user
    let user = await UserModel.findOne(query).lean();
    console.log(user);
    if (!user) {
      updateUserFCMToken(user._id, loginDetails.token);
      return res.status(400).json({ message: "user is not registered" });
    }
    //check if passwords match
    if (user.password !== sha1(loginDetails.password))
      return res.status(400).json({ message: "wrong user password" });
    //generate user token
    let token = generateToken(user);
    let verified = await VerifyIdentityModel.findOne({
      userId: user._id,
    }).lean();
    if (user.role === "vendor") {
      if (verified && verified.status === "verified") {
        user.verified = true;
        user.stores = await StoreModel.find({ userId: user._id })
          .select("-__v")
          .populate({ path: "type", select: "name" })
          .lean();
      } else user.verified === false;
    }
    return res.status(200).json({ user, token });
  };

  static categories = async (req, res) => {
    let categories = await CategoriesModel.find({})
      .select("-__v")
      .populate("subCategories", "name")
      .lean();
    return res.status(200).json(categories);
  };

  static getNearStoresByCategory = async (req, res) => {
    try {
      const { longitude, latitude, maxDistance = 5000 } = req.query;

      if (!longitude || !latitude) {
        return res
          .status(400)
          .json({ error: "longitude and latitude are required" });
      }

      const distance = parseInt(maxDistance, 10);
      const userLocation = [parseFloat(longitude), parseFloat(latitude)];

      const storesByCategory = await StoreModel.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: userLocation },
            distanceField: "distance",
            maxDistance: distance,
            spherical: true,
          },
        },
        {
          $project: {
            _id: 1,
            storeName: 1,
            type: 1, // Keep type to group by categories later
          },
        },
        {
          $group: {
            _id: "$type", // Group by category ID
            stores: { $push: { _id: "$_id", storeName: "$storeName" } }, // Only store id and name
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "categoryDetails",
          },
        },
        {
          $unwind: "$categoryDetails",
        },
        {
          $project: {
            _id: 0, // Exclude the grouped `_id` from the output
            category: "$categoryDetails.name", // Rename the category details as needed
            stores: 1,
          },
        },
      ]);

      res.status(200).json(storesByCategory);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching stores" });
    }
  };

  static getItemsByStoreId = async (req, res) => {
    try {
      const { storeId } = req.params;

      if (!storeId) {
        return res.status(400).json({ error: "Store ID is required" });
      }

      const items = await ItemModel.find({ storeId })
        .populate("itemSizes") // Populate the details of each itemSize
        .populate("images"); // Fetch all fields
      res.status(200).json(items);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred while fetching items" });
    }
  };

  // static addToCart = async (req, res) => {
  //   const { userId, productId, quantity, price, addons, name } = req.body;
  //   let cart = await Cart.findOne({ userId });

  //   const newItem = {
  //     productId,
  //     name,
  //     quantity,
  //     price,
  //     addons:
  //       addons?.map((addon) => ({
  //         name: addon.name,
  //         price: addon.price,
  //         quantity: addon.quantity || 1, // Default to 1 if quantity not provided
  //       })) || [],
  //   };

  //   if (!cart) {
  //     cart = new Cart({ userId, items: [newItem] });
  //   } else {
  //     const itemIndex = cart.items.findIndex(
  //       (item) => item.productId === productId
  //     );
  //     if (itemIndex > -1) {
  //       cart.items[itemIndex].quantity += quantity;
  //       cart.items[itemIndex].addons = addons || cart.items[itemIndex].addons;
  //     } else {
  //       cart.items.push(newItem);
  //     }
  //   }

  //   await cart.save();
  //   res.json(cart);
  // };

  static updateUserFCMToken = async (req, res) => {
    // console.log(req.user);
    const userId = req.user._id;
    const newToken = req.body.fcmToken;
    // console.log(newToken);
    try {
      await UserModel.findByIdAndUpdate(userId, { fcmToken: newToken });

      console.log("FCM token updated successfully");
      return res.status(200).json({ message: "Fcm updated successfully" });
    } catch (error) {
      console.error("Error updating FCM token:", error);
    }
  };

  static addToCart = async (req, res) => {
    const { userId, storeId, productId, quantity, price, addons, name } =
      req.body;
    let cart = await Cart.findOne({ userId });

    const newItem = {
      productId,
      name,

      quantity,
      price,
      addons:
        addons?.map((addon) => ({
          name: addon.name,
          price: addon.price,
          quantity: addon.quantity || 1,
        })) || [],
    };
    console.log(newItem);
    if (!cart) {
      // If no cart exists, create a new cart with the store and item
      cart = new Cart({
        userId,
        stores: [{ storeId, items: [newItem] }],
      });
    } else {
      // Check if this store already exists in the cart
      const storeIndex = cart.stores.findIndex(
        (store) => store.storeId === storeId
      );

      if (storeIndex > -1) {
        // Store exists, check if item exists within the store
        const itemIndex = cart.stores[storeIndex].items.findIndex(
          (item) => item.productId === productId
        );

        if (itemIndex > -1) {
          // Item exists, update quantity and addons
          cart.stores[storeIndex].items[itemIndex].quantity += quantity;
          cart.stores[storeIndex].items[itemIndex].addons =
            addons || cart.stores[storeIndex].items[itemIndex].addons;
        } else {
          // Item does not exist, add it to the store's items
          cart.stores[storeIndex].items.push(newItem);
        }
      } else {
        // Store does not exist, add the store with the new item
        cart.stores.push({ storeId, items: [newItem] });
      }
    }

    await cart.save();
    res.json(cart);
  };

  // Increase quantity of an item in the cart
  static inCreaseCartQuantity = async (req, res) => {
    const { userId, productId } = req.body;

    try {
      const cart = await Cart.findOneAndUpdate(
        { userId, "items.productId": productId },
        { $inc: { "items.$.quantity": 1 } },
        { new: true }
      );
      res.status(200).json(cart);
    } catch (error) {
      res.status(500).json({ error: "Failed to increase quantity" });
    }
  };

  // Decrease quantity of an item in the cart
  static decreaseCartQuantity = async (req, res) => {
    const { userId, productId } = req.body;

    try {
      const cart = await Cart.findOneAndUpdate(
        { userId, "items.productId": productId, "items.quantity": { $gt: 1 } },
        { $inc: { "items.$.quantity": -1 } },
        { new: true }
      );
      res.status(200).json(cart);
    } catch (error) {
      res.status(500).json({ error: "Failed to decrease quantity" });
    }
  };

  // Remove an item from the cart
  static removeFromCart = async (req, res) => {
    const { userId, productId } = req.body;

    try {
      const cart = await Cart.findOneAndUpdate(
        { userId },
        { $pull: { items: { productId } } },
        { new: true }
      );
      res.status(200).json(cart);
    } catch (error) {
      res.status(500).json({ error: "Failed to remove item" });
    }
  };

  static fetchCartItems = async (req, res) => {
    const { userId } = req.params;

    try {
      const cart = await Cart.findOne({ userId });
      console.log(cart);
      if (cart) {
        res.status(200).json(cart);
      } else {
        res.status(200).json([]); // Empty array if cart does not exist
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cart items" });
    }
  };

  static getOrderStatus = async (type, req, res) => {
    let orderId = req.params.orderId;
    let orderDetails =
      type === "rider"
        ? await riderOrdersModel.findOne({ orderId }).lean()
        : await OrderModel.findById(orderId).lean();
    if (!orderDetails) return res.status(400).jso({ message: "wrong order" });
    let status =
      type === "rider"
        ? orderDetails.status
        : type === "vendor"
        ? orderDetails.vendorStatus
        : orderDetails.customerStatus;

    return res.status(200).json({ status });
  };

  static initializeTransaction = async (req, res) => {
    const { email, amount, callbackUrl } = req.body;

    try {
      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email, // User email
          amount: amount * 100, // Amount in kobo (e.g., 5000 for NGN 50.00)
          callback_url: callbackUrl, // Redirect URL after payment
        },
        {
          headers: {
            Authorization: `Bearer sk_test_24a97f6465025b11a4bfdbdcda862e47501699be`,
            "Content-Type": "application/json",
          },
        }
      );
      // console.log(response.data);

      // Send the payment URL back to the client
      res.status(200).json({ status: true, data: response.data.data });
    } catch (error) {
      console.error(error.response?.data || error.message);
      res
        .status(500)
        .json({ status: false, error: error.response?.data || error.message });
    }
  };

  static verifyPayment = async (req, res) => {
    const { reference } = req.body; // Reference sent by Paystack in the callback URL
    console.log(reference);
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer sk_test_24a97f6465025b11a4bfdbdcda862e47501699be`,
          },
        }
      );
      console.log(response);
      // Handle the transaction verification response
      const { status, data } = response;
      if (status === 200 && data.data.status === "success") {
        // Payment successful, update your database
        return res
          .status(200)
          .json({ message: "Payment verified successfully", data: data.data });
      }

      // Payment failed
      res
        .status(400)
        .json({ message: "Payment verification failed", data: data.data });
    } catch (error) {
      res.status(500).json({ error: error.response?.data || error.message });
    }
  };
}
export { UserController };

// static getNearStoresAndItems = async (req, res) => {
//   try {
//     const { longitude, latitude, maxDistance = 5000 } = req.query;

//     if (!longitude || !latitude) {
//       return res
//         .status(400)
//         .json({ error: "longitude and latitude are required" });
//     }

//     const distance = parseInt(maxDistance, 10);
//     const userLocation = [parseFloat(longitude), parseFloat(latitude)];

//     const storesByCategory = await StoreModel.aggregate([
//       {
//         $geoNear: {
//           near: { type: "Point", coordinates: userLocation },
//           distanceField: "distance",
//           maxDistance: distance,
//           spherical: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "items",
//           localField: "_id",
//           foreignField: "storeId",
//           as: "items",
//         },
//       },
//       {
//         $unwind: {
//           path: "$items",
//           preserveNullAndEmptyArrays: true, // Allow stores without items
//         },
//       },
//       {
//         $lookup: {
//           from: "itemsizes",
//           localField: "items.itemSizes",
//           foreignField: "_id",
//           as: "items.itemSizesDetails",
//         },
//       },
//       {
//         $lookup: {
//           from: "categories",
//           localField: "items.categoryId",
//           foreignField: "_id",
//           as: "categoryDetails",
//         },
//       },
//       {
//         $unwind: "$categoryDetails",
//       },
//       {
//         $group: {
//           _id: "$categoryDetails._id",
//           category: { $first: "$categoryDetails.name" },
//           stores: {
//             $addToSet: {
//               storeId: "$_id",
//               storeName: "$storeName",
//               distance: "$distance",
//               items: {
//                 $cond: {
//                   if: { $isArray: "$items" }, // Ensure items is an array
//                   then: {
//                     $map: {
//                       input: "$items",
//                       as: "item",
//                       in: {
//                         itemId: "$$item._id",
//                         name: "$$item.name",
//                         description: "$$item.description",
//                         itemSizes: "$$item.itemSizesDetails",
//                         attributes: "$$item.attributes",
//                       },
//                     },
//                   },
//                   else: [],
//                 },
//               },
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           categoryId: "$_id",
//           categoryName: "$category",
//           stores: 1,
//         },
//       },
//     ]);

//     res.status(200).json(storesByCategory);
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ error: "An error occurred while fetching stores" });
//   }
// };
