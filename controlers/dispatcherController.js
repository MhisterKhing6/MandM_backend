import { OrderModel } from "../models/orders.js";
import { OrderRiderStatusModel } from "../models/OrderStatus.js";
import { activeUsers } from "../services/notification/socketHandler.js";
import { findAvailableRiders, setRiderStatus } from "../utils/redisStorage.js";

class DispatcherController {
    
    static acceptOrRejectOrder = async (req, res) => {
        //requires order and status
        let details = req.body;
        if(!(details.orderId && details.status))
            return res.status(400).json({"message": "order status required"});
        //fetch order
        if(!["PENDING" , "DELIVERED", "PICKED", "ACCEPTED", "REJECTED"].includes(details.status.toUpperCase()))
            return res.status(400).json({message: "wrong status element"});
        let order = await OrderModel.findById(details.order);
        if(!order)
            return res.status(400).json({"message": "wrong order id"});
        if(details.status.toUpperCase() == "ACCEPTED") {
            //form order rider status
            await new OrderRiderStatusModel({orderId:order._id, riderId:req.user._id, status:'Not picked'}).save();
            //toggle available to zero
            setRiderStatus(req.user._id, "0");
            //change customer order status
        } else if(details.status.toUpperCase() === "REJECTED") {
            let nextAvailableDriver = null;
            let availableRiders = await findAvailableRiders(order.address.coordinates[0], order.address.coordinates[0])
            if(availableRiders.length === 0) {
                //inform admin
            }else {
                let rejectedRiderPos = 0;
                for(int = 0; i < availableRiders.length; i++) {
                    if(availableRiders[i].riderId === req.user._id) {
                        rejectedRiderPos = i;
                        break;
                    }
                }
                //only rider available so contact admin
                if(rejectedRiderPos === 0 && availableRiders.length === 1) {
                    //contact admin
                } else {
                    //check for the position and assign
                    nextAvailableDriver = rejectedRiderPos === 0 ? availableRiders[1] : availableRiders[rejectedRiderPos - 1];
                    //send notification to the next available driver;
                }
            }
        } else if(details.status === "PICKED") {
            //Question will we pay the vendor here, or not
            //find order rider to update information
            let orderRider = OrderRiderStatusModel.find({orderId:details.orderId});
            orderRider.status = "PICKED";
            order.vendorStatus = "COMPLETED"
            order.customerStatus = "PICKED"
            Promise.all(orderRider.save(), order.save())
        } else {
            let orderRider = OrderRiderStatusModel.find({orderId:details.orderId});
            orderRider.status =  "DELIVERED";
            order.customerStatus = "DELIVERED"
            Promise.all(orderRider.save(), order.save())
        }
        return res.status(200).json();
    }

    static orderStatus = async (req, res) => {
        //returns the vendor status of an order
          return UserController.getOrderStatus("rider", req, res)
      } 
}

export {DispatcherController}