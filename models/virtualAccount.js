import { Schema, Types, model } from "mongoose";

const virtualAccount = new Schema({
  id: { type: Schema.Types.ObjectId, required: true }, //order id
  amount:   { type: Schema.Types.Number, default: 0},//track order status,
  totalAccumulated: {type:Schema.Types.Number, default:0},
  totalWithdrawn: {type:Schema.Types.Number, default:0}
});

let VirtualAccountModel = model("virtualAccount", virtualAccount);

export { VirtualAccountModel};
