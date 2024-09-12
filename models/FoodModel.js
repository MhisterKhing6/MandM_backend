import { Schema, model } from "mongoose";

const ItemSchema = new Schema({
    storeId: {type:Schema.Types.ObjectId,ref:"Store" , required:true},
    name: { type: String, required: true },
    year: {type:String},
    price: {type:Number, required:true},
    enable: {type:Boolean, required:true, default:true},
    categoryName: {type:String, required:true},
    subCategoryName: {type: String, required:true},
    images : [{type:Schema.Types.ObjectId, ref:"ItemImages"}]
  });

  let ItemModel = model("Items", ItemSchema)

  export {ItemModel}
  
