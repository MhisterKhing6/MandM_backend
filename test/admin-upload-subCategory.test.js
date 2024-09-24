//test for user registration
import request from "supertest";
import { app } from "../index.js";
import { assert } from "chai";
import { UserModel } from "../models/user.js";
import { after, before, describe } from "mocha";
import { generateToken } from "../utils/WebTokenController.js";
import sha1 from "sha1";
import { VerifyIdentityModel } from "../models/verifyIdentity.js";
import { ItemImageModel } from "../models/itemsImages.js";
import { ItemModel } from "../models/items.js";
import { ItemSizesModel } from "../models/itemSizes.js";
import { CategoriesModel } from "../models/categories.js";
import { subCategoriesModel } from "../models/subCategories.js";
const url = "/admin/subcategory";

describe("test codes for upload  subcategories", () => {
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

  let token1 = generateToken(user1);
  let token2 = "";
  let category = new CategoriesModel({name:"Phones"})
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
    ]);
    let response = await request(app)
      .post("/api/login")
      .send({ id: user2.email, password: "987321" })
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    token2 = response.body.token;
    user = response.body.user;
    await category.save()

  });
  it("should return status 400 with no authorization token given", async () => {
    let response = await request(app)
      .post(url)
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    assert.equal(response.status, 401);
    assert.equal(response.body.message, "no authorization token");
  });

  //testing normal registration
  it("should return 400, with wrong token", async () => {
    let response = await request(app)
      .post(url)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token1}s`)
      .set("content-type", "application/json");
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "wrong token");
  });

  it("should return status of 401, with wrong user not authorized", async () => {
    
    let response = await request(app)
      .post(url)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token1}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 401);
    assert.equal(response.body.message, "user not authorized");
  });


  

  it("should return status of 400, not all fields given", async () => {
    let data = {}
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "not all fields given");
  });

  it("should return status of 400, subCategories should be an array, containing categories name, eg:['break fast', 'lunch']", async () => {
    let data = {subCategories: {}, categoryId:"cat"}
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "subCategories should be an array, containing categories name, eg:['break fast', 'lunch']");
  });

  it("should return status of 400, no subCategories names given", async () => {
    let data = {subCategories: [], categoryId:category._id}
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "no subCategories names given");
  });

  it("should return status of 400, no category entry found for category id", async () => {
    let data = {subCategories: ["SamSung", "Nokia"], categoryId:user._id}
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "no category entry found for category id");
  });

  it("should return status of 200", async () => {
    let data = {
        subCategories : ["Nokia", "Infinix", "SamSung"],
        categoryId:category._id
      };
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 200);
  });

  it("should return status of 200", async () => {
    await subCategoriesModel.deleteMany({})
    let data = {
        subCategories : ["Infinix", "Nokia", "Apple"],
        categoryId: category._id
      };
    await new subCategoriesModel({name:"nokia", categoryId:category._id}).save()
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    let numCategories = await subCategoriesModel.countDocuments()
    assert.equal(response.status, 200);
    assert.equal(numCategories, 3)
  });


});
