require("dotenv").config()
const app = require("./src/app")
const initSocketServer = require("./src/socket/socket.server");
const httpServer = require("http").createServer(app);


initSocketServer(httpServer);

httpServer.listen(3000 , () =>{
    console.log("Server is Running on port 3000!!!");
})