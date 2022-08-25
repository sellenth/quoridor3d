import { game } from "./game_logic"

import { GameStatePayload, MessageType, Payload } from "../shared/types"
import { server as WSServer } from "websocket"
import { randomUUID } from "crypto"
import { connection } from "websocket";

let numConnections = 0;

let clients = new Map<string, connection>();

export function configureSocketServer(server: WSServer)
{
    server.on('request', (req) => {
        // TODO: filter origins
        if (!originIsAllowed(req.origin)) {
            req.reject();
            console.log((new Date()) + ' Connection from origin ' + req.origin + ' rejected.');
            return;
        }

        let gameStateConnection = req.accept('gamerzone', req.origin);

        let connectionUUID = randomUUID();
        numConnections++;

        clients.set(connectionUUID, gameStateConnection);
        game.CreatePlayer(connectionUUID);

        console.log((new Date()) + ' Connection accepted.');
        console.log("Number of connections: ", numConnections)
        console.log("It is player %s's turn", game.currPlayer?.id)


        gameStateConnection.send(JSON.stringify({ type: MessageType.Identity, data: connectionUUID }));
        UpdateAllClients(MessageType.GameState, game.getGameState());

        gameStateConnection.on('message', (message) => {
            if (message.type == 'utf8') {
                console.log('Received Message: ' + message.utf8Data);

                game.handleClientMessage(JSON.parse(message.utf8Data));
            }
        });

        gameStateConnection.on('close', (reasonCode, description) => {
            game.RemovePlayer(connectionUUID);
            clients.delete(connectionUUID);
            numConnections--;
            UpdateAllClients(MessageType.GameState, game.getGameState());
            console.log((new Date()) + ' Peer ' + gameStateConnection.remoteAddress + ' disconnected.');
        });
    });

}

function originIsAllowed(_: string) {
    return true;
}

export function UpdateAllClients(type: MessageType, payload: Payload)
{
    clients.forEach((socket) => {
        socket.send(JSON.stringify({ type: type, data: payload}));
    })
}
