import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import LandingPage from './pages/Landing'
import LoginPage from './pages/LoginPage';
import Header from './components/Header';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from "./pages/UserDashboard";
import './App.css'
import AiInterview from './services/AiInterview';
import CreateMeeting from './components/CreateMeeting';
import InterviewRoom from './components/InterviewRoom';

function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/user/dashboard" element={<UserDashboard />} />
        {/* <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} /> */}

        <Route path="/user/services/ai-interview" element={ <AiInterview />} />
        <Route path="/user/services/peer-interview" element={ <CreateMeeting />} />
        
        <Route path="/interview/:roomId"      element={ <InterviewRoom
      userName={"vivek"}
      canStartInterview={true}
      interviewQuotaLeft={10}
    />}/>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}


export default App
