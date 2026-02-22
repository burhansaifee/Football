import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import socket from '../socket';

import {
    Gavel,
    DollarSign,
    UserPlus,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout';

const AdminTeams = () => {
    const navigate = useNavigate();
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [teams, setTeams] = useState([]);

    const [alert, setAlert] = useState({ message: '', type: '' });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Form states
    const [newBudgets, setNewBudgets] = useState({});
    const [newTeamReg, setNewTeamReg] = useState({ username: '', password: '', teamName: '', initialBudget: 100 });

    const showAlert = (message, type) => {
        setAlert({ message, type });
        setTimeout(() => setAlert({ message: '', type: '' }), 5000);
    };

    const loadTeams = async () => {
        try {
            const response = await api.get('/users');
            setTeams(response.data);
        } catch (error) {
            console.error('Failed to load teams:', error);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token || user?.role !== 'admin') {
            navigate('/');
            return;
        }

        loadTeams();

        if (user?.tournamentId) {
            socket.emit('join-tournament', user.tournamentId);
        }

        socket.on('budget-update', () => {
            loadTeams();
        });

        socket.on('auction-ended', () => {
            loadTeams();
        });

        return () => {
            socket.off('budget-update');
            socket.off('auction-ended');
        };
    }, [navigate, user]);

    const handleAddTeam = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users/register-team', newTeamReg);
            showAlert('Team registered successfully!', 'success');
            setNewTeamReg({ username: '', password: '', teamName: '', initialBudget: 100 });
            loadTeams();
        } catch (error) {
            showAlert(error.response?.data?.error || 'Failed to register team', 'error');
        }
    };

    const updateBudget = async (userId) => {
        const budget = newBudgets[userId];
        if (!budget || budget < 0) {
            showAlert('Please enter a valid budget', 'error');
            return;
        }
        try {
            await api.post(`/users/budget/${userId}`, { budget });
            showAlert('Budget updated successfully!', 'success');
            loadTeams();
            setNewBudgets({ ...newBudgets, [userId]: '' });
        } catch (error) {
            showAlert(error.response?.data?.error || 'Failed to update budget', 'error');
        }
    };

    const logout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <DashboardLayout user={user}>
            <div className="max-w-7xl mx-auto space-y-6">
                {alert.message && (
                    <div className={`alert-float ${alert.type}`}>
                        {alert.message}
                    </div>
                )}

                <div className="content-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    {/* Left Column: Register New Team */}
                    <div className="left-column">
                        <section className="section-card glass">
                            <div className="section-header">
                                <h2><UserPlus size={20} /> Register New Team</h2>
                            </div>
                            <form onSubmit={handleAddTeam} className="add-player-form">
                                <div className="form-group">
                                    <input
                                        type="text"
                                        placeholder="Username (for login)"
                                        required
                                        value={newTeamReg.username}
                                        onChange={(e) => setNewTeamReg({ ...newTeamReg, username: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        placeholder="Team Name"
                                        required
                                        value={newTeamReg.teamName}
                                        onChange={(e) => setNewTeamReg({ ...newTeamReg, teamName: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        required
                                        value={newTeamReg.password}
                                        onChange={(e) => setNewTeamReg({ ...newTeamReg, password: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="number"
                                        placeholder="Initial Budget"
                                        required
                                        value={newTeamReg.initialBudget}
                                        onChange={(e) => setNewTeamReg({ ...newTeamReg, initialBudget: e.target.value })}
                                    />
                                </div>
                                <button type="submit" className="btn-submit">Register Team</button>
                            </form>
                        </section>
                    </div>

                    {/* Right Column: Teams */}
                    <div className="right-column">
                        <section className="section-card glass">
                            <div className="section-header">
                                <h2><Gavel size={20} /> Teams & Budgets</h2>
                            </div>
                            <div className="flex flex-col gap-4">
                                {teams.map(team => (
                                    <div key={team._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-bg-card backdrop-blur-md border border-border rounded-xl shadow-sm hover:border-primary transition-colors">
                                        <div className="flex flex-col">
                                            <h4 className="font-bold text-text-dark text-base">{team.teamName || team.username}</h4>
                                            <div className="flex items-center text-primary font-semibold text-sm mt-1">
                                                <DollarSign size={15} className="mr-1" />
                                                {team.budget}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                className="flex-1 sm:w-32 px-3 py-2 text-sm border border-border rounded-lg bg-bg-main text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                                value={newBudgets[team._id] || ''}
                                                onChange={(e) => setNewBudgets({ ...newBudgets, [team._id]: e.target.value })}
                                            />
                                            <button
                                                onClick={() => updateBudget(team._id)}
                                                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover shadow-sm transition-all whitespace-nowrap"
                                            >
                                                Update
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminTeams;
