let socket;
let yourName = '';

const connect = () => {
  socket = new WebSocket('ws://localhost:8080');
  socket.addEventListener('open', () => {
    document.getElementById('status').innerText = '[入室済]';
    const obj = {
      type: 'enter',
      name: yourName,
    };
    socket.send(JSON.stringify(obj));
  });

  socket.addEventListener('message', msg => {
    const obj = JSON.parse(msg.data);
    if(obj.type === 'message') {
      document.getElementById('fromServer').innerHTML += `${obj.name}: ${obj.data}<br />`;
    }
    else if(obj.type === 'enter') {
      document.getElementById('fromServer').innerHTML += `${obj.name}が入室しました！<br />`;
    }
    else if(obj.type === 'leave') {
      document.getElementById('fromServer').innerHTML += `${obj.name}が退室しました！<br />`;
    }
  });  
};

const sendMessage = () => {
  if (socket.readyState === WebSocket.OPEN) {
    const obj = {
      type: 'message',
      name: yourName,
      data: document.getElementById('fromClient').value,
    };
    socket.send(JSON.stringify(obj));
    document.getElementById('fromClient').value = '';
  }  
};

// Enterキーでメッセージ送信
document.getElementById('fromClient').addEventListener('change', sendMessage);

const enterLeaveRoom = () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    const obj = {
      type: 'leave',
      name: yourName,
    };
    socket.send(JSON.stringify(obj));
    socket.close();
    socket = null;
    document.getElementById('yourName').disabled = false;
    document.getElementById('enterLeaveButton').innerText = '入室';
    document.getElementById('status').innerText = '[退室中]';  
  }
  else {
    yourName = document.getElementById('yourName').value;
    if (yourName) {
      document.getElementById('yourName').disabled = true;
      document.getElementById('enterLeaveButton').innerText = '退室';
      connect();
    }
 }
};

// 入室・退室ボタン
document.getElementById('enterLeaveButton').addEventListener('click', enterLeaveRoom);
