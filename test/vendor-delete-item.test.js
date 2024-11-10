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
        email: "tese3t2est255@gmail.com",
        password: sha1("987321"),
        phoneNumber: "8758552214",
        
    };
    let user2Store = {}
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
        "name": "Google Pixel 9 pro",
        "description": "Google phone running android 18 with 8 gig ram, 2023 model",
        "year": "2022"
    };
    let category = {name: "electronics"}
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
        category = await new CategoriesModel(category).save()
        await new VerifyIdentityModel({ userId: user3.db._id, status: "verified", userPic: "path to user pic", "idCard": "path to id card" }).save()
        user3Store.db = await new StoreModel({location: {coordinates: [6.666600,-1.616271 ] },type:category._id, storeName: "Afa Papa Accessories", storePhone: "+22222222222222", userId: user3.db._id, latitude: "23333333", "longitude": "33333333" }).save()
        user3Item.categoryId = user._id;
        user3Item.subCategoryId = user._id
        user2Store.db = await new StoreModel({location: {coordinates: [6.666600,-1.616271 ] }, storePhone: "+666666666666666", userId: user._id, type: category._id, storeName: "Afa ppp", storePhone: "klskflsfjlsf" }).save()
        user3Item.db = await new ItemModel({ storeId: user3Store.db._id, ...user3Item }).save()

    });
    it("should return status 400 with no authorization token given", async () => {
        let response = await request(app)
            .delete(url)
            .set("Accept", "application/json")
            .set("content-type", "application/json");
        assert.equal(response.status, 401);
        assert.equal(response.body.message, "no authorization token");
    });

    //testing normal registration
    it("should return 400, with wrong token", async () => {
        let response = await request(app)
            .delete(url)
            .set("Accept", "application/json")
            .set("Authorization", `Bearer ${token1}s`)
            .set("content-type", "application/json");
        assert.equal(response.status, 400);
        assert.equal(response.body.message, "wrong token");
    });

    it("should return status of 401, with wrong user not authorized", async () => {
        let response = await request(app)
            .delete(url)
            .set("Accept", "application/json")
            .set("Authorization", `Bearer ${token1}`)
            .set("content-type", "application/json");
        assert.equal(response.status, 401);
        assert.equal(response.body.message, "user not authorized");
    });

    it("should return status of 400, with vendor identity not verified", async () => {
        let data = {
            itemId: "testItemId"
        };
        let response = await request(app)
            .delete(`${url}/${user3Store.db._id}/${user3Item.db._id.toString()}`)
            .set("Accept", "application/json")
            .set("Authorization", `Bearer ${token2}`)
            .set("content-type", "application/json");
        assert.equal(response.status, 401);
        assert.equal(response.body.message, "vendor identity not verified");
    });


    it("should return status of 400, with no store information added", async () => {
        let identity = new VerifyIdentityModel({ userId: user, status: "verified", userPic: "path to user pic", "idCard": "path to id card" });
        await identity.save()
        let response = await request(app)
            .delete(`${url}/${user3Item.db._id.toString()}/${user3Item.db._id.toString()}`)
            .set("Accept", "application/json")
            .set("Authorization", `Bearer ${token2}`)
            .set("content-type", "application/json");
        assert.equal(response.status, 400);
        assert.equal(response.body.message, "user doesn't have a store");
    });


    it("should return status of 400, with item not found, check item id", async () => {

        await new VerifyIdentityModel({ userId: user, status: "verified", userPic: "path to user pic", "idCard": "path to id card" }).save();
        await new StoreModel({location: {coordinates: [6.666600,-1.616271 ] },type:category._id, storeName: "Afa Papa Accessories", storePhone: "+22222222222222", userId: user._id, latitude: "23333333", "longitude": "33333333" , location: {coordinates: [6.666600,-1.616271 ] }}).save()
        let response = await request(app)
            .delete(`${url}/${user3Store.db._id}/${user._id.toString()}`)
            .set("Accept", "application/json")
            .set("Authorization", `Bearer ${token3}`)
            .set("content-type", "application/json");
        assert.equal(response.status, 400);
        assert.equal(response.body.message, "no item entry found, check item id")
    });

    it("should return status of 401, with item doesn't belong store", async () => {
        await new VerifyIdentityModel({ userId: user, status: "verified", userPic: "path to user pic", "idCard": "path to id card" }).save();
        await new StoreModel({location: {coordinates: [6.666600,-1.616271 ] },type:category._id, storeName: "Afa Papa Accessories", storePhone: "+22222222222222", userId: user._id, latitude: "23333333", "longitude": "33333333" }).save()
        let response = await request(app)
            .delete(`${url}/${user2Store.db._id}/${user3Item.db._id.toString()}`)
            .set("Accept", "application/json")
            .set("Authorization", `Bearer ${token2}`)
            .set("content-type", "application/json");
        assert.equal(response.status, 401);
        assert.equal(response.body.message, "item doesn't belong to user's store")
    });

    it("should return status of 200, with item deleted message", async () => {
        let response = await request(app)
            .delete(`${url}/${user3Store.db._id}/${user3Item.db._id.toString()}`)
            .set("Accept", "application/json")
            .set("Authorization", `Bearer ${token3}`)
            .set("content-type", "application/json");
        let item = await ItemSizesModel.findById(user3Item.db._id)
        assert.isNull(item)
        assert.equal(response.status, 200);
        assert.equal(response.body.message, "item deleted")
    });
});
