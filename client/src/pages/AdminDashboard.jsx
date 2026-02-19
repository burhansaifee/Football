import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../api';
import socket from '../socket';
import {
    Users,
    Gavel,
    TrendingUp,
    DollarSign,
    UserPlus,
    Trash2,
    LogOut,
    PlayCircle,
    StopCircle,
    Search,
    Shield,
    Award
} from 'lucide-react';

// Socket instance is now imported from ../socket.js

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [alert, setAlert] = useState({ message: '', type: '' });
    const [searchTerm, setSearchTerm] = useState('');

    // Form states
    const [newPlayer, setNewPlayer] = useState({ name: '', position: '', basePrice: '', imageUrl: '' });
    const [newPrices, setNewPrices] = useState({});
    const [newBudgets, setNewBudgets] = useState({});

    const showAlert = (message, type) => {
        setAlert({ message, type });
        setTimeout(() => setAlert({ message: '', type: '' }), 5000);
    };

    const loadPlayers = async () => {
        try {
            const response = await api.get('/players');
            setPlayers(response.data);
        } catch (error) {
            console.error('Failed to load players:', error);
        }
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

        loadPlayers();
        loadTeams();

        socket.on('bid-update', (data) => {
            loadPlayers();
            showAlert(`New bid: ${data.bidder} bid ${data.amount} coins for ${data.player.name}`, 'success');
        });

        socket.on('players-update', () => {
            loadPlayers();
        });

        socket.on('budget-update', () => {
            loadTeams();
        });

        socket.on('auction-ended', () => {
            loadPlayers();
            loadTeams();
        });

        return () => {
            socket.off('bid-update');
            socket.off('players-update');
            socket.off('budget-update');
            socket.off('auction-ended');
        };
    }, [navigate, user]);

    const handleAddPlayer = async (e) => {
        e.preventDefault();
        try {
            await api.post('/players', newPlayer);
            showAlert('Player added successfully!', 'success');
            setNewPlayer({ name: '', position: '', basePrice: '', imageUrl: '' });
            loadPlayers();
        } catch (error) {
            showAlert(error.response?.data?.error || 'Failed to add player', 'error');
        }
    };

    const startAuction = async (playerId) => {
        try {
            await api.post(`/auction/start/${playerId}`);
            showAlert('Auction started!', 'success');
            setTimeout(() => navigate('/auction'), 500);
        } catch (error) {
            showAlert(error.response?.data?.error || 'Failed to start auction', 'error');
        }
    };

    const startRandomAuction = async () => {
        try {
            const response = await api.post('/auction/start-random');
            showAlert(`Auction started for ${response.data.name}! Redirecting...`, 'success');
            setTimeout(() => navigate('/auction'), 1000);
        } catch (error) {
            showAlert(error.response?.data?.error || 'Failed to start random auction', 'error');
        }
    };

    const endAndNext = async () => {
        try {
            const activePlayer = players.find(p => p.status === 'in-auction');
            if (!activePlayer) {
                await startRandomAuction();
                return;
            }

            await api.post(`/auction/end/${activePlayer._id}`);
            setTimeout(() => startRandomAuction(), 1000);
        } catch (error) {
            console.error('Error in flow:', error);
        }
    };

    const endAuction = async (playerId) => {
        try {
            await api.post(`/auction/end/${playerId}`);
            showAlert('Auction ended!', 'success');
            loadPlayers();
        } catch (error) {
            showAlert(error.response?.data?.error || 'Failed to end auction', 'error');
        }
    };

    const markUnsold = async (playerId) => {
        try {
            await api.post(`/auction/unsold/${playerId}`);
            showAlert('Player marked as Unsold!', 'warning');
            loadPlayers();
        } catch (error) {
            showAlert('Failed to mark as unsold', 'error');
        }
    };

    const setPrice = async (playerId) => {
        const price = newPrices[playerId];
        if (!price || price <= 0) {
            showAlert('Please enter a valid price', 'error');
            return;
        }
        try {
            await api.post(`/auction/set-price/${playerId}`, { newPrice: price });
            showAlert('Price updated successfully!', 'success');
            loadPlayers();
            setNewPrices({ ...newPrices, [playerId]: '' });
        } catch (error) {
            showAlert(error.response?.data?.error || 'Failed to set price', 'error');
        }
    };

    const deletePlayer = async (playerId) => {
        if (!window.confirm('Are you sure you want to delete this player?')) return;
        try {
            await api.delete(`/players/${playerId}`);
            showAlert('Player deleted!', 'success');
            loadPlayers();
        } catch (error) {
            showAlert(error.response?.data?.error || 'Failed to delete player', 'error');
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

    // Derived stats
    const totalPlayers = players.length;
    const soldPlayers = players.filter(p => p.status === 'sold').length;
    const unsoldPlayersCount = players.filter(p => p.status === 'unsold').length;
    const totalBudget = teams.reduce((acc, team) => acc + (team.budget || 0), 0);

    // Filtered players
    const filteredPlayers = players.filter(player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.position.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar glass">
                <div className="sidebar-header">
                    <Shield className="logo-icon" size={32} color="var(--primary)" />
                    <h2>Admin Panel</h2>
                </div>

                <div className="sidebar-menu">
                    <div className="menu-item active">
                        <TrendingUp size={20} />
                        <span>Dashboard</span>
                    </div>
                </div>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={logout}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-header glass">
                    <div className="welcome-text">
                        <h1>Welcome back, {user?.username} 👋</h1>
                        <p>Manage your auction efficiently</p>
                    </div>
                    <div className="header-actions">
                        <button onClick={startRandomAuction} className="btn-action primary">
                            <PlayCircle size={18} />
                            Start Random Auction
                        </button>
                    </div>
                </header>

                {alert.message && (
                    <div className={`alert-float ${alert.type}`}>
                        {alert.message}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card glass">
                        <div className="stat-icon p-blue"><Users size={24} /></div>
                        <div className="stat-info">
                            <h3>Total Players</h3>
                            <p>{totalPlayers}</p>
                        </div>
                    </div>
                    <div className="stat-card glass">
                        <div className="stat-icon p-green"><Award size={24} /></div>
                        <div className="stat-info">
                            <h3>Sold</h3>
                            <p>{soldPlayers}</p>
                        </div>
                    </div>
                    <div className="stat-card glass">
                        <div className="stat-icon p-red"><StopCircle size={24} /></div>
                        <div className="stat-info">
                            <h3>Unsold</h3>
                            <p>{unsoldPlayersCount}</p>
                        </div>
                    </div>
                    <div className="stat-card glass">
                        <div className="stat-icon p-purple"><DollarSign size={24} /></div>
                        <div className="stat-info">
                            <h3>Total Budget</h3>
                            <p>{totalBudget}</p>
                        </div>
                    </div>
                </div>

                <div className="content-grid">
                    {/* Left Column: Players & Auction */}
                    <div className="left-column">
                        <section className="section-card glass">
                            <div className="section-header">
                                <h2><UserPlus size={20} /> Add New Player</h2>
                            </div>
                            <form onSubmit={handleAddPlayer} className="add-player-form">
                                <div className="form-group">
                                    <input
                                        type="text"
                                        placeholder="Player Name"
                                        required
                                        value={newPlayer.name}
                                        onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <select
                                        required
                                        value={newPlayer.position}
                                        onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                                    >
                                        <option value="">Select Position</option>
                                        <option value="Forward">Forward</option>
                                        <option value="Midfielder">Midfielder</option>
                                        <option value="Defender">Defender</option>
                                        <option value="Goalkeeper">Goalkeeper</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <input
                                        type="number"
                                        placeholder="Base Price"
                                        min="1"
                                        required
                                        value={newPlayer.basePrice}
                                        onChange={(e) => setNewPlayer({ ...newPlayer, basePrice: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="url"
                                        placeholder="Image URL"
                                        value={newPlayer.imageUrl}
                                        onChange={(e) => setNewPlayer({ ...newPlayer, imageUrl: e.target.value })}
                                    />
                                </div>
                                <button type="submit" className="btn-submit">Add Player</button>
                            </form>
                        </section>

                        <section className="section-card glass">
                            <div className="section-header">
                                <h2><Users size={20} /> Player List</h2>
                                <div className="search-bar">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search players..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="table-responsive">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Player</th>
                                            <th>Position</th>
                                            <th>Status</th>
                                            <th>Price/Bid</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPlayers.map(player => (
                                            <tr key={player._id}>
                                                <td>
                                                    <div className="player-cell">
                                                        <img src={player.imageUrl || 'https://cdn-icons-png.flaticon.com/512/21/21104.png'} alt="" />
                                                        <span>{player.name}</span>
                                                    </div>
                                                </td>
                                                <td><span className="badge">{player.position}</span></td>
                                                <td><span className={`status-badge ${player.status}`}>{player.status}</span></td>
                                                <td>
                                                    {player.status === 'sold' && player.soldTo ? (
                                                        <span className="sold-info">Sold to {player.soldTo.teamName} for {player.currentPrice}</span>
                                                    ) : (
                                                        <span>{player.currentPrice}</span>
                                                    )}
                                                </td>
                                                <td className="actions-cell">
                                                    {player.status === 'available' && (
                                                        <>
                                                            <button onClick={() => startAuction(player._id)} className="btn-icon p-blue" title="Start Auction">
                                                                <PlayCircle size={18} />
                                                            </button>
                                                            <button onClick={() => deletePlayer(player._id)} className="btn-icon p-red" title="Delete">
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {player.status === 'unsold' && (
                                                        <button onClick={() => startAuction(player._id)} className="btn-icon p-purple" title="Re-auction">
                                                            <PlayCircle size={18} />
                                                        </button>
                                                    )}
                                                    {player.status === 'in-auction' && (
                                                        <div className="auction-actions">
                                                            <input
                                                                type="number"
                                                                placeholder="Price"
                                                                className="price-input"
                                                                value={newPrices[player._id] || ''}
                                                                onChange={(e) => setNewPrices({ ...newPrices, [player._id]: e.target.value })}
                                                            />
                                                            <button onClick={() => setPrice(player._id)} className="btn-small">Set</button>
                                                            <button onClick={() => endAuction(player._id)} className="btn-small danger">Sell</button>
                                                            <button onClick={() => markUnsold(player._id)} className="btn-small secondary">Unsold</button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Teams */}
                    <div className="right-column">
                        <section className="section-card glass">
                            <div className="section-header">
                                <h2><Gavel size={20} /> Teams & Budgets</h2>
                            </div>
                            <div className="teams-grid-admin">
                                {teams.map(team => (
                                    <div key={team._id} className="team-card-mini">
                                        <div className="team-info">
                                            <h4>{team.teamName || team.username}</h4>
                                            <p className="budget"><DollarSign size={14} /> {team.budget}</p>
                                        </div>
                                        <div className="team-actions">
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                value={newBudgets[team._id] || ''}
                                                onChange={(e) => setNewBudgets({ ...newBudgets, [team._id]: e.target.value })}
                                            />
                                            <button onClick={() => updateBudget(team._id)}>Update</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
