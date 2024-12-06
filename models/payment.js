// const mongoose = require("mongoose");
import mongoose from "mongoose";
const PaymentMethodSchema = new mongoose.Schema({
  token: String,
  last4: String,
  brand: String,
});

const UserPaymentMethodSchema = new mongoose.Schema({
  email: String,
  paymentMethods: [PaymentMethodSchema],
});
let PaymentSchema = mongoose.model("User", UserPaymentMethodSchema);
export { PaymentSchema };
