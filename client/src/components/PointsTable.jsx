import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';
import api from '../api';

const PointsTable = ({ refreshTrigger }) => {
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStandings();
    }, [refreshTrigger]);

    const loadStandings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/matches/standings');
            setStandings(response.data);
        } catch (error) {
            console.error('Failed to load standings:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="section-card glass" style={{ marginTop: '20px' }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2><Trophy size={20} color="var(--primary)" /> Points Table</h2>
                <button
                    onClick={loadStandings}
                    className="btn-icon p-blue"
                    title="Refresh"
                    disabled={loading}
                >
                    <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                </button>
            </div>

            <div className="table-responsive">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Pos</th>
                            <th>Team</th>
                            <th style={{ textAlign: 'center' }}>P</th>
                            <th style={{ textAlign: 'center' }}>W</th>
                            <th style={{ textAlign: 'center' }}>D</th>
                            <th style={{ textAlign: 'center' }}>L</th>
                            <th style={{ textAlign: 'center' }}>GF</th>
                            <th style={{ textAlign: 'center' }}>GA</th>
                            <th style={{ textAlign: 'center' }}>GD</th>
                            <th style={{ textAlign: 'center', fontWeight: 'bold' }}>Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.length > 0 ? (
                            standings.map((team, index) => (
                                <tr key={team.teamId} style={{ backgroundColor: index === 0 ? 'rgba(99, 102, 241, 0.05)' : 'transparent' }}>
                                    <td style={{ fontWeight: 'bold', width: '40px' }}>{index + 1}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: index === 0 ? 'bold' : 'normal' }}>
                                            {index === 0 && <span style={{ color: '#fbbf24' }}></span>}
                                            {team.teamName}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{team.played}</td>
                                    <td style={{ textAlign: 'center' }}>{team.won}</td>
                                    <td style={{ textAlign: 'center' }}>{team.drawn}</td>
                                    <td style={{ textAlign: 'center' }}>{team.lost}</td>
                                    <td style={{ textAlign: 'center' }}>{team.goalsFor}</td>
                                    <td style={{ textAlign: 'center' }}>{team.goalsAgainst}</td>
                                    <td style={{ textAlign: 'center' }}>{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.1rem' }}>{team.points}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="10" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                    {loading ? 'Loading standings...' : 'No matches played yet.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spinning {
                    animation: spin 1s linear infinite;
                }
            `}} />
        </section>
    );
};

export default PointsTable;
