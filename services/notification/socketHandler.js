import { decodeToken } from "../../utils/WebTokenController.js";
// Active Riders
const activeUsers = new Map();

class SocketServices {
<<<<<<< HEAD
  //start connection
  static socketHandler = (socket) => {
    this.onConnection(socket);
    //disconnection
    this.disConnection(socket);
  };
  //connection start
  static onConnection = (socket) => {
    //take authentication token
    const token = socket.handshake.auth.token;
    console.log(token);
    //check if the token is given
    if (!token) {
      socket.disconnect(); //disconnect user
      console.log("User not authenticated");
      return;
=======
    //start connection
    static socketHandler = (socket) => {
        this.onConnection(socket);
        //disconnection
        this.disConnection(socket);
        //update drivers information
        this.updateDriversLocation(socket)
>>>>>>> bddba98c627c47f5c5910010ade2b28a5317c325
    }
    //verify user token
    try {
      let user = decodeToken(token);
      if (!user) return;
      //let user join their respective rooms
      if (user.role === "admin") {
        socket.join("admin");
      } else if (socket.role === "vendor") socket.join("vendor");
      else if (socket.role === "dispatcher") socket.join("dispatcher");
      else socket.join("customer");
      //add to active user
      user.socketId = socket._id;
      activeUsers.set(user._id, user);

      console.log("user is connected");
    } catch (err) {
      socket.disconnect();
      console.log(err);
    }
  };
  static disConnection = (socket) => {
    socket.on("disconnect", () => {
      //find key
      let userId = null;
      for (const key of activeUsers) {
        if (activeUsers[value].socketId === socket.id) {
          userId = key;
          break;
        }
      }
      if (userId) activeUsers.delete(userId);
    });
  };

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
<<<<<<< HEAD
  };
=======
    //update driver location 
    static updateDriversLocation(socket) {
        socket.on("currentDriverLocation", (details) => {
            //find driver
            //finds the user of the particular
            let driver = activeUsers.get(details.userId);
            if(driver) {
                driver.latitude = details.latitude;
                driver.longitude = details.longitude;
            }
        })
    }
>>>>>>> bddba98c627c47f5c5910010ade2b28a5317c325
}

export { SocketServices, activeUsers };
