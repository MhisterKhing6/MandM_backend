import { ItemSizesModel } from "../models/itemSizes.js";
import { OrderItemModel } from "../models/orderItems.js";
import { OrderModel } from "../models/orders.js";
import { OrderRiderStatusModel } from "../models/OrderStatus.js";
import { PaymentVendorModel } from "../models/paymentStore.js";
import { StoreModel } from "../models/stores.js";
import sendNewOrderNotification from "../utils/notificationHandler.js";
import { UserController } from "./userController.js";

class CustomerController {
  static placeOrder = async (req, res) => {
    let mainOrder;
    //items decide the kind of data structures between the interfaces
    //[{storeId:"stores", items:[{itemSizeId:ssll}]}, //[{storeId:"stores", items:[{itemSizeId:ssll}]}  ]
    try {
      let ordersDetails = req.body;
      let pendingProcess = []; //fast process
      //loop through thee orders
      for (let storeOrder of ordersDetails) {
        //form order entry
        //find store entry
        let store = await StoreModel.findById(storeOrder.storeId)
          .lean()
          .select("userId");
        if (!store) return res.status(400).json("No store entry found");

        let order = new OrderModel({
          customerId: req.user._id,
          storeId: storeOrder.storeId,
          vendorId: store.userId,
          address: {
            coordinates: [
              storeOrder.address.latitude,
              storeOrder.address.longitude,
            ],
          },
        });
        mainOrder = order;
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
        order.totalPrice = orderTotalPrice;
        pendingProcess.push(order.save());
        //find store payment
        let storePayment = await PaymentVendorModel.findOne({
          storeId: storeOrder.storeId,
        });
        if (storePayment) storePayment += orderTotalPrice;
        else
          storePayment = new PaymentVendorModel({
            storeId: storeOrder.storeId,
            userId: store.userId,
            amount: orderTotalPrice,
          });

        pendingProcess.push(storePayment.save());
        await sendNewOrderNotification(store.userId, mainOrder);
      }
      await Promise.all(pendingProcess);
      for (let storeOrder of ordersDetails) {
        let store = await StoreModel.findById(storeOrder.storeId)
          .lean()
          .select("userId");
        await sendNewOrderNotification(store.userId, mainOrder);
      }
      return res.status(200).json({ message: "order placed successfully" });
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
    let orderRider = await OrderRiderStatusModel.findOne({ orderId });
    if (orderRider) {
      orderRider.status = "CANCELLED";
      await orderRider.save();
    }
    return res.status(200).json({ message: "cancelled" });
  };
}

export { CustomerController };
