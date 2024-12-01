import { Schema, Types, model } from "mongoose";

const PaymentVendor = new Schema({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true }, //order id
  userId: { type: Schema.Types.ObjectId, required: true , ref:"Users"},//rider who picked the order
  amount:   { type: Schema.Types.Number},//track order status
});

let PaymentVendorModel = model("PaymentVendor", PaymentVendor);

export { PaymentVendorModel };
