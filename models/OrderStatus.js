import { Schema, Types, model } from "mongoose";

const OrderRiderStatus = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: "Store", required: true }, //order id
  deliveryCost : {Number},
  riderId: { type: Schema.Types.ObjectId, required: true }, //rider who picked the order
  status: { type: String, required: true, enum: ["ACCEPTED" , "DELIVERED", "PICKED", "CANCELLED"] , default:"ACCEPTED"}, //track order status
});

let OrderRiderStatusModel = model("OrderStatus", OrderRiderStatus);

export { OrderRiderStatusModel };
