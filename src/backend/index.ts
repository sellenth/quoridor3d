import * as http from "http"
import { readFile } from "fs"
import * as path from "path"
import { game } from "./game_logic"

import { server as WSServer } from "websocket"
import { GameStatePayload, MessageType } from "../shared/types"

const server = http.createServer( (req, res) => {
    let filePath = '' + req.url;
    if (filePath =='/')
        filePath = '/html/index.html'

    const extname = path.extname(filePath);

    let contentType = 'text/html';
    switch(extname){
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
    }

    // TODO: prevent ../ type paths
    readFile(path.join('./public', filePath), (err, content) => {
        console.log('\t\t', filePath)
        if (err){
            readFile('./public/404.html', function(_, content) {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(content, 'utf-8');
            });
            console.log(err);
        }
        else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }

    });
}).listen(8008);

let wsServer = new WSServer({
   httpServer: server,
   autoAcceptConnections: false
})

function originIsAllowed(_: string) {
    return true;
}

let numConnections = 0;

wsServer.on('request', (req) => {
    // TODO: filter origins
    if (!originIsAllowed(req.origin)) {
        req.reject();
        console.log((new Date()) + ' Connection from origin ' + req.origin + ' rejected.');
        return;
    }

    numConnections++;

    let gameStateConnection = req.accept('gamerzone', req.origin);
    console.log((new Date()) + ' Connection accepted.');
    console.log("Number of connections: ", numConnections)

    gameStateConnection.send(JSON.stringify({ type: MessageType.GameState, data: game.getGameState() }));
    gameStateConnection.send(JSON.stringify({ type: MessageType.Identity, data: { id: numConnections } }));

    gameStateConnection.on('message', (message) => {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);

            game.handleClientMessage(JSON.parse(message.utf8Data),
                (payload: GameStatePayload) => {
                    gameStateConnection.send(JSON.stringify({ type:MessageType.GameState, data: payload}));
                }
            );
        }
    });

    gameStateConnection.on('close', (reasonCode, description) => {
        numConnections--;
        console.log((new Date()) + ' Peer ' + gameStateConnection.remoteAddress + ' disconnected.');
    });
});
