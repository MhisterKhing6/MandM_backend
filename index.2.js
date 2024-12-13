import express from "express";
import { connectDb } from "./utils/MongodbConnector.js";
import { authenticationRouter } from "./routes/authRoute.js";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { vendorRouter } from "./routes/vendorRoute.js";
import { adminRouter } from "./routes/adminRoute.js";
import { userRouter } from "./routes/usersRoute.js";
import { SocketServices } from "./services/notification/socketHandler.js";
import { customerRouter } from "./routes/customerRoute.js";
import admin from "firebase-admin";
import { dispatcherRoute } from "./routes/dispatcherRoute.js";
import fs from "fs"

// Initialize Firebase Admin with service account
const serviceAccount = JSON.parse(fs.readFileSync("./utils/firebase-service-account.json" ));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const app = express();
//set up server
const httpServer = http.createServer(app);
//middlewares goes here
//set up http
const io = new Server(httpServer);
app.use(cors());
app.use(express.json({ limit: "100mb" }));

//setup connection here
io.on("connection", SocketServices.socketHandler);

//routes  middle ware goes here
app.use("/api", authenticationRouter);

app.use("/vendor", vendorRouter);

app.use("/admin", adminRouter);

app.use("/rider", dispatcherRoute);

app.use("/auth", userRouter);

app.use("/customer", customerRouter);

let port = process.env.PORT || 8000;
//setting up static route
app.use("/public", express.static("public"));

app.use("/public", express.static("public"));

app.get("/", async (req, res) => {
  return res.send("ok i am working");
});

httpServer.listen(port, async () => {
  await connectDb();
  console.log(`http://localhost:${port}`);
});

export { httpServer, app, io };
