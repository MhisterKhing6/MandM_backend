import { Schema, model } from "mongoose";

const Store = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    storeName: { type: String, required: true },
    storeAddress: { type: String, required: true },
    storePhone: { type: String, require:true },
    storeGpsAddress: { type: String },
    createdAt: { type: Date, default: Date.now },
  });
  
let  StoreModel = model('Store', VendorSchema);
export {StoreModel}