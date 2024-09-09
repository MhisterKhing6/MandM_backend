import { Schema, model } from "mongoose";

const subCategories = new Schema({
    name: { type: String, required: true },
    categoryId: {type: Schema.Types.ObjectId, ref: 'Categories', required: true },
    enable: {type:Boolean, default:true}
  });

  let categoriesModel = model("SubCategories", categoriesModel)
  
  export {categoriesModel}
  
