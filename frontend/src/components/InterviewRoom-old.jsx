
// import React, { useEffect, useRef, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { io } from 'socket.io-client';
// import Peer from 'simple-peer';

// export default function InterviewRoom() {
//   const { roomId } = useParams();
//   const navigate = useNavigate();
//   const localVid = useRef(null);
//   const remoteVid = useRef(null);
//   const peerRef = useRef(null);
//   const socketRef = useRef(null);
//   const localStreamRef = useRef(null);

//   const [recorder, setRecorder] = useState(null);
//   const [isRecording, setIsRecording] = useState(false);
//   const [isInitiator, setIsInitiator] = useState(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const [peerConnected, setPeerConnected] = useState(false);
//   const [error, setError] = useState(null);
//   const [chatMessages, setChatMessages] = useState([]);
//   const [messageInput, setMessageInput] = useState('');
//   const [userName, setUserName] = useState('');
//   const [isVideoOn, setIsVideoOn] = useState(true);
//   const [isAudioOn, setIsAudioOn] = useState(true);

//   const chunks = useRef([]);

//   // Initialize user info
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       navigate('/login');
//       return;
//     }

//     // Get user name from token or API
//     try {
//       const payload = JSON.parse(atob(token.split('.')[1]));
//       setUserName(payload.name || payload.email || 'User');
//     } catch (err) {
//       console.error('Error parsing token:', err);
//       setUserName('User');
//     }
//   }, [navigate]);

//   // Ask if user is initiator
//   useEffect(() => {
//     if (!roomId) return;

//     const initiator = window.confirm('Are you the host (initiator) of this interview room? Click OK if yes, Cancel if you are joining.');
//     setIsInitiator(initiator);
//   }, [roomId]);

//   // Main WebRTC and Socket setup
//   useEffect(() => {
//     if (isInitiator === null || !userName) return;

//     const initializeConnection = async () => {
//       try {
//         // Verify room exists
//         const token = localStorage.getItem('token');
//         if (!token) {
//           setError('No authentication token found');
//           return;
//         }

//         const response = await fetch(`http://localhost:3000/interviews/join/${roomId}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });

//         if (!response.ok) {
//           setError('Room not found');
//           return;
//         }

//         // Check if io is available
//         if (typeof io !== 'function') {
//           setError('Socket.io client not loaded properly');
//           return;
//         }

//         // Initialize socket with better error handling
//         socketRef.current = io('http://localhost:3000/peer-interview', {
//           transports: ['websocket'],
//           timeout: 20000,
//           forceNew: true
//         });

//         // Add connection event handlers first
//         socketRef.current.on('connect', () => {
//           console.log('Socket connected');
//           setIsConnected(true);
//         });

//         socketRef.current.on('connect_error', (err) => {
//           console.error('Socket connection error:', err);
//           setError(`Failed to connect to server: ${err.message}`);
//         });

//         socketRef.current.on('disconnect', (reason) => {
//           console.log('Socket disconnected:', reason);
//           setIsConnected(false);
//         });

//         // Check if getUserMedia is available
//         if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//           setError('Camera/microphone access not supported in this browser');
//           return;
//         }

//         // Get user media with better error handling
//         let stream;
//         try {
//           stream = await navigator.mediaDevices.getUserMedia({ 
//             video: true, 
//             audio: true 
//           });
//         } catch (mediaErr) {
//           console.error('Media access error:', mediaErr);
//           setError('Cannot access camera/microphone. Please allow permissions and try again.');
//           return;
//         }

//         localStreamRef.current = stream;
//         if (localVid.current) {
//           localVid.current.srcObject = stream;
//         }

//         // Check if Peer is available
//         if (typeof Peer !== 'function') {
//           setError('Simple-peer library not loaded properly');
//           return;
//         }

//         // Create peer connection with better error handling
//         let peer;
//         try {
//           peer = new Peer({
//             initiator: isInitiator,
//             trickle: false,
//             stream,
//             config: {
//               iceServers: [
//                 { urls: 'stun:stun.l.google.com:19302' },
//                 { urls: 'stun:stun1.l.google.com:19302' }
//               ]
//             }
//           });
//         } catch (peerErr) {
//           console.error('Peer creation error:', peerErr);
//           setError('Failed to create peer connection');
//           return;
//         }

//         peerRef.current = peer;

//         // Handle peer events
//         peer.on('signal', (data) => {
//           console.log('Sending signal');
//           if (socketRef.current && socketRef.current.connected) {
//             socketRef.current.emit('signal', { roomId, signalData: data });
//           }
//         });

//         peer.on('stream', (remoteStream) => {
//           console.log('Received remote stream');
//           if (remoteVid.current) {
//             remoteVid.current.srcObject = remoteStream;
//           }
//           setPeerConnected(true);
//         });

//         peer.on('connect', () => {
//           console.log('Peer connected');
//           setPeerConnected(true);
//         });

//         peer.on('error', (err) => {
//           console.error('Peer error:', err);
//           setError(`Peer connection failed: ${err.message}`);
//         });

//         peer.on('close', () => {
//           console.log('Peer connection closed');
//           setPeerConnected(false);
//         });

//         // Join room after socket is connected
//         const userId = JSON.parse(atob(token.split('.')[1])).id;
        
//         // Wait for socket connection before emitting
//         if (socketRef.current.connected) {
//           socketRef.current.emit('join-room', { roomId, userId });
//         } else {
//           socketRef.current.on('connect', () => {
//             socketRef.current.emit('join-room', { roomId, userId });
//           });
//         }

//         // Socket event listeners
//         socketRef.current.on('joined-room', (data) => {
//           console.log('Joined room:', data);
//         });

//         socketRef.current.on('signal', ({ signalData }) => {
//           console.log('Received signal');
//           if (peerRef.current && signalData) {
//             try {
//               peerRef.current.signal(signalData);
//             } catch (signalErr) {
//               console.error('Signal error:', signalErr);
//             }
//           }
//         });

//         socketRef.current.on('peer-joined', (data) => {
//           console.log('Peer joined:', data);
//         });

//         socketRef.current.on('peer-left', (data) => {
//           console.log('Peer left:', data);
//           setPeerConnected(false);
//           if (remoteVid.current) {
//             remoteVid.current.srcObject = null;
//           }
//         });

//         socketRef.current.on('chat-message', (data) => {
//           setChatMessages(prev => [...prev, data]);
//         });

//         socketRef.current.on('recording-started', (data) => {
//           setChatMessages(prev => [...prev, {
//             message: data.message,
//             userName: 'System',
//             timestamp: new Date().toISOString(),
//             isSystem: true
//           }]);
//         });

//         socketRef.current.on('recording-stopped', (data) => {
//           setChatMessages(prev => [...prev, {
//             message: data.message,
//             userName: 'System',
//             timestamp: new Date().toISOString(),
//             isSystem: true
//           }]);
//         });

//         socketRef.current.on('error', (data) => {
//           console.error('Socket error:', data);
//           setError(data.message || 'Socket error occurred');
//         });

//       } catch (err) {
//         console.error('Error initializing connection:', err);
//         setError(`Initialization failed: ${err.message}`);
//       }
//     };

//     initializeConnection().catch(err => {
//       console.error('Async initialization error:', err);
//       setError(`Connection setup failed: ${err.message}`);
//     });

//     // Cleanup
//     return () => {
//       try {
//         if (socketRef.current) {
//           if (socketRef.current.connected) {
//             socketRef.current.emit('leave-room', { roomId });
//           }
//           socketRef.current.disconnect();
//           socketRef.current = null;
//         }
//         if (peerRef.current) {
//           peerRef.current.destroy();
//           peerRef.current = null;
//         }
//         if (localStreamRef.current) {
//           localStreamRef.current.getTracks().forEach(track => {
//             try {
//               track.stop();
//             } catch (stopErr) {
//               console.error('Error stopping track:', stopErr);
//             }
//           });
//           localStreamRef.current = null;
//         }
//         if (recorder && recorder.state !== 'inactive') {
//           try {
//             recorder.stop();
//           } catch (recorderErr) {
//             console.error('Error stopping recorder:', recorderErr);
//           }
//         }
//       } catch (cleanupErr) {
//         console.error('Cleanup error:', cleanupErr);
//       }
//     };
//   }, [isInitiator, roomId, userName, navigate, recorder]);

//   // Recording functions
//   const startRecording = () => {
//     if (!localStreamRef.current) {
//       alert('Local stream not available');
//       return;
//     }

//     try {
//       // Check MediaRecorder support
//       if (!window.MediaRecorder) {
//         alert('Recording is not supported on this browser.');
//         return;
//       }

//       // Check supported mime types
//       let mimeType = 'video/webm;codecs=vp9';
//       if (!MediaRecorder.isTypeSupported(mimeType)) {
//         mimeType = 'video/webm';
//         if (!MediaRecorder.isTypeSupported(mimeType)) {
//           mimeType = 'video/mp4';
//           if (!MediaRecorder.isTypeSupported(mimeType)) {
//             alert('No supported video format found for recording.');
//             return;
//           }
//         }
//       }

//       const mediaRecorder = new MediaRecorder(localStreamRef.current, { 
//         mimeType 
//       });

//       mediaRecorder.ondataavailable = (e) => {
//         if (e.data && e.data.size > 0) {
//           chunks.current.push(e.data);
//         }
//       };

//       mediaRecorder.onstop = async () => {
//         const blob = new Blob(chunks.current, { type: mimeType });
//         chunks.current = [];

//         try {
//           const formData = new FormData();
//           const extension = mimeType.includes('webm') ? 'webm' : 'mp4';
//           formData.append('recording', blob, `interview_${roomId}.${extension}`);

//           const token = localStorage.getItem('token');
//           const res = await fetch('http://localhost:3000/upload-recording', {
//             method: 'POST',
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//             body: formData,
//           });

//           if (res.ok) {
//             const result = await res.json();
            
//             // Update interview with recording URL
//             await fetch(`http://localhost:3000/interviews/recording/${roomId}`, {
//               method: 'PATCH',
//               headers: {
//                 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${token}`,
//               },
//               body: JSON.stringify({
//                 recordingUrl: `/uploads/recordings/${result.filename}`
//               }),
//             });

//             alert('Recording uploaded successfully!');
//           } else {
//             const errorData = await res.text();
//             console.error('Upload failed:', errorData);
//             alert('Failed to upload recording.');
//           }
//         } catch (uploadErr) {
//           console.error('Upload error:', uploadErr);
//           alert('Error uploading recording.');
//         }
//       };

//       mediaRecorder.onerror = (e) => {
//         console.error('MediaRecorder error:', e);
//         alert('Recording error occurred.');
//       };

//       mediaRecorder.start();
//       setRecorder(mediaRecorder);
//       setIsRecording(true);

//       // Notify others
//       if (socketRef.current && socketRef.current.connected) {
//         socketRef.current.emit('recording-started', { roomId });
//       }

//     } catch (err) {
//       console.error('Failed to start recording:', err);
//       alert(`Recording failed: ${err.message}`);
//     }
//   };

//   const stopRecording = () => {
//     if (recorder && recorder.state !== 'inactive') {
//       try {
//         recorder.stop();
//         setRecorder(null);
//         setIsRecording(false);

//         // Notify others
//         if (socketRef.current && socketRef.current.connected) {
//           socketRef.current.emit('recording-stopped', { roomId });
//         }
//       } catch (err) {
//         console.error('Error stopping recording:', err);
//         alert('Error stopping recording.');
//       }
//     }
//   };

//   // Media controls
//   const toggleVideo = () => {
//     if (localStreamRef.current) {
//       const videoTrack = localStreamRef.current.getVideoTracks()[0];
//       if (videoTrack) {
//         videoTrack.enabled = !videoTrack.enabled;
//         setIsVideoOn(videoTrack.enabled);
//       }
//     }
//   };

//   const toggleAudio = () => {
//     if (localStreamRef.current) {
//       const audioTrack = localStreamRef.current.getAudioTracks()[0];
//       if (audioTrack) {
//         audioTrack.enabled = !audioTrack.enabled;
//         setIsAudioOn(audioTrack.enabled);
//       }
//     }
//   };

//   // Chat functions
//   const sendMessage = () => {
//     if (messageInput.trim() && socketRef.current && socketRef.current.connected) {
//       const message = {
//         message: messageInput,
//         userName,
//         timestamp: new Date().toISOString()
//       };
      
