import * as http from "http"
import { readFile } from "fs"
import * as path from "path"
import { game } from "./game_logic"

import { server as WSServer } from "websocket"

setTimeout( () => {
    game.drawBoard();
}, 1000 )

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

wsServer.on('request', (req) => {
    // TODO: filter origins
    if (!originIsAllowed(req.origin)) {
        req.reject();
        console.log((new Date()) + ' Connection from origin ' + req.origin + ' rejected.');
        return;
    }

    let connection = req.accept('gamerzone', req.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', (message) => {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.send(JSON.stringify(game.fenceLocs));
        }
    });

    connection.on('close', (reasonCode, description) => {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});
