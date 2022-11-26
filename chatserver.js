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
server.listen({ host, port }, () => {
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

ws.on('connection', (socket, req) => {
  // (1) 入室時の処理
  const ip = req.socket.remoteAddress;
  // 1-1) 入室したユーザの名前を取得
  const urlArray = req.url.split('?');
  let userName = '';
  if (urlArray.length > 1) {
    userName = decodeURIComponent(urlArray[1]);
  }
  else {
    socket.terminate();
    return;
  }
  console.log(`[WebSocket] connected from ${userName} (${ip})`);
  // 1-2) 全ての入室中のクライアントへ通知
  ws.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'enter',
        name: userName,
      }));
    }
  });


  // (2) メッセージ受信時の処理を追加
  socket.on('message', data => {
    console.log('[WebSocket] message from client: ' + data);
    // 全ての入室中のクライアントへ転送
    ws.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data.toString());
      }
    });
  });


  // (3) 退室時の処理を追加
  socket.on('close', () => {
    console.log(`[WebSocket] disconnected from ${userName} (${ip})`);
    // 退室したクライアントを除く全ての入室中のクライアントへ通知
    ws.clients.forEach(client => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'leave',
          name: userName,
        }));
      }
    });
  })
});