//       setChatMessages(prev => [...prev, { ...message, fromMe: true }]);
//       socketRef.current.emit('chat-message', { roomId, ...message });
//       setMessageInput('');
//     }
//   };

//   const leaveRoom = () => {
//     if (window.confirm('Are you sure you want to leave the interview?')) {
//       navigate('/dashboard');
//     }
//   };

//   if (error) {
//     return (
//       <div style={{ padding: '20px', textAlign: 'center' }}>
//         <h2>Error</h2>
//         <p>{error}</p>
//         <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
//         <button onClick={() => window.location.reload()} style={{ marginLeft: '10px' }}>
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//         <h2>Interview Room: {roomId}</h2>
//         <div>
//           <span style={{ 
//             color: isConnected ? 'green' : 'red', 
//             marginRight: '10px' 
//           }}>
//             {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
//           </span>
//           <span style={{ 
//             color: peerConnected ? 'green' : 'orange' 
//           }}>
//             {peerConnected ? '🟢 Peer Connected' : '🟡 Waiting for peer...'}
//           </span>
//         </div>
//       </div>

//       <div style={{ display: 'flex', flex: 1, gap: '20px' }}>
//         {/* Video Section */}
//         <div style={{ flex: 2 }}>
//           <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
//             <div>
//               <h4>Your Video</h4>
//               <video 
//                 ref={localVid} 
//                 playsInline 
//                 autoPlay 
//                 muted 
//                 width="320" 
//                 height="240" 
//                 style={{ backgroundColor: 'black', borderRadius: '8px' }} 
//               />
//             </div>
//             <div>
//               <h4>Peer Video</h4>
//               <video 
//                 ref={remoteVid} 
//                 playsInline 
//                 autoPlay 
//                 width="320" 
//                 height="240" 
//                 style={{ backgroundColor: 'black', borderRadius: '8px' }} 
//               />
//             </div>
//           </div>

//           {/* Controls */}
//           <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
//             <button 
//               onClick={toggleVideo}
//               style={{ 
//                 backgroundColor: isVideoOn ? '#4CAF50' : '#f44336',
//                 color: 'white',
//                 border: 'none',
//                 padding: '10px 15px',
//                 borderRadius: '5px',
//                 cursor: 'pointer'
//               }}
//             >
//               {isVideoOn ? '📹 Video On' : '📹 Video Off'}
//             </button>
            
//             <button 
//               onClick={toggleAudio}
//               style={{ 
//                 backgroundColor: isAudioOn ? '#4CAF50' : '#f44336',
//                 color: 'white',
//                 border: 'none',
//                 padding: '10px 15px',
//                 borderRadius: '5px',
//                 cursor: 'pointer'
//               }}
//             >
//               {isAudioOn ? '🎤 Audio On' : '🎤 Audio Off'}
//             </button>

//             {!isRecording ? (
//               <button 
//                 onClick={startRecording}
//                 style={{ 
//                   backgroundColor: '#2196F3',
//                   color: 'white',
//                   border: 'none',
//                   padding: '10px 15px',
//                   borderRadius: '5px',
//                   cursor: 'pointer'
//                 }}
//               >
//                 🔴 Start Recording
//               </button>
//             ) : (
//               <button 
//                 onClick={stopRecording}
//                 style={{ 
//                   backgroundColor: '#f44336',
//                   color: 'white',
//                   border: 'none',
//                   padding: '10px 15px',
//                   borderRadius: '5px',
//                   cursor: 'pointer'
//                 }}
//               >
//                 ⏹️ Stop Recording
//               </button>
//             )}

//             <button 
//               onClick={leaveRoom}
//               style={{ 
//                 backgroundColor: '#9E9E9E',
//                 color: 'white',
//                 border: 'none',
//                 padding: '10px 15px',
//                 borderRadius: '5px',
//                 cursor: 'pointer'
//               }}
//             >
//               🚪 Leave Room
//             </button>
//           </div>
//         </div>

//         {/* Chat Section */}
//         <div style={{ 
//           flex: 1, 
//           display: 'flex', 
//           flexDirection: 'column',
//           border: '1px solid #ccc',
//           borderRadius: '8px',
//           padding: '15px'
//         }}>
//           <h4 style={{ marginTop: 0 }}>Chat</h4>
          
