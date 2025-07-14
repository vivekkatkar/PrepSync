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

  const [isRoomValidated, setIsRoomValidated] = useState(false);
  const [validating, setValidating] = useState(true);


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

    // startLocalStream();

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
    socketRef.current.on('you-are-initiator', async (data) => {
      console.log('You are initiator:', data);
      isInitiator.current = true;
      setRole(data.role);
      setConnectionStatus('Waiting for peer to join...');

        await startLocalStream();
       setIsRoomValidated(true);
    setValidating(false);
    });

    // Handle being set as receiver (second person to join)
    socketRef.current.on('you-are-receiver', async (data) => {
      console.log('You are receiver:', data);
      isInitiator.current = false;
      setRole(data.role);
      setConnectionStatus('Connecting to peer...');
      
        await startLocalStream();
      initPeer();
      setIsRoomValidated(true);
      setValidating(false);
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
       setValidating(false);
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Validating interview link...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Main Video Area */}
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-white font-medium">Interview Room</span>
            </div>
            <div className="text-gray-400 text-sm">
              Room: {roomId}
            </div>
            {role && (
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                {role}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-gray-400 text-sm">
              {connectionStatus}
            </div>
            {interviewQuotaLeft !== undefined && (
              <div className="text-gray-400 text-sm">
                Quota: {interviewQuotaLeft}
              </div>
            )}
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 relative bg-gray-900">
          {/* Remote Video (Main) */}
          <div className="absolute inset-0">
            <video
              ref={remoteVid}
              playsInline
              autoPlay
              className="w-full h-full object-cover bg-gray-800"
            />
            {!peerConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-lg">Waiting for peer to join...</p>
                </div>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-72 h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600 shadow-xl">
            <video
              ref={localVid}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              You ({userName})
            </div>
            {!isVideoOn && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Recording</span>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
          <div className="flex items-center justify-center space-x-4">
            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isAudioOn 
                  ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={isAudioOn ? 'Mute' : 'Unmute'}
            >
              {isAudioOn ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isVideoOn 
                  ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoOn ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              )}
            </button>

            {/* Recording Toggle */}
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={!canStartInterview || interviewQuotaLeft <= 0}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  !canStartInterview || interviewQuotaLeft <= 0
                    ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                title={
                  !canStartInterview
                    ? 'You are not eligible for interviews'
                    : interviewQuotaLeft <= 0
                    ? 'No interview quota left'
                    : 'Start recording'
                }
              >
                <div className="w-4 h-4 bg-current rounded-full"></div>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white transition-colors"
                title="Stop recording"
              >
                <div className="w-4 h-4 bg-current"></div>
              </button>
            )}

            {/* Leave Call */}
            <button
              onClick={leaveRoom}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white transition-colors"
              title="Leave call"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12V6a4 4 0 00-8 0v6m8 0a4 4 0 01-8 0m8 0H8m8 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        chatMessages.length > 0 ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Chat Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Chat</h3>
            <button
              onClick={() => setChatMessages([])}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`${
                  msg.fromMe
                    ? 'ml-8'
                    : msg.isSystem
                    ? 'text-center'
                    : 'mr-8'
                }`}
              >
                <div
                  className={`rounded-lg p-3 ${
                    msg.fromMe
                      ? 'bg-blue-600 text-white ml-auto'
                      : msg.isSystem
                      ? 'bg-yellow-100 text-yellow-800 text-center'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {!msg.isSystem && (
                    <div className="text-xs opacity-75 mb-1">
                      {msg.userName} • {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                  <div className="text-sm">{msg.message}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                disabled={!isConnected}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={sendMessage}
                disabled={!isConnected}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Toggle Button */}
      <button
        onClick={() => setChatMessages(prev => prev.length === 0 ? [{
          message: 'Chat opened',
          userName: 'System',
          timestamp: new Date().toISOString(),
          fromMe: false,
          isSystem: true
        }] : prev)}
        className="fixed bottom-24 right-6 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-40"
        title="Open chat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {chatMessages.filter(msg => !msg.fromMe).length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {chatMessages.filter(msg => !msg.fromMe).length}
          </div>
        )}
      </button>
    </div>
  );
}