import { Router } from "express";
import {
  decodeToken,
  getAuthorizationToken,
} from "../utils/WebTokenController.js";
import { VendorController } from "../controlers/vendorController.js";
import { VerifyIdentityModel } from "../models/verifyIdentity.js";
import { DispatcherController } from "../controlers/dispatcherController.js";

const dispatcherRoute = Router();

//middle ware the checks if the user has login and is of type vendor

const dispatcherMiddleWare = (req, res, next) => {
  let token = getAuthorizationToken(req);
  if (!token)
    return res.status(401).json({ message: "no authorization token" });
  let user = decodeToken(token);
  if (!user) return res.status(400).json({ message: "wrong token" });
  if (user.role !== "dispatcher")
    return res.status(401).json({ message: "user not authorized" });
  req.user = user;
  next();
};

dispatcherRoute.use(dispatcherMiddleWare);

/**
 * adding store information
 */
dispatcherRoute.post("/add-store-info", VendorController.addStore);
//accept or reject order
dispatcherRoute.post("/order-status", DispatcherController.acceptOrRejectOrder);

/**
 * get orders
 */
dispatcherRoute.get("/order/status/:orderId", DispatcherController.orderStatus);

export {dispatcherRoute}