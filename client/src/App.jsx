import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import BidderDashboard from './pages/BidderDashboard';
import LiveAuction from './pages/LiveAuction';
import Matches from './pages/Matches';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/bidder" element={<BidderDashboard />} />
          <Route path="/auction" element={<LiveAuction />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
