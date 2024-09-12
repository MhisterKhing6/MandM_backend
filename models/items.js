import { Schema, model } from "mongoose";

const ItemSchema = new Schema({
    storeId:{type:Schema.Types.ObjectId,ref:"Store" , required:true},
    name:   { type: String, required: true },
    year:   {type:String},
    description:  {type:String},
    enable: {type:Boolean, required:true, default:true},
    categoryId: {type:String, required:true},
    subCategoryId: {type: String, required:true},
    images : [{type:Schema.Types.ObjectId, ref:"ItemImages"}],
    itemSizes: [{type:Schema.Types.ObjectId, ref:"ItemSizes"}],
    colors: {type:String}
  });

  let ItemModel = model("Items", ItemSchema)

  export {ItemModel}
  
