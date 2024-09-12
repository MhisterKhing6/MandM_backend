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
import { deleteFolder } from "../utils/FileHandler.js";
import path from "path";
const url = "/vendor/item";

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
    email: "tese3t2est255@gmail.com",
    password: sha1("987321"),
    phoneNumber: "8758552214",
  };

  let user3 = {
    role: "vendor",
    name: "kingsley",
    email: "user3test255@sgmail.com",
    password: sha1("987321"),
    phoneNumber: "87ss58552214",
  };

  let token3 = ""

  let user3Store = {}

  let user3Item = {
    "categoryId": "9888888",
    "subCategoryId": "2222222",
    "name": "Google Pixel 9 pro",
    "description": "Google phone running android 18 with 8 gig ram, 2023 model",
    "year":"2022"
  };

  let token1 = generateToken(user1);
  let token2 = "";
  after(async () => {
    await UserModel.deleteMany({});
    await VerifyIdentityModel.deleteMany({})
    await ItemImageModel.deleteMany({})
    await ItemModel.deleteMany({})
    await ItemSizesModel.deleteMany({})
    await StoreModel.deleteMany({})
    await deleteFolder(path.join(path.resolve("."), "public"))
  });
  before(async () => {
    await UserModel.deleteMany({});
    await VerifyIdentityModel.deleteMany({})
    await StoreModel.deleteMany({})
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

    let user3Login = await request(app)
      .post("/api/login")
      .send({ id: user3.email, password: "987321" })
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    token3 = user3Login.body.token;
    user3.db = user3Login.body.user;
    await new VerifyIdentityModel({userId:user3.db._id, status: "verified",userPic: "path to user pic", "idCard":"path to id card"}).save()
    user3Store.db = await new StoreModel({storeName:"Afa Papa Accessories", storePhone:"+22222222222222",userId:user3.db._id, latitude:"23333333", "longitude":"33333333"}).save()
    user3Item.db =  await new ItemModel({storeId: user3Store.db._id, ...user3Item}).save()

  });
  it("should return status 400 with no authorization token given", async () => {
    let data = { name: "kingsley" };
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    assert.equal(response.status, 401);
    assert.equal(response.body.message, "no authorization token");
  });

  //testing normal registration
  it("should return 400, with wrong token", async () => {
    let data = {};
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token1}s`)
      .set("content-type", "application/json");
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "wrong token");
  });

  it("should return status of 401, with wrong user not authorized", async () => {
    let data = {
      role: "customer",
      name: "kingsley",
      email: "test255@gmail.com",
      password: "987321",
      phoneNumber: "8758552214",
    };
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token1}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 401);
    assert.equal(response.body.message, "user not authorized");
  });

  it("should return status of 400, with vendor identity not verified", async () => {
    let data = {
      itemId:"testItemId"
    };
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 401);
    assert.equal(response.body.message, "vendor identity not verified");
  });


  it("should return status of 400, with not all fields given", async () => {
    let data = {};
    let identity = new VerifyIdentityModel({userId:user, status: "verified",userPic: "path to user pic", "idCard":"path to id card"});
    await identity.save()
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "itemId is required");
  });


  it("should return status of 400, with no store information added", async () => {
    let data = {
        itemId:"testItemId"
      };
    let identity = new VerifyIdentityModel({userId:user, status: "verified",userPic: "path to user pic", "idCard":"path to id card"});
    await identity.save()
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "user doesn't have a store");
  });

  
  it("should return status of 400, with item not found, check item id", async () => {
    let data = {
        itemId:user._id
      };
    await new VerifyIdentityModel({userId:user, status: "verified",userPic: "path to user pic", "idCard":"path to id card"}).save();
    await new StoreModel({storeName:"Afa Papa Accessories", storePhone:"+22222222222222",userId:user._id, latitude:"23333333", "longitude":"33333333"}).save()
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "item not found, check item id")
  });

  it("should return status of 401, with item doesn't belong store", async () => {
    let data = {
        itemId:user3Item.db._id
      };
    await new VerifyIdentityModel({userId:user, status: "verified",userPic: "path to user pic", "idCard":"path to id card"}).save();
    await new StoreModel({storeName:"Afa Papa Accessories", storePhone:"+22222222222222",userId:user._id, latitude:"23333333", "longitude":"33333333"}).save()
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    console.log(response.body)
    assert.equal(response.status, 401);
    assert.equal(response.body.message, "item doesn't belong to user store")
  });

  it("should return status of 200, with item description changed to user description", async () => {
    let data = {
        itemId:user3Item.db._id,
        description:"testing description"
      };
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token3}`)
      .set("content-type", "application/json");
    console.log(response.body)
    let updatedItem  = await ItemModel.findById(user3Item.db._id)
    assert.equal(response.status, 200);
    assert.equal(response.body.message, "item updated successfully")
    assert.equal(updatedItem.description, data.description)
  });

  it("should return status of 200, with item description and name changed to data name and description", async () => {
    let data = {
        itemId:user3Item.db._id,
        description:"testing description",
        name: "change test"
      };
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token3}`)
      .set("content-type", "application/json");
    console.log(response.body)
    let updatedItem  = await ItemModel.findById(user3Item.db._id)
    assert.equal(response.status, 200);
    assert.equal(response.body.message, "item updated successfully")
    assert.equal(updatedItem.description, data.description)
    assert.equal(updatedItem.name, data.name)
  });

  it("should return status of 400, with to add new sizes, name,price and quantity are required fields", async () => {
    let data = {
        itemId:user3Item.db._id,
        description:"testing description",
        name: "change test",
        sizes: [
            {action:"add", price:566, "quantity": 200},
        ]
      };
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token3}`)
      .set("content-type", "application/json");
    let updatedItem  = await ItemModel.findById(user3Item.db._id).populate("itemSizes").exec()
    let itemSizes  = await ItemSizesModel.find({itemId:user3Item.db._id}).lean()
    console.log(itemSizes)
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "to add new sizes, name,price and quantity are required fields")
  });


  it("should return status of 200, with item description and name changed, sizes uploaded", async () => {
    let data = {
        itemId:user3Item.db._id,
        description:"testing description",
        name: "change test",
        sizes: [
            {action:"add", name: "13gb ROM and 5 gig Ram", price:566, "quantity": 200},
            {action:"add", name: "18gb ROM and 5 gig Ram", price:566, "quantity": 200},
            {action:"add", name: "12gb ROM and 5 gig Ram", price:566, "quantity": 200}
        ]
      };
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token3}`)
      .set("content-type", "application/json");
    let updatedItem  = await ItemModel.findById(user3Item.db._id).populate("itemSizes").exec()
    let itemSizes  = await ItemSizesModel.find({itemId:user3Item.db._id}).lean()
    console.log(itemSizes)
    assert.equal(response.status, 200);
    assert.equal(response.body.message, "item updated successfully")
    assert.equal(updatedItem.description, data.description)
    assert.equal(updatedItem.name, data.name)
    assert.equal(itemSizes.length, 3)
  });


  it("should return status of 200, with item description and name changed to data name and description", async () => {
    let data = {
        itemId:user3Item.db._id,
        description:"testing description",
        name: "change test"
      };
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token3}`)
      .set("content-type", "application/json");
    console.log(response.body)
    let updatedItem  = await ItemModel.findById(user3Item.db._id)
    assert.equal(response.status, 200);
    assert.equal(response.body.message, "item updated successfully")
    assert.equal(updatedItem.description, data.description)
    assert.equal(updatedItem.name, data.name)
  });

  it("should return status of 400, with sizeId is required to delete the size", async () => {

    let uploadedSize = await new ItemSizesModel({itemId:user3Item.db._id, price:500, name:"98gig", quantity:20}).save()
    let data = {
        itemId:user3Item.db._id,
        description:"testing description",
        name: "change test",
        sizes: [
            {action:"delete", itemId:uploadedSize._id},
        ]
      };
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token3}`)
      .set("content-type", "application/json");
    let updatedItem  = await ItemModel.findById(user3Item.db._id).populate("itemSizes").exec()
    let itemSizes  = await ItemSizesModel.find({itemId:user3Item.db._id}).lean()
    console.log(itemSizes)
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "sizeId is required to delete the size")
   
  });

  //deleting size
  it("should return status of 200, with name and description changed and size deleted", async () => {
    await ItemSizesModel.deleteMany({})
    let uploadedSize = await new ItemSizesModel({itemId:user3Item.db._id, price:500, name:"98gig", quantity:20}).save()
    let data = {
        itemId:user3Item.db._id,
        description:"testing description",
        name: "change test",
        sizes: [
            {action:"delete", sizeId:uploadedSize._id},
        ]
      };
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token3}`)
      .set("content-type", "application/json");
    let itemSizes  = await ItemSizesModel.find({itemId:user3Item.db._id}).lean()
    console.log(itemSizes)
    assert.equal(response.status, 200);
    assert.equal(itemSizes.length, 0)
   
  });


  it("should return status of 200, with name and description changed and size deleted", async () => {
    await ItemSizesModel.deleteMany({})
    let uploadedSize = await new ItemSizesModel({itemId:user3Item.db._id, price:500, name:"98gig", quantity:20}).save()
    let data = {
        itemId:user3Item.db._id,
        description:"testing description",
        name: "change test",
        sizes: [
            {action:"delete", sizeId:uploadedSize._id},
        ]
      };
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token3}`)
      .set("content-type", "application/json");
    let itemSizes  = await ItemSizesModel.find({itemId:user3Item.db._id}).lean()
    console.log(itemSizes)
    assert.equal(response.status, 200);
    assert.equal(itemSizes.length, 0)
   
  });

  //updating quantity and price
  it("should return status of 400, to update item size, sizeId is required", async () => {
    await ItemSizesModel.deleteMany({})
    let uploadedSize = await new ItemSizesModel({itemId:user3Item.db._id, price:500, name:"98gig", quantity:20}).save()
    let data = {
        itemId:user3Item.db._id,
        description:"testing description",
        name: "change test",
        sizes: [
            {},
        ]
      };
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token3}`)
      .set("content-type", "application/json");
    let itemSizes  = await ItemSizesModel.find({itemId:user3Item.db._id}).lean()
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "to update item size, sizeId is required")
   
  });

  
  it("should return status of 200, with name and description changed and size deleted", async () => {
    await ItemSizesModel.deleteMany({})
    let uploadedSize = await new ItemSizesModel({itemId:user3Item.db._id, price:500, name:"98gig", quantity:20}).save()
    let data = {
        itemId:user3Item.db._id,
        description:"testing description",
        name: "change test",
        sizes: [
            {action:"update", sizeId:uploadedSize._id, price:800, quantity:9999},
        ]
      };
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token3}`)
      .set("content-type", "application/json");
    let itemSizes  = await ItemSizesModel.findById(uploadedSize._id).lean()
    assert.equal(response.status, 200);
    assert.equal(itemSizes.price, data.sizes[0].price)
    assert.equal(itemSizes.quantity, data.sizes[0].quantity)
   
  });
  
  //adding images
  it("should return status of 400, image should have have a fileName and data", async () => {
    let data = {
        itemId:user3Item.db._id,
        description:"testing description",
        name: "change test",
        images: [
            {data:`base64,${Buffer.from("test image 3").toString("base64")}`},
        ]
      };
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token3}`)
      .set("content-type", "application/json");
    let itemSizes  = await ItemSizesModel.find({itemId:user3Item.db._id}).lean()
    console.log(itemSizes)
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "image should have have a fileName and data")
   
  });

  
  it("should return status of 200, with name and description changed and size deleted", async () => {
    let data = {
        itemId:user3Item.db._id,
        description:"testing description",
        name: "change test",
        images: [
            {data:`base64,${Buffer.from("test image 18").toString("base64")}`, fileName:"image.txt"},
        ]
      };
    let response = await request(app)
      .put(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token3}`)
      .set("content-type", "application/json");
    let itemImage  = await ItemImageModel.find({itemId:data.itemId}).lean()
    assert.equal(response.status, 200);
    assert.equal(itemImage.length, 1)
  });
  

});
