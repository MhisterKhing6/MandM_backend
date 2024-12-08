import { Schema, Types, model } from "mongoose";

const riderOrders = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: "Orders"}, //order id
  deliveryCost : {Number},
  riderId: { type: Schema.Types.ObjectId, ref: "Users" }, //rider who picked the order
  status: { type: String, required: true, enum: ["ACCEPTED" , "DELIVERED", "PICKED", "CANCELLED"] , default:"ACCEPTED"}, //track order status
});

let riderOrdersModel = model("riderOrders", riderOrders);

export { riderOrdersModel };
