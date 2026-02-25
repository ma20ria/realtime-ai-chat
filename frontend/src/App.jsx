import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const socketRef = useRef(null);
  const audioCtxRef = useRef(null);
const currentSourceRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [input, setInput] = useState("");
  const [aiText, setAiText] = useState("");
  const currentResponseIdRef = useRef(null);

  useEffect(() => {
    audioCtxRef.current = new (window.AudioContext ||
      window.webkitAudioContext)({
      sampleRate: 24000,
    });
    audioCtxRef.current.resume();
    document.body.addEventListener("click", () => {
  audioCtxRef.current.resume();
});

    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => {
      console.log("Connected");
      setConnected(true);
    };

   ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  console.log(data); // IMPORTANT

  // Clear previous response
  if (data.type === "response.created") {
    setAiText("");
    currentResponseIdRef.current = data.response?.id;
  }

  // Live transcript text
  if (data.type === "response.audio_transcript.delta") {
    setAiText(prev => prev + (data.delta || ""));
  }

  // Audio chunks
  if (data.type === "response.audio.delta") {
  if (data.response_id === currentResponseIdRef.current) {
    playAudioChunk(data.delta);
  }
}
};
    socketRef.current = ws;

    return () => ws.close();
  }, []);

 const sendMessage = () => {
  if (!input) return;

  // STOP current audio immediately
  if (currentSourceRef.current) {
    currentSourceRef.current.stop();
    currentSourceRef.current = null;
  }

  pcmQueue = [];
  isPlaying = false;


  socketRef.current.send(
    JSON.stringify({
      type: "user_message",
      text: input,
    })
  );

  setInput("");
};
let audioQueue = [];

let pcmQueue = [];
let isPlaying = false;

const playAudioChunk = (base64) => {
  const audioCtx = audioCtxRef.current;

  const binary = atob(base64);
  const pcm = new Int16Array(binary.length / 2);

  for (let i = 0; i < pcm.length; i++) {
    pcm[i] =
      binary.charCodeAt(i * 2) |
      (binary.charCodeAt(i * 2 + 1) << 8);
  }

  pcmQueue.push(pcm);

  if (!isPlaying) playNext();
};

function playNext() {
  if (pcmQueue.length === 0) {
    isPlaying = false;
    return;
  }

  isPlaying = true;

  const pcm = pcmQueue.shift();
  const audioCtx = audioCtxRef.current;

  const float32 = new Float32Array(pcm.length);

  for (let i = 0; i < pcm.length; i++) {
    float32[i] = pcm[i] / 32768;
  }

  const buffer = audioCtx.createBuffer(1, float32.length, 24000);
  buffer.copyToChannel(float32, 0);

  const source = audioCtx.createBufferSource();
  currentSourceRef.current = source;
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();

  source.onended = playNext;
}
return (
  <div className="app">
    <div className="chat-shell">
      <div className="chat-header">AI Chat</div>

      <div className="chat-body">
        <div className="bubble ai">
          {aiText || "Ask me anything…"}
        </div>
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  </div>
);
  
}






export default App;