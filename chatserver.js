const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

const host = 'localhost';
const port = 8080;
const documentRoot = './static';

const staticFile = (req, res) => {
  let url = req.url;
  url = url.replace(/\/$/, '/index.html');

  const notFound = `<h1>404 Not Found</h1>${url}はありません。`;

  let contentType = 'text/html; charset=utf-8';
  let encoding = 'utf-8';

  if (url.endsWith('.css')) contentType = 'text/css; charset=utf-8';
  else if (url.endsWith('.jpg')) {
    // バイナリファイルの場合 null を設定
    // https://nodejs.org/api/fs.html#fsreadfilepath-options-callback
    encoding = null;
    contentType = 'image/jpeg';
  }

  fs.readFile(`${documentRoot}${url}`, encoding, (err, data) => {
    res.setHeader('Content-Type', contentType);
    if (err) {
      res.statusCode = 404;
      res.end(notFound);
    }
    else {
      res.statusCode = 200;
      res.end(data);
    }
  });
};

const server = http.createServer((req, res) => {
  console.log(req.method);
  console.log(req.url);

  if (req.method === 'GET') {
    staticFile(req, res);
    return;
  }

  // https://developer.mozilla.org/ja/docs/Web/HTTP/Status/405
  res.statusCode = 405;
  res.setHeader('Allow', 'GET');
  res.end();
});

server.listen({ host, port }, () => {
  console.log(`Starting HTTP server at http://${host}:${port}/`)
});


// ws
// https://www.npmjs.com/package/ws

// 通常のhttp.Serverインスタンスを元に作成。
// 通常のhttpとWebSocketの共存が簡単にできます。
const ws = new WebSocket.Server({ server });
// 通常のhttp.Serverインスタンスを使わずに作成する場合はこちら。
// const ws = new WebSocket.Server({ port });

ws.on('connection', socket => {

  socket.on('message', data => {
    console.log('[WebSocket] from client: ' + data);

    const req = JSON.parse(data);

    if (req.type === 'message') {
      // メッセージの場合
      // 全ての接続中のクライアントへ返信
      ws.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data.toString());
        }
      });
    }
    else if (req.type === 'enter' || req.type === 'leave') {
      // 入室、退室メッセージの場合
      // メッセージを送ってきたクライアントを除く全ての接続中のクライアントへ返信
      ws.clients.forEach(client => {
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          client.send(data.toString());
        }
      });
    }
  })
});
