import { Schema, Types, model } from "mongoose";

const OrderStatusOrdSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: "Store", required: true }, //order id
  riderId: { type: Schema.Types.ObjectId, required: true }, //rider who picked the order
  status: {
    type: String,
    required: true,
    enum: ["DELIVERED", "PICKED", "ONWAY"],
  }, //track order status
  currentRiderLocation: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
});

let OrderStatusModel = model("OrderStatus", OrderStatusOrdSchema);

export { OrderStatusModel };
