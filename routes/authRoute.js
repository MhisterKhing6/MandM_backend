import { Router } from "express"
import { UserController } from "../controlers/userController.js"

const authenticationRouter = Router()

authenticationRouter.post("/signup", UserController.register)

export {authenticationRouter}
