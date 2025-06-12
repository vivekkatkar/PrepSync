import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { API } from '../utils/api';

export default function InterviewRoom({
  userName,
  canStartInterview,
  interviewQuotaLeft,
}) {
  const { roomId } = useParams();
  const navigate = useNavigate();

  // Refs for media elements, streams, socket, peer connection, recording chunks, initiator role
  const localVid = useRef(null);
  const remoteVid = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const chunks = useRef([]);
  const isInitiator = useRef(false);
  const peerSocketId = useRef(null);

  // State
  const [role, setRole] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  // Initialize media stream, socket, peer connections
  useEffect(() => {
    async function startLocalStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVid.current) {
          localVid.current.srcObject = stream;
        }
      } catch (err) {
        setError('Failed to access camera/microphone: ' + err.message);
      }
    }

    startLocalStream();

    // Connect socket.io to the peer-interview namespace
    // socketRef.current = io('http://localhost:3000/peer-interview');
    socketRef.current = io(`${API}/peer-interview`);

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      setIsConnected(true);
      setConnectionStatus('Connected, joining room...');
      
      // Join room with userId (you might want to get this from props or context)
      socketRef.current.emit('join-room', { 
        roomId, 
        userId: userName || 'anonymous' 
      });
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
      setPeerConnected(false);
      setConnectionStatus('Disconnected');
    });

    // Handle being set as initiator (first person to join)
    socketRef.current.on('you-are-initiator', (data) => {
      console.log('You are initiator:', data);
      isInitiator.current = true;
      setRole(data.role);
      setConnectionStatus('Waiting for peer to join...');
    });

    // Handle being set as receiver (second person to join)
    socketRef.current.on('you-are-receiver', (data) => {
      console.log('You are receiver:', data);
      isInitiator.current = false;
      setRole(data.role);
      setConnectionStatus('Connecting to peer...');
      initPeer();
    });

    // Handle when peer is ready to connect (sent to initiator)
    socketRef.current.on('peer-ready-to-connect', (data) => {
      console.log('Peer ready to connect:', data);
      peerSocketId.current = data.peerSocketId;
      setConnectionStatus('Peer joined, establishing connection...');
      initPeer();
    });

    // Handle spectator role
    socketRef.current.on('joined-as-spectator', (data) => {
      console.log('Joined as spectator:', data);
      setRole(data.role);
      setConnectionStatus('Watching as spectator');
    });

    // Handle WebRTC signaling
    socketRef.current.on('signal', (data) => {
      console.log('Received signal from:', data.fromSocketId);
      if (peerRef.current && data.signalData) {
        peerRef.current.signal(data.signalData);
      }
    });

    socketRef.current.on('offer', (data) => {
      console.log('Received offer from:', data.fromSocketId);
      if (peerRef.current && data.offer) {
        peerRef.current.signal(data.offer);
      }
    });

    socketRef.current.on('answer', (data) => {
      console.log('Received answer from:', data.fromSocketId);
      if (peerRef.current && data.answer) {
        peerRef.current.signal(data.answer);
      }
    });

    socketRef.current.on('ice-candidate', (data) => {
      console.log('Received ICE candidate from:', data.fromSocketId);
      if (peerRef.current && data.candidate) {
        peerRef.current.signal(data.candidate);
      }
    });

    // Handle chat messages
    socketRef.current.on('chat-message', (msg) => {
      setChatMessages((prev) => [...prev, { ...msg, fromMe: false }]);
    });

    // Handle recording events
    socketRef.current.on('recording-started', (data) => {
      setChatMessages((prev) => [...prev, {
        message: data.message,
        userName: 'System',
        timestamp: new Date().toISOString(),
        fromMe: false,
        isSystem: true
      }]);
    });

    socketRef.current.on('recording-stopped', (data) => {
      setChatMessages((prev) => [...prev, {
        message: data.message,
        userName: 'System',
        timestamp: new Date().toISOString(),
        fromMe: false,
        isSystem: true
      }]);
    });

    // Handle peer events
    socketRef.current.on('peer-joined', (data) => {
      console.log('Peer joined:', data);
      setChatMessages((prev) => [...prev, {
        message: `${data.userId} joined as ${data.role}`,
        userName: 'System',
        timestamp: new Date().toISOString(),
        fromMe: false,
        isSystem: true
      }]);
    });

    socketRef.current.on('peer-left', (data) => {
      console.log('Peer left:', data);
      setPeerConnected(false);
      setConnectionStatus('Peer disconnected');
      setChatMessages((prev) => [...prev, {
        message: `${data.userId} left the room`,
        userName: 'System',
        timestamp: new Date().toISOString(),
        fromMe: false,
        isSystem: true
      }]);
    });

    // Handle errors
    socketRef.current.on('server-error', (data) => {
      console.error('Server error:', data);
      setError(data.message);
    });

    // Initialize peer connection
    function initPeer() {
      if (peerRef.current) {
        peerRef.current.destroy();
      }

      console.log('Initializing peer, isInitiator:', isInitiator.current);
      
      peerRef.current = new Peer({
        initiator: isInitiator.current,
        trickle: false,
        stream: localStreamRef.current,
      });

      peerRef.current.on('signal', (data) => {
        console.log('Sending signal, isInitiator:', isInitiator.current);
        
        if (isInitiator.current && peerSocketId.current) {
          // Initiator sends to specific peer
          socketRef.current.emit('signal', {
            roomId,
            signalData: data,
            targetSocketId: peerSocketId.current
          });
        } else {
          // Receiver sends to room (will reach initiator)
          socketRef.current.emit('signal', {
            roomId,
            signalData: data
          });
        }
      });

      peerRef.current.on('stream', (stream) => {
        console.log('Received peer stream');
        if (remoteVid.current) {
          remoteVid.current.srcObject = stream;
        }
      });

      peerRef.current.on('connect', () => {
        console.log('Peer connection established');
        setPeerConnected(true);
        setConnectionStatus('Connected to peer');
      });

      peerRef.current.on('close', () => {
        console.log('Peer connection closed');
        setPeerConnected(false);
        setConnectionStatus('Peer connection closed');
      });

      peerRef.current.on('error', (err) => {
        console.error('Peer connection error:', err);
        setError('Peer connection error: ' + err.message);
        setConnectionStatus('Connection error');
      });
    }

    // Cleanup on unmount
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (socketRef.current) {
        socketRef.current.emit('leave-room', { roomId });
        socketRef.current.disconnect();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomId, userName]);

  // Recording controls
  const startRecording = async () => {
    if (!canStartInterview) {
      alert('You are not eligible to start an interview or have no remaining quota.');
      return;
    }
    if (!localStreamRef.current) {
      alert('Local stream not available');
      return;
    }

    try {
      if (!window.MediaRecorder) {
        alert('Recording not supported on this browser.');
        return;
      }

      // Select supported mimeType
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            alert('No supported format for recording.');
            return;
          }
        }
      }

      const mediaRecorder = new MediaRecorder(localStreamRef.current, { mimeType });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks.current, { type: mimeType });
        chunks.current = [];

        try {
          const formData = new FormData();
          const extension = mimeType.includes('webm') ? 'webm' : 'mp4';
          formData.append('recording', blob, `interview_${roomId}.${extension}`);
          const token = localStorage.getItem('token');

          // const res = await fetch('http://localhost:3000/upload-recording', {
          //   method: 'POST',
          //   headers: { Authorization: `Bearer ${token}` },
          //   body: formData,
          // });

          const res = await fetch(`${API}/upload-recording`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          if (res.ok) {
            const result = await res.json();

            await fetch(`${API}/interviews/recording/${roomId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                recordingUrl: `/uploads/recordings/${result.filename}`,
              }),
            });

            alert('Recording uploaded successfully!');
          } else {
            alert('Failed to upload recording.');
          }
        } catch (uploadErr) {
          alert('Error uploading recording.');
        }
      };

      mediaRecorder.onerror = (e) => {
        alert('Recording error occurred.');
      };

      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setIsRecording(true);
      socketRef.current.emit('recording-started', { roomId });
    } catch (err) {
      alert(`Recording failed: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
        setRecorder(null);
        setIsRecording(false);

        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('recording-stopped', { roomId });
        }
      } catch (err) {
        console.error('Error stopping recording:', err);
        alert('Error stopping recording.');
      }
    }
  };

  // Toggle video on/off
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  // Toggle audio on/off
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  // Chat: send message to peer via socket
  const sendMessage = () => {
    if (!isConnected) {
      alert('You must be connected to send messages.');
      return;
    }
    if (messageInput.trim() && socketRef.current && socketRef.current.connected) {
      const message = {
        message: messageInput,
        userName,
        timestamp: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, { ...message, fromMe: true }]);
      socketRef.current.emit('chat-message', { roomId, ...message });
      setMessageInput('');
    }
  };

  // Leave room and go back to dashboard
  const leaveRoom = () => {
    if (window.confirm('Are you sure you want to leave the interview?')) {
      navigate('/dashboard');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Connection Error</h2>
          <p className="text-purple-200 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Interview Room</h1>
              <div className="flex items-center gap-4">
                <span className="text-purple-200">Room ID: <code className="bg-white/10 px-2 py-1 rounded text-purple-300">{roomId}</code></span>
                {role && (
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {role}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isConnected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
              <div className={`px-3 py-2 rounded-lg ${peerConnected ? 'bg-green-500/20 text-green-300' : 'bg-orange-500/20 text-orange-300'}`}>
                {connectionStatus}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Streams */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-xs">👤</span>
                    </div>
                    Your Video
                  </h3>
                  <video
                    ref={localVid}
                    playsInline
                    autoPlay
                    muted
                    className="w-full aspect-video bg-black rounded-lg border border-white/10"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                      <span className="text-xs">👥</span>
                    </div>
                    Peer Video
                  </h3>
                  <video
                    ref={remoteVid}
                    playsInline
                    autoPlay
                    className="w-full aspect-video bg-black rounded-lg border border-white/10"
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={toggleVideo}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isVideoOn 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600' 
                      : 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600'
                  }`}
                >
                  📹 {isVideoOn ? 'Video On' : 'Video Off'}
                </button>

                <button
                  onClick={toggleAudio}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isAudioOn 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600' 
                      : 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600'
                  }`}
                >
                  🎤 {isAudioOn ? 'Audio On' : 'Audio Off'}
                </button>

                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={!canStartInterview || interviewQuotaLeft <= 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      !canStartInterview || interviewQuotaLeft <= 0
                        ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600'
                    }`}
                    title={
                      !canStartInterview
                        ? 'You are not eligible for interviews'
                        : interviewQuotaLeft <= 0
                        ? 'No interview quota left'
                        : ''
                    }
                  >
                    🔴 Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200"
                  >
                    ⏹️ Stop Recording
                  </button>
                )}

                <button
                  onClick={leaveRoom}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg font-medium border border-white/20 hover:bg-white/20 transition-all duration-200"
                >
                  🚪 Leave Room
                </button>
              </div>

              {/* Interview Quota Info */}
              {interviewQuotaLeft !== undefined && (
                <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-purple-200 text-sm">
                    Interview quota remaining: <span className="text-white font-semibold">{interviewQuotaLeft}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 flex flex-col h-fit lg:sticky lg:top-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-xs">💬</span>
              </div>
              Chat
            </h3>

            <div className="flex flex-col h-80">
              <div className="flex-1 overflow-y-auto mb-4 space-y-3 bg-white/5 rounded-lg p-4 border border-white/10">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      msg.fromMe
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-300/20 ml-4'
                        : msg.isSystem
                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-300/20'
                        : 'bg-white/10 border border-white/20 mr-4'
                    }`}
                  >
                    <div className="text-xs text-purple-200 mb-1">
                      {msg.userName} • {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-white text-sm">{msg.message}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  disabled={!isConnected}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={sendMessage}
                  disabled={!isConnected}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}