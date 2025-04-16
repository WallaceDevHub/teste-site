// Novo fluxo: solicitar chamada
btn.addEventListener("click", () => {
  socket.emit("solicitar-chamada");
});

// Receber solicitação
socket.on("receber-solicitacao", () => {
  const aceita = confirm("Alguém quer iniciar uma chamada com você. Deseja aceitar?");
  if (aceita) {
    iniciarChamada();
    socket.emit("resposta-solicitacao", true);
  } else {
    socket.emit("resposta-solicitacao", false);
  }
});

// Se o outro aceitar, inicia a chamada
socket.on("solicitacao-aceita", () => {
  iniciarChamada();
});

// Se recusar
socket.on("solicitacao-recusada", () => {
  alert("O outro usuário recusou a chamada.");
});

function iniciarChamada() {
  // seu código atual que ativa câmera e faz offer
}

// Encerrar chamada
function endCall() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localVideo.srcObject = null;
  }

  remoteVideo.srcObject = null;
  socket.emit("encerrar-chamada");
}

// Se o outro desligar
socket.on("chamada-encerrada", () => {
  alert("O outro usuário encerrou a chamada.");
  endCall();
});
