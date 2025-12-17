import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Space } from 'antd';
import { User, Lock, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../App.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Redirect based on stored user role or decode token
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'admin') {
          navigate('/admin');
        } else if (payload.role === 'franchise') {
          navigate('/franchise');
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
  }, [navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await authAPI.login(values);
      const { access_token } = response.data;

      // Store token
      localStorage.setItem('token', access_token);

      // Decode token to get user role
      const payload = JSON.parse(atob(access_token.split('.')[1]));

      message.success('Login successful!');

      // Redirect based on role
      if (payload.role === 'admin') {
        navigate('/admin');
      } else if (payload.role === 'franchise') {
        navigate('/franchise');
      }
    } catch (error) {
      message.error('Login failed. Please check your credentials.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-form">
        <div className="login-header">
          <div className="login-icon">
            <GraduationCap size={48} strokeWidth={2} />
          </div>
          <h1 className="login-title">Admission Management System</h1>
          <p className="login-subtitle">Sign in to continue</p>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input
              prefix={<User size={18} />}
              placeholder="Enter your username"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<Lock size={18} />}
              placeholder="Enter your password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className="login-button"
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div className="login-demo-info">
          <Space direction="vertical" size="small">
            <div>
              <strong>Demo Credentials:</strong>
            </div>
            <div>
              Admin: username: <code>admin</code>, password: <code>admin123</code>
            </div>
            <div>
              (Create franchise accounts through admin panel)
            </div>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Login;