//           <div style={{ 
//             flex: 1, 
//             overflowY: 'auto', 
//             marginBottom: '15px',
//             padding: '10px',
//             backgroundColor: '#f9f9f9',
//             borderRadius: '5px',
//             maxHeight: '300px'
//           }}>
//             {chatMessages.map((msg, index) => (
//               <div key={index} style={{ 
//                 marginBottom: '10px',
//                 padding: '8px',
//                 backgroundColor: msg.fromMe ? '#e3f2fd' : msg.isSystem ? '#fff3e0' : '#ffffff',
//                 borderRadius: '5px',
//                 border: '1px solid #eee'
//               }}>
//                 <div style={{ 
//                   fontSize: '12px', 
//                   color: '#666',
//                   marginBottom: '3px'
//                 }}>
//                   {msg.userName} - {new Date(msg.timestamp).toLocaleTimeString()}
//                 </div>
//                 <div>{msg.message}</div>
//               </div>
//             ))}
//           </div>

//           <div style={{ display: 'flex', gap: '10px' }}>
//             <input
//               type="text"
//               value={messageInput}
//               onChange={(e) => setMessageInput(e.target.value)}
//               onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
//               placeholder="Type a message..."
//               style={{ 
//                 flex: 1,
//                 padding: '8px',
//                 border: '1px solid #ccc',
//                 borderRadius: '4px'
//               }}
//             />
//             <button 
//               onClick={sendMessage}
//               style={{ 
//                 backgroundColor: '#4CAF50',
//                 color: 'white',
//                 border: 'none',
//                 padding: '8px 15px',
//                 borderRadius: '4px',
//                 cursor: 'pointer'
//               }}
//             >
//               Send
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// import React, { useEffect, useRef, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { io } from 'socket.io-client';
// import Peer from 'simple-peer';

// export default function InterviewRoom({
//   userName,
//   canStartInterview,  // Boolean: from backend or parent to indicate if user can do interview
//   interviewQuotaLeft,  // Number: remaining interview quota for user
// }) {
//   const { roomId } = useParams();
//   const navigate = useNavigate();

//   const localVid = useRef(null);
//   const remoteVid = useRef(null);
//   const localStreamRef = useRef(null);
//   const socketRef = useRef(null);
//   const peerRef = useRef(null);
//   const chunks = useRef([]);

//   const [isConnected, setIsConnected] = useState(false);
//   const [peerConnected, setPeerConnected] = useState(false);
//   const [recorder, setRecorder] = useState(null);
//   const [isRecording, setIsRecording] = useState(false);
//   const [isVideoOn, setIsVideoOn] = useState(true);
//   const [isAudioOn, setIsAudioOn] = useState(true);

//   const [chatMessages, setChatMessages] = useState([]);
//   const [messageInput, setMessageInput] = useState('');
//   const [error, setError] = useState(null);

//   // Initialize media and socket connections
//   useEffect(() => {
//     async function startLocalStream() {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//         localStreamRef.current = stream;
//         if (localVid.current) {
//           localVid.current.srcObject = stream;
//         }
//       } catch (err) {
//         setError('Failed to access camera/microphone: ' + err.message);
//       }
//     }
//     startLocalStream();

//     socketRef.current = io('http://localhost:3000', { query: { roomId } });

//     socketRef.current.on('connect', () => {
//       setIsConnected(true);
//     });
//     socketRef.current.on('disconnect', () => {
//       setIsConnected(false);
//       setPeerConnected(false);
//     });

//     socketRef.current.on('peer-connected', () => {
//       setPeerConnected(true);
//     });

//     socketRef.current.on('chat-message', (msg) => {
//       setChatMessages(prev => [...prev, { ...msg, fromMe: false }]);
//     });

//     // Handle signaling for WebRTC
//     socketRef.current.on('signal', (data) => {
//       if (peerRef.current) {
//         peerRef.current.signal(data);
//       }
//     });

//     // Create Peer
//     peerRef.current = new Peer({
//       initiator: window.location.hash === '#init',
//       trickle: false,
//       stream: localStreamRef.current,
//     });

