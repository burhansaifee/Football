import React, { useState } from 'react';
import { Plus, Trash, Play, ShieldCheck } from 'lucide-react';
import { startAuction } from '../services/socket';

const AdminDashboard = () => {
    const [players, setPlayers] = useState([
        { id: 1, name: 'Vinicius Jr', position: 'Forward', basePrice: 150 },
        { id: 2, name: 'Kevin De Bruyne', position: 'Midfielder', basePrice: 120 },
        { id: 3, name: 'Virgil van Dijk', position: 'Defender', basePrice: 100 }
    ]);
    const [newPlayer, setNewPlayer] = useState({ name: '', position: 'Forward', basePrice: '' });

    const addPlayer = (e) => {
        e.preventDefault();
        if (!newPlayer.name || !newPlayer.basePrice) return;
        setPlayers([...players, { ...newPlayer, id: Date.now() }]);
        setNewPlayer({ name: '', position: 'Forward', basePrice: '' });
    };

    const removePlayer = (id) => {
        setPlayers(players.filter(p => p.id !== id));
    };

    const startBid = (p) => {
        startAuction(p.id, parseInt(p.basePrice));
        alert(`Auction started for ${p.name}!`);
    };

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldCheck className="text-primary" /> Admin Panel
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage Players & Control Auction</p>
                </div>
            </header>

            <div className="auction-grid">
                <section className="card">
                    <h2 style={{ marginBottom: '1.5rem' }}>Add New Player</h2>
                    <form onSubmit={addPlayer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Player Name</label>
                            <input
                                type="text"
                                value={newPlayer.name}
                                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                                placeholder="e.g. Kylian Mbappé"
                                className="input"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Position</label>
                            <select
                                value={newPlayer.position}
                                onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                            >
                                <option>Forward</option>
                                <option>Midfielder</option>
                                <option>Defender</option>
                                <option>Goalkeeper</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Base Price ($M)</label>
                            <input
                                type="number"
                                value={newPlayer.basePrice}
                                onChange={(e) => setNewPlayer({ ...newPlayer, basePrice: e.target.value })}
                                placeholder="100"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                            />
                        </div>
                        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Plus size={18} /> Add Player
                        </button>
                    </form>
                </section>

                <section>
                    <div className="card">
                        <h2 style={{ marginBottom: '1.5rem' }}>Player Pool</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {players.map(p => (
                                <div key={p.id} className="card" style={{ background: '#f8fafc', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                                    <div>
                                        <h4 style={{ fontSize: '1.125rem' }}>{p.name}</h4>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{p.position} • Base: ${p.basePrice}M</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => startBid(p)} className="btn" style={{ background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Play size={16} fill="currentColor" /> Start
                                        </button>
                                        <button onClick={() => removePlayer(p.id)} className="btn" style={{ background: 'white', border: '1px solid var(--error)', color: 'var(--error)' }}>
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AdminDashboard;
