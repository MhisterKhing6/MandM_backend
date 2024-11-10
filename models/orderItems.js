import { Schema, Types, model } from "mongoose";

const OrderItemSchema = new Schema({
  itemSizeId: { type: Schema.Types.ObjectId, ref: "ItemSizes", required: true }, //order id
  orderCost: { type: Schema.Types.Number, required: true },//rider who picked the order
  quantity:   { type: Schema.Types.Number},//track order status
  orderId:   { type: Schema.Types.ObjectId, ref: "OrderId", required: true },
  attributes: [{
    type: Schema.Types.Map,
    of: Schema.Types.Mixed,
    default: {} /**year, colors */,
  }],
});

let OrderItemModel = model("OrderItems", OrderItemSchema);

export { OrderItemModel };
