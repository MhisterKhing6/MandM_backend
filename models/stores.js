import { Schema, model } from "mongoose";

const Store = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    storeName: { type: String, required: true },
    storeAddress: { type: String},
    storePhone: { type: String, require:true },
    latitude: { type: String },
    longitude: { type: String },
    createdAt: { type: Date, default: Date.now },
  });
  
let  StoreModel = model('Store', Store);
export {StoreModel}