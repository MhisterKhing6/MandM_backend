import { Schema, model } from "mongoose";

const ItemSizesSchema = new Schema({
    itemId: {type:Schema.Types.ObjectId,ref:"Items" , required:true},
    name: { type: String, required: true },
    price: {type:Number, required:true},
    quantity: {type:Number},
    enable: {type:Boolean, required:true, default:true},
  });

  let ItemSizesModel = model("ItemSizes", ItemSizesSchema)

  export {ItemSizesModel}
  
