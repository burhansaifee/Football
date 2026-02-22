import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout';
import MatchInput from '../components/MatchInput';
import PointsTable from '../components/PointsTable';

const Matches = () => {
    const navigate = useNavigate();
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [refreshStandings, setRefreshStandings] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !user) {
            navigate('/');
            return;
        }
    }, [navigate, user]);

    const logout = () => {
        localStorage.clear();
        navigate('/');
    };

    const isAdmin = user?.role === 'admin';

    return (
        <DashboardLayout user={user}>
            <div className="content-grid" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                    {isAdmin && (
                        <MatchInput onMatchAdded={() => setRefreshStandings(prev => prev + 1)} />
                    )}
                    <PointsTable refreshTrigger={refreshStandings} />
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Matches;
