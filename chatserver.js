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

const members = {};

ws.on('connection', socket => {
  socket.on('message', data => {
    console.log('[WebSocket] from client: ' + data);
    const req = JSON.parse(data);

    if (req.type === 'message') {
      // 通常メッセージの場合

      // bot宛か？
      if (req.data.startsWith('@bot ')) {
        const cmdArray = req.data.split(' ');
        if (cmdArray.length > 1) {
          req.name = 'bot';
          const cmd = cmdArray[1];
          if (cmd === 'date'){
            req.data = Date();
          }
          else if (cmd === 'list'){
            req.data = '現在の入室者は ' + Object.keys(members).join(', ');
          }
          else {
            return;
          }
          socket.send(JSON.stringify(req));
        }
        // bot の場合はここで終わり。
        return;
      }

      // 全ての入室中のクライアントへ返信
      ws.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(req));
        }
      });
    }
    else if (req.type === 'enter') {
      // 入室メッセージの場合

      // メンバーを追加
      members[req.name] = 1;

      // 全ての入室中のクライアントへ返信
      ws.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(req));
        }
      });
    }
    else if (req.type === 'leave') {
      // 退室メッセージの場合

      // メンバーを削除
      // （クライアントの不正な切断による退室には未対応）
      delete members[req.name];

      // メッセージを送ってきたクライアントを除く全ての入室中のクライアントへ返信
      ws.clients.forEach(client => {
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          client.send(data.toString());
        }
      });
    }
  })
});
