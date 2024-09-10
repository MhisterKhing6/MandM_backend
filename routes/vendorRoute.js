import {Router } from "express"
import { decodeToken, getAuthorizationToken } from "../utils/WebTokenController"

const vendorRouter = Router()

//middle ware the checks if the user has login and is of type vendor

const vendorMiddleWare = (req, res, next) => {
    let token = getAuthorizationToken(req)
    if(!token)
        return res.status(401).json({message : "no authorization token"})
    let user = decodeToken(token)
    if(!user)
        return res.status(400).json({"message": "wrong token"})
    if(user.type !== "vendor")
        return res.status(401).json({message: "user not authorized"})
    req.user = user
    next()
}

vendorRouter.use(vendorMiddleWare)


/**
 * adding store information
 */
vendorRouter.post("/add-store-info", )
