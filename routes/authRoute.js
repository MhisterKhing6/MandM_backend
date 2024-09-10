import { Router } from "express"
import { UserController } from "../controlers/userController.js"

const authenticationRouter = Router()
/**
 * user registration
 */
authenticationRouter.post("/signup", UserController.register)

/**
 * sending email verification number
 */
authenticationRouter.get("/reset-password/:email", UserController.sendVerificationNumber)

/**
 * sending email verification number
 */
authenticationRouter.post("/verify", UserController.verify)

/**
 * login in function
 */
authenticationRouter.post("/login", UserController.login)

/**
 * update password
 */
authenticationRouter.post("/update-password", UserController.updatePassword)



export {authenticationRouter}
