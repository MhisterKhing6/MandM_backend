//test for user registration
import request from "supertest";
import { app } from "../index.js";
import { assert } from "chai";
import { UserModel } from "../models/user.js";
import { after } from "mocha";
const url = "/api/signup";

describe("test codes for user registration", () => {
    after(async () => {
        await UserModel.deleteMany({})
    })
    it("should return status of 400  with, not all fields giving message", async () => {
    let data = { name: "kingsley" };
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    assert.equal(response.status, 400)
  });

  //testing normal registration
  it("should return status of 400, wrong user type", async () => {
    let data = {role:"wrong", name: "kingsley" , email: "test2@gmail.com", password: "987321", "phoneNumber": "875552214"};
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    assert.equal(response.status, 400)
    assert.equal(response.body.message, "wrong type")
  });

  it("should return status of 201, with verificationId undefined", async () => {
    let data = {role:"customer", name: "kingsley" , email: "test255@gmail.com", password: "987321", "phoneNumber": "8758552214"};
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    assert.equal(response.status, 201)
    assert.isUndefined(response.body.verificationId)
  });

  it("should return status of 201, with verificationId defined", async () => {
    let data = {role:"vendor", name: "kingsley" , email: "t4est33255@gmail.com", password: "987321", "phoneNumber": "875853352214"};
    let response = await request(app)
      .post(url)
      .send(data)
      .set("Accept", "application/json")
      .set("content-type", "application/json");
    assert.equal(response.status, 201)
    assert.isDefined(response.body.verificationId)
  });
});
