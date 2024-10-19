import express from "express"
import { connectDb } from "./utils/MongodbConnector.js"
import { authenticationRouter } from "./routes/authRoute.js"
import cors from "cors"
import { vendorRouter } from "./routes/vendorRoute.js"
import { adminRouter } from "./routes/adminRoute.js"
import { userRouter } from "./routes/usersRoute.js"

const app = express()

//middlewares goes here
app.use(cors())
app.use(express.json({limit:"100mb"}))

//routes  middle ware goes here
app.use("/api", authenticationRouter)

app.use("/vendor", vendorRouter)

app.use("/admin", adminRouter)

app.use('/auth', userRouter)

//setting up static route

app.use('/public',express.static('public'))

let port = process.env.PORT || 4444

app.get("/", async (req, res) => {
    return res.send("ok i am working")
})

app.listen(port, async () => {
    await connectDb()
    console.log(`http://localhost:${port}`)
})

export {app}