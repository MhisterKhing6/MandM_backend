//test for user registration
import request from "supertest";
import { app } from "../index.js";
import { assert } from "chai";
import { UserModel } from "../models/user.js";
import { after, before } from "mocha";
import sha1 from "sha1"
const url = "/api/login";

describe("test codes for user registration", () => {
    let user = {phoneNumber:"2333333333","email": "test2@gmail.com", "password": sha1("password"), "name": "test3", "role": "customer"}
    before(async () => {
        await UserModel.deleteMany({})
        await new UserModel(user).save()
    })

    after(async () => {
        await UserModel.deleteMany({})
    })
    it("should return status of 400  with, not all fields giving message", async () => {
    let data = { id: "kingsley" };
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    assert.equal(response.status, 400)
    assert.equal(response.body.message, "not all fields given")
  });

  //testing normal registration
  it("should return status of 400, wrong user not registered", async () => {
    let data = {id:"wrongEmail@gmail.com", password:"password"};
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    assert.equal(response.status, 400)
    assert.equal(response.body.message, "user is not registered")
  });

  it("should return status of 400, with wrong password", async () => {
    let data = {id:user.email, password:"wrong password"};
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    assert.equal(response.status, 400)
    assert.equal(response.body.message, "wrong user password")
  });

  //email login
  it("should return status of 200, user and token defined", async () => {
    let data = {id:user.email, password:"password"};
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("content-type", "application/json");
      console.log(response.body)

    assert.equal(response.status, 200)
    assert.isDefined(response.body.user)
    assert.isDefined(response.body.token)
  });

  it("should return status of 200, user and token defined", async () => {
    let data = {id:user.phoneNumber, password:"password"};
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    assert.equal(response.status, 200)
    assert.isDefined(response.body.user)
    assert.isDefined(response.body.token)
  });
});
