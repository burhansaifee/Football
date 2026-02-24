import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users, TrendingUp, Award, StopCircle,
    PlayCircle, UserPlus, Search, Trash2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { DashboardLayout } from '../components/layout';
import api from '../api';
import socket from '../socket';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [players, setPlayers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [newPlayer, setNewPlayer] = useState({ name: '', position: '', basePrice: '', imageUrl: '', imageFile: null });
    const [newPrices, setNewPrices] = useState({});
    const [tournamentSport, setTournamentSport] = useState('Football');
    const [isOtherPosition, setIsOtherPosition] = useState(false);

    const { toast } = useToast();

    const loadPlayers = async () => {
        try {
            const response = await api.get('/players');
            setPlayers(response.data);
        } catch (error) {
            console.error('Failed to load players:', error);
        }
    };

    const loadTournamentDetails = async () => {
        try {
            if (user?.tournamentId) {
                const response = await api.get('/tournaments');
                const activeTournament = response.data.find(t => t._id === user.tournamentId);
                if (activeTournament && activeTournament.sport) {
                    setTournamentSport(activeTournament.sport);
                }
            }
        } catch (error) {
            console.error('Failed to load tournament details:', error);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || user?.role !== 'admin') {
            navigate('/');
            return;
        }

        loadPlayers();
        loadTournamentDetails();

        if (user?.tournamentId) {
            socket.emit('join-tournament', user.tournamentId);
        }

        socket.on('bid-update', (data) => {
            loadPlayers();
            toast.success('New bid received', `${data.bidder} bid ${data.amount} coins for ${data.player.name}`);
        });

        socket.on('players-update', () => {
            loadPlayers();
        });

        socket.on('auction-ended', () => {
            loadPlayers();
        });

        return () => {
            socket.off('bid-update');
            socket.off('players-update');
            socket.off('auction-ended');
        };
    }, [navigate, user]);

    const handleAddPlayer = async (e) => {
        e.preventDefault();
        try {
            let payload = newPlayer;
            let config = {};

            if (newPlayer.imageFile) {
                payload = new FormData();
                payload.append('name', newPlayer.name);
                payload.append('position', newPlayer.position);
                payload.append('basePrice', newPlayer.basePrice);
                if (newPlayer.imageUrl) payload.append('imageUrl', newPlayer.imageUrl);
                payload.append('image', newPlayer.imageFile);
                config = { headers: { 'Content-Type': 'multipart/form-data' } };
            }

            await api.post('/players', payload, config);
            toast.success('Player added', 'Player successfully added to the system');
            setNewPlayer({ name: '', position: '', basePrice: '', imageUrl: '', imageFile: null });
            setIsOtherPosition(false);

            // clear file input
            const fileInput = document.getElementById('imageFileInput');
            if (fileInput) fileInput.value = '';

            loadPlayers();
        } catch (error) {
            toast.error('Failed to add player', error.response?.data?.error || 'Unable to add player');
        }
    };

    const startAuction = async (playerId) => {
        try {
            await api.post(`/auction/start/${playerId}`);
            toast.success('Auction started', 'Redirecting to auction room...');
            setTimeout(() => navigate('/auction'), 500);
        } catch (error) {
            toast.error('Failed to start auction', error.response?.data?.error || 'Unable to start auction');
        }
    };

    const startRandomAuction = async () => {
        try {
            const response = await api.post('/auction/start-random');
            toast.success('Auction started', `Auction started for ${response.data.name}! Redirecting...`);
            setTimeout(() => navigate('/auction'), 1000);
        } catch (error) {
            toast.error('Failed to start random auction', error.response?.data?.error || 'Unable to start auction');
        }
    };

    const endAuction = async (playerId) => {
        try {
            await api.post(`/auction/end/${playerId}`);
            toast.success('Auction ended', 'Player successfully sold');
            loadPlayers();
        } catch (error) {
            toast.error('Failed to end auction', error.response?.data?.error || 'Unable to end auction');
        }
    };

    const markUnsold = async (playerId) => {
        try {
            await api.post(`/auction/unsold/${playerId}`);
            toast.warning('Player marked as unsold', 'Player will be available for re-auction');
            loadPlayers();
        } catch (error) {
            toast.error('Failed to mark unsold', 'Unable to update player status');
        }
    };

    const setPrice = async (playerId) => {
        const price = newPrices[playerId];
        if (!price || price <= 0) {
            toast.error('Invalid price', 'Please enter a valid price');
            return;
        }
        try {
            await api.post(`/auction/set-price/${playerId}`, { newPrice: price });
            toast.success('Price updated', 'Price successfully updated');
            loadPlayers();
            setNewPrices({ ...newPrices, [playerId]: '' });
        } catch (error) {
            toast.error('Failed to set price', error.response?.data?.error || 'Unable to update price');
        }
    };

    const deletePlayer = async (playerId) => {
        if (!window.confirm('Are you sure you want to delete this player?')) return;
        try {
            await api.delete(`/players/${playerId}`);
            toast.success('Player deleted', 'Player successfully removed');
            loadPlayers();
        } catch (error) {
            toast.error('Failed to delete player', error.response?.data?.error || 'Unable to delete player');
        }
    };

    // Derived stats
    const totalPlayers = players.length;
    const soldPlayers = players.filter(p => p.status === 'sold').length;
    const unsoldPlayersCount = players.filter(p => p.status === 'unsold').length;

    const filteredPlayers = players.filter(player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.position.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        {
            title: 'Total Players',
            value: totalPlayers,
            icon: <Users className="h-6 w-6" />,
            color: 'bg-blue-100 text-blue-600'
        },
        {
            title: 'Sold',
            value: soldPlayers,
            icon: <Award className="h-6 w-6" />,
            color: 'bg-green-100 text-green-600'
        },
        {
            title: 'Unsold',
            value: unsoldPlayersCount,
            icon: <StopCircle className="h-6 w-6" />,
            color: 'bg-red-100 text-red-600'
        }
    ];

    const getPositionOptions = (sport) => {
        switch (sport) {
            case 'Football': return ["Forward", "Midfielder", "Defender", "Goalkeeper"];
            case 'Cricket': return ["Batsman", "Bowler", "All-rounder", "Wicket-keeper"];
            case 'Basketball': return ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"];
            case 'Kabaddi': return ["Raider", "Defender", "All-rounder"];
            default: return ["Forward", "Midfielder", "Defender", "Goalkeeper"];
        }
    };

    const positionOptions = getPositionOptions(tournamentSport);

    return (
        <DashboardLayout user={user}>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Stats Section */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-text-muted">{stat.title}</p>
                                            <p className="text-3xl font-bold text-text-primary mt-2">{stat.value}</p>
                                        </div>
                                        <div className={`p-3 rounded-lg ${stat.color}`}>
                                            {stat.icon}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Actions Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <h2 className="text-2xl font-bold text-text-primary">Player Management</h2>
                        <Button
                            onClick={startRandomAuction}
                            className="flex items-center gap-2"
                        >
                            <PlayCircle className="h-4 w-4" />
                            Start Random Auction
                        </Button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Add Player Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <UserPlus className="h-5 w-5" />
                                    Add New Player
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddPlayer} className="space-y-4">
                                    <Input
                                        label="Player Name"
                                        type="text"
                                        placeholder="Enter player name"
                                        value={newPlayer.name}
                                        onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                                        required
                                    />

                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-text-primary">
                                            Position
                                        </label>
                                        <select
                                            className="w-full px-3 py-2 border border-border rounded-md bg-bg-card focus:outline-none focus:ring-2 focus:ring-accent"
                                            value={isOtherPosition ? 'Other' : newPlayer.position}
                                            onChange={(e) => {
                                                if (e.target.value === 'Other') {
                                                    setIsOtherPosition(true);
                                                    setNewPlayer({ ...newPlayer, position: '' });
                                                } else {
                                                    setIsOtherPosition(false);
                                                    setNewPlayer({ ...newPlayer, position: e.target.value });
                                                }
                                            }}
                                            required={!isOtherPosition}
                                        >
                                            <option value="">Select Position ({tournamentSport})</option>
                                            {positionOptions.map(pos => (
                                                <option key={pos} value={pos}>{pos}</option>
                                            ))}
                                            <option value="Other">Other</option>
                                        </select>
                                        {isOtherPosition && (
                                            <div className="mt-3">
                                                <Input
                                                    type="text"
                                                    placeholder="Type custom position"
                                                    value={newPlayer.position}
                                                    onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                                                    required={isOtherPosition}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <Input
                                        label="Base Price"
                                        type="number"
                                        placeholder="Enter base price"
                                        min="1"
                                        value={newPlayer.basePrice}
                                        onChange={(e) => setNewPlayer({ ...newPlayer, basePrice: e.target.value })}
                                        required
                                    />

                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-text-primary">
                                            Upload Image (Optional)
                                        </label>
                                        <input
                                            id="imageFileInput"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files.length > 0) {
                                                    setNewPlayer({ ...newPlayer, imageFile: e.target.files[0], imageUrl: '' });
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-border rounded-md bg-bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                                        />
                                    </div>

                                    <div className="text-center text-sm text-text-muted my-2">OR</div>

                                    <Input
                                        label="Image URL (Optional)"
                                        type="url"
                                        placeholder="Enter direct image URL (.png / .jpg)"
                                        value={newPlayer.imageUrl}
                                        onChange={(e) => {
                                            setNewPlayer({ ...newPlayer, imageUrl: e.target.value });
                                            if (e.target.value) {
                                                const fileInput = document.getElementById('imageFileInput');
                                                if (fileInput) fileInput.value = '';
                                                setNewPlayer(prev => ({ ...prev, imageFile: null }));
                                            }
                                        }}
                                    />

                                    <Button type="submit" className="w-full">
                                        Add Player
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Players List */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Players List
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted h-4 w-4" />
                                        <input
                                            type="text"
                                            placeholder="Search players..."
                                            className="pl-10 pr-4 py-2 border border-border rounded-md bg-bg-card focus:outline-none focus:ring-2 focus:ring-accent"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-bg-muted border-b border-border">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Player</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Status</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredPlayers.map((player) => (
                                                <motion.tr
                                                    key={player._id}
                                                    className="hover:bg-bg-muted transition-colors"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={player.imageUrl || 'https://cdn-icons-png.flaticon.com/512/21/21104.png'}
                                                                alt={player.name}
                                                                className="w-10 h-10 rounded-full object-cover border-2 border-border"
                                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://cdn-icons-png.flaticon.com/512/21/21104.png'; }}
                                                            />
                                                            <div>
                                                                <p className="font-medium text-text-primary">{player.name}</p>
                                                                <p className="text-sm text-text-muted">{player.position}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${player.status === 'available' ? 'bg-green-100 text-green-800' :
                                                            player.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                                                                player.status === 'unsold' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-purple-100 text-purple-800'
                                                            }`}>
                                                            {player.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            {player.status === 'available' && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => startAuction(player._id)}
                                                                        className="flex items-center gap-1"
                                                                    >
                                                                        <PlayCircle className="h-4 w-4" />
                                                                        Start
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => deletePlayer(player._id)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            )}

                                                            {player.status === 'unsold' && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => startAuction(player._id)}
                                                                    className="flex items-center gap-1"
                                                                >
                                                                    <PlayCircle className="h-4 w-4" />
                                                                    Re-auction
                                                                </Button>
                                                            )}

                                                            {player.status === 'in-auction' && (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="number"
                                                                        placeholder="Price"
                                                                        className="w-24 px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                                                                        value={newPrices[player._id] || ''}
                                                                        onChange={(e) => setNewPrices({ ...newPrices, [player._id]: e.target.value })}
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => setPrice(player._id)}
                                                                    >
                                                                        Set
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => endAuction(player._id)}
                                                                    >
                                                                        Sell
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => markUnsold(player._id)}
                                                                    >
                                                                        Unsold
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;