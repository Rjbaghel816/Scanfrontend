import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTenant } from './context/TenantContext';
import MainLayout from './components/layout/MainLayout';
import UniversityPage from './pages/UniversityPage';
import LoginPage from './pages/LoginPage';
import ScannerPage from './pages/scanner/ScannerPage';
import PaperUploadPage from './pages/admin/PaperUploadPage';
import PaperListPage from './pages/admin/PaperListPage'; // ✅ NEW
import CopyViewingPage from './pages/admin/CopyViewingPage';
import ReviewQueuePage from './pages/admin/ReviewQueuePage';
import EvaluationConfig from './pages/admin/EvaluationConfig';
import StatisticsPage from './pages/admin/StatisticsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user } = useTenant();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

function App() {
  const { user } = useTenant();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? "/admin/dashboard" : "/scanner") : "/login"} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/university" element={<UniversityPage />} />
      
      {/* Protected Routes */}
      <Route path="/scanner" element={<ProtectedRoute><ScannerPage /></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/upload-paper" element={<ProtectedRoute><PaperUploadPage /></ProtectedRoute>} />
      <Route path="/admin/view-paper" element={<ProtectedRoute><PaperListPage defaultType="question-paper" /></ProtectedRoute>} />
      <Route path="/admin/view-answer-template" element={<ProtectedRoute><PaperListPage defaultType="answer-template" /></ProtectedRoute>} />
      <Route path="/admin/view-copies" element={<ProtectedRoute><CopyViewingPage /></ProtectedRoute>} />
      <Route path="/admin/review-queue" element={<ProtectedRoute><ReviewQueuePage /></ProtectedRoute>} />
      <Route path="/admin/config" element={<ProtectedRoute><EvaluationConfig /></ProtectedRoute>} />
      <Route path="/admin/statistics" element={<ProtectedRoute><StatisticsPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
