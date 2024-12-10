import { OrderModel } from "../models/orders.js";
import { riderOrdersModel } from "../models/riderOrders.js";
import { activeUsers } from "../services/notification/socketHandler.js";
import axios from "axios";
import {
  findAvailableRiders,
  getRiderStatus,
  setRiderStatus,
} from "../utils/redisStorage.js";

import { SocketServices } from "../services/notification/socketHandler.js";
import { io } from "../index.js";
import { VirtualAccountModel } from "../models/virtualAccount.js";
import { saveUploadFileDisk } from "../utils/FileHandler.js";
import { generateFileUrl } from "../utils/FileHandler.js";
import { VerifyIdentityModel } from "../models/verifyIdentity.js";
import { riderDetailsModel } from "../models/riderDetails.js";
import { StoreModel } from "../models/stores.js";

class DispatcherController {
  static acceptOrRejectOrder = async (req, res) => {
    //requires order and status
    let details = req.body;
    if (!(details.orderId && details.status))
      return res.status(400).json({ message: "order status required" });
    //fetch order
    if (
      ![
        "PENDING",
        "DELIVERED",
        "PICKED",
        "ACCEPTED",
        "REJECTED",
        "CANCELLED",
      ].includes(details.status.toUpperCase())
    )
      return res.status(400).json({ message: "wrong status element" });
    let order = await OrderModel.findById(details.order);
    if (!order) return res.status(400).json({ message: "wrong order id" });
    if (details.status.toUpperCase() === "ACCEPTED") {
      //form order rider status
      await new riderOrdersModel({
        orderId: order._id,
        riderId: req.user._id,
      }).save();
      //change customer order status
    } else if (details.status.toUpperCase() === "REJECTED") {
      let nextAvailableDriver = null;
      let availableRiders = await findAvailableRiders(
        order.address.coordinates[0],
        order.address.coordinates[0]
      );
      if (availableRiders.length === 0) {
        //inform admin
      } else {
        let rejectedRiderPos = 0;
        for (int = 0; i < availableRiders.length; i++) {
          if (availableRiders[i].riderId === req.user._id) {
            rejectedRiderPos = i;
            break;
          }
        }
        //only rider available so contact admin
        if (rejectedRiderPos === 0 && availableRiders.length === 1) {
          //contact admin
        } else {
          //check for the position and assign
          nextAvailableDriver =
            rejectedRiderPos === 0
              ? availableRiders[1]
              : availableRiders[rejectedRiderPos - 1];
          SocketServices.sendOrderNotificationRider(
            io,
            nextAvailableDriver.userId,
            { address: order.address, orderId: order._id.toString() }
          );
          //send notification to the next available driver;
        }
      }
    } else if (details.status === "PICKED") {
      //Question will we pay the vendor here, or not
      //find order rider to update information
      let orderRider = riderOrdersModel.find({ orderId: details.orderId });
      orderRider.status = "PICKED";
      order.vendorStatus = "COMPLETED";
      order.customerStatus = "PICKED";
      Promise.all(orderRider.save(), order.save());
    } else {
      let orderRider = riderOrdersModel.find({ orderId: details.orderId });
      orderRider.status = "DELIVERED";
      order.customerStatus = "DELIVERED";
      let virtualAccountRider = await VirtualAccountModel.findOne({
        id: req.user._id,
      });
      let virtualAccountStore = await VirtualAccountModel.findOne({
        id: order.storeId,
      });
      virtualAccountRider.amount += order.deliveryCost * 0.75;
      virtualAccountStore.amount += order.itemCost;
      Promise.all(
        orderRider.save(),
        order.save(),
        virtualAccountRider.save(),
        virtualAccountStore.save()
      );
    }
    return res.status(200).json();
  };

