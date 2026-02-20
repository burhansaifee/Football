import React, { useState, useEffect } from 'react';
import { PlusCircle, Save } from 'lucide-react';
import api from '../api';

const MatchInput = ({ onMatchAdded }) => {
    const [teams, setTeams] = useState([]);
    const [teamA, setTeamA] = useState('');
    const [teamB, setTeamB] = useState('');
    const [goalsA, setGoalsA] = useState('');
    const [goalsB, setGoalsB] = useState('');
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ message: '', type: '' });

    useEffect(() => {
        loadTeams();
    }, []);

    const loadTeams = async () => {
        try {
            const response = await api.get('/users');
            setTeams(response.data);
        } catch (error) {
            console.error('Failed to load teams:', error);
        }
    };

    const showAlert = (message, type) => {
        setAlert({ message, type });
        setTimeout(() => setAlert({ message: '', type: '' }), 5000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (teamA === teamB) {
            showAlert('Please select two different teams', 'error');
            return;
        }

        if (goalsA === '' || goalsB === '' || goalsA < 0 || goalsB < 0) {
            showAlert('Please enter valid goals for both teams', 'error');
            return;
        }

        setLoading(true);
        try {
            await api.post('/matches', {
                teamA,
                teamB,
                goalsA: parseInt(goalsA),
                goalsB: parseInt(goalsB)
            });
            showAlert('Match result saved successfully!', 'success');
            setTeamA('');
            setTeamB('');
            setGoalsA('');
            setGoalsB('');
            if (onMatchAdded) onMatchAdded();
        } catch (error) {
            showAlert(error.response?.data?.error || 'Failed to save match result', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="section-card glass">
            <div className="section-header">
                <h2><PlusCircle size={20} /> Add Match Result</h2>
            </div>

            {alert.message && (
                <div style={{
                    padding: '10px', marginBottom: '15px', borderRadius: '8px',
                    backgroundColor: alert.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    color: alert.type === 'error' ? '#ef4444' : '#22c55e',
                    fontSize: '0.9rem'
                }}>
                    {alert.message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="add-player-form" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <select
                            required
                            value={teamA}
                            onChange={(e) => setTeamA(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-dark)' }}
                        >
                            <option value="">Select Team A</option>
                            {teams.map(team => (
                                <option key={team._id} value={team._id}>{team.teamName || team.username}</option>
                            ))}
                        </select>
                    </div>

                    <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>VS</span>

                    <div className="form-group" style={{ flex: 1 }}>
                        <select
                            required
                            value={teamB}
                            onChange={(e) => setTeamB(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-dark)' }}
                        >
                            <option value="">Select Team B</option>
                            {teams.map(team => (
                                <option key={team._id} value={team._id}>{team.teamName || team.username}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <input
                            type="number"
                            placeholder="Goals A"
                            min="0"
                            required
                            value={goalsA}
                            onChange={(e) => setGoalsA(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-dark)' }}
                        />
                    </div>

                    <span style={{ fontWeight: 'bold', color: 'var(--text-muted)', visibility: 'hidden' }}>VS</span>

                    <div className="form-group" style={{ flex: 1 }}>
                        <input
                            type="number"
                            placeholder="Goals B"
                            min="0"
                            required
                            value={goalsB}
                            onChange={(e) => setGoalsB(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-dark)' }}
                        />
                    </div>
                </div>

                <button type="submit" className="btn-submit" disabled={loading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <Save size={18} /> {loading ? 'Saving...' : 'Save Result'}
                </button>
            </form>
        </section>
    );
};

export default MatchInput;
