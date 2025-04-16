// Conecta com o servidor de sinalização no Render
const socket = io("https://teste-site-y0l4.onrender.com");

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
let localStream;
let peerConnection;

const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

// Botão para iniciar chamada
const startBtn = document.getElementById("startCall");
startBtn.addEventListener("click", () => {
  socket.emit("solicitar-chamada");
});

// Recebe solicitação de chamada
socket.on("receber-solicitacao", () => {
  const aceitar = confirm("Alguém deseja iniciar uma chamada com você. Aceitar?");
  if (aceitar) {
    iniciarChamada();
    socket.emit("resposta-solicitacao", true);
  } else {
    socket.emit("resposta-solicitacao", false);
  }
});

// Se o outro aceitar, iniciar a chamada
socket.on("solicitacao-aceita", () => {
  iniciarChamada();
});

// Se o outro recusar
socket.on("solicitacao-recusada", () => {
  alert("O outro usuário recusou a chamada.");
});

// Função principal de chamada
async function iniciarChamada() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('ice-candidate', event.candidate);
    }
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', offer);
}

// Recebe offer
socket.on('offer', async offer => {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection(config);
    peerConnection.ontrack = event => {
      remoteVideo.srcObject = event.streams[0];
    };
    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
      }
    };

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  }

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', answer);
});

// Recebe answer
socket.on('answer', async answer => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// Recebe ice candidates
socket.on('ice-candidate', async candidate => {
  try {
    await peerConnection.addIceCandidate(candidate);
  } catch (e) {
    console.error('Erro ao adicionar ICE Candidate', e);
  }
});

// Desligar chamada
const endBtn = document.getElementById("endCall");
endBtn.addEventListener("click", () => {
  endCall();
  socket.emit("encerrar-chamada");
});

socket.on("chamada-encerrada", () => {
  alert("O outro usuário encerrou a chamada.");
  endCall();
});

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
}
