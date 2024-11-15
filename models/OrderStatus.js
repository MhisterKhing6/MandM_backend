import { Schema, Types, model } from "mongoose";

const OrderRiderStatus = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: "Store", required: true }, //order id
<<<<<<< HEAD
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
=======
  riderId: { type: Schema.Types.ObjectId, required: true },//rider who picked the order
  status: { type: String, required: true, enum: ["DELIVERED", "PICKED"] }//track order status
});

let OrderRiderStatusModel = model("OrderStatus", OrderRiderStatus);
>>>>>>> bddba98c627c47f5c5910010ade2b28a5317c325

export { OrderRiderStatusModel };
