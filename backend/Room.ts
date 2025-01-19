import WebSocket from "ws";
import { v4 as uuid } from "uuid";

export class Room {
    user1: WebSocket | null;
    user2: WebSocket | null;
    roomid: string | null;

    constructor(user1: WebSocket, user2: WebSocket) {
        this.user1 = user1;
        this.user2 = user2;
        this.roomid = uuid();
        console.log(`Room ${this.roomid} created.`);
        this.user1.send(JSON.stringify({ type: "createRoom", data: this.roomid }));
        this.user2.send(JSON.stringify({ type: "createRoom", data: this.roomid }));
        this.handleSDP(this.user1, this.user2);
        this.handleSDP(this.user2, this.user1);
    }

    async handleSDP(usera: WebSocket, userb: WebSocket) {
        usera.on("message", (data: any) => {
            let message;
            try {
                message = JSON.parse(data);
                console.log(`Message in room ${this.roomid} from one user:`, message);
            } catch (err) {
                console.error("Invalid JSON message received:", data);
                return;
            }
            if (message.type === "createOffer" && message.sdp) {
                userb.send(JSON.stringify({ type: "createOffer", sdp: message.sdp }));
            } else if (message.type === "createAnswer" && message.sdp) {
                userb.send(JSON.stringify({ type: "createAnswer", sdp: message.sdp }));
            } else if (message.type === "iceCandidate" && message.candidate) {
                userb.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }));
            } else if (message.type === 'chat' && message.msg) {
                userb.send(JSON.stringify({type:'chat', msg:message.msg}));
            } else {
                console.warn("Invalid message type or missing fields:", message);
            }
        });
        usera.on("close", () => {
            console.log(`User disconnected from room ${this.roomid}`);
            userb?.close();
        });
        usera.on("error", (err) => {
            console.error(`Error in user connection in room ${this.roomid}:`, err);
        });
    }
}
