import React, { useEffect, useState, useRef } from 'react';
import { checkEligibility } from '../services/aiInterviewService';
import { FiSend, FiMic, FiMicOff, FiVideo, FiUser, FiClock, FiBriefcase, FiMonitor, FiXCircle, FiUpload, FiFile } from 'react-icons/fi';
import { API } from '../utils/api';

const InputModal = ({ isOpen, onClose, onSubmit, title, placeholder, required = false, isTextArea = false }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValue('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (required && !value.trim()) {
      setError('This field is required');
      return;
    }
    onSubmit(value);
    setValue('');
    setError('');
  };

  const handleCancel = () => {
    setValue('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4">
        <div 
          className="rounded-xl p-6 shadow-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            <div 
              className="h-1 w-16 rounded-full"
              style={{
                background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
              }}
            ></div>
          </div>

          {/* Input Section */}
          <div className="mb-4">
            {isTextArea ? (
              <textarea
                rows={6}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (error) setError('');
                }}
                placeholder={placeholder}
                className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${
                  error 
                    ? 'border-red-400 focus:ring-red-400/50' 
                    : 'border-white/20 focus:ring-purple-500/50 focus:border-purple-400'
                }`}
                style={{ backdropFilter: 'blur(8px)' }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleSubmit(e);
                  }
                }}
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (error) setError('');
                }}
                placeholder={placeholder}
                className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  error 
                    ? 'border-red-400 focus:ring-red-400/50' 
                    : 'border-white/20 focus:ring-purple-500/50 focus:border-purple-400'
                }`}
                style={{ backdropFilter: 'blur(8px)' }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e);
                  }
                }}
              />
            )}
            {error && (
              <p className="mt-2 text-sm text-red-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
            {isTextArea && (
              <p className="mt-1 text-xs text-purple-300">
                Press Ctrl+Enter to submit
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 bg-white/5 border border-white/20 text-purple-200 rounded-lg hover:bg-white/10 hover:border-white/30 transition-all duration-200 font-medium"
              style={{ backdropFilter: 'blur(8px)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 text-white rounded-lg transition-all duration-200 font-medium shadow-lg"
              style={{
                background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.25)',
              }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Resume Upload Modal Component (unchanged)
const ResumeModal = ({ isOpen, onClose, onSubmit }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFile(null);
    }
  }, [isOpen]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf')) {
        setFile(droppedFile);
      } else {
        alert('Please upload a PDF file only');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
        setFile(selectedFile);
      } else {
        alert('Please upload a PDF file only');
        e.target.value = '';
      }
    }
  };

  const handleSubmit = () => {
    onSubmit(file);
    setFile(null);
  };

  const handleSkip = () => {
    onSubmit(null);
    setFile(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4">
        <div 
          className="rounded-xl p-6 shadow-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">Upload Resume (Optional)</h3>
            <div 
              className="h-1 w-16 rounded-full"
              style={{
                background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
              }}
            ></div>
            <p className="text-purple-200 text-sm mt-2">
              Upload your resume for more personalized interview questions
            </p>
          </div>

          {/* File Upload Area */}
          <div className="mb-6">
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                dragActive 
                  ? 'border-purple-400 bg-purple-500/10' 
                  : file 
                    ? 'border-green-400 bg-green-500/10'
                    : 'border-white/30 bg-white/5 hover:border-purple-400/50 hover:bg-white/10'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {file ? (
                <div className="flex flex-col items-center">
                  <FiFile className="text-green-400 text-3xl mb-2" />
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-green-400 text-sm">Ready to upload</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <FiUpload className="text-purple-400 text-3xl mb-2" />
                  <p className="text-white font-medium mb-1">
                    {dragActive ? 'Drop your resume here' : 'Click to upload or drag & drop'}
                  </p>
                  <p className="text-purple-200 text-sm">PDF files only</p>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 px-4 py-2.5 bg-white/5 border border-white/20 text-purple-200 rounded-lg hover:bg-white/10 hover:border-white/30 transition-all duration-200 font-medium"
              style={{ backdropFilter: 'blur(8px)' }}
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!file}
              className="flex-1 px-4 py-2.5 text-white rounded-lg transition-all duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: file 
                  ? 'linear-gradient(to right, #8b5cf6, #ec4899)' 
                  : 'rgba(139, 92, 246, 0.3)',
                boxShadow: file ? '0 4px 16px rgba(139, 92, 246, 0.25)' : 'none',
              }}
            >
              {file ? 'Upload & Continue' : 'Select Resume'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AiInterview() {
  const [eligibility, setEligibility] = useState(null);
  const [messages, setMessages] = useState([]);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [interviewDuration, setInterviewDuration] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');

  // Modal state management
  const [modalState, setModalState] = useState({
    isOpen: false,
    currentField: '',
    title: '',
    placeholder: '',
    isTextArea: false
  });
  
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [interviewParams, setInterviewParams] = useState({});
  const [resumeFile, setResumeFile] = useState(null);

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem('token');

  const fieldConfig = {
    type: { 
      title: 'Interview Type', 
      placeholder: 'e.g., Technical, Behavioral, System Design, HR Round',
      isTextArea: false
    },
    domain: { 
      title: 'Domain/Technology', 
      placeholder: 'e.g., Frontend Development, Backend, Full Stack, Data Science, DevOps',
      isTextArea: false
    },
    company: { 
      title: 'Target Company', 
      placeholder: 'e.g., Google, Amazon, Microsoft, Meta, Netflix, Startup',
      isTextArea: false
    },
    jobDesc: { 
      title: 'Job Description', 
      placeholder: 'Paste the complete job description here. Include responsibilities, requirements, and any specific technologies mentioned...',
      isTextArea: true
    }
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (messages.length > 0) {
        setInterviewDuration(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [messages.length]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setAnswer(prev => prev + ' ' + finalTranscript);
        }
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    async function fetchEligibility() {
      try {
        const data = await checkEligibility(token);
        setEligibility(data);
      } catch {
        setEligibility({ level: 'NONE' });
      }
    }
    fetchEligibility();
  }, [token]);

  // Modal management functions
  const openModal = (field) => {
    const config = fieldConfig[field];
    setModalState({
      isOpen: true,
      currentField: field,
      title: config.title,
      placeholder: config.placeholder,
      isTextArea: config.isTextArea
    });
  };

  const closeModal = () => {
    setModalState({ 
      isOpen: false, 
      currentField: '', 
      title: '', 
      placeholder: '', 
      isTextArea: false 
    });
  };

  const handleModalSubmit = (value) => {
    setInterviewParams(prev => ({
      ...prev,
      [modalState.currentField]: value
    }));
    closeModal();
    
    // Continue to next field or show resume modal
    const fields = ['type', 'domain', 'company', 'jobDesc'];
    const currentIndex = fields.indexOf(modalState.currentField);
    
    if (currentIndex < fields.length - 1) {
      // Open next modal
      setTimeout(() => openModal(fields[currentIndex + 1]), 100);
    } else {
      // All fields collected, show resume modal
      setTimeout(() => setResumeModalOpen(true), 100);
    }
  };

  const handleResumeSubmit = (file) => {
    setResumeFile(file);
    setResumeModalOpen(false);
    // Start interview with collected params
    setTimeout(() => startInterview(), 100);
  };

  const connectWebSocket = () => {
    if (wsRef.current) return;

    const backendWithoutProtocol = API.replace(/^https?:\/\//, '');
    // decide ws scheme
    const wsProtocol = API.startsWith('https') ? 'wss:' : 'ws:';

    const ws = new WebSocket(`${wsProtocol}//${backendWithoutProtocol}/ws/ai-interview?token=${token}`);

    ws.onopen = () => {
      setConnected(true);
      console.log('WebSocket connected');
      
      // Automatically start interview if we're waiting
      handleStartInterview(); // ✅ move this here
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'question') {
        setMessages((prev) => [...prev, { role: 'ai', content: data.content }]);
        setCurrentQuestion(data.content);
        setLoading(false);
        // Speak the question aloud
        setTimeout(() => speakText(data.content), 500);
      } else if (data.type === 'error') {
        alert(data.message);
        setLoading(false);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      console.log('WebSocket disconnected');
    };

    ws.onerror = (err) => {
      console.error('WebSocket error', err);
      alert('WebSocket connection error');
      setLoading(false);
    };

    wsRef.current = ws;
  };

  // const begin = () => {
  //   if (!connected) {
  //     connectWebSocket();
  //     setTimeout(() => {
  //       handleStartInterview();
  //     }, 500);
  //   } else {
  //     handleStartInterview();
  //   }
  // };

  const begin = () => {
  if (!connected) {
    connectWebSocket(); // ⏳ wait for `onopen` to trigger `handleStartInterview()`
  } else {
    handleStartInterview(); // ✅ call immediately if already connected
  }
};

  const handleStartInterview = () => {
    if (eligibility.level === 'BASIC') {
      startInterview();
    } else {
      setInterviewParams({});
      setResumeFile(null);
      openModal('type');
    }
  };

  const startInterview = () => {
    if (!wsRef.current) return;

    const params = { ...interviewParams };
    
    // Add resume info if provided
    if (resumeFile) {
      params.hasResume = true;
      params.resumeName = resumeFile.name;
      // In a real implementation, you'd upload the file to your server here
      // and include the file URL or ID in the params
    }

    setMessages([]);
    setLoading(true);
    setInterviewDuration(0);
    setCurrentQuestion('');

    wsRef.current.send(JSON.stringify({ type: 'start', params }));
  };

  const respond = () => {
    if (!answer.trim() || !wsRef.current) return;

    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: answer }]);
    wsRef.current.send(JSON.stringify({ type: 'answer', answer }));

    setAnswer('');
    setCurrentQuestion('');
  };

  const quitInterview = () => {
    if (wsRef.current && connected) {
      wsRef.current.send(JSON.stringify({ type: 'quit' }));
      setConnected(false);
      setMessages([]);
      setAnswer('');
      setLoading(false);
      setIsListening(false);
      setCurrentQuestion('');
      setInterviewDuration(0);
      setInterviewParams({});
      setResumeFile(null);
      alert('Interview ended. You can check your report later.'); 
    }
  };

  const toggleMic = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


  if (!eligibility)
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800"
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div className="p-8 rounded-2xl text-center bg-white/10 backdrop-blur-lg shadow-2xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-white text-xl font-semibold">Checking eligibility...</div>
        </div>
      </div>
    );

  if (eligibility.level === 'NONE')
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800"
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div className="p-8 rounded-2xl text-center bg-white/10 backdrop-blur-lg shadow-2xl border border-red-400/30">
          <div className="text-red-400 text-xl font-semibold">
            You don't have a subscription or you have exceeded your quota
          </div>
        </div>
      </div>
    );

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800"
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Modals */}
      <InputModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        title={modalState.title}
        placeholder={modalState.placeholder}
        required={true}
        isTextArea={modalState.isTextArea}
      />
      <ResumeModal
        isOpen={resumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
        onSubmit={handleResumeSubmit}
      />

      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
              <FiBriefcase className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-white text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                AI Mock Interview
              </h1>
              <p className="text-gray-400 text-sm">Professional Interview Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-gray-300 text-sm">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-lg px-3 py-1.5 rounded-lg border border-white/20">
              <FiClock className="text-cyan-400" />
              <span className="font-mono text-white">{currentTime.toLocaleTimeString()}</span>
            </div>
            {messages.length > 0 && (
              <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-lg px-3 py-1.5 rounded-lg border border-emerald-400/30">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="font-mono text-emerald-300">Duration: {formatTime(interviewDuration)}</span>
              </div>
            )}
            {messages.length > 0 && (
              <button
                onClick={quitInterview}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 transition-all duration-300 flex items-center gap-1.5 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105"
              >
                <FiXCircle className="text-sm" />
                End Interview
              </button>
            )}
          </div>
        </div>
      </div>

      {messages.length === 0 ? (
        /* Pre-Interview Setup */
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
          <div className="w-full max-w-2xl p-8 rounded-2xl bg-white/10 backdrop-blur-lg shadow-2xl border border-white/20">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
                <FiVideo className="text-white text-2xl" />
              </div>
              <h2 className="text-white text-2xl font-semibold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Ready for Your Interview?
              </h2>
              <p className="text-gray-300 text-lg">
                Experience a professional AI-powered mock interview session
              </p>
            </div>

            {/* Interview Setup Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-xl text-center bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center bg-gradient-to-r from-cyan-400 to-blue-500 group-hover:scale-110 transition-transform duration-300">
                  <FiMic className="text-white text-lg" />
                </div>
                <p className="text-white text-sm font-medium">Voice Enabled</p>
                <p className="text-gray-400 text-xs">Speech Recognition</p>
              </div>
              <div className="p-4 rounded-xl text-center bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center bg-gradient-to-r from-emerald-400 to-green-500 group-hover:scale-110 transition-transform duration-300">
                  <FiMonitor className="text-white text-lg" />
                </div>
                <p className="text-white text-sm font-medium">AI Interviewer</p>
                <p className="text-gray-400 text-xs">Real-time Interaction</p>
              </div>
              <div className="p-4 rounded-xl text-center bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center bg-gradient-to-r from-amber-400 to-orange-500 group-hover:scale-110 transition-transform duration-300">
                  <FiClock className="text-white text-lg" />
                </div>
                <p className="text-white text-sm font-medium">Live Session</p>
                <p className="text-gray-400 text-xs">Real-time Feedback</p>
              </div>
            </div>

            <button
              onClick={begin}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-medium text-lg shadow-lg transition-all duration-300 disabled:opacity-60 hover:shadow-2xl active:scale-[0.98] text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 shadow-cyan-500/25 hover:shadow-cyan-500/40"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Starting Interview...
                </div>
              ) : (
                'Start Interview Session'
              )}
            </button>
          </div>
        </div>
      ) : (

        <div className="overflow-scroll max-w-7xl mx-auto p-6 h-[calc(100vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">

            {/* Interviewer Panel */}
            <div className="lg:col-span-1 rounded-2xl p-5 flex flex-col bg-white/10 backdrop-blur-lg shadow-2xl border border-white/20">
              {/* AI Interviewer Avatar */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center relative bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/25">
                  <span className="text-2xl text-white">🤖</span>
                  {loading && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-400/25">
                      <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                <h3 className="text-white text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">AI Interviewer</h3>
                <p className="text-gray-400 text-sm">Professional Assistant</p>
              </div>

              {/* Current Question Display */}
              {currentQuestion && (
                <div className="p-4 rounded-xl mb-5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-lg border border-blue-400/30">
                  <p className="text-xs text-cyan-300 mb-2 font-medium uppercase tracking-wide">Current Question</p>
                  <p className="text-white text-sm leading-relaxed">{currentQuestion}</p>
                </div>
              )}

              {/* Status Indicators */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10">
                  <span className="text-gray-300 text-sm">Connection</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                    <span className="text-emerald-300 text-sm font-medium">Live</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10">
                  <span className="text-gray-300 text-sm">Questions</span>
                  <span className="text-white text-sm font-medium">{messages.filter(m => m.role === 'ai').length}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10">
                  <span className="text-gray-300 text-sm">Voice Input</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-400 animate-pulse shadow-lg shadow-red-400/50' : 'bg-gray-500'}`}></div>
                    <span className={`text-sm font-medium ${isListening ? 'text-red-300' : 'text-gray-400'}`}>
                      {isListening ? 'Listening' : 'Ready'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Analysis Indicator */}
              {loading && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-lg border border-amber-400/30">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-400"></div>
                    <span className="text-amber-300 text-sm">Analyzing response...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Interview Conversation */}
            <div className="lg:col-span-3 rounded-2xl p-5 flex flex-col bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-lg shadow-2xl border border-white/10">
              {/* Interview History */}
              <div className="flex-1 overflow-y-auto mb-5 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                {messages.slice(-6).map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'ai' && (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
                        <span className="text-sm text-white">🤖</span>
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] p-4 rounded-xl backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] ${
                        msg.role === 'ai'
                          ? 'bg-white/10 text-white shadow-lg border border-white/20'
                          : 'bg-gradient-to-r from-cyan-500/80 to-blue-600/80 text-white shadow-lg shadow-cyan-500/25'
                      }`}
                    >
                      <div className={`text-xs mb-2 font-medium uppercase tracking-wide ${
                        msg.role === 'ai' ? 'text-gray-400' : 'text-cyan-100'
                      }`}>
                        {msg.role === 'ai' ? 'Interviewer' : 'Your Response'}
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/25">
                        <FiUser className="text-white text-sm" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Response Input Area */}
              <div className="space-y-4">
                <div className="flex items-end gap-3">
                  <textarea
                    rows={3}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your response or use the microphone..."
                    className="flex-1 p-4 rounded-xl bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder-gray-400 resize-none
                    focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300 hover:bg-white/15"
                    disabled={loading}
                  />

                  {/* Microphone Button */}
                  <button
                    onClick={toggleMic}
                    disabled={loading}
                    className={`p-4 rounded-xl transition-all duration-300 disabled:opacity-60 shadow-lg hover:scale-105 ${
                      isListening
                        ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 shadow-red-500/25'
                        : 'bg-white/10 backdrop-blur-lg text-gray-300 hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    {isListening ? (
                      <FiMicOff className="text-xl" />
                    ) : (
                      <FiMic className="text-xl" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">{answer.length} characters</span>
                    {isListening && (
                      <span className="text-red-300 flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse shadow-lg shadow-red-400/50"></div>
                        Recording...
                      </span>
                    )}
                  </div>

                  <button
                    onClick={respond}
                    disabled={loading || !answer.trim()}
                    className="px-6 py-2.5 rounded-xl font-medium shadow-lg transition-all duration-300 disabled:opacity-60 flex items-center gap-2 hover:shadow-2xl active:scale-[0.98] text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 shadow-cyan-500/25 hover:shadow-cyan-500/40"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Response
                        <FiSend className="text-sm" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );


  // if (!eligibility)
  //   return (
  //     <div 
  //       className="min-h-screen flex items-center justify-center"
  //       style={{
  //         background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)',
  //         fontFamily: "'Inter', sans-serif",
  //       }}
  //     >
  //       <div 
  //         className="p-8 rounded-xl text-center"
  //         style={{
  //           background: 'rgba(255, 255, 255, 0.1)',
  //           backdropFilter: 'blur(12px)',
  //           border: '1px solid rgba(255, 255, 255, 0.2)',
  //         }}
  //       >
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
  //         <div className="text-white text-xl font-semibold">Checking eligibility...</div>
  //       </div>
  //     </div>
  //   );

  // if (eligibility.level === 'NONE')
  //   return (
  //     <div 
  //       className="min-h-screen flex items-center justify-center"
  //       style={{
  //         background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)',
  //         fontFamily: "'Inter', sans-serif",
  //       }}
  //     >
  //       <div 
  //         className="p-8 rounded-xl text-center"
  //         style={{
  //           background: 'rgba(255, 255, 255, 0.1)',
  //           backdropFilter: 'blur(12px)',
  //           border: '1px solid rgba(239, 68, 68, 0.3)',
  //         }}
  //       >
  //         <div className="text-red-400 text-xl font-semibold">
  //           You don't have subscription or you have exceeded quota 
  //         </div>
  //       </div>
  //     </div>
  //   );

  // return (
  //   <div
  //     className="min-h-screen"
  //     style={{
  //       background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)',
  //       fontFamily: "'Inter', sans-serif",
  //     }}
  //   >
  //     {/* Modals */}
  //     <InputModal
  //       isOpen={modalState.isOpen}
  //       onClose={closeModal}
  //       onSubmit={handleModalSubmit}
  //       title={modalState.title}
  //       placeholder={modalState.placeholder}
  //       required={true}
  //       isTextArea={modalState.isTextArea}
  //     />
      
  //     <ResumeModal
  //       isOpen={resumeModalOpen}
  //       onClose={() => setResumeModalOpen(false)}
  //       onSubmit={handleResumeSubmit}
  //     />

  //     {/* Header */}
  //     <div 
  //       className="sticky top-0 z-50 border-b border-white/10"
  //       style={{
  //         background: 'rgba(15, 23, 42, 0.9)',
  //         backdropFilter: 'blur(16px)',
  //       }}
  //     >
  //       <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
  //         <div className="flex items-center gap-4">
  //           <div 
  //             className="p-2 rounded-lg"
  //             style={{
  //               background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
  //             }}
  //           >
  //             <FiBriefcase className="text-white text-lg" />
  //           </div>
  //           <div>
  //             <h1 className="text-white text-lg font-bold">AI Mock Interview</h1>
  //             <p className="text-purple-200 text-xs">Live Interview Session</p>
  //           </div>
  //         </div>
          
  //         <div className="flex items-center gap-4 text-white text-sm">
  //           <div className="flex items-center gap-2">
  //             <FiClock className="text-purple-300" />
  //             <span className="font-mono">{currentTime.toLocaleTimeString()}</span>
  //           </div>
  //           {messages.length > 0 && (
  //             <div className="flex items-center gap-2">
  //               <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
  //               <span className="font-mono">Duration: {formatTime(interviewDuration)}</span>
  //             </div>
  //           )}
  //           {messages.length > 0 && (
  //             <button
  //               onClick={quitInterview}
  //               className="px-3 py-1 rounded-full text-xs font-semibold bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-1"
  //             >
  //               <FiXCircle className="text-sm" />
  //               Quit
  //             </button>
  //           )}
  //         </div>
  //       </div>
  //     </div>

  //     {messages.length === 0 ? (
  //       /* Pre-Interview Setup */
  //       <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
  //         <div 
  //           className="w-full max-w-2xl p-8 rounded-2xl"
  //           style={{
  //             background: 'rgba(255, 255, 255, 0.1)',
  //             backdropFilter: 'blur(12px)',
  //             border: '1px solid rgba(255, 255, 255, 0.2)',
  //             boxShadow: '0 8px 32px 0 rgba(139, 92, 246, 0.15)',
  //           }}
  //         >
  //           <div className="text-center mb-8">
  //             <div 
  //               className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
  //               style={{
  //                 background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
  //               }}
  //             >
  //               <FiVideo className="text-white text-3xl" />
  //             </div>
  //             <h2 className="text-white text-3xl font-bold mb-2">Ready for Your Live Interview?</h2>
  //             <p className="text-purple-200 text-lg">
  //               Experience a real-time AI interview with voice interaction
  //             </p>
  //           </div>

  //           {/* Interview Setup Cards */}
  //           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
  //             <div 
  //               className="p-4 rounded-lg text-center"
  //               style={{
  //                 background: 'rgba(255, 255, 255, 0.05)',
  //                 border: '1px solid rgba(255, 255, 255, 0.1)',
  //               }}
  //             >
  //               <FiMic className="text-purple-400 text-2xl mx-auto mb-2" />
  //               <p className="text-white text-sm font-medium">Voice Enabled</p>
  //               <p className="text-purple-200 text-xs">Speech Recognition</p>
  //             </div>
  //             <div 
  //               className="p-4 rounded-lg text-center"
  //               style={{
  //                 background: 'rgba(255, 255, 255, 0.05)',
  //                 border: '1px solid rgba(255, 255, 255, 0.1)',
  //               }}
  //             >
  //               <FiMonitor className="text-green-400 text-2xl mx-auto mb-2" />
  //               <p className="text-white text-sm font-medium">AI Interviewer</p>
  //               <p className="text-purple-200 text-xs">Real-time Interaction</p>
  //             </div>
  //             <div 
  //               className="p-4 rounded-lg text-center"
  //               style={{
  //                 background: 'rgba(255, 255, 255, 0.05)',
  //                 border: '1px solid rgba(255, 255, 255, 0.1)',
  //               }}
  //             >
  //               <FiClock className="text-blue-400 text-2xl mx-auto mb-2" />
  //               <p className="text-white text-sm font-medium">Live Session</p>
  //               <p className="text-purple-200 text-xs">Real-time Feedback</p>
  //             </div>
  //           </div>

  //           <button
  //             onClick={begin}
  //             disabled={loading}
  //             className="w-full py-4 rounded-xl font-semibold text-lg shadow-lg transition duration-300 disabled:opacity-60"
  //             style={{
  //               background: loading 
  //                 ? 'rgba(139, 92, 246, 0.5)' 
  //                 : 'linear-gradient(to right, #8b5cf6, #ec4899)',
  //               color: 'white',
  //             }}
  //           >
  //             {loading ? (
  //               <div className="flex items-center justify-center gap-3">
  //                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
  //                 Starting Live Interview...
  //               </div>
  //             ) : (
  //               'Start Live Interview'
  //             )}
  //           </button>
  //         </div>
  //       </div>
  //     ) : (
        
  //       <div className="overflow-scroll max-w-7xl mx-auto p-4 h-[calc(100vh-70px)]">
  //         <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
            
  //           {/* Interviewer Panel */}
  //           <div 
  //             className="lg:col-span-1 rounded-2xl p-4 flex flex-col"
  //             style={{
  //               background: 'rgba(255, 255, 255, 0.1)',
  //               backdropFilter: 'blur(12px)',
  //               border: '1px solid rgba(255, 255, 255, 0.2)',
  //               boxShadow: '0 8px 32px 0 rgba(139, 92, 246, 0.15)',
  //             }}
  //           >
  //             {/* AI Interviewer Avatar */}
  //             <div className="text-center mb-4">
  //               <div 
  //                 className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center relative"
  //                 style={{
  //                   background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
  //                 }}
  //               >
  //                 <span className="text-3xl">🤖</span>
  //                 {loading && (
  //                   <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
  //                     <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
  //                   </div>
  //                 )}
  //               </div>
  //               <h3 className="text-white text-lg font-bold">AI Interviewer</h3>
  //               <p className="text-purple-200 text-xs">Live Interview Assistant</p>
  //             </div>

  //             {/* Current Question Display */}
  //             {currentQuestion && (
  //               <div 
  //                 className="p-3 rounded-lg mb-4"
  //                 style={{
  //                   background: 'linear-gradient(to right, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
  //                   border: '1px solid rgba(139, 92, 246, 0.3)',
  //                 }}
  //               >
  //                 <p className="text-xs text-purple-300 mb-1 font-medium">CURRENT QUESTION:</p>
  //                 <p className="text-white text-sm leading-relaxed">{currentQuestion}</p>
  //               </div>
  //             )}

  //             {/* Status Indicators */}
  //             <div className="space-y-2 mb-4">
  //               <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
  //                 <span className="text-purple-200 text-xs">Connection</span>
  //                 <div className="flex items-center gap-1">
  //                   <div className="w-2 h-2 bg-green-500 rounded-full"></div>
  //                   <span className="text-green-400 text-xs font-medium">Live</span>
  //                 </div>
  //               </div>
  //               <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
  //                 <span className="text-purple-200 text-xs">Questions</span>
  //                 <span className="text-white text-xs font-medium">{messages.filter(m => m.role === 'ai').length}</span>
  //               </div>
  //               <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
  //                 <span className="text-purple-200 text-xs">Voice Input</span>
  //                 <div className="flex items-center gap-1">
  //                   <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
  //                   <span className={`text-xs font-medium ${isListening ? 'text-red-400' : 'text-gray-400'}`}>
  //                     {isListening ? 'Listening' : 'Ready'}
  //                   </span>
  //                 </div>
  //               </div>
  //             </div>

  //             {/* Analysis Indicator */}
  //             {loading && (
  //               <div 
  //                 className="p-3 rounded-lg"
  //                 style={{
  //                   background: 'linear-gradient(to right, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
  //                   border: '1px solid rgba(139, 92, 246, 0.3)',
  //                 }}
  //               >
  //                 <div className="flex items-center gap-2">
  //                   <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400"></div>
  //                   <span className="text-purple-200 text-xs">Analyzing response...</span>
  //                 </div>
  //               </div>
  //             )}
  //           </div>

  //           {/* Interview Conversation */}
  //           <div 
  //             className="lg:col-span-3 rounded-2xl p-4 flex flex-col"
  //             style={{
  //               background: 'rgba(255, 255, 255, 0.1)',
  //               backdropFilter: 'blur(12px)',
  //               border: '1px solid rgba(255, 255, 255, 0.2)',
  //               boxShadow: '0 8px 32px 0 rgba(139, 92, 246, 0.15)',
  //             }}
  //           >
  //             {/* Interview History - Only show last 3 exchanges */}
  //             <div className="flex-1 overflow-y-auto mb-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
  //               {messages.slice(-6).map((msg, i) => (
  //                 <div
  //                   key={i}
  //                   className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
  //                 >
  //                   {msg.role === 'ai' && (
  //                     <div 
  //                       className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
  //                       style={{
  //                         background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
  //                       }}
  //                     >
  //                       <span className="text-sm">🤖</span>
  //                     </div>
  //                   )}
                    
  //                   <div
  //                     className={`max-w-[85%] p-3 rounded-xl ${
  //                       msg.role === 'ai'
  //                         ? 'bg-white/10 border-l-2 border-purple-500'
  //                         : 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30'
  //                     }`}
  //                     style={{
  //                       backdropFilter: 'blur(8px)',
  //                     }}
  //                   >
  //                     <div className="text-xs text-purple-300 mb-1 font-medium">
  //                       {msg.role === 'ai' ? 'INTERVIEWER' : 'YOUR RESPONSE'}
  //                     </div>
  //                     <div className="text-white text-sm leading-relaxed whitespace-pre-wrap">
  //                       {msg.content}
  //                     </div>
  //                   </div>

  //                   {msg.role === 'user' && (
  //                     <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
  //                       <FiUser className="text-white text-sm" />
  //                     </div>
  //                   )}
  //                 </div>
  //               ))}
  //               <div ref={messagesEndRef} />
  //             </div>

  //             {/* Response Input Area */}
  //             <div className="space-y-3">
  //               <div className="flex items-center gap-2">
  //                 <textarea
  //                   rows={3}
  //                   value={answer}
  //                   onChange={(e) => setAnswer(e.target.value)}
  //                   placeholder="Type your response or use the microphone to speak..."
  //                   className="flex-1 p-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-purple-300 resize-none
  //                   focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-60 focus:border-transparent transition-all duration-200"
  //                   disabled={loading}
  //                   style={{
  //                     backdropFilter: 'blur(8px)',
  //                   }}
  //                 />
                  
  //                 {/* Microphone Button */}
  //                 <button
  //                   onClick={toggleMic}
  //                   disabled={loading}
  //                   className={`p-3 rounded-lg transition duration-300 disabled:opacity-60 ${
  //                     isListening 
  //                       ? 'bg-red-500 hover:bg-red-600' 
  //                       : 'bg-white/10 hover:bg-white/20'
  //                   }`}
  //                   style={{
  //                     backdropFilter: 'blur(8px)',
  //                     border: isListening ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
  //                   }}
  //                 >
  //                   {isListening ? (
  //                     <FiMicOff className="text-white text-xl" />
  //                   ) : (
  //                     <FiMic className="text-white text-xl" />
  //                   )}
  //                 </button>
  //               </div>

  //               <div className="flex items-center justify-between">
  //                 <div className="flex items-center gap-3 text-xs">
  //                   <span className="text-purple-200">{answer.length} characters</span>
  //                   {isListening && (
  //                     <span className="text-red-400 flex items-center gap-1">
  //                       <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
  //                       Recording...
  //                     </span>
  //                   )}
  //                 </div>

  //                 <button
  //                   onClick={respond}
  //                   disabled={loading || !answer.trim()}
  //                   className="px-5 py-2 rounded-lg font-semibold shadow-lg transition duration-300 disabled:opacity-60 flex items-center gap-2"
  //                   style={{
  //                     background: loading || !answer.trim() 
  //                       ? 'rgba(139, 92, 246, 0.3)' 
  //                       : 'linear-gradient(to right, #8b5cf6, #ec4899)',
  //                     color: 'white',
  //                   }}
  //                 >
  //                   {loading ? (
  //                     <>
  //                       <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
  //                       Submitting...
  //                     </>
  //                   ) : (
  //                     <>
  //                       Submit
  //                       <FiSend className="text-sm" />
  //                     </>
  //                   )}
  //                 </button>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );
}