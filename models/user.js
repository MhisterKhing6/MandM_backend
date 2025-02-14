import { model, Schema } from "mongoose";
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String },
  address: { type: String }, // For customers
  role: {
    type: String,
    enum: ["customer", "vendor", "dispatcher", "admin"],
    required: true,
  },
  fcmToken: { type: String },
  created_at: { type: Date, default: Date.now },
});

//create a model
let UserModel = model("Users", UserSchema);
export { UserModel };
