// import { Schema, model } from "mongoose";

// const Store = new Schema({
//   userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
//   storeName: { type: String, required: true },
//   storeAddress: { type: String },
//   storePhone: { type: String, require: true },
//   latitude: { type: String },
//   longitude: { type: String },
//   createdAt: { type: Date, default: Date.now },
//   type: { type: Schema.Types.ObjectId, ref: "Categories", required: true },
// });

// let StoreModel = model("Store", Store);
// export { StoreModel };

import { Schema, model } from "mongoose";

const Store = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  storeName: { type: String, required: true },
  storeAddress: { type: String },
  storePhone: { type: String, required: true },
  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  createdAt: { type: Date, default: Date.now },
  type: { type: Schema.Types.ObjectId, ref: "Categories", required: true },
});

// Create a 2dsphere index on the location field
Store.index({ location: "2dsphere" });

let StoreModel = model("Store", Store);
export { StoreModel };
