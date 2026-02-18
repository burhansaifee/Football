import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../index.css'; // Assuming styles are here or inherited

const Login = () => {
    const [activeTab, setActiveTab] = useState('login');
    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [registerData, setRegisterData] = useState({ username: '', password: '', role: '', teamName: '' });
    const [alert, setAlert] = useState({ message: '', type: '' });
    const navigate = useNavigate();

    const switchTab = (tab) => {
        setActiveTab(tab);
        setAlert({ message: '', type: '' });
    };

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.id]: e.target.value });
    };

    const handleRegisterChange = (e) => {
        setRegisterData({ ...registerData, [e.target.id]: e.target.value });
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/login', loginData);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/bidder');
            }
        } catch (error) {
            setAlert({
                message: error.response?.data?.error || 'Login failed',
                type: 'error'
            });
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        try {
            const { username, password, role, teamName } = registerData;
            await api.post('/auth/register', { username, password, role, teamName });

            setAlert({ message: 'Registration successful! Please login.', type: 'success' });
            setRegisterData({ username: '', password: '', role: '', teamName: '' });
            setActiveTab('login');
        } catch (error) {
            setAlert({
                message: error.response?.data?.error || 'Registration failed',
                type: 'error'
            });
        }
    };

    return (
        <div>
            <div className="login-container">
                <div className="glass-card">
                    <div className="logo-area">
                        <h1>Football Auction</h1>
                        <p>Premium Bidding Experience</p>
                    </div>

                    <div className="tabs">
                        <button
                            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                            onClick={() => switchTab('login')}
                        >
                            Login
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                            onClick={() => switchTab('register')}
                        >
                            Register
                        </button>
                    </div>

                    {alert.message && (
                        <div className={`alert ${alert.type}`}>
                            {alert.message}
                        </div>
                    )}

                    {activeTab === 'login' && (
                        <form id="loginForm" className="auth-form active" onSubmit={handleLoginSubmit}>
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    placeholder="Enter your username"
                                    required
                                    value={loginData.username}
                                    onChange={handleLoginChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="Enter your password"
                                    required
                                    value={loginData.password}
                                    onChange={handleLoginChange}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary">Login</button>
                        </form>
                    )}

                    {activeTab === 'register' && (
                        <form id="registerForm" className="auth-form active" onSubmit={handleRegisterSubmit}>
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    id="username" // Changed from regUsername to username for handler simplicity
                                    placeholder="Choose a username"
                                    required
                                    value={registerData.username}
                                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    id="password" // Changed from regPassword
                                    placeholder="Create a password"
                                    required
                                    value={registerData.password}
                                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    id="role"
                                    required
                                    value={registerData.role}
                                    onChange={handleRegisterChange}
                                >
                                    <option value="">Select Role</option>
                                    <option value="admin">Admin</option>
                                    <option value="bidder">Team Owner</option>
                                </select>
                            </div>

                            {registerData.role === 'bidder' && (
                                <div className="form-group" id="teamNameGroup">
                                    <label>Team Name</label>
                                    <input
                                        type="text"
                                        id="teamName"
                                        placeholder="Enter your team name"
                                        value={registerData.teamName}
                                        onChange={handleRegisterChange}
                                    />
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary">Register</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
