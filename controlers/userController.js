//handle user functions
import { UserModel } from "../models/user.js";
import { sendEmailVerification } from "../utils/EmailHandler.js";
import { generateSecretNumber } from "../utils/VerificationFunctions.js";
import { VerifyTokenModel } from "../models/verifyToken.js";
import sha1 from "sha1"
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
      
      if(!(["customer", "vendor", "admin", "dispatcher"].includes(regDetails.role)))
        return res.status(400).json({ message: "wrong type" });
      try {
      //check a user with the same phone number is registered
      let savedUser = await UserModel.findOne({
        phoneNumber: regDetails.phoneNumber,
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
      return res.status(201).json({ ...message, ...user._doc });
    } catch (err) {
      console.log(err);
      return res.status(501).json({ message: "internal error"});
    }
  };
}
export { UserController };
