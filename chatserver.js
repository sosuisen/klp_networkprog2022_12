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

const members = {};

ws.on('connection', socket => {
  socket.on('message', data => {
    console.log('[WebSocket] from client: ' + data);
    const req = JSON.parse(data);

    if (req.type === 'message') {
      // メッセージの場合
      // 全ての接続中のクライアントへ返信

      // bot
      if (req.data.startsWith('@bot date')) {
        req.data = Date();
        req.name = 'bot';
        socket.send(JSON.stringify(req));
        return;
      }
      else if (req.data.startsWith('@bot list')) {
        req.data = Object.keys(members).join(', ');
        req.name = 'bot';
        socket.send(JSON.stringify(req));
        return;
      }

      ws.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(req));
        }
      });
    }
    else if (req.type === 'enter' || req.type === 'leave') {
      // 入室、退室メッセージの場合
      if (req.type === 'enter') {
        members[req.data] = 1;
      }
      else if (req.type === 'leave') {
        // クライアントの不正な切断による退室には未対応。
        delete members[req.data];
      }

      // メッセージを送ってきたクライアントを除く全ての接続中のクライアントへ返信
      ws.clients.forEach(client => {
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          client.send(data.toString());
        }
      });
    }
  })
});
