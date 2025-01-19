import { WebSocketServer, WebSocket } from "ws";
import { Room } from "./Room";
const wss = new WebSocketServer({port:3000 });

let rooms:Room[] = [];
let waiter:WebSocket|null;
wss.on('connection', (ws)=>{
    ws.on('error', console.error);
    if(waiter){
        rooms.push(new Room(ws, waiter));
        waiter = null;
    }
    else{
        waiter = ws;
    }
    console.log(rooms.length);

})
