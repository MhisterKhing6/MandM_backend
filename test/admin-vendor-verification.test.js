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
const url = "/admin/vendor-verification";

describe("test codes for vendor verification", () => {
  let user = "";
  let user1 = {
    role: "customer",
    name: "kingsley",
    email: "test255@gmail.com",
    password: sha1("987321"),
    phoneNumber: "st8758552214",
  };
  let user2 = {
    role: "admin",
    name: "kingsley",
    email: "admint2est255@gmail.com",
    password: sha1("987321"),
    phoneNumber: "admin8758552214",
  };

  let user3 = new UserModel({
    role: "vendor",
    name: "kingsley",
    email: "user3admint2est255@gmail.com",
    password: sha1("987321"),
    phoneNumber: "user38758552214",
  });


  let token1 = generateToken(user1);
  let token2 = "";
  after(async () => {
    await UserModel.deleteMany({});
    await VerifyIdentityModel.deleteMany({})
    await ItemImageModel.deleteMany({})
    await ItemModel.deleteMany({})
    await ItemSizesModel.deleteMany({})
  });
  before(async () => {
    await UserModel.deleteMany({});
    await VerifyIdentityModel.deleteMany({})
    await Promise.all([
      new UserModel(user1).save(),
      new UserModel(user2).save(),
      user3.save(),
    ]);
    let response = await request(app)
      .post("/api/login")
      .send({ id: user2.email, password: "987321" })
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    token2 = response.body.token;
    user = response.body.user;
    await new VerifyIdentityModel({userId:user, status: "verified", userPic: "path to user pic", "idCard":"path to id card"}).save();
    await new VerifyIdentityModel({userId:user3, userPic: "path to user pic", "idCard":"path to id card"}).save();

  });
  it("should return status 400 with no authorization token given", async () => {
    let response = await request(app)
      .get(url)
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    assert.equal(response.status, 401);
    assert.equal(response.body.message, "no authorization token");
  });

  //testing normal registration
  it("should return 400, with wrong token", async () => {
    let response = await request(app)
      .get(url)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token1}s`)
      .set("content-type", "application/json");
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "wrong token");
  });

  it("should return status of 401, with wrong user not authorized", async () => {
    let response = await request(app)
      .get(url)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token1}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 401);
    assert.equal(response.body.message, "user not authorized");
  });


  
  it("should return status of 200, page, limit given", async () => {
    let response = await request(app)
      .get(url)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    console.log(response.body.message)
    assert.equal(response.status, 200);
    assert.isDefined(response.body.limit);
    assert.equal(response.body.items.length, 1);
    assert.isDefined(response.body.page);
  });


  it("should return status of 200, page, limit given", async () => {
    let response = await request(app)
      .get(`${url}?email=wrongemail@k`)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    console.log(response.body.message)
    assert.equal(response.status, 200);
    assert.isDefined(response.body.limit);
    assert.equal(response.body.items.length, 0);
    assert.isDefined(response.body.page);
  });

  it("should return status of 200, page, limit given", async () => {
    let response = await request(app)
      .get(`${url}?page=2`)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    console.log(response.body.message)
    assert.equal(response.status, 200);
    assert.isDefined(response.body.limit);
    assert.equal(response.body.items.length, 0);
    assert.isDefined(response.body.page);
  });

  it("should return status of 200, page, limit given", async () => {
    let response = await request(app)
      .get(`${url}?page=1&&limit=20`)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    console.log(response.body.message)
    assert.equal(response.status, 200);
    assert.isDefined(response.body.limit);
    assert.equal(response.body.items.length, 1);
    assert.isDefined(response.body.page);
  });

});
