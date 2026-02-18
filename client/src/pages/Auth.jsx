import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('owner');
    const [teamName, setTeamName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password, role, teamName);
            }
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}>
            <div className="card" style={{ width: '400px' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>{isLogin ? 'Login' : 'Sign Up'}</h1>

                {error && <p style={{ color: 'var(--error)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                    />

                    {!isLogin && (
                        <>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                            >
                                <option value="owner">Team Owner</option>
                                <option value="admin">Admin</option>
                            </select>
                            {role === 'owner' && (
                                <input
                                    type="text"
                                    placeholder="Team Name"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    required
                                    style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                />
                            )}
                        </>
                    )}

                    <button className="btn btn-primary" type="submit" disabled={loading} style={{ padding: '1rem' }}>
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                    </button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                </p>
            </div>
        </div>
    );
};

export default Auth;
