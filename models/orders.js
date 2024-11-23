import { Schema, Types, model } from "mongoose";

const OrderSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: "Users", required: true }, //order id
  totalPrice: { type: Schema.Types.Number, required: true }, //rider who picked the order
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  vendorId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
  vendorStatus: { type: String, enum: ["PENDING", "ACCEPTED", "REJECTED", "COMPLETED"], default:"PENDING"},//track order status
  customerStatus: { type: String, enum: ["PENDING", "APPROVED","PICKED", "REJECTED", "DELIVERED"], default:"PENDING"},
  address: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  createdAt: { type: Date, default: Date.now },
});

let OrderModel = model("Orders", OrderSchema);

export { OrderModel };