//     peerRef.current.on('signal', (data) => {
//       socketRef.current.emit('signal', data);
//     });

//     peerRef.current.on('stream', (stream) => {
//       if (remoteVid.current) {
//         remoteVid.current.srcObject = stream;
//       }
//     });

//     peerRef.current.on('connect', () => {
//       setPeerConnected(true);
//     });

//     peerRef.current.on('close', () => {
//       setPeerConnected(false);
//     });

//     peerRef.current.on('error', (err) => {
//       setError('Peer connection error: ' + err.message);
//     });

//     return () => {
//       // Cleanup
//       if (peerRef.current) peerRef.current.destroy();
//       if (socketRef.current) socketRef.current.disconnect();
//       if (localStreamRef.current) {
//         localStreamRef.current.getTracks().forEach(track => track.stop());
//       }
//     };
//   }, [roomId]);

//   // Recording functions
//   const startRecording = () => {
//     if (!canStartInterview) {
//       alert('You are not eligible to start an interview or you have no remaining quota.');
//       return;
//     }
//     if (!localStreamRef.current) {
//       alert('Local stream not available');
//       return;
//     }

//     try {
//       if (!window.MediaRecorder) {
//         alert('Recording is not supported on this browser.');
//         return;
//       }

//       let mimeType = 'video/webm;codecs=vp9';
//       if (!MediaRecorder.isTypeSupported(mimeType)) {
//         mimeType = 'video/webm';
//         if (!MediaRecorder.isTypeSupported(mimeType)) {
//           mimeType = 'video/mp4';
//           if (!MediaRecorder.isTypeSupported(mimeType)) {
//             alert('No supported video format found for recording.');
//             return;
//           }
//         }
//       }

//       const mediaRecorder = new MediaRecorder(localStreamRef.current, { mimeType });

//       mediaRecorder.ondataavailable = (e) => {
//         if (e.data && e.data.size > 0) {
//           chunks.current.push(e.data);
//         }
//       };

//       mediaRecorder.onstop = async () => {
//         const blob = new Blob(chunks.current, { type: mimeType });
//         chunks.current = [];

//         try {
//           const formData = new FormData();
//           const extension = mimeType.includes('webm') ? 'webm' : 'mp4';
//           formData.append('recording', blob, `interview_${roomId}.${extension}`);

//           const token = localStorage.getItem('token');
//           const res = await fetch('http://localhost:3000/upload-recording', {
//             method: 'POST',
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//             body: formData,
//           });

//           if (res.ok) {
//             const result = await res.json();

//             // Update interview with recording URL
//             await fetch(`http://localhost:3000/interviews/recording/${roomId}`, {
//               method: 'PATCH',
//               headers: {
//                 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${token}`,
//               },
//               body: JSON.stringify({
//                 recordingUrl: `/uploads/recordings/${result.filename}`,
//               }),
//             });

//             alert('Recording uploaded successfully!');
//           } else {
//             const errorData = await res.text();
//             console.error('Upload failed:', errorData);
//             alert('Failed to upload recording.');
//           }
//         } catch (uploadErr) {
//           console.error('Upload error:', uploadErr);
//           alert('Error uploading recording.');
//         }
//       };

//       mediaRecorder.onerror = (e) => {
//         console.error('MediaRecorder error:', e);
//         alert('Recording error occurred.');
//       };

//       mediaRecorder.start();
//       setRecorder(mediaRecorder);
//       setIsRecording(true);

//       if (socketRef.current && socketRef.current.connected) {
//         socketRef.current.emit('recording-started', { roomId });
//       }
//     } catch (err) {
//       console.error('Failed to start recording:', err);
//       alert(`Recording failed: ${err.message}`);
//     }
//   };

//   const stopRecording = () => {
//     if (recorder && recorder.state !== 'inactive') {
//       try {
//         recorder.stop();
//         setRecorder(null);
//         setIsRecording(false);

//         if (socketRef.current && socketRef.current.connected) {
//           socketRef.current.emit('recording-stopped', { roomId });
//         }
//       } catch (err) {
//         console.error('Error stopping recording:', err);
//         alert('Error stopping recording.');
//       }
//     }
//   };

