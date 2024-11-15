// test/socketio.test.js
import { expect } from "chai";
import socketClient from 'socket.io-client';
import { httpServer } from "../index.js" // Import the httpServer instance
import http from 'http';
import { query } from "express";

describe('Socket.IO httpServer tests', function () {
    let clientSocket;

    // Start the httpServer before running the tests
    before(async () => {
        // We already imported the httpServer, so it will start automatically
        await httpServer.close()
        await httpServer.listen(8000, () => {
            console.log('Test httpServer running on http://localhost:8000');
        });

        // Create a client socket and connect
        clientSocket = socketClient('http://localhost:8000', {auth:{token:"user token"}});
        clientSocket.on("connect_error", (err) => {
            // the reason of the error, for example "xhr poll error"
            console.log(err.message);
          
            // some additional description, for example the status code of the initial HTTP response
            console.log(err.description);
          
            // some additional context, for example the XMLHttpRequest object
            console.log(err.context);
          });
    });

    // Close the httpServer after tests
    after((done) => {
        done();
    });

    it('should connect to the httpServer', (done) => {
        clientSocket.on('connect',() => {
            console.log('Client connected');
            done();
        }, {"query": {token:"skslkf"}}); 
    });

});
