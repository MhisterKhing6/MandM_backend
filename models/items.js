import { Schema, Types, model } from "mongoose";

const ItemSchema = new Schema({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  name: { type: String, required: true },
  description: { type: String },
  quantity: { type: Number },
  enable: { type: Boolean, required: true, default: true },
  categoryId: { type: Schema.Types.ObjectId, required: true },
  subCategoryId: { type: Schema.Types.ObjectId, String, required: true },
  images: [{ type: Schema.Types.ObjectId, ref: "ItemImages" }],
  itemSizes: [{ type: Schema.Types.ObjectId, ref: "ItemSizes" }],
  ratings: {type:Schema.Types.Mixed, default: {totalPeopleRated:0, totalRatedValueValue:0, totalRatedPoint:0.0}},
  attributes: {
    type: Schema.Types.Map,
    of: Schema.Types.Mixed,
    default: {} /**year, colors */,
  },
});

let ItemModel = model("Items", ItemSchema);

export { ItemModel };
