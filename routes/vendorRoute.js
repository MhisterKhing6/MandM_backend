import { Router } from "express";
import {
  decodeToken,
  getAuthorizationToken,
} from "../utils/WebTokenController.js";
import { VendorController } from "../controlers/vendorController.js";
import { VerifyIdentityModel } from "../models/verifyIdentity.js";

const vendorRouter = Router();

//middle ware the checks if the user has login and is of type vendor

const vendorMiddleWare = (req, res, next) => {
  let token = getAuthorizationToken(req);
  if (!token)
    return res.status(401).json({ message: "no authorization token" });
  let user = decodeToken(token);
  if (!user) return res.status(400).json({ message: "wrong token" });
  if (user.role !== "vendor")
    return res.status(401).json({ message: "user not authorized" });
  req.user = user;
  next();
};

vendorRouter.use(vendorMiddleWare);

/**
 * adding store information
 */
vendorRouter.post("/add-store-info", VendorController.addStore);

/**
 * adding verification info
 */

vendorRouter.post(
  "/store-verification",
  VendorController.storeOwnerIdentityVerification
);

/**
 * uploading store item
 */
vendorRouter.post("/item", VendorController.uploadItem);

/**
 * editing uploaded  item
 */
vendorRouter.put("/item", VendorController.editItem);

/**
 * deleting item
 */
vendorRouter.delete("/item/:storeId/:itemId", VendorController.deleteItem);

/**
 * toggle item
 */
vendorRouter.put("/toggle-item", VendorController.toggleItem);

/**
 * toggle size
 */
vendorRouter.put("/toggle-item-size", VendorController.toggleItemSize);

/**
 * get stores
 */
vendorRouter.get("/stores", VendorController.getStores);

/**
 * toggle size
 */
vendorRouter.delete(
  "/item-size/:storeId/:sizeId",
  VendorController.deleteItemSize
);

/**
 * get items
 */
vendorRouter.get("/store-items/:storeId", VendorController.getStoreItems);

/**
 * get items
 */
vendorRouter.post("/order-status", VendorController.updateOrderStatus);

vendorRouter.get("/orders", VendorController.getVendorOrders);

/**
 * get orders
 */
vendorRouter.get("/order/status/:orderId", VendorController.orderStatus);

/**
 * get orders
 */
vendorRouter.get("/recent/orders", VendorController.pendingOrdersRecent);
vendorRouter.get("/recent/order", VendorController.getRecentVendorOrders);

/**
 * get payment of vendor store
 */
vendorRouter.get("/payment/:storeId", VendorController.paymentStore);

//get payment vendor
vendorRouter.get("/payment/vendor", VendorController.paymentVendor);

export { vendorRouter };
