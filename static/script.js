const socket = new WebSocket('ws://localhost:8080');

socket.addEventListener('open', () => {
  document.getElementById('status').innerText = '[サーバと接続しました]';
});

socket.addEventListener('message', msg => {  
  msg.data.text().then(text => {
    document.getElementById('fromServer').innerText = text;
  });  
});

document.getElementById('sendButton').addEventListener('click', () => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(document.getElementById('fromClient').value);
  }  
});

document.getElementById('closeButton').addEventListener('click', () => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.close();    
    document.getElementById('status').innerText = '[未接続]';
  }  
});
