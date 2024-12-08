import { Schema, Types, model } from "mongoose";

const customerRatings = new Schema({
    message: { type: String},
    entityId: {type:Schema.Types.ObjectId ,required:true},
    rateValue:{type:Number, required:true},
    customerId :{type:Schema.Types.ObjectId, required:true}
  });

  let customerRatingsModel = model("CustomerRatings", customerRatings)

  export {customerRatingsModel}
  
