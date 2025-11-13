import React, { useState } from 'react';
import './AuthScreen.css';

const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.username || !formData.password) {
      setError('Username and password are required');
      return false;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (!isLogin) {
      if (!formData.email) {
        setError('Email is required');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Invalid email format');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = () => {
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');

    if (isLogin) {
      const user = users.find(
        u => u.username === formData.username && u.password === formData.password
      );

      if (user) {
        onLogin({ username: user.username, email: user.email });
      } else {
        setError('Invalid username or password');
      }
    } else {
      const userExists = users.find(u => u.username === formData.username);
      const emailExists = users.find(u => u.email === formData.email);

      if (userExists) {
        setError('Username already exists');
        return;
      }

      if (emailExists) {
        setError('Email already registered');
        return;
      }

      const newUser = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      setSuccess('Registration successful! Please login.');
      setTimeout(() => {
        setIsLogin(true);
        setFormData({
          username: formData.username,
          password: '',
          confirmPassword: '',
          email: ''
        });
        setSuccess('');
      }, 2000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-background">
        <div className="floating-particle"></div>
        <div className="floating-particle"></div>
        <div className="floating-particle"></div>
        <div className="floating-particle"></div>
        <div className="floating-particle"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="game-logo">
              <span className="logo-icon">🎮</span>
              <h1 className="logo-text">Physics Quest</h1>
            </div>
            <p className="auth-tagline">Master Physics Through Adventure</p>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(true);
                setError('');
                setSuccess('');
              }}
            >
              Login
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(false);
                setError('');
                setSuccess('');
              }}
            >
              Register
            </button>
          </div>

          <div className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-wrapper">
                  <span className="input-icon">📧</span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
              </div>
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔐</span>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="message error-message">
                <span className="message-icon">⚠️</span>
                {error}
              </div>
            )}

            {success && (
              <div className="message success-message">
                <span className="message-icon">✅</span>
                {success}
              </div>
            )}

            <button onClick={handleSubmit} className="submit-button">
              {isLogin ? '🎮 Start Playing' : '📝 Create Account'}
            </button>
          </div>

          <div className="auth-footer">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button className="switch-button" onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
                setFormData({
                  username: '',
                  password: '',
                  confirmPassword: '',
                  email: ''
                });
              }}>
                {isLogin ? 'Register here' : 'Login here'}
              </button>
            </p>
          </div>

          <div className="features-info">
            <h3>🌟 Game Features</h3>
            <ul>
              <li>✨ Interactive physics simulations</li>
              <li>🗺️ Multiple worlds and quests</li>
              {/* <li>💾 Automatic progress saving</li> */}
              <li>🏆 Earn badges and achievements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;