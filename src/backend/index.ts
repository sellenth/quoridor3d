import * as http from "http"
import { readFile } from "fs"
import * as path from "path"
import { game } from "./game_logic"

import { connection, server as WSServer } from "websocket"
import { GameStatePayload, MessageType } from "../shared/types"
import { randomUUID } from "crypto"

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

type ClientInfo = {
    socket: connection,
    placement: number
}

let clients = new Map<string, ClientInfo>();

function UpdateAllClients(payload: GameStatePayload)
{
    clients.forEach((connection) => {
        connection.socket.send(JSON.stringify({ type:MessageType.GameState, data: payload}));
    })
}

wsServer.on('request', (req) => {
    // TODO: filter origins
    if (!originIsAllowed(req.origin)) {
        req.reject();
        console.log((new Date()) + ' Connection from origin ' + req.origin + ' rejected.');
        return;
    }

    let connectionUUID = randomUUID();

    let gameStateConnection = req.accept('gamerzone', req.origin);
    let pid = numConnections;
    numConnections++;

    clients.set(connectionUUID, {socket: gameStateConnection, placement: pid});
    game.CreatePlayer(pid);

    console.log((new Date()) + ' Connection accepted.');
    console.log("Number of connections: ", numConnections)
    console.log("It is player %d's turn", game.currPlayer?.id)

    UpdateAllClients(game.getGameState());
    gameStateConnection.send(JSON.stringify({ type: MessageType.Identity, data: { id: pid } }));

    gameStateConnection.on('message', (message) => {
        if (message.type == 'utf8') {
            console.log('Received Message: ' + message.utf8Data);

            game.handleClientMessage(JSON.parse(message.utf8Data),
                (payload: GameStatePayload) => {
                    UpdateAllClients(payload);
                }
            );
        }
    });

    gameStateConnection.on('close', (reasonCode, description) => {
        game.RemovePlayer(clients.get(connectionUUID)?.placement);
        clients.delete(connectionUUID);
        numConnections--;
        RefreshAllClientPlacements();
        UpdateAllClients(game.getGameState());
        console.log((new Date()) + ' Peer ' + gameStateConnection.remoteAddress + ' disconnected.');
    });
});

function RefreshAllClientPlacements()
{
    clients.forEach((connection) => {
        if (connection.placement > numConnections)
        {
            console.log("Telling player %d that they have a new identity", connection.placement);
            connection.placement--;
            connection.socket.send(JSON.stringify({ type: MessageType.Identity, data: { id: connection.placement } }));
        }
    })

}
