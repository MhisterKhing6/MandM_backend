import { Schema, Types, model } from "mongoose";

const ridersDetails = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true , ref:"Users"},//rider who picked the order
  operationArea: {type:Schema.Types.String, required:true}
});

let riderDetailsModel = model("riderDetails", ridersDetails);

export { riderDetailsModel };
