import { Router } from "express";
import {
  decodeToken,
  getAuthorizationToken,
} from "../utils/WebTokenController.js";
import { VendorController } from "../controlers/vendorController.js";
import { VerifyIdentityModel } from "../models/verifyIdentity.js";
import { AdminController } from "../controlers/adminController.js";
import { CustomerController } from "../controlers/customerController.js";

const customerRouter = Router();

//middle ware the checks if the user has login and is of type vendor

const customerMiddleWare = (req, res, next) => {
  let token = getAuthorizationToken(req);
  if (!token)
    return res.status(401).json({ message: "no authorization token" });
  let user = decodeToken(token);
  if (!user) return res.status(400).json({ message: "wrong token" });
  if (user.role !== "customer") {
    return res.status(401).json({ message: "user not authorized" });
  }
  req.user = user;
  next();
};

customerRouter.use(customerMiddleWare);
/*
place order

*/
customerRouter.post("/order", CustomerController.placeOrder);

export { customerRouter };
