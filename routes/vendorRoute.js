import {Router } from "express"
import { decodeToken, getAuthorizationToken } from "../utils/WebTokenController.js"
import { VendorController } from "../controlers/vendorController.js"
import { VerifyIdentityModel } from "../models/verifyIdentity.js"

const vendorRouter = Router()

//middle ware the checks if the user has login and is of type vendor

const vendorMiddleWare = (req, res, next) => {
    let token = getAuthorizationToken(req)
    if(!token)
        return res.status(401).json({message : "no authorization token"})
    let user = decodeToken(token)
    if(!user)
        return res.status(400).json({"message": "wrong token"})
    if(user.role !== "vendor")
        return res.status(401).json({message: "user not authorized"})
    req.user = user
    next()
}

vendorRouter.use(vendorMiddleWare)


/**
 * adding store information
 */
vendorRouter.post("/add-store-info",  VendorController.addStore)

/**
 * adding verification info
 */

vendorRouter.post("/store-verification", VendorController.storeOwnerIdentityVerification)

/**
 * uploading store item
 */
vendorRouter.post("/item",  VendorController.uploadItem)

/**
 * editing uploaded  item
 */
vendorRouter.put("/item",  VendorController.editItem)

/**
 * deleting item
 */
vendorRouter.delete("/item/:itemId",  VendorController.deleteItem)

/**
 * toggle item
 */
vendorRouter.post("/toggle-item",  VendorController.toggleItem)

/**
 * toggle size
 */
vendorRouter.post("/toggle-item-size",  VendorController.toggleItemSize)

/**
 * toggle size
 */
vendorRouter.delete("/item-size/:sizeId",  VendorController.deleteItemSize)

export {vendorRouter}
