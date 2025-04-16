const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + '/public'));

io.on('connection', socket => {
  console.log('Usuário conectado:', socket.id);

  socket.on('solicitar-chamada', () => {
    socket.broadcast.emit('receber-solicitacao');
  });

  socket.on('resposta-solicitacao', (aceitou) => {
    if (aceitou) {
      socket.broadcast.emit('solicitacao-aceita');
    } else {
      socket.broadcast.emit('solicitacao-recusada');
    }
  });

  socket.on('offer', offer => {
    socket.broadcast.emit('offer', offer);
  });

  socket.on('answer', answer => {
    socket.broadcast.emit('answer', answer);
  });

  socket.on('ice-candidate', candidate => {
    socket.broadcast.emit('ice-candidate', candidate);
  });

  socket.on('encerrar-chamada', () => {
    socket.broadcast.emit('chamada-encerrada');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
