import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Shield, Plus, ArrowRight, Play, LogOut, Loader, CreditCard } from 'lucide-react';

const AdminTournaments = () => {
    const navigate = useNavigate();
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [tournaments, setTournaments] = useState([]);
    const [newTournamentName, setNewTournamentName] = useState('');
    const [newTournamentSport, setNewTournamentSport] = useState('Football');
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ message: '', type: '' });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || user?.role !== 'admin') {
            navigate('/');
            return;
        }
        loadTournaments();
    }, [navigate, user]);

    const showAlert = (message, type) => {
        setAlert({ message, type });
        setTimeout(() => setAlert({ message: '', type: '' }), 5000);
    };

    const loadTournaments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/tournaments');
            setTournaments(response.data);
        } catch (error) {
            console.error('Failed to load tournaments:', error);
            showAlert('Failed to load tournaments', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTournament = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/tournaments', { name: newTournamentName, sport: newTournamentSport });

            // Update local storage to point to this new tournament
            const currentUser = JSON.parse(localStorage.getItem('user'));
            currentUser.tournamentId = res.data.tournament._id;
            currentUser.tournamentSport = res.data.tournament.sport;
            localStorage.setItem('user', JSON.stringify(currentUser));
            localStorage.setItem('token', res.data.token);

            showAlert('Tournament created successfully!', 'success');
            setNewTournamentName('');
            setNewTournamentSport('Football');

            // Redirect to dashboard
            setTimeout(() => {
                navigate('/admin');
            }, 1000);

        } catch (error) {
            showAlert(error.response?.data?.error || 'Failed to create tournament', 'error');
        }
    };

    const selectTournament = async (tournament) => {
        try {
            const res = await api.post('/tournaments/select', { tournamentId: tournament._id });

            // Update local storage to point to this new tournament
            const currentUser = JSON.parse(localStorage.getItem('user'));
            currentUser.tournamentId = tournament._id;
            currentUser.tournamentSport = res.data.tournament?.sport || tournament.sport;
            localStorage.setItem('user', JSON.stringify(currentUser));
            localStorage.setItem('token', res.data.token);

            navigate('/admin');
        } catch (e) {
            console.error('Failed to select tournament', e);
            showAlert('Failed to switch tournament', 'error');
        }
    };

    const logout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <div style={{ minHeight: '100vh', padding: '40px', background: 'var(--bg-light)' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Shield size={36} color="var(--primary)" />
                        <div>
                            <h1 style={{ margin: 0, color: 'var(--text-dark)' }}>My Tournaments</h1>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Manage your auction events</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button onClick={() => navigate('/admin/billing')} className="btn-small primary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <CreditCard size={16} /> Billing
                        </button>
                        <button onClick={logout} className="btn-small secondary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </header>

                {alert.message && (
                    <div className={`alert-float ${alert.type}`}>
                        {alert.message}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '30px' }}>

                    {/* Create New */}
                    <div className="section-card glass" style={{ height: 'fit-content' }}>
                        <div className="section-header">
                            <h2><Plus size={20} /> New Tournament</h2>
                        </div>
                        <form onSubmit={handleCreateTournament} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Tournament Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Summer League 2026"
                                    required
                                    value={newTournamentName}
                                    onChange={(e) => setNewTournamentName(e.target.value)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Sport</label>
                                <select
                                    required
                                    value={newTournamentSport}
                                    onChange={(e) => setNewTournamentSport(e.target.value)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-dark)' }}
                                >
                                    <option value="Football">Football</option>
                                    <option value="Cricket">Cricket</option>
                                    <option value="Basketball">Basketball</option>
                                    <option value="Kabaddi">Kabaddi</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-submit" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                Create Event <ArrowRight size={16} />
                            </button>
                        </form>
                    </div>

                    {/* Manage Existing */}
                    <div className="section-card glass">
                        <div className="section-header">
                            <h2><Play size={20} /> Your Events</h2>
                        </div>

                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                <Loader className="spin" size={32} color="var(--primary)" />
                            </div>
                        ) : tournaments.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                <p>You haven't created any tournaments yet.</p>
                                <p>Create one to get started!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {tournaments.map(tournament => (
                                    <div key={tournament._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                                <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.2rem' }}>{tournament.name}</h3>
                                                <span className="badge" style={{ fontSize: '0.75rem' }}>{tournament.sport || 'Football'}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '15px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                <span><strong style={{ color: 'var(--text-dark)' }}>Join Code:</strong> {tournament.joinCode}</span>
                                                <span><strong style={{ color: 'var(--text-dark)' }}>Status:</strong> {tournament.status}</span>
                                                <span><strong style={{ color: 'var(--text-dark)' }}>Created:</strong> {new Date(tournament.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => selectTournament(tournament)}
                                            className="btn-small primary"
                                            style={{ padding: '10px 20px' }}
                                        >
                                            Enter Dashboard
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
};

export default AdminTournaments;
