import { Schema, model } from "mongoose";

const VendorSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vendorName: { type: String, required: true },
    vendorAddress: { type: String, required: true },
    vendorPhone: { type: String },
    createdAt: { type: Date, default: Date.now },
    verified: {type:Boolean, default:false}
  });
  
let  vendorModel = model('Vendor', VendorSchema);
export {vendorModel}