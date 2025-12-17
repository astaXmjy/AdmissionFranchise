import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import FranchiseDashboard from './pages/FranchiseDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#ff0080',
          colorInfo: '#40e0d0',
          colorSuccess: '#52c41a',
          colorWarning: '#ff8c00',
          colorError: '#ff0080',
          borderRadius: 8,
        },
      }}
    >
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/franchise/*"
              element={
                <ProtectedRoute requiredRole="franchise">
                  <FranchiseDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