//   // Media controls
//   const toggleVideo = () => {
//     if (!isConnected || !peerConnected) {
//       alert('You must be connected to toggle video.');
//       return;
//     }
//     if (localStreamRef.current) {
//       const videoTrack = localStreamRef.current.getVideoTracks()[0];
//       if (videoTrack) {
//         videoTrack.enabled = !videoTrack.enabled;
//         setIsVideoOn(videoTrack.enabled);
//       }
//     }
//   };

//   const toggleAudio = () => {
//     if (!isConnected || !peerConnected) {
//       alert('You must be connected to toggle audio.');
//       return;
//     }
//     if (localStreamRef.current) {
//       const audioTrack = localStreamRef.current.getAudioTracks()[0];
//       if (audioTrack) {
//         audioTrack.enabled = !audioTrack.enabled;
//         setIsAudioOn(audioTrack.enabled);
//       }
//     }
//   };

//   // Chat functions
//   const sendMessage = () => {
//     if (!isConnected || !peerConnected) {
//       alert('You must be connected to send messages.');
//       return;
//     }
//     if (messageInput.trim() && socketRef.current && socketRef.current.connected) {
//       const message = {
//         message: messageInput,
//         userName,
//         timestamp: new Date().toISOString(),
//       };

//       setChatMessages(prev => [...prev, { ...message, fromMe: true }]);
//       socketRef.current.emit('chat-message', { roomId, ...message });
//       setMessageInput('');
//     }
//   };

//   const leaveRoom = () => {
//     if (window.confirm('Are you sure you want to leave the interview?')) {
//       navigate('/dashboard');
//     }
//   };

//   if (error) {
//     return (
//       <div style={{ padding: '20px', textAlign: 'center' }}>
//         <h2>Error</h2>
//         <p>{error}</p>
//         <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
//         <button onClick={() => window.location.reload()} style={{ marginLeft: '10px' }}>
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//         <h2>Interview Room: {roomId}</h2>
//         <div>
//           <span
//             style={{
//               color: isConnected ? 'green' : 'red',
//               marginRight: '10px',
//             }}
//           >
//             {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
//           </span>
//           <span
//             style={{
//               color: peerConnected ? 'green' : 'orange',
//             }}
//           >
//             {peerConnected ? '🟢 Peer Connected' : '🟡 Waiting for peer...'}
//           </span>
//         </div>
//       </div>

//       <div style={{ display: 'flex', flex: 1, gap: '20px' }}>
//         {/* Video Section */}
//         <div style={{ flex: 2 }}>
//           <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
//             <div>
//               <h4>Your Video</h4>
//               <video
//                 ref={localVid}
//                 playsInline
//                 autoPlay
//                 muted
//                 width="320"
//                 height="240"
//                 style={{ backgroundColor: 'black', borderRadius: '8px' }}
//               />
//             </div>
//             <div>
//               <h4>Peer Video</h4>
//               <video
//                 ref={remoteVid}
//                 playsInline
//                 autoPlay
//                 width="320"
//                 height="240"
//                 style={{ backgroundColor: 'black', borderRadius: '8px' }}
//               />
//             </div>
//           </div>

//           {/* Controls */}
//           <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
//             <button
//               onClick={toggleVideo}
//               disabled={!isConnected || !peerConnected}
//               style={{
//                 backgroundColor: isVideoOn ? '#4CAF50' : '#f44336',
//                 color: 'white',
//                 border: 'none',
//                 padding: '10px 15px',
//                 borderRadius: '5px',
//                 cursor: !isConnected || !peerConnected ? 'not-allowed' : 'pointer',
//               }}
//               title={!isConnected || !peerConnected ? 'Connect to peer first' : ''}
//             >
//               {isVideoOn ? '📹 Video On' : '📹 Video Off'}
//             </button>

//             <button
//               onClick={toggleAudio}
//               disabled={!isConnected || !peerConnected}
//               style={{
//                 backgroundColor: isAudioOn ? '#4CAF50' : '#f44336',
//                 color: 'white',
//                 border: 'none',
//                 padding: '10px 15px',
//                 borderRadius: '5px',
//                 cursor: !isConnected || !peerConnected ? 'not-allowed' : 'pointer',
//               }}
//               title={!isConnected || !peerConnected ? 'Connect to peer first' : ''}
//             >
//               {isAudioOn ? '🎤 Audio On' : '🎤 Audio Off'}
//             </button>

