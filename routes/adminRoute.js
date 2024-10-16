import { Router } from "express";
import {
  decodeToken,
  getAuthorizationToken,
} from "../utils/WebTokenController.js";
import { VendorController } from "../controlers/vendorController.js";
import { VerifyIdentityModel } from "../models/verifyIdentity.js";
import { AdminController } from "../controlers/adminController.js";

const adminRouter = Router();

//middle ware the checks if the user has login and is of type vendor

const adminMiddleWare = (req, res, next) => {
  let token = getAuthorizationToken(req);
  if (!token)
    return res.status(401).json({ message: "no authorization token" });
  let user = decodeToken(token);
  if (!user) return res.status(400).json({ message: "wrong token" });
  if (user.role !== "admin") {
    return res.status(401).json({ message: "user not authorized" });
  }
  req.user = user;
  next();
};

adminRouter.use(adminMiddleWare);
/**
 * upload category
 */
adminRouter.post("/category", AdminController.uploadCategory);

/**
 * delete category
 */
adminRouter.delete("/category/:categoryId", AdminController.deleteCategory);

/**
 * post sub category
 */
adminRouter.post("/subcategory", AdminController.uploadSubCategories);

/**
 * post sub category
 */
adminRouter.delete(
  "/subcategory/:subCategoryId",
  AdminController.deleteSubCategory
);

/**
 * toggle category
 */
adminRouter.put("/toggle-category", AdminController.toggleCategory);

/**
 * toggle sub category
 */
adminRouter.put("/toggle-sub-category", AdminController.toggleSubCategory);

/**
 * vendor verification
 */
adminRouter.get(
  "/vendor-verification",
  AdminController.getVendorVerificationRequests
);

/**
 * verify verification
 */
adminRouter.put(
  "/vendor-verification",
  AdminController.toggleVenderIdentityVerification
);

/**
 * get users
 */
adminRouter.get("/users", AdminController.viewUserInfo);

export { adminRouter };
