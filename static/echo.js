const socket = new WebSocket('ws://localhost:8080');

socket.addEventListener('message', msg => {  
  document.getElementById('fromServer').innerText = msg.data;
});

document.getElementById('sendButton').addEventListener('click', () => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(document.getElementById('fromClient').value);
  }  
});
