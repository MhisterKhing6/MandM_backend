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
import { connectDb } from "../utils/MongodbConnector.js";
const url = "/vendor/add-store-info";

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
    await VerifyIdentityModel.deleteMany({})
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

  });
  it("should return status 400 with no authorization token given", async () => {
    let data = { name: "kingsley" };
    let response = await request(app)
      .post("/vendor/add-store-info")
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

  it("should return status of 401, vendor identity not verified", async () => {
    let data = {
      "how":"yp"
    };
    let response = await request(app)
      .post("/vendor/add-store-info")
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
    let identity = new VerifyIdentityModel({userId:user, status: "verified",userPic: "path to user pic", "idCard":"path to id card"});
    await identity.save()
    let response = await request(app)
      .post("/vendor/add-store-info")
      .send(data)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${token2}`)
      .set("content-type", "application/json");
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "not all fields given");
  });

});
