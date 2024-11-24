import { UserModel } from "../../models/user.js";
import {
  deleteActiveMember,
  getUserIdfromSocket,
  setRiderStatus,
  storeActiveMember,
  storeRiderLocation,
} from "../../utils/redisStorage.js";
import { decodeToken } from "../../utils/WebTokenController.js";
// Active Riders
const activeUsers = new Map();

class SocketServices {
  //start connection
  static socketHandler = (socket) => {
    this.onConnection(socket);
    this.setDetails(socket);
    //disconnection
    this.updateDriversLocation(socket);
    this.disConnection(socket);
  };
  //connection start
  static onConnection = async (socket) => {
    //take authentication token
    const token = socket.handshake.auth.token;
    const token3 = socket.handshake.headers;
    // console.log(token);
    // console.log(socket.handshake);
    //check if the token is given
    if (!token) {
      socket.disconnect(); //disconnect user
      console.log("User not authenticated");
      return;
    }
    //verify user token
    try {
      let user = decodeToken(token);
      if (!user) return;
      //let user join their respective rooms
      if (user.role === "admin") socket.join("admin");
      else if (user.role === "vendor") socket.join("vendor");
      else if (user.role === "dispatcher") {
        //set the rider status available
        setRiderStatus(user._id, 1);
        socket.join("dispatcher");
      } else socket.join("customer");
      //add to active user
      user.socketId = socket.id;
      await storeActiveMember(user._id, socket.id, user.email, user.role);
      //activeUsers.set(user._id, user);
      console.log("user is connected");
    } catch (err) {
      console.log("i am here error");
      socket.disconnect();
      console.log(err);
      return;
    }
  };
  static disConnection = (socket) => {
    socket.on("disconnect", () => {
      //find key
      //get user id;
      let userIdandRole = getUserIdfromSocket(socket.id);
      if (!userId) {
        console.log("Cant find user Id from socket id " + socket.id);
        return;
      } else {
        let [userId, role] = userIdandRole.split(":::");
        //if the disconnected user is dispatcher "set available status to false"
        if (role === "dispatcher") setRiderStatus(userId, 0);
        //delete active member
        deleteActiveMember(userId, role);
      }

      //
    });
  };

  static verifyTokenAndAddUser(socket, token) {
    try {
      let user = decodeToken(token); // Assuming decodeToken is your JWT decoding function
      if (!user) {
        socket.disconnect(); // If token is invalid, disconnect the socket
        return;
      }

      // User is valid, add/update user in active users map
      user.socketId = socket.id; // Store socket ID
      activeUsers.set(user._id, user); // Map user _id to user object

      console.log(`${user.role} is connected with socket ID: ${socket.id}`);
    } catch (err) {
      console.log("Error in token verification:", err);
      socket.disconnect(); // If token verification fails, disconnect the socket
    }
  }
  //sendOrder
  static sendOrderNotificationRider = async (io, userId) => {
    //get socket id from user id
    let socketId = activeUsers.get(userId); //check if the user is active
    if (socketId) {
      io.to(socketId).emit("riderOrder", { message });
    }
  };

  //send order rider
  static sendOrderNotificationVendor = (io, userId, order) => {
    //message
    let message = "A new order has been placed orderId " + order._id;
    //get socket id from active users
    let socketId = activeUsers.get(userId); //check if the user is active
    if (socketId) {
      // if active send
      io.to(socketId).emit("vendorOrders", { message, order });
    }
  };
  //send private message customer
  static sendPrivateMessageCustomer = (io, userId, message) => {
    //get socket id from active users
    let socketId = activeUsers.get(userId); //check if the user is active
    if (socketId) {
      io.to(socketId).emit("customerMessage", { message });
    }
  };

  //update driver location
  static updateDriversLocation(socket) {
    socket.on("currentDriverLocation", async (details) => {
      //{userId:latitude, longitude}
      // console.log(
      //   ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
      // );
      //find driver
      //finds the user of the particular
      // console.log(details);
      let user = await UserModel.findById(details.userId).lean();
      console.log(details);
      if (!user || user.role != "dispatcher") {
        console.log("cant find user information from id or user not rider");
        return;
      }
      if (!details.latitude || !details.longitude) {
        console.log("wrong details latitude and longitude required");
        return;
      }
      //update user information
      await storeRiderLocation(
        details.userId,
        details.latitude,
        details.longitude
      );
    });
  }

  //update set details
  static setDetails(socket) {
    socket.on("setDetails", async (details) => {
      const token = details.token;
      console.log(token);
      //check if the token is given
      if (!token) {
        socket.disconnect(); //disconnect user
        console.log("User not authenticated");
        return;
      }
      //verify user token
      try {
        let user = decodeToken(token);
        if (!user) return;
        //let user join their respective rooms
        if (user.role === "admin") socket.join("admin");
        else if (user.role === "vendor") socket.join("vendor");
        else if (user.role === "dispatcher") {
          //set the rider status available
          setRiderStatus(user._id, 1);
          storeRiderLocation(user._id, details.latitude, details.longitude);
          socket.join("dispatcher");
        } else socket.join("customer");
        //add to active user
        user.socketId = socket.id;
        await storeActiveMember(user._id, socket.id, user.email, user.role);
        //activeUsers.set(user._id, user);
        console.log("user is connected");
      } catch (err) {
        socket.disconnect();
        console.log(err);
      }
    });
  }
}

export { SocketServices, activeUsers };
