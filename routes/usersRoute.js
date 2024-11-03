import { Router } from "express";
import { UserController } from "../controlers/userController.js";

const userRouter = Router();

//middle ware the checks if the user has login
const authenticatedMiddleWare = (req, res, next) => {
  let token = getAuthorizationToken(req);
  if (!token)
    return res.status(401).json({ message: "no authorization token" });
  let user = decodeToken(token);
  if (!user) return res.status(400).json({ message: "wrong token" });
  req.user = user;
  next();
};

//userRouter.use(authenticatedMiddleWare)
/**
 * fetch categories
 */
userRouter.get("/item-categories", UserController.categories);
userRouter.get("/stores", UserController.getNearStoresByCategory);
userRouter.get("/stores/items/:storeId", UserController.getItemsByStoreId);
userRouter.post("/cart/add", UserController.addToCart);
userRouter.get("/cart/:userId", UserController.fetchCartItems);
userRouter.post("/cart/remove", UserController.removeFromCart);

export { userRouter };
