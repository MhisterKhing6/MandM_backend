import {model, Schema } from "mongoose";
const verifyIdentity = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    idCard: {type:String, required:true},
    userPic: {type:String, required:true},
    createdDate: {type:Date, default:Date.now},
    status: {type:String, enum:["not verified", "pending", "verified"], default:"not verified"}
})

//create a model
let VerifyIdentityModel = model("Identity", verifyIdentity)

export {VerifyIdentityModel}

