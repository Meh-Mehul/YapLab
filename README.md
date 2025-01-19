# YapLab
Its a simple WebRTC based web-app, which uses websocket for real-time communication.

## Note:
My implementation uses two ```RTCPeerConnection``` objects for every client, and a single ```socket``` obejct to connect to the main ```signalling server```(backend directory). I have just made it so that the rooms are separate and the server queues only one awaiting socket connection until another user joins.
Now, this is not the most scalable design, but it works for ```~100``` rooms, as the server only has the ```WebRTC``` Handshake job to do.

## How-to-run?
(i should have made a monorepo ;( )

Steps:
1. go to backend dir and type ```npm start```.
2. go to fronend dir and type ```npm run dev``` (parallelly).
3. Now visit ```http://localhost:5173``` to see the app.