  static orderStatus = async (req, res) => {
    //returns the vendor status of an order
    return UserController.getOrderStatus("rider", req, res);
  };
  //details status
  static changeAvailability = async (req, res) => {
    ///change rider toggle rider availability
    //check for status availablity
    let details = req.body;
    if (!(details.stat || details.status !== "0" || details.status !== "1"))
      return res.status(400).json({
        message:
          "The status of the order should be 1 or 0, 1 means one and zero means off. they should be string",
      });
    await setRiderStatus(req.user._id.toString(), details.status);
    return res.status(200).json({ message: st });
  };
  //
  static getAvailabilityStatus = async (req, res) => {
    let orderStatus = getRiderStatus(req.user._id.toString());
    return res.status(200).json({ status: orderStatus ? orderStatus : "0" });
  };

  static verifyIdentity = async (req, res) => {
    //get store owner identify info,
    //the info should have two pics
    //one being the store owner id card
    //second being the store owner picture
    //check if store information is accurate
    //save images and create database entry
    /*
        {
        idCard: {data: "base64Data", fileName: "ama.png"},
        userPic: {data: "base64Data", fileName: "yaw.png"}
        }
        */
    try {
      let identityInfo = req.body;

      if (!(identityInfo.idCard && identityInfo.userPic))
        return res.status(400).json({ message: "not all fields given" });

      let idCard = await saveUploadFileDisk(
        identityInfo.idCard.fileName,
        identityInfo.idCard.data.split("base64,")[1],
        req.user._id,
        "vId"
      );
      let userPic = await saveUploadFileDisk(
        identityInfo.userPic.fileName,
        identityInfo.userPic.data.split("base64,")[1],
        req.user._id,
        "vId"
      );
      await VerifyIdentityModel({
        status: "verified",
        userId: req.user._id,
        idCard: generateFileUrl(idCard.urlPath),
        userPic: generateFileUrl(userPic.urlPath),
      }).save();
      await VirtualAccountModel({ id: req.user._id }).save();
      return res.status(200).json({
        message: "verification in progress, please wait for 2 working days",
      });
    } catch (err) {
      console.log(err);
      return res.status(501).json({ message: "couldn't add identity" });
    }
  };

  static orderStatus = async (req, res) => {
    //returns the vendor status of an order
    return UserController.getOrderStatus("rider", req, res);
  };
  //details status
  static changeAvailability = async (req, res) => {
    ///change rider toggle rider availability
    //check for status availablity
    let details = req.body;
    if (!(details.stat || details.status !== "0" || details.status !== "1"))
      return res.status(400).json({
        message:
          "The status of the order should be 1 or 0, 1 means one and zero means off. they should be string",
      });
    await setRiderStatus(req.user._id.toString(), details.status);
    return res.status(200).json({ message: "" });
  };
  //
  static getAvailabilityStatus = async (req, res) => {
    let orderStatus = await getRiderStatus(req.user._id.toString());
    console.log(orderStatus);
    return res.status(200).json({ status: orderStatus ? orderStatus : "0" });
  };

  // Initialize Transaction
  static operationArea = async (req, res) => {
    let details = req.body;
    try {
      if (!details.location) {
        return res.status(200).json({ message: "location is required" });
      }
      //find rider
      let riderDetails = await riderDetailsModel.findOne({
        userId: req.user._id,
      });
      if (riderDetails) {
        riderDetails.operationArea = details.location;
        riderDetails.save();
      } else {
        await new riderDetailsModel({
          operationArea: details.location,
          userId: req.user._id,
        }).save();
      }
      return res.status(200).json({ message: "rider info saved successfully" });
    } catch (err) {
      console.log(err);
      return res.status(501).json({ message: "couldn't add identity" });
    }
  };


  //get all pending orders
  static acceptedOrders = async (req, res) => {
    //rider id
    let orders = await riderOrdersModel.find({riderId:req.user._id, $or :[ {status:"ACCEPTED"}, {status:"PICKED"} ]}).populate({
    path: 'orderId',
    populate: {
      path: 'store',
      model: StoreModel,
    }}).populate("riderId").lean()
    return res.status(200).json(orders)
  }

 //get all the orders today
 static getAllOrders  = async (req, res) => {
  let orders = await riderOrdersModel.find({riderId:req.user._id}).populate({
    path: 'orderId',
    populate: {
      path: 'store',
      model: StoreModel,
    }}).populate("riderId").lean()
    return res.status(200).json(orders)
 }
  
}

export { DispatcherController };
