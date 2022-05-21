document.body.style.backgroundColor = "red";

let clientSocket = new WebSocket("ws://localhost:8080", "gamerzone");

clientSocket.onopen = () => {
    clientSocket.send("yeet");
}

clientSocket.onmessage = (event) => {
    console.log("server says", event.data); 
}

//clientSocket.readyState == WebSocket.OPEN;