//             {!isRecording ? (
//               <button
//                 onClick={startRecording}
//                 disabled={!canStartInterview || interviewQuotaLeft <= 0}
//                 style={{
//                   backgroundColor: !canStartInterview || interviewQuotaLeft <= 0 ? '#9E9E9E' : '#2196F3',
//                   color: 'white',
//                   border: 'none',
//                   padding: '10px 15px',
//                   borderRadius: '5px',
//                   cursor: !canStartInterview || interviewQuotaLeft <= 0 ? 'not-allowed' : 'pointer',
//                 }}
//                 title={
//                   !canStartInterview
//                     ? 'You are not eligible for interviews'
//                     : interviewQuotaLeft <= 0
//                     ? 'No interview quota left'
//                     : ''
//                 }
//               >
//                 🔴 Start Recording
//               </button>
//             ) : (
//               <button
//                 onClick={stopRecording}
//                 style={{
//                   backgroundColor: '#f44336',
//                   color: 'white',
//                   border: 'none',
//                   padding: '10px 15px',
//                   borderRadius: '5px',
//                   cursor: 'pointer',
//                 }}
//               >
//                 ⏹️ Stop Recording
//               </button>
//             )}

//             <button
//               onClick={leaveRoom}
//               style={{
//                 backgroundColor: '#9E9E9E',
//                 color: 'white',
//                 border: 'none',
//                 padding: '10px 15px',
//                 borderRadius: '5px',
//                 cursor: 'pointer',
//               }}
//             >
//               🚪 Leave Room
//             </button>
//           </div>

//           <div style={{ marginTop: '10px', color: '#555', fontSize: '14px' }}>
//             {interviewQuotaLeft !== undefined && (
//               <div>
//                 Interview quota remaining: <strong>{interviewQuotaLeft}</strong>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Chat Section */}
//         <div
//           style={{
//             flex: 1,
//             display: 'flex',
//             flexDirection: 'column',
//             border: '1px solid #ccc',
//             borderRadius: '8px',
//             padding: '15px',
//           }}
//         >
//           <h4 style={{ marginTop: 0 }}>Chat</h4>

//           <div
//             style={{
//               flex: 1,
//               overflowY: 'auto',
//               marginBottom: '15px',
//               padding: '10px',
//               backgroundColor: '#f9f9f9',
//               borderRadius: '5px',
//               maxHeight: '300px',
//             }}
//           >
//             {chatMessages.map((msg, index) => (
//               <div
//                 key={index}
//                 style={{
//                   marginBottom: '10px',
//                   padding: '8px',
//                   backgroundColor: msg.fromMe ? '#e3f2fd' : msg.isSystem ? '#fff3e0' : '#ffffff',
//                   borderRadius: '5px',
//                   border: '1px solid #eee',
//                 }}
//               >
//                 <div
//                   style={{
//                     fontSize: '12px',
//                     color: '#666',
//                     marginBottom: '3px',
//                   }}
//                 >
//                   {msg.userName} - {new Date(msg.timestamp).toLocaleTimeString()}
//                 </div>
//                 <div>{msg.message}</div>
//               </div>
//             ))}
//           </div>

//           <div style={{ display: 'flex', gap: '10px' }}>
//             <input
//               type="text"
//               value={messageInput}
//               onChange={(e) => setMessageInput(e.target.value)}
//               onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
//               placeholder="Type a message..."
//               disabled={!isConnected || !peerConnected}
//               style={{
//                 flex: 1,
//                 padding: '8px',
//                 border: '1px solid #ccc',
//                 borderRadius: '4px',
//                 backgroundColor: !isConnected || !peerConnected ? '#eee' : 'white',
//               }}
//             />
//             <button
//               onClick={sendMessage}
//               disabled={!isConnected || !peerConnected}
//               style={{
//                 backgroundColor: '#4CAF50',
//                 color: 'white',
//                 border: 'none',
//                 padding: '8px 15px',
//                 borderRadius: '4px',
//                 cursor: !isConnected || !peerConnected ? 'not-allowed' : 'pointer',
//               }}
//             >
//               Send
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



