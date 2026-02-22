import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { DashboardLayout } from '../components/layout';
import { Gavel, Shield, TrendingUp, Users, Wallet } from 'lucide-react';
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

        // Join the specific tournament room
        if (user?.tournamentId) {
            socket.emit('join-tournament', user.tournamentId);
        }

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

    // Calculate active bid amount to freeze funds dynamically
    let activeBidAmount = 0;
    if (auctionPlayer && auctionPlayer.currentBidder) {
        // Handle currentBidder whether it's populated (object with _id) or just a string ID
        const bidderId = typeof auctionPlayer.currentBidder === 'object' ? auctionPlayer.currentBidder._id : auctionPlayer.currentBidder;
        if (bidderId === (user._id || user.id)) {
            activeBidAmount = auctionPlayer.currentPrice;
        }
    }

    const availableBudget = budget - activeBidAmount;

    // Stats
    const totalSpent = myTeam.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
    const maxBid = availableBudget;

    return (
        <DashboardLayout user={user}>
            <div className="max-w-7xl mx-auto space-y-6">
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
                            <p>{availableBudget.toLocaleString()} coins</p>
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
                            <div className="flex flex-col gap-3">
                                {players.filter(p => p.status === 'available').slice(0, 5).map(player => (
                                    <div key={player._id} className="flex items-center p-3 bg-bg-card backdrop-blur-md border border-border rounded-xl shadow-sm hover:border-accent transition-colors">
                                        <img src={player.imageUrl || 'https://cdn-icons-png.flaticon.com/512/21/21104.png'} className="w-10 h-10 rounded-full object-cover border border-border mr-3" alt="" />
                                        <div className="flex flex-col">
                                            <h4 className="font-bold text-text-dark text-sm">{player.name}</h4>
                                            <span className="text-xs font-semibold text-text-muted mt-0.5">{player.position}</span>
                                        </div>
                                    </div>
                                ))}
                                {players.filter(p => p.status === 'available').length === 0 && (
                                    <p className="text-text-muted text-center text-sm py-4">No players available.</p>
                                )}
                            </div>
                        </div>


                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default BidderDashboard;
