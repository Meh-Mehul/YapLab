import React, {  useState } from 'react';
// import WebSocket from 'ws';
import './style.css';
export const Video:React.FC = ()=>{
    const [socket, setSocket] = useState<WebSocket|null>(null);
    const [room , setroom]  = useState<string|null>(null);
    const [issending, setissending] = useState<string>("Send Video");
    const [senderConn, setSenderConn] = useState<RTCPeerConnection|null>(null);
    const [videoElement, setVideoElement] = useState<HTMLVideoElement|null>(null);
    const [receiverconn, setReceiverConn] = useState<RTCPeerConnection|null>(null);
    const [sendertrack, setsendertrack] = useState<RTCRtpSender|null>(null);
    async function Connect(){
        // const socket1 = new WebSocket("wss://signalling-server-hedo.onrender.com");  This was a simple render service i had set up to test this app
        const socket1 = new WebSocket('ws://localhost:3000')
        socket1.addEventListener('close', ()=>{
            setSocket(null);
            // setSenderConn(null);
        })
        socket1.addEventListener('error', ()=>{
            setSenderConn(null);
            // setSocket(null);
        })
        socket1!.onmessage = async (event)=>{
            const data = JSON.parse(event.data);
            if(data.type === 'createRoom'){
                setroom(data.data);
            }
        }
        setSocket(socket1);
    }
    async function startStuff() {
        if (!socket) return;
    
        const pc = new RTCPeerConnection();
        pc.onnegotiationneeded = async () => {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.send(JSON.stringify({ type: "createOffer", sdp: pc.localDescription }));
            } catch (e) {
                console.error("Error during negotiation:", e);
            }
        };
    
        pc.onicecandidate = (e) => {
            if (e.candidate) {
                socket.send(JSON.stringify({ type: 'iceCandidate', candidate: e.candidate }));
            }
        };
    
        socket.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'createAnswer') {
                await pc.setRemoteDescription(data.sdp);
            } else if (data.type === 'iceCandidate') {
                await pc.addIceCandidate(data.candidate);
            }
        };
    
        setSenderConn(pc);
    }
    
    const playlclVid = (videoelement:HTMLVideoElement) =>{
        // reciever();
        if(videoelement) {
            videoelement.play().catch((e)=>{
                console.log("Error while loading Vid.: ", e);
            })
        }
    }
    const playVid = () =>{
        // reciever();
        if(videoElement) {
            videoElement.play().catch((e)=>{
                console.log("Error while loading Vid.: ", e);
            })
        }
    }
    // function addMessage(message, info:string){
    //     const msg =document.createElement('div');
    //     msg.classList.add("message");
    //     msg.classList.add(info);
    //     msg.innerHTML = message;
    //     document.getElementById('chatGuy')?.appendChild(msg);
    // }
    async function reciever() {
        if(!socket){
            console.log("No Socket!");
            return;
        }
        const pc = new RTCPeerConnection();
        socket!.addEventListener("message", async (e) => {
            const message = JSON.parse(e.data);
            if (message.type === 'createOffer') {
                await pc.setRemoteDescription(message.sdp);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket!.send(JSON.stringify({ type: 'createAnswer', sdp: answer }));
            } else if (message.type === 'iceCandidate') {
                await pc.addIceCandidate(message.candidate);
            } else if (message.type === 'chat') {
                // addMessage(message.msg, 'receiver');
                console.log(message.msg);
            }
        });
    
        pc.ontrack = (event) => {
            const  video = document.createElement('video');
            const b4:HTMLVideoElement = document.getElementsByClassName('receiverVid')[0];
            if(b4){ 
                console.log(b4);
                b4.srcObject = event.streams[0]; // Use the full stream
                setReceiverConn(pc);
                return;
            }
            video.autoplay = true;
            video.style.border = '1px solid red';
            video.className = 'receiverVid';
            video.srcObject = event.streams[0]; // Use the full stream
            document.body.appendChild(video);
            setVideoElement(video);
        };
    
        setReceiverConn(pc);
    }
    
    async function sendVideo() {
        if (!senderConn) {
            console.log("Sender connection is not established yet.");
            return;
        }
        const b4:HTMLVideoElement = document.getElementsByClassName('senderVid')[0];
        if(issending === 'Stop Video'){
            if(b4 && sendertrack){
                b4.srcObject = null;
                senderConn.removeTrack(sendertrack);
                setissending("Start Video");
                return;
            }
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        stream.getTracks().forEach((track) => {setsendertrack(senderConn.addTrack(track, stream))});
        if(b4){
            b4.autoplay = true;
            b4.srcObject  =stream;
            playlclVid(b4);
            setissending("Stop Video");
            return;
        }
        const vid = document.createElement('video');
        vid.className = 'senderVid';
        vid.autoplay = true;
        vid.srcObject = stream;
        document.body.appendChild(vid);
        playlclVid(vid);
    }
    
    async function recieveVideo() {
        if(!receiverconn){
            console.log('No Connection found yet')
            return;
        }
        // TODO: add checks to see if the sender is sending a video from other side.

        let video: HTMLVideoElement | null = null;
        receiverconn.ontrack = (event) => {
            if (!video) {
                video = document.createElement('video');
                video.style.borderTopColor = 'red';
                video.className = 'vid';
                document.body.appendChild(video);
                setVideoElement(video);
                video.srcObject = new MediaStream([event.track]);
                playVid();
            }
        };
    }
    // function sendMessage(event){
    //     event.preventDefault();
    //     const message = event.target!.chat;
    //     console.log(message.value);
    //     socket!.send(JSON.stringify({ type: "chat", msg: message.value }));
    //     addMessage(message.value, 'sender')
    // }
    if (!socket) {
        return (
            <div className="connect-container">
                <h2 className="connect-title">Please Connect</h2>
                <button className="connect-button" onClick={Connect}>
                    Connect
                </button>
            </div>
        );
    }
    
    if(!room){
        return(
            <>
                <div>
                    <h2>
                        Waiting to join in some room......
                    </h2>
                </div>
            </>
        )
    }
    if (room) {
        if (!senderConn) {
            startStuff();
        }
        if (!receiverconn) {
            reciever();
        }
        return (
            <>
                <div>
                <div className="room-container">
                        <span className="room-label">Room ID:</span>
                        <span className="room-id">{room}</span>
                </div>
                    <button onClick={sendVideo}>
                        {
                            issending 
                        }
                    </button>
                    <div className="video-container">
                        <video className="receiverVid" autoPlay></video>
                        <video className="senderVid" autoPlay></video>
                    </div>
                </div>
            </>
        );
    }
    

}