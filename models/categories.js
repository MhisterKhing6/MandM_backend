import { Schema, model } from "mongoose";

const Categories = new Schema({
    name: { type: String, required: true },
    enable: {type:Boolean, default:true},
    subCategories: [{type: Schema.Types.ObjectId, ref: 'SubCategories', required: true }],

  });

  let categoriesModel = model("Categories", categoriesModel)

  export {categoriesModel}
  
