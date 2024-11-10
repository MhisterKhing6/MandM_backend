import { mongoose } from "mongoose";

const addonSchema = new mongoose.Schema({
  name: String,
  price: Number,
  quantity: { type: Number, default: 1 },
});

const cartItemSchema = new mongoose.Schema({
  productId: String,
  name: String,
  quantity: { type: Number, default: 1 },
  price: Number,
  addons: [addonSchema],
});


const storeSchema = new mongoose.Schema({
  storeId: String, // Unique identifier for each store
  items: [cartItemSchema], // Items specific to this store
});


const cartSchema = new mongoose.Schema({
  userId: String,
  stores: { type: [storeSchema], default: [] }, // Stores array to group items by storeId
});

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
