import { Schema, model } from "mongoose";

const ItemImageSchema = new Schema({
    url: { type: String, required: true },
    diskPath: { type: String, required: true },
    itemId: {type:Schema.Types.ObjectId,ref:"Items" , required:true},
  });

  let ItemImageModel = model("ItemImages", ItemImageSchema)

  export {ItemImageModel}
  
