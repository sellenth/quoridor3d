import { game } from "./game_logic"

import { ClientMessage, ClientAction, MessageType, NetworkCamera, Payload } from "../shared/types"
import { server as WSServer } from "websocket"
import { randomUUID } from "crypto"
import { connection } from "websocket"

let numConnections = 0;

let clients = new Map<string, connection>();
let clientCams = new Map<string, NetworkCamera>();

setInterval(() => {
    if (clients.size > 0)
    {
        const arr = Array.from(clientCams.values());
        UpdateAllClients(MessageType.Cameras, arr);
    }
}, 1000)

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
                const msg = JSON.parse(message.utf8Data) as ClientMessage;

                if (msg.type == MessageType.ClientAction)
                {
                    console.log('Received Action: ' + message.utf8Data);
                    game.handleClientMessage(msg.payload as ClientAction);
                }
                else if (msg.type == MessageType.ClientCameraPos)
                {
                    const payload = msg.payload as NetworkCamera;
                    clientCams.set(payload.id, payload);
                }
            }
        });

        gameStateConnection.on('close', (reasonCode, description) => {
            PerformClientCleanup(connectionUUID);
        });
    });
}

function PerformClientCleanup(connectionUUID: string)
{
    game.RemovePlayer(connectionUUID);
    clients.delete(connectionUUID);
    clientCams.delete(connectionUUID);
    numConnections--;
    UpdateAllClients(MessageType.GameState, game.getGameState());
    console.log((new Date()) + ' Peer %s disconnected.', connectionUUID);
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
