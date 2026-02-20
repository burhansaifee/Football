import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import {
    LayoutDashboard,
    LogOut,
    Wallet,
    Users,
    TrendingUp,
    Gavel,
    Trophy,
    Shield,
    User,
    Menu,
    X,
    Swords
} from 'lucide-react';
import api from '../api';
import socket from '../socket';


// Socket instance is now imported from ../socket.js

const BidderDashboard = () => {
    const navigate = useNavigate();
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [budget, setBudget] = useState(0);
    const [myTeam, setMyTeam] = useState([]);
    const [players, setPlayers] = useState([]);
    const [alert, setAlert] = useState({ message: '', type: '' });
    const [bidAmount, setBidAmount] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const showAlert = (message, type) => {
        setAlert({ message, type });
        setTimeout(() => setAlert({ message: '', type: '' }), 5000);
    };

    const loadUserData = async () => {
        try {
            const response = await api.get('/auction/user');
            setBudget(response.data.budget);
            setMyTeam(response.data.players || []);
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    };

    const loadPlayers = async () => {
        try {
            const response = await api.get('/players');
            setPlayers(response.data);
        } catch (error) {
            console.error('Failed to load players:', error);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token || user?.role !== 'bidder') {
            navigate('/');
            return;
        }

        loadUserData();
        loadPlayers();

        socket.on('bid-update', (data) => {
            loadPlayers();
            loadUserData();
            showAlert(`New bid: ${data.bidder} bid ${data.amount} for ${data.player.name}`, 'success');
        });

        socket.on('bid-error', (data) => {
            showAlert(data.message, 'error');
        });

        socket.on('auction-ended', () => {
            loadPlayers();
            loadUserData();
        });

        socket.on('players-update', () => {
            loadPlayers();
        });

        socket.on('budget-update', () => {
            loadUserData();
        });

        return () => {
            socket.off('bid-update');
            socket.off('bid-error');
            socket.off('auction-ended');
            socket.off('players-update');
            socket.off('budget-update');
        };
    }, [navigate, user]);

    const placeBid = (playerId, currentPrice) => {
        const amount = parseInt(bidAmount);
        if (!amount || amount <= currentPrice) {
            showAlert('Bid must be higher than current price', 'error');
            return;
        }
        if (amount > budget) {
            showAlert('Insufficient budget!', 'error');
            return;
        }

        socket.emit('place-bid', {
            playerId,
            userId: user._id || user.id,
            amount
        });
        setBidAmount('');
    };

    const logout = () => {
        localStorage.clear();
        navigate('/');
    };

    const auctionPlayer = players.find(p => p.status === 'in-auction');

    // Stats
    const totalSpent = myTeam.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
    const maxBid = budget;

    return (
        <div className="dashboard-layout">
            {/* Mobile Sidebar Overlay */}
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar glass ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Trophy className="logo-icon" size={32} color="#6366f1" />
                    <h2>TeamZone</h2>
                    <button
                        className="mobile-menu-btn hidden-desktop"
                        onClick={() => setIsSidebarOpen(false)}
                        style={{ marginLeft: 'auto' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-menu">
                    <div className="menu-item active">
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </div>
                    <div className="menu-item" onClick={() => navigate('/matches')}>
                        <Swords size={20} />
                        <span>Matches & Standings</span>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="menu-item" onClick={logout} style={{ marginTop: 'auto', color: '#ef4444' }}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Header */}
                <header className="top-header">
                    <button
                        className="mobile-menu-btn hidden-desktop"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <div className="welcome-text">
                        <h1>Team Dashboard</h1>
                        <p>Manage your squad and bid efficiently</p>
                    </div>
                    <div className="user-info">
                        <div className="badge" style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 16px' }}>
                            <Shield size={16} color="var(--primary)" />
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                {user?.teamName || user?.username}
                            </span>
                        </div>
                        <img
                            src={`https://ui-avatars.com/api/?name=${user?.username}&background=6366f1&color=fff`}
                            alt="Profile"
                            style={{ width: '40px', height: '40px', borderRadius: '12px' }}
                        />
                    </div>
                </header>

                {alert.message && (
                    <div className={`alert-float ${alert.type}`}>
                        {alert.type === 'success' ? <TrendingUp size={18} /> : <Shield size={18} />}
                        {alert.message}
                    </div>
                )}

                {/* KPI Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon p-green">
                            <Wallet size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>Remaining Budget</h3>
                            <p>{budget.toLocaleString()} coins</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon p-blue">
                            <Users size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>Squad Size</h3>
                            <p>{myTeam.length} Players</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon p-purple">
                            <TrendingUp size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>Total Spent</h3>
                            <p>{totalSpent.toLocaleString()} coins</p>
                        </div>
                    </div>
                </div>

                <div className="content-grid">
                    {/* Left Column: Live Auction & Squad */}
                    <div className="left-column">

                        {/* Live Auction Spotlight */}
                        <div className="section-card">
                            <div className="section-header">
                                <h2><Gavel size={20} color="var(--highlight)" /> Live Auction</h2>
                                {auctionPlayer && <span className="status-badge in-auction">Live Now</span>}
                            </div>

                            {auctionPlayer ? (
                                <div className="spotlight-content" style={{ display: 'flex', gap: '30px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <img
                                        src={auctionPlayer.imageUrl || 'https://cdn-icons-png.flaticon.com/512/21/21104.png'}
                                        alt={auctionPlayer.name}
                                        style={{ width: '120px', height: '120px', borderRadius: '16px', objectFit: 'cover', border: '3px solid var(--highlight)' }}
                                    />

                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginBottom: '5px' }}>{auctionPlayer.name}</h2>
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                            <span className="badge">{auctionPlayer.position}</span>
                                            <span className="badge">Rating: 85</span>
                                        </div>

                                        <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '16px', marginBottom: '15px', border: '1px solid var(--border-color)' }}>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Current Price</div>
                                            <div style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--primary)' }}>
                                                {auctionPlayer.currentPrice.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: '500' }}>coins</span>
                                            </div>
                                            {auctionPlayer.currentBidder && (
                                                <div style={{ fontSize: '0.9rem', marginTop: '5px', color: 'var(--primary)' }}>
                                                    Highest Bidder: {auctionPlayer.currentBidder.teamName || auctionPlayer.currentBidder.username}
                                                </div>
                                            )}
                                        </div>

                                        <div className="bid-controls" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            <input
                                                type="number"
                                                placeholder="Enter Amount"
                                                value={bidAmount}
                                                onChange={(e) => setBidAmount(e.target.value)}
                                                style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-dark)', minWidth: '120px' }}
                                            />
                                            <button
                                                className="btn-submit"
                                                onClick={() => placeBid(auctionPlayer._id, auctionPlayer.currentPrice)}
                                                style={{ width: 'auto', padding: '0 30px', flex: 1, whiteSpace: 'nowrap' }}
                                            >
                                                Place Bid
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    <Gavel size={48} style={{ opacity: 0.3, marginBottom: '15px' }} />
                                    <h3>No Auction in Progress</h3>
                                    <p>Waiting for the admin to start the next round...</p>
                                </div>
                            )}
                        </div>

                        {/* My Squad Grid */}
                        <div className="section-card">
                            <div className="section-header">
                                <h2><Users size={20} color="var(--primary)" /> My Squad ({myTeam.length})</h2>
                            </div>

                            {myTeam.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                                    {myTeam.map(player => (
                                        <div key={player._id} style={{ background: 'var(--bg-main)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                            <img
                                                src={player.imageUrl || 'https://cdn-icons-png.flaticon.com/512/21/21104.png'}
                                                alt={player.name}
                                                style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px', display: 'block', margin: '0 auto 10px' }}
                                            />
                                            <h4 style={{ color: 'var(--text-dark)', marginBottom: '5px', fontWeight: '700', fontSize: '0.95rem' }}>{player.name}</h4>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{player.position}</div>
                                            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.85rem', color: 'var(--highlight)', fontWeight: '600' }}>
                                                {player.soldPrice?.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>You haven't bought any players yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Market Watch / Upcoming */}
                    <div className="right-column">
                        <div className="section-card">
                            <div className="section-header">
                                <h2><Shield size={20} color="var(--accent)" /> Upcoming Players</h2>
                            </div>
                            <div className="teams-grid-admin">
                                {players.filter(p => p.status === 'available').slice(0, 5).map(player => (
                                    <div key={player._id} className="team-card-mini">
                                        <div className="team-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <img src={player.imageUrl || 'https://cdn-icons-png.flaticon.com/512/21/21104.png'} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
                                            <div>
                                                <h4>{player.name}</h4>
                                                <div className="budget" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{player.position}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {players.filter(p => p.status === 'available').length === 0 && (
                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No players available.</p>
                                )}
                            </div>
                        </div>


                    </div>
                </div>
            </main>
        </div>
    );
};

export default BidderDashboard;
