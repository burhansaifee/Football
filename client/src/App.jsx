import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastProvider } from './components/ui';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import BidderDashboard from './pages/BidderDashboard';
import LiveAuction from './pages/LiveAuction';
import Matches from './pages/Matches';
import AdminTournaments from './pages/AdminTournaments';
import AdminBilling from './pages/AdminBilling';
import AdminTeams from './pages/AdminTeams';
import HalideLanding from './components/ui/demo';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  in: {
    opacity: 1,
    y: 0
  },
  out: {
    opacity: 0,
    y: -20
  }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.3
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="in"
        exit="out"
        transition={pageTransition}
        className="w-full"
      >
        <Routes location={location}>
          <Route path="/landing" element={<HalideLanding />} />
          <Route path="/" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/teams" element={<AdminTeams />} />
          <Route path="/admin/tournaments" element={<AdminTournaments />} />
          <Route path="/admin/billing" element={<AdminBilling />} />
          <Route path="/bidder" element={<BidderDashboard />} />
          <Route path="/auction" element={<LiveAuction />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

import { AppBackground } from './components/ui/AppBackground';

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="App min-h-screen relative">
          <AppBackground />
          <AnimatedRoutes />
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
