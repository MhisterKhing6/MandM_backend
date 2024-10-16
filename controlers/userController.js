//handle user functions
import { UserModel } from "../models/user.js";
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
    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid credentials or User is not registered" });
    //check if passwords match
    if (user.password !== sha1(loginDetails.password))
      return res
        .status(400)
        .json({ message: "Wrong credentials check and try again!!" });
    //generate user token
    let token = generateToken(user);
    let verified = await VerifyIdentityModel.findOne({
      userId: user._id,
    }).lean();
    if (user.type === "vendor") {
      if (verified && verified.status === "verified") {
        user.verified === true;
        user.stores = await StoreModel.find({ userId: user._id })
          .select("-__v")
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
}
export { UserController };
