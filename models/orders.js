import { Schema, Types, model } from "mongoose";

const OrderSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: "User", required: true }, //order id
  totalPrice: { type: Schema.Types.Number, required: true },//rider who picked the order
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  vendorId : {type:Schema.Types.ObjectId, ref: "User", required:true},
  vendorAcceptanceStatus: { type: Boolean, default:false},//track order status
  address: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  }
});

let OrderModel = model("Orders", OrderSchema);

export { OrderModel };
