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
const url = "/vendor/store-verification";

describe("test codes for request verification functions", () => {
  let user = "";

  let user2 = {
    role: "vendor",
    name: "kingsley",
    email: "t2est255@gmail.com",
    password: sha1("987321"),
    phoneNumber: "8758552214",
  };

  let token2 = "";
  after(async () => {
    await UserModel.deleteMany({});
    await VerifyIdentityModel.deleteMany({});
  });
  before(async () => {
    await UserModel.deleteMany({});
    await VerifyIdentityModel.deleteMany({});
    await Promise.all([new UserModel(user2).save()]);
    let response = await request(app)
      .post("/api/login")
      .send({ id: user2.email, password: "987321" })
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    token2 = response.body.token;
    user = response.body.user;
  });

  it("should return status of 400, with not all fields given", async () => {
    let data = {};
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
      idCard: {
        fileName: "idCard.txt",
        data: `base64,${Buffer.from("id card user").toString("base64")}`,
      },
      userPic: {
        fileName: "userPic.txt",
        data: `base64,${Buffer.from("user pictruer").toString("base64")}`,
      },
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
    assert.equal(response.status, 200);
  });

  //test for shop owner identity
});
