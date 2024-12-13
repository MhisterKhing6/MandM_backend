import { customerRatingsModel } from "../models/customerRatings.js";
import { ItemSizesModel } from "../models/itemSizes.js";
import { OrderItemModel } from "../models/orderItems.js";
import { OrderModel } from "../models/orders.js";
import { riderOrdersModel } from "../models/riderOrders.js";
import { StoreModel } from "../models/stores.js";
import sendNewOrderNotification from "../utils/notificationHandler.js";
import { calculateFare } from "../utils/transportCalculation.js";
import { UserController } from "./userController.js";
class CustomerController {
  static placeOrder = async (req, res) => {
    //items decide the kind of data structures between the interfaces
    //[{storeId:"stores", items:[{itemSizeId:ssll}]}, //[{storeId:"stores", items:[{itemSizeId:ssll}]}  ]
    try {
      let ordersDetails = req.body;
      let pendingProcess = []; //fast process
      //loop through thee orders
      // print(ordersDetails);
      console.log(ordersDetails);
      for (let storeOrder of ordersDetails) {
        //form order entry
        //find store entry
        let store = await StoreModel.findById(storeOrder.storeId)
          .lean()
          .select();
        if (!store) return res.status(400).json("No store entry found");

        if (!store) return res.status(400).json("No store entry found");
        console.log(store);
        let order = new OrderModel({
          customerId: req.user._id,
          storeId: storeOrder.storeId,
          vendorId: store.userId,
          deliveryCost: calculateFare(
            {
              latitude: storeOrder.address.latitude,
              longitude: storeOrder.address.longitude,
            },
            {
              latitude: store.location.coordinates[1],
              longitude: store.location.coordinates[0],
            }
          ).totalFare,
          address: {
            coordinates: [
              storeOrder.address.latitude,
              storeOrder.address.longitude,
            ],
          },
        });
        //calculate the total price of order and push it to pending process
        let orderTotalPrice = 0;
        for (const orderItem of storeOrder.items) {
          //find sizedItem
          let orderItemCost = 0;
          let sizedItem = await ItemSizesModel.findById(orderItem.itemSizeId)
            .select("price")
            .lean();
          if (!sizedItem)
            return res
              .status(400)
              .json({ message: "Can't find entry with such id" });
          //else calculate total price
          orderItemCost += sizedItem.price * orderItem.quantity;
          //check if addons are given
          if (orderItem.addons) {
            for (let addon of orderItem.addons) {
              //add price and quantity
              orderItemCost += addon.price * orderItem.quantity;
            }
          }
          //form orderItem model and save to the db
          orderTotalPrice += orderItemCost;
          //form order order item model;
          //push to pending process
          pendingProcess.push(
            new OrderItemModel({
              attributes: orderItem.addons,
              quantity: orderItem.quantity,
              itemSizeId: orderItem.itemSizeId,
              orderId: order._id,
              orderCost: orderItemCost,
            }).save()
          );
        }
        //push order
        order.totalPrice = orderTotalPrice + order.deliveryCost;
        order.itemCost = orderTotalPrice;
        pendingProcess.push(order.save());
        await Promise.all(pendingProcess);
        //await sendNewOrderNotification(store.userId, order);
        return res.status(200).json({ message: order });
      }
    } catch (err) {
      console.log(err);
      return res.status(501).json({ message: "error occurred" });
    }
  };
  static orderStatus = async (req, res) => {
    //returns the vendor status of an order
    return UserController.getOrderStatus("customer", req, res);
  };
  //cancel order
  static cancelOrder = async (req, res) => {
    //cancel order
    let orderId = req.body.orderId;
    if (!orderId) {
      return res.status(400).json({ message: "order id required" });
    }
    //find order status
    let order = await OrderModel.findById({ orderId });
    if (!order) {
      return res.status(400).json({ message: "cant find order" });
    }
    order.customerStatus = "CANCELLED";
    await order.save();
    //update the order rider status too
    let orderRider = await riderOrdersModel.findOne({ orderId });
    if (orderRider) {
      orderRider.status = "CANCELLED";
      await orderRider.save();
    }
    return res.status(200).json({ message: "cancelled" });
  };

  static rating = async (req, res) => {
    try {
      let details = req.body;
      if (!(details.entityId && details.type))
        return res.status(400).json({ message: "entityId, type are required" });
      //find store
      let entity = type.toLowerCase() === "store" ? await StoreModel.findById(details.entityId) : await StoreModel.findById(details.entityId)
      if (!entity)
        return res.status(400).json({ message: "wrong entity id" });
      //compute rateValue
      entity.ratings.totalPeopleRated += 1;
      entity.ratings.totalRatedValueValue += (details.ratedValue) ? details.ratedValue : 0;
      entity.ratings.totalRatedPoint = (entity.ratings.totalPeopleRated === 0) ? 0 : (entity.ratings.totalRatedValueValue / entity.ratings.totalPeopleRated)
      Promise.all([entity.save(), new customerRatingsModel({ customerId: req.user._id, entityId: details.entityId, message: details.message, rateValue: details.ratedValue }).save()])
      return res.status(200).json({ message: "operation success" })
    } catch (err) {
      console.log(err)
      return res.status(500).json({message:"internal error"})
    }
  }
}

export { CustomerController };
