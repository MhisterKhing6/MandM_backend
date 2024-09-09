import {model, Schema } from "mongoose";
const verification = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    verificationCode: {type:String, required:true},
    createdDate: {type:Date, default:Date.now},
    verified: {type:Boolean, default:false}
})

//create a model
let VerifyTokenModel = model("VerifyToken", verification)

export {VerifyTokenModel}

