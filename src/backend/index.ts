import * as http from "http"
import { readFile } from "fs"
import * as path from "path"
import { server as WSServer } from "websocket"
import { configureSocketServer } from "./socket_handler"
import { PerformTests } from "./tests"

export const server = http.createServer( (req, res) => {
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

configureSocketServer(wsServer)

PerformTests();