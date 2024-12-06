// test/socketio.test.js
import { expect } from "chai";
import socketClient from 'socket.io-client';
import { httpServer } from "../index.js" // Import the httpServer instance
import http from 'http'
import sha1 from "sha1"
import request from "supertest"
import { query } from "express";
import { UserModel } from "../models/user.js";

describe('Socket.IO httpServer tests', function () {
    let clientSocket;
    let userModel;

    // Start the httpServer before running the tests
    let user = {phoneNumber:"2333333333333","email": "tessoct2@gmail.com", "password": sha1("password"), "name": "test3", "role": "dispatcher"}

    before(async () => {
        await UserModel.deleteMany();
        // We already imported the httpServer, so it will start automatically
        await httpServer.close()
        await httpServer.listen(8000, () => {
            console.log('Test httpServer running on http://localhost:8000');
        });
        userModel = await new UserModel(user).save()
        let data = {id:user.email, password:"password"};
        let response = await request(httpServer)
        .post("/api/login")
        .send(data)
        .set("Accept", "application/json")
        .set("content-type", "application/json");
        user.token = response.body.token;
        // Create a client socket and connect
        clientSocket = socketClient('http://localhost:8000', {auth:{token:user.token}});
        clientSocket.on("connect_error", (err) => {
            // the reason of the error, for example "xhr poll error"
            console.log(err.message);
          
            // some additional description, for example the status code of the initial HTTP response
            console.log(err.description);
          
            // some additional context, for example the XMLHttpRequest object
            console.log(err.context);
          });
         clientSocket.on("reconnect", () => {
            clientSocket.emit("setDetails")
         })
    });

    // Close the httpServer after tests
    after((done) => {
        done();
    });

    it('should connect to the httpServer', (done) => {
        clientSocket.on('connect',() => {
            done();
        }, {"query": {token:user.token}}); 
        clientSocket.emit("currentDriverLocation", {userId:userModel._id, latitude:80.88, longitude:899});
    });
        

});
