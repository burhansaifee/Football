import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout';
import io from 'socket.io-client';
import api from '../api';
import socket from '../socket';

// Socket instance is now imported from ../socket.js

const LiveAuction = () => {
    const navigate = useNavigate();
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [players, setPlayers] = useState([]);
    const [alert, setAlert] = useState({ message: '', type: '' });
    const [newPrices, setNewPrices] = useState({});

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

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || user?.role !== 'admin') {
            navigate('/');
            return;
        }

        // Join the specific tournament room
        socket.emit('join-tournament', user.tournamentId);

        // eslint-disable-next-line
        loadPlayers();

        socket.on('bid-update', () => {
            loadPlayers();
        });

        socket.on('auction-ended', () => {
            loadPlayers();
            showAlert('Auction Ended', 'success');
        });

        socket.on('players-update', () => {
            loadPlayers();
        });

        return () => {
            socket.off('bid-update');
            socket.off('auction-ended');
            socket.off('players-update');
        };
    }, [navigate, user]);

    const startRandomAuction = async () => {
        try {
            const response = await api.post('/auction/start-random');
            showAlert(`Auction started for ${response.data.name}!`, 'success');
            loadPlayers();
        } catch (error) {
            showAlert(error.response?.data?.error || 'Failed to start auction', 'error');
        }
    };

    const markUnsold = async () => {
        try {
            const activePlayer = players.find(p => p.status === 'in-auction');
            if (!activePlayer) return;

            await api.post(`/auction/unsold/${activePlayer._id}`);
            showAlert('Player marked as Unsold!', 'warning');
            loadPlayers();
        } catch (error) {
            showAlert('Failed to mark as unsold', 'error');
        }
    };

    const endAuction = async () => {
        try {
            const activePlayer = players.find(p => p.status === 'in-auction');
            if (!activePlayer) return;

            await api.post(`/auction/end/${activePlayer._id}`);
            showAlert('Auction Ended!', 'success');
            loadPlayers();
        } catch (error) {
            showAlert(error.response?.data?.error || 'Failed to end auction', 'error');
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
            setTimeout(() => startRandomAuction(), 500);
        } catch (error) {
            console.error('Error in flow:', error);
        }
    };

    const setPrice = async (playerId) => {
        const price = newPrices[playerId];
        if (!price || price <= 0) return;

        try {
            await api.post(`/auction/set-price/${playerId}`, { newPrice: price });
            showAlert('Price updated!', 'success');
            loadPlayers();
            setNewPrices({ ...newPrices, [playerId]: '' });
        } catch {
            showAlert('Failed to set price', 'error');
        }
    };

    const auctionPlayer = players.find(p => p.status === 'in-auction');
    const otherPlayers = players.filter(p => p._id !== auctionPlayer?._id)
        .sort((a, b) => {
            if (a.status === 'available' && b.status !== 'available') return -1;
            if (a.status !== 'available' && b.status === 'available') return 1;
            return 0;
        });

    return (
        <DashboardLayout user={user}>
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="top-header glass" style={{ marginBottom: '20px' }}>
                    <div className="welcome-text">
                        <h1>🔴 Live Auction Console</h1>
                        <p>Control the player auction process.</p>
                    </div>
                </header>

                {alert.message && (
                    <div className={`alert-float ${alert.type}`}>
                        {alert.message}
                    </div>
                )}

                {/* Spotlight Section */}
                <div className="auction-spotlight" id="auctionSpotlight" style={{ display: 'flex', justifyContent: 'center' }}>
                    {auctionPlayer ? (
                        <div className="player-card" style={{ width: '100%', maxWidth: '500px' }}>
                            <img
                                src={auctionPlayer.imageUrl || 'https://cdn-icons-png.flaticon.com/512/21/21104.png'}
                                alt={auctionPlayer.name}
                                className="player-img"
                                style={{ width: '180px', height: '180px', objectFit: 'cover', borderRadius: '50%', border: '4px solid var(--primary)', marginBottom: '15px' }}
                            />
                            <h3 style={{ fontSize: '2rem', marginBottom: '5px' }}>{auctionPlayer.name}</h3>
                            <span className="position">{auctionPlayer.position}</span>
                            <span className={`status ${auctionPlayer.status}`}>{auctionPlayer.status.toUpperCase()}</span>
                            <div className="price" style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--highlight)', margin: '20px 0', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                                💰 Current Price: {auctionPlayer.currentPrice}
                            </div>

                            {auctionPlayer.currentBidder ? (
                                <div className="current-bidder">
                                    Highest Bidder: <strong>{auctionPlayer.currentBidder.teamName || auctionPlayer.currentBidder.username}</strong>
                                </div>
                            ) : (
                                <div className="current-bidder">No Bids Yet</div>
                            )}

                            {/* End of player-card. Controls moved to bottom bar */}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', width: '100%', padding: '40px', background: 'var(--bg-card)', borderRadius: '15px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
                            <h3>Waiting for Auction to Start...</h3>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="admin-section" style={{ textAlign: 'center', marginTop: '20px' }}>
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
                        {!auctionPlayer ? (
                            <button onClick={startRandomAuction} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '12px 24px' }}>
                                🎲 Start Random Auction
                            </button>
                        ) : (
                            <>
                                <button onClick={startRandomAuction} className="btn" style={{ background: 'var(--primary)', color: 'white', width: 'auto', flex: '1 1 auto', maxWidth: '200px' }}>
                                    🎲 Random
                                </button>
                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center', width: 'auto', flex: '1 1 auto', maxWidth: '250px' }}>
                                    <input
                                        type="number"
                                        placeholder="Set Price"
                                        style={{ padding: '10px', width: '100%', background: 'var(--bg-card)', color: 'var(--text-dark)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                        value={newPrices[auctionPlayer._id] || ''}
                                        onChange={(e) => setNewPrices({ ...newPrices, [auctionPlayer._id]: e.target.value })}
                                    />
                                    <button onClick={() => setPrice(auctionPlayer._id)} className="btn" style={{ background: '#f39c12', color: 'white', width: 'auto', padding: '10px 15px' }}>
                                        Set Price
                                    </button>
                                </div>
                                <button onClick={endAuction} className="btn" style={{ background: '#dc2626', color: 'white', width: 'auto', flex: '1 1 auto', maxWidth: '150px' }}>
                                    🛑 Sell
                                </button>
                                <button onClick={endAndNext} className="btn" style={{ background: '#d97706', color: 'white', width: 'auto', flex: '1 1 auto', maxWidth: '180px' }}>
                                    ⏭ Sell & Next
                                </button>
                                <button onClick={markUnsold} className="btn" style={{ background: 'var(--secondary)', color: 'white', width: 'auto', flex: '1 1 auto', maxWidth: '180px' }}>
                                    ⌛ Mark Unsold
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* All Players List */}
                <h2 style={{ marginTop: '40px', borderBottom: '2px solid var(--primary)', paddingBottom: '10px' }}>📋 All Players</h2>
                <div className="players-grid">
                    {otherPlayers.map(player => (
                        <div key={player._id} className="player-card" style={{ opacity: player.status === 'sold' ? '0.7' : '1' }}>
                            <img
                                src={player.imageUrl || 'https://cdn-icons-png.flaticon.com/512/21/21104.png'}
                                alt={player.name}
                                className="player-img"
                                style={{ width: '80px', height: '80px' }}
                            />
                            <h3>{player.name}</h3>
                            <span className="position">{player.position}</span>
                            <span className={`status ${player.status}`}>{player.status.toUpperCase()}</span>
                            <div className="price">💰 {player.currentPrice}</div>
                            {player.soldTo && <div>Sold To: {player.soldTo.teamName || player.soldTo.username}</div>}
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LiveAuction;
