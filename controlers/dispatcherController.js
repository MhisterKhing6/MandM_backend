import { OrderModel } from "../models/orders.js";
import { OrderRiderStatusModel } from "../models/OrderStatus.js";
import { activeUsers } from "../services/notification/socketHandler.js";

class DispatcherController {
    
    static acceptOrRejectOrder = async (req, res) => {
        //requires order and status
        let details = req.body;
        if(!(details.orderId && details.status))
            return res.status(400).json({"message": "order status required"});
        //fetch order
        let order = await OrderModel.findById(details.order);
        if(!order)
            return res.status(400).json({"message": "wrong order id"});
        if(details.status.toLowerCase() == "accepted") {
            //form order rider status
            await new OrderRiderStatusModel({orderId:order._id, riderId:req.user._id, status:'Not picked'}).save();
            activeUsers.get(req.user._id).available = false; // make the rider not available for other orders until the order is complete
        } else {
            //else look for new rider by filtering the rejected rider id from the online orders

        }
        return res.status(200).json();
    }
}

export {DispatcherController}