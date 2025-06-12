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
  const [showChat, setShowChat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
        <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg px-3 py-2">
              <span className="text-white text-sm font-medium">Room: {roomId}</span>
            </div>
            {role && (
              <div className="bg-blue-600 bg-opacity-80 backdrop-blur-sm rounded-lg px-3 py-2">
                <span className="text-white text-sm font-medium">{role}</span>
              </div>
            )}
            {isRecording && (
              <div className="bg-red-600 bg-opacity-80 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">Recording</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm ${
              isConnected 
                ? 'bg-green-600 bg-opacity-80 text-white' 
                : 'bg-red-600 bg-opacity-80 text-white'
            }`}>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-300' : 'bg-red-300'}`}></div>
                <span>{connectionStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className={`relative ${showChat ? 'pr-80' : ''} transition-all duration-300`}>
        {/* Remote Video (Main) */}
        <div className="h-screen relative">
          <video
            ref={remoteVid}
            playsInline
            autoPlay
            className="w-full h-full object-cover bg-gray-800"
          />
          
          {/* Peer Name Overlay */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg px-3 py-2">
            <span className="text-white text-sm font-medium">
              {peerConnected ? 'Peer' : 'Waiting for peer...'}
            </span>
          </div>
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-20 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
          <video
            ref={localVid}
            playsInline
            autoPlay
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 backdrop-blur-sm rounded px-2 py-1">
            <span className="text-white text-xs font-medium">You</span>
          </div>
          {!isVideoOn && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
        <div className="flex items-center justify-center space-x-4">
          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 ${
              isAudioOn 
                ? 'bg-gray-700 bg-opacity-80 text-white hover:bg-gray-600' 
                : 'bg-red-600 bg-opacity-80 text-white hover:bg-red-700'
            }`}
            title={isAudioOn ? 'Mute' : 'Unmute'}
          >
            {isAudioOn ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0L18.485 7.757a1 1 0 010 1.414L17.071 10.585a1 1 0 11-1.414-1.414L16.243 8.586l-.586-.586a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 ${
              isVideoOn 
                ? 'bg-gray-700 bg-opacity-80 text-white hover:bg-gray-600' 
                : 'bg-red-600 bg-opacity-80 text-white hover:bg-red-700'
            }`}
            title={isVideoOn ? 'Stop Video' : 'Start Video'}
          >
            {isVideoOn ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Recording Toggle */}
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={!canStartInterview || interviewQuotaLeft <= 0}
              className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 ${
                !canStartInterview || interviewQuotaLeft <= 0
                  ? 'bg-gray-500 bg-opacity-50 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 bg-opacity-80 text-white hover:bg-blue-700'
              }`}
              title={
                !canStartInterview
                  ? 'You are not eligible for interviews'
                  : interviewQuotaLeft <= 0
                  ? 'No interview quota left'
                  : 'Start Recording'
              }
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-red-600 bg-opacity-80 text-white hover:bg-red-700 backdrop-blur-sm transition-all duration-200"
              title="Stop Recording"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          {/* Chat Toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-700 bg-opacity-80 text-white hover:bg-gray-600 backdrop-blur-sm transition-all duration-200"
            title="Toggle Chat"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            {chatMessages.length > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {chatMessages.length}
              </div>
            )}
          </button>

          {/* Leave Button */}
          <button
            onClick={leaveRoom}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-red-600 bg-opacity-80 text-white hover:bg-red-700 backdrop-blur-sm transition-all duration-200"
            title="Leave Meeting"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 z-30 ${
        showChat ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
            <button
              onClick={() => setShowChat(false)}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.fromMe
                      ? 'bg-blue-600 text-white'
                      : msg.isSystem
                      ? 'bg-yellow-100 text-yellow-800 text-center w-full'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {!msg.fromMe && !msg.isSystem && (
                    <div className="text-xs text-gray-500 mb-1">{msg.userName}</div>
                  )}
                  <div className="text-sm">{msg.message}</div>
                  <div className={`text-xs mt-1 ${
                    msg.fromMe ? 'text-blue-100' : msg.isSystem ? 'text-yellow-600' : 'text-gray-500'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">Start a conversation</p>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200">
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
                disabled={!isConnected || !messageInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interview Quota Info - Bottom Left */}
      {interviewQuotaLeft !== undefined && (
        <div className="absolute bottom-20 left-4 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg px-3 py-2">
          <div className="text-white text-sm">
            Interviews remaining: <span className="font-semibold text-blue-300">{interviewQuotaLeft}</span>
          </div>
        </div>
      )}

      {/* Connection Status for Mobile */}
      <div className="md:hidden absolute top-16 left-4 right-4">
        <div className={`px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm text-center ${
          isConnected 
            ? 'bg-green-600 bg-opacity-80 text-white' 
            : 'bg-red-600 bg-opacity-80 text-white'
        }`}>
          {connectionStatus}
        </div>
      </div>
    </div>
  );
}