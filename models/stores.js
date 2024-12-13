

import { Schema, model } from "mongoose";

const Store = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  storeName: { type: String, required: true },
  storeAddress: { type: String },
  images: [{type:Schema.Types.Mixed}],
  ratings: {
    type: Schema.Types.Mixed,
    default: {
      totalPeopleRated: 0,
      totalRatedValue: 0,
      totalRatedPoint: 0.0
    }
  },
  //startTime: {type:String},
  //endTime: {type:String},
  open: {type: Schema.Types.Boolean, default:true},
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
