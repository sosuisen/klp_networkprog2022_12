const http = require('http');
const express = require('express');
const WebSocket = require('ws');

const host = 'localhost';
const port = 8080;

const app = express();
// 本プログラムでは、Expressはstatic以下のファイルのGETにのみ用いています。
app.use(express.static('static'));

// ExpressとWebSocketと同じポートで動作させる場合、
// http.createServerにappを渡して
// 生成されたhttp.Serverオブジェクトでlistenすること。
// app.listenは使いません
var server = http.createServer(app);
server.listen({ host, port } , () => {
  console.log(`Starting Express and WebSocket server at http://${host}:${port}/`)
});

// ws
// https://www.npmjs.com/package/ws

// 通常のhttp.Serverオブジェクトを元に作成。
// （通常のhttpとWebSocketの共存が簡単にできます。）
const ws = new WebSocket.Server({ server });
// 通常のhttp.Serverオブジェクトを使わずに作成する場合はこちら。
// (ただし、通常のhttpと共存できない)
// const ws = new WebSocket.Server({ port });

ws.on('connection', socket => {
  socket.on('message', data => {
    console.log('[WebSocket] from client: ' + data);
    const req = JSON.parse(data);

    if (req.type === 'message' || req.type === 'enter') {
      // 通常メッセージ・入室メッセージの場合
      // 全ての接続中のクライアントへ返信
      ws.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data.toString());
        }
      });
    }
    else if (req.type === 'leave') {
      // 退室メッセージの場合
      // メッセージを送ってきたクライアントを除く全ての接続中のクライアントへ返信
      ws.clients.forEach(client => {
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          client.send(data.toString());
        }
      });
    }
  })
});
