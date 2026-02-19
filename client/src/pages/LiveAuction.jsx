import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
        <div className="container">
            <div className="header">
                <h1>🔴 Live Auction Console</h1>
                <div className="user-info">
                    <Link to="/admin" className="btn" style={{ background: 'var(--secondary)', marginRight: '10px', textDecoration: 'none' }}>
                        ⬅ Back to Dashboard
                    </Link>
                    <p>Admin: {user?.username}</p>
                </div>
            </div>

            {alert.message && <div className={`alert ${alert.type}`}>{alert.message}</div>}

            {/* Spotlight Section */}
            <div className="auction-spotlight" id="auctionSpotlight" style={{ display: 'flex', justifyContent: 'center' }}>
                {auctionPlayer ? (
                    <div className="player-card" style={{ width: '100%', maxWidth: '500px' }}>
                        <img
                            src={auctionPlayer.imageUrl || 'https://cdn-icons-png.flaticon.com/512/21/21104.png'}
                            alt={auctionPlayer.name}
                            className="player-img"
                        />
                        <h3>{auctionPlayer.name}</h3>
                        <span className="position">{auctionPlayer.position}</span>
                        <span className={`status ${auctionPlayer.status}`}>{auctionPlayer.status.toUpperCase()}</span>
                        <div className="price">💰 Current Price: {auctionPlayer.currentPrice}</div>

                        {auctionPlayer.currentBidder ? (
                            <div className="current-bidder">
                                Highest Bidder: <strong>{auctionPlayer.currentBidder.teamName || auctionPlayer.currentBidder.username}</strong>
                            </div>
                        ) : (
                            <div className="current-bidder">No Bids Yet</div>
                        )}

                        <div className="bid-controls" style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginBottom: '10px' }}>
                                <input
                                    type="number"
                                    placeholder="Set Price"
                                    style={{ padding: '8px', width: '100px' }}
                                    value={newPrices[auctionPlayer._id] || ''}
                                    onChange={(e) => setNewPrices({ ...newPrices, [auctionPlayer._id]: e.target.value })}
                                />
                                <button
                                    onClick={() => setPrice(auctionPlayer._id)}
                                    style={{ background: '#f39c12' }}
                                >
                                    Set Price
                                </button>
                            </div>
                            <button
                                onClick={endAndNext}
                                style={{ background: 'var(--warning)', width: '100%' }}
                            >
                                ⏭ End & Next Player
                            </button>
                            <button
                                onClick={endAuction}
                                className="btn"
                                style={{ background: '#dc2626', color: 'white', marginTop: '10px' }}
                            >
                                🛑 Sell / End Auction
                            </button>
                            <button
                                onClick={markUnsold}
                                className="btn"
                                style={{ background: 'var(--secondary)', color: 'white', marginTop: '10px' }}
                            >
                                ⌛ Mark Unsold (Auction later)
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', width: '100%', padding: '40px', background: 'var(--bg-card)', borderRadius: '15px' }}>
                        <h3>Waiting for Auction to Start...</h3>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="admin-section" style={{ textAlign: 'center', marginTop: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={startRandomAuction} className="btn" style={{ background: 'var(--primary)', color: 'white', width: 'auto' }}>
                        🎲 Start Random Auction
                    </button>
                    <button onClick={endAndNext} className="btn" style={{ background: '#d97706', color: 'white', width: 'auto' }}>
                        ⏭ End & Next Player
                    </button>
                    <button onClick={markUnsold} className="btn" style={{ background: 'var(--secondary)', color: 'white', width: 'auto' }}>
                        ⌛ Mark Unsold
                    </button>
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
    );
};

export default LiveAuction;
