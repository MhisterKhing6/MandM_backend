//test for user registration
import request from "supertest";
import { app } from "../index.js";
import { assert } from "chai";
import { UserModel } from "../models/user.js";
import { after, before, describe } from "mocha";
import { generateToken } from "../utils/WebTokenController.js";
import sha1 from "sha1";
import { VerifyIdentityModel } from "../models/verifyIdentity.js";
import { VerifyTokenModel } from "../models/verifyToken.js";
import { StoreModel } from "../models/stores.js";
import { ItemImageModel } from "../models/itemsImages.js";
import { ItemModel } from "../models/items.js";
import { ItemSizesModel } from "../models/itemSizes.js";
import { CategoriesModel } from "../models/categories.js";
import { OrderItemModel } from "../models/orderItems.js";
import { OrderModel } from "../models/orders.js";
import { riderOrdersModel } from "../models/riderOrders.js";


describe("test codes for vendor functions", () => {
  let user = "";
  let user1 = {
    role: "customer",
    name: "kingsley",
    email: "test255@gmail.com",
    password: sha1("987321"),
    phoneNumber: "8758552214",
  };
  let user2 = {
    role: "vendor",
    name: "kingsley",
    email: "t2est255@gmail.com",
    password: sha1("987321"),
    phoneNumber: "8758552214",
  };

  let user3 = {
    role: "dispatcher",
    name: "kingsley",
    email: "testRider@gmail.com",
    password: sha1("987321"),
    phoneNumber: "8758552214",
  };

  let token1 = "";
  let token2 = "";
  let category = {name:"Food"};
  let store = null;
  after(async () => {
    await UserModel.deleteMany({});
    await VerifyIdentityModel.deleteMany({})
    await ItemImageModel.deleteMany({})
    await ItemModel.deleteMany({})
    await ItemSizesModel.deleteMany({})
    await OrderItemModel.deleteMany();
    await OrderModel.deleteMany({})
    await riderOrdersModel.deleteMany({})
  });
  before(async () => {
    await UserModel.deleteMany({});
    await VerifyIdentityModel.deleteMany({})
    await Promise.all([
      new UserModel(user1).save(),
      new UserModel(user2).save(),
      new UserModel(user3).save()
    ]);
    let response = await request(app)
      .post("/api/login")
      .send({ id: user2.email, password: "987321" })
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    token2 = response.body.token;
    user = response.body.user;
    //customer login in
    let customerLoginResponse = await request(app)
      .post("/api/login")
      .send({ id: user1.email, password: "987321" })
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    token1 = customerLoginResponse.body.token;
    let riderResponse = await request(app)
      .post("/api/login")
      .send({ id: user3.email, password: "987321" })
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    user3.token = riderResponse.body.token;
    category = await new CategoriesModel(category).save()
    //upload category item
    await new VerifyIdentityModel({userId:user, status: "verified",userPic: "path to user pic", "idCard":"path to id card"}).save();
    store = await new StoreModel({location: {coordinates: [6.666600,-1.616271 ] },type:category._id,storeName:"Afa Papa Accessories", storePhone:"+22222222222222",userId:user._id, latitude:"23333333", "longitude":"33333333"}).save()
    let data = {
      "categoryId": user._id.toString(),
      "subCategoryId": user._id.toString(),
      "name": "Google Pixel 9 pro",
      "description": "Google phone running android 18 with 8 gig ram, 2023 model",
      "year":"2022",
      "storeId": store._id,
      "images": [{"fileName": "image1.txt", data:`base64,${Buffer.from("ImageData").toString("base64")}`},{"fileName": "image2.txt", data:`base64,${Buffer.from("ImageData2").toString("base64")}`}],
      "sizes": [
          {"name": "13gb ROM and 5 gig Ram", price:566, "quantity": 200},
          {"name": "18gb ROM and 5 gig Ram", price:566, "quantity": 200},
          {"name": "12gb ROM and 5 gig Ram", price:566, "quantity": 200}
      ]
    };
    await request(app)
      .post("/vendor/item")
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
  });

  it("order should be accepted by rider", async () => {
    //find all the item sizes
    let itemSizes = await ItemSizesModel.find().select("_id").lean();
    //form the order object
    let storeOrder = {storeId:store._id, address: {latitude:38.8951, longitude:-77.0364}}
    const addons =[ {name:"mackroni", price:300}, {name:"soup", price:355}]
    let itemIds = itemSizes.map(item => {
        return {itemSizeId : item._id, quantity:30, addons:addons};
    })
    storeOrder.items = itemIds;
    //send response
    let response = await request(app).post("/customer/order")
    .send([storeOrder])
    .set("Accept", "application/json")
    .set("Authorization", `Bearer ${token1}`)
    .set("content-type", "application/json");
    //accept order
    let placedResponse = await request(app).post("/rider/order-status")
    .send({orderId:response.body.message._id, status:"accepted"})
    .set("Accept", "application/json")
    .set("Authorization", `Bearer ${user3.token}`)
    .set("content-type", "application/json"); 
    assert.equal(200, placedResponse.status)
  })
});
