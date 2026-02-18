import React, { useState, useEffect } from 'react';
import socket from '../services/socket';
import { Trophy, Users, Wallet, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const AuctionRoom = () => {
    const { currentUser, userData } = useAuth();
    const [player, setPlayer] = useState(null);
    const [timer, setTimer] = useState(0);
    const [highestBid, setHighestBid] = useState(0);
    const [highestBidder, setHighestBidder] = useState('No bids yet');
    const [bidValue, setBidValue] = useState('');
    const [error, setError] = useState('');

    const myBudget = userData?.budget || 0;
    const myTeamName = userData?.teamName || currentUser?.email;


    useEffect(() => {
        socket.on('auction-started', (data) => {
            setPlayer(data);
            setHighestBid(data.highestBid);
            setHighestBidder(data.highestBidder);
        });

        socket.on('auction-tick', (data) => setTimer(data.timer));

        socket.on('bid-updated', (data) => {
            setHighestBid(data.highestBid);
            setHighestBidder(data.highestBidder);
        });

        socket.on('bid-error', (data) => {
            setError(data.message);
            setTimeout(() => setError(''), 3000);
        });

        return () => {
            socket.off('auction-started');
            socket.off('auction-tick');
            socket.off('bid-updated');
            socket.off('bid-error');
        };
    }, []);

    const handleBid = (e) => {
        e.preventDefault();
        const amount = parseInt(bidValue);
        if (isNaN(amount)) return;

        socket.emit('place-bid', {
            bidderId: currentUser.uid,
            bidderName: myTeamName,
            bidAmount: amount,
            availableBudget: myBudget
        });
        setBidValue('');
    };

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Live Auction</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Player Bidding Active</p>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem' }}>
                    <Wallet className="text-primary" />
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Your Budget</p>
                        <p style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>${myBudget}M</p>
                    </div>
                </div>
            </header>

            <div className="auction-grid">
                <main>
                    {player ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card"
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.75rem' }}>{player.name || 'Unknown Player'}</h2>
                                    <span className="btn" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '0.875rem' }}>
                                        {player.position || 'Forward'}
                                    </span>
                                </div>
                                <div className="timer">00:{timer < 10 ? `0${timer}` : timer}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div className="card" style={{ background: '#f8fafc', border: 'none' }}>
                                    <p style={{ color: 'var(--text-muted)' }}>Current Highest Bid</p>
                                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                        ${highestBid}M
                                    </p>
                                    <p style={{ fontWeight: 500 }}>
                                        <Users size={16} style={{ marginRight: '0.5rem' }} />
                                        {highestBidder}
                                    </p>
                                </div>

                                <div>
                                    <h3>Place Your Bid</h3>
                                    <form onSubmit={handleBid} style={{ marginTop: '1rem' }}>
                                        <input
                                            type="number"
                                            value={bidValue}
                                            onChange={(e) => setBidValue(e.target.value)}
                                            placeholder={`Enter > ${highestBid}`}
                                            style={{
                                                width: '100%',
                                                padding: '1rem',
                                                borderRadius: '0.5rem',
                                                border: '2px solid var(--border)',
                                                marginBottom: '1rem',
                                                fontSize: '1.25rem'
                                            }}
                                        />
                                        <button className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                                            Submit Bid
                                        </button>
                                        <AnimatePresence>
                                            {error && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    style={{ color: 'var(--error)', marginTop: '0.5rem', textAlign: 'center' }}
                                                >
                                                    {error}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: '5rem' }}>
                            <Clock size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
                            <h2>Waiting for Admin to start...</h2>
                        </div>
                    )}
                </main>

                <aside>
                    <div className="card">
                        <h3>Recent Bids</h3>
                        {/* Bid log would go here */}
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                <span>Bidder Name</span>
                                <span style={{ fontWeight: 'bold' }}>$Amount</span>
                            </div>
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No recent activity</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default AuctionRoom;
