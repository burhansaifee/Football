import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, Trophy, Users, Calendar, Settings, Eye, Swords } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui';
import { cn } from '../../lib/utils';

const DashboardLayout = ({ children, user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const adminMenuItems = [
    { path: '/admin/tournaments', label: 'Tournaments', icon: <Calendar className="h-5 w-5" /> },
    { path: '/admin', label: 'Dashboard', icon: <Trophy className="h-5 w-5" /> },
    { path: '/admin/teams', label: 'Manage Teams', icon: <Users className="h-5 w-5" /> },
    { path: '/auction', label: 'Watch Auction', icon: <Eye className="h-5 w-5" /> },
    { path: '/matches', label: 'Matches & Standings', icon: <Swords className="h-5 w-5" /> },
    { path: '/admin/billing', label: 'Billing', icon: <Settings className="h-5 w-5" /> },
  ];

  const bidderMenuItems = [
    { path: '/bidder', label: 'Dashboard', icon: <Trophy className="h-5 w-5" /> },
    { path: '/auction', label: 'Watch Auction', icon: <Eye className="h-5 w-5" /> },
    { path: '/matches', label: 'Matches & Standings', icon: <Swords className="h-5 w-5" /> },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : bidderMenuItems;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className="fixed inset-y-0 left-0 z-50 w-64 bg-bg-sidebar border-r border-border md:static md:translate-x-0 md:!transform-none md:z-auto"
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : '-100%'
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-8 border-b border-border">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Auction Pro</h1>
              <p className="text-xs text-text-muted">Admin Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.li key={item.path} whileHover={{ x: 4 }}>
                    <Button
                      variant={isActive ? 'primary' : 'ghost'}
                      className={cn(
                        "w-full justify-start gap-3 px-4 py-3 text-left",
                        isActive && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                    >
                      {item.icon}
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  </motion.li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-muted">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {user?.role === 'admin' ? (user?.username || 'Admin User') : (user?.teamName || user?.username || 'Team User')}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {user?.role === 'admin' ? 'Administrator' : 'Team / Bidder'}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-0">
        {/* Top Bar */}
        <header className="bg-bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold text-text-primary">
                {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-sm text-text-muted">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Mobile Close Button */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.button
            className="fixed top-4 right-4 z-50 p-2 rounded-full bg-bg-card shadow-lg md:hidden"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6 text-text-primary" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;