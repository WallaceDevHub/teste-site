// Conecta com o servidor de sinalização no Render
const socket = io("https://teste-site-y0l4.onrender.com");

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const btnChamar = document.getElementById('btnChamar');
const btnAceitar = document.getElementById('btnAceitar');
const btnRecusar = document.getElementById('btnRecusar');
const btnEncerrar = document.getElementById('btnEncerrar');

let localStream;
let peerConnection;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

btnChamar.onclick = () => {
  socket.emit('solicitar-chamada');
};

btnAceitar.onclick = async () => {
  socket.emit('resposta-solicitacao', true);
  iniciarChamadaComoReceptor();
};

btnRecusar.onclick = () => {
  socket.emit('resposta-solicitacao', false);
  btnAceitar.hidden = true;
  btnRecusar.hidden = true;
};

btnEncerrar.onclick = encerrarChamada;

socket.on('receber-solicitacao', () => {
  btnAceitar.hidden = false;
  btnRecusar.hidden = false;
});

socket.on('solicitacao-aceita', () => {
  iniciarChamadaComoEmissor();
});

socket.on('solicitacao-recusada', () => {
  alert("Usuário recusou a chamada.");
});

socket.on('offer', async offer => {
  peerConnection = criarPeer();
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', answer);
});

socket.on('answer', async answer => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', async candidate => {
  try {
    await peerConnection.addIceCandidate(candidate);
  } catch (e) {
    console.error('Erro ao adicionar ICE Candidate', e);
  }
});

socket.on('chamada-encerrada', encerrarChamada);

function criarPeer() {
  const pc = new RTCPeerConnection(config);

  pc.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('ice-candidate', event.candidate);
    }
  };

  pc.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  return pc;
}

async function iniciarChamadaComoEmissor() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  peerConnection = criarPeer();

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', offer);
  btnEncerrar.hidden = false;
}

async function iniciarChamadaComoReceptor() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  peerConnection = criarPeer();
  btnEncerrar.hidden = false;
  btnAceitar.hidden = true;
  btnRecusar.hidden = true;
}

function encerrarChamada() {
  if (peerConnection) peerConnection.close();
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localVideo.srcObject = null;
  }
  remoteVideo.srcObject = null;
  peerConnection = null;
  socket.emit('encerrar-chamada');
  btnEncerrar.hidden = true;
}
