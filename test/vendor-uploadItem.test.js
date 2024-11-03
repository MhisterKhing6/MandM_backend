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
    email: "t2est255@gmail.com",
    password: sha1("987321"),
    phoneNumber: "8758552214",
  };

  let token1 = generateToken(user1);
  let token2 = "";
  after(async () => {
    await UserModel.deleteMany({});
    await VerifyIdentityModel.deleteMany({});
    await ItemImageModel.deleteMany({});
    await ItemModel.deleteMany({});
    await ItemSizesModel.deleteMany({});
    await CategoriesModel.deleteMany({});
  });
  before(async () => {
    await UserModel.deleteMany({});
    await VerifyIdentityModel.deleteMany({});
    await Promise.all([
      new UserModel(user1).save(),
      new UserModel(user2).save(),
    ]);
    let response = await request(app)
      .post("/api/login")
      .send({ id: user2.email, password: "987321" })
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    token2 = response.body.token;
    user = response.body.user;
  });
  it("should return status 400 with no authorization token given", async () => {
    let data = { name: "kingsley" };
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    assert.equal(response.status, 401);
    assert.equal(response.body.message, "no authorization token");
  });

  //testing normal registration
  it("should return 400, with wrong token", async () => {
    let data = {
      role: "wrong",
      name: "kingsley",
      email: "test2@gmail.com",
      password: "987321",
      phoneNumber: "875552214",
    };
    let response = await request(app)
      .post(url)
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
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token1}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 401);
    assert.equal(response.body.message, "user not authorized");
  });

  it("should return status of 400, with no store information added", async () => {
    let data = {
      name: "Google Pixel 9 pro",
      description: "Google phone running android 18 with 8 gig ram, 2023 model",
      year: "2022",
    };
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 401);
    assert.equal(response.body.message, "vendor identity not verified");
  });

  it("should return status of 400, with not all fields given", async () => {
    let data = {
      storeName: "Kwame Anan",
      latitude: "987752111",
      longitude: "98838883",
    };
    let identity = new VerifyIdentityModel({
      userId: user,
      status: "verified",
      userPic: "path to user pic",
      idCard: "path to id card",
    });
    await identity.save();
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "not all fields given");
  });

  it("should return status of 400, with not all fields given", async () => {
    let data = {
      storeId: user._id.toString(),
      categoryId: "9888888",
      subCategoryId: "2222222",
      name: "Google Pixel 9 pro",
      attributes: { color: ["yellow", "pink", "brown"] },
      description: "Google phone running android 18 with 8 gig ram, 2023 model",
      images: [
        {
          fileName: "image1.txt",
          data: `base64,${Buffer.from("ImageData").toString("base64")}`,
        },
        {
          fileName: "image2.txt",
          data: `base64,${Buffer.from("ImageData2").toString("base64")}`,
        },
      ],
      sizes: [
        { name: "13gb ROM and 5 gig Ram", price: 566, quantity: 200 },
        { name: "18gb ROM and 5 gig Ram", price: 566, quantity: 200 },
        { name: "12gb ROM and 5 gig Ram", price: 566, quantity: 200 },
      ],
    };
    let identity = new VerifyIdentityModel({
      userId: user,
      status: "verified",
      userPic: "path to user pic",
      idCard: "path to id card",
    });
    await identity.save();
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "no store information added");
  });
  //phones
  it("should return status of 200", async () => {
    await new VerifyIdentityModel({
      userId: user,
      status: "verified",
      userPic: "path to user pic",
      idCard: "path to id card",
    }).save();
    let category = await new CategoriesModel({ name: "electronics" }).save();
    let store = await new StoreModel({
      type: category._id,
      storeName: "Afa Papa Accessories",
      storePhone: "+22222222222222",
      userId: user._id,
      latitude: "23333333",
      longitude: "33333333",
    }).save();
    let data = {
      categoryId: user._id.toString(),
      subCategoryId: user._id.toString(),
      name: "Google Pixel 9 pro",
      storeId: store._id,
      description: "Google phone running android 18 with 8 gig ram, 2023 model",
      attributes: { year: 2022, colors: ["brown", "yellow", "pink"] },
      images: [
        {
          fileName: "image1.txt",
          data: `base64,${Buffer.from("ImageData").toString("base64")}`,
        },
        {
          fileName: "image2.txt",
          data: `base64,${Buffer.from("ImageData2").toString("base64")}`,
        },
      ],
      sizes: [
        { name: "13gb ROM and 5 gig Ram", price: 566, quantity: 200 },
        { name: "18gb ROM and 5 gig Ram", price: 566, quantity: 200 },
        { name: "12gb ROM and 5 gig Ram", price: 566, quantity: 200 },
      ],
    };
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 200);
  });

  //food
  it("should return status of 200", async () => {
    await new VerifyIdentityModel({
      userId: user,
      status: "verified",
      userPic: "path to user pic",
      idCard: "path to id card",
    }).save();
    let category = await new CategoriesModel({ name: "electronics" }).save();
    let store = await new StoreModel({
      type: category._id,
      storeName: "Afa Papa Accessories",
      storePhone: "+22222222222222",
      userId: user._id,
      latitude: "23333333",
      longitude: "33333333",
    }).save();
    let data = {
      categoryId: user._id.toString(),
      subCategoryId: user._id.toString(),
      name: "Waakye",
      storeId: store._id,
      description: "Waakye with fifuslklsjflsjflsjflsjflsjflsjflsjfls",
      attributes: { toppings: { makroni: 20, beans: 55, fish: 30 } },
      images: [
        {
          fileName: "image1.txt",
          data: `base64,${Buffer.from("ImageData").toString("base64")}`,
        },
        {
          fileName: "image2.txt",
          data: `base64,${Buffer.from("ImageData2").toString("base64")}`,
        },
      ],
      sizes: [
        { name: "medium", description: "waakye na makksoslf", price: 566 },
      ],
    };
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 200);
  });
});
