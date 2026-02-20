import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    Eye,
    LayoutDashboard,
    LogOut,
    Shield,
    Trophy,
    Menu,
    X,
    Swords
} from 'lucide-react';
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
        <div className="dashboard-layout">
            {/* Mobile Sidebar Overlay */}
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar glass ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    {isAdmin ? (
                        <>
                            <Shield className="logo-icon" size={32} color="var(--primary)" />
                            <h2>Admin Panel</h2>
                        </>
                    ) : (
                        <>
                            <Trophy className="logo-icon" size={32} color="#6366f1" />
                            <h2>TeamZone</h2>
                        </>
                    )}
                    <button
                        className="mobile-menu-btn hidden-desktop"
                        onClick={() => setIsSidebarOpen(false)}
                        style={{ marginLeft: 'auto' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-menu">
                    <div className="menu-item" onClick={() => navigate(isAdmin ? '/admin' : '/bidder')}>
                        {isAdmin ? <TrendingUp size={20} /> : <LayoutDashboard size={20} />}
                        <span>Dashboard</span>
                    </div>
                    {isAdmin && (
                        <div className="menu-item" onClick={() => navigate('/auction')}>
                            <Eye size={20} />
                            <span>Watch Auction</span>
                        </div>
                    )}
                    <div className="menu-item active">
                        <Swords size={20} />
                        <span>Matches & Standings</span>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    {isAdmin ? (
                        <button className="logout-btn" onClick={logout}>
                            <LogOut size={18} />
                            <span>Logout</span>
                        </button>
                    ) : (
                        <div className="menu-item" onClick={logout} style={{ marginTop: 'auto', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 20px', cursor: 'pointer', borderRadius: '12px', transition: 'all 0.3s ease' }}>
                            <LogOut size={20} />
                            <span>Logout</span>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-header glass">
                    <button
                        className="mobile-menu-btn hidden-desktop"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <div className="welcome-text">
                        <h1>Matches & Standings</h1>
                        <p>Track tournament progress and match results</p>
                    </div>
                </header>

                <div className="content-grid" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                        {isAdmin && (
                            <MatchInput onMatchAdded={() => setRefreshStandings(prev => prev + 1)} />
                        )}
                        <PointsTable refreshTrigger={refreshStandings} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Matches;
