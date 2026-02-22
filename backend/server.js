require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/db');

// Initialize app
const app = express();
// Trust proxy (Required for Render/Heroku/etc where app is behind a load balancer)
app.set('trust proxy', 1);
const server = http.createServer(app);

// Connect to database
connectDB();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://ui-avatars.com", "https://cdn-icons-png.flaticon.com", "https://images.unsplash.com"],
            connectSrc: ["'self'", "ws:", "wss:", "http://localhost:5001", "http://127.0.0.1:5001", "https://football-9cfe.onrender.com", "wss://football-9cfe.onrender.com"]
        }
    }
}));

// CORS Configuration
const allowedOrigins = process.env.CLIENT_URL ? [process.env.CLIENT_URL] : ["http://localhost:5173", "http://127.0.0.1:5173", "https://football-9cfe.onrender.com"];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true
}));

// Body Parser (Must be before sanitizers)
// Use JSON parser for all non-webhook routes
app.use((req, res, next) => {
    if (req.originalUrl === '/api/payments/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});

// Sanitization & Compression
app.use(xss());
app.use(mongoSanitize());
app.use(compression());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/players', require('./routes/players'));
app.use('/api/auction', require('./routes/auction'));
app.use('/api/users', require('./routes/users'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/payments', require('./routes/payments'));

// Serve static assets in production
// Serve static assets in production
const distPath = path.join(__dirname, '../client/dist');
const fs = require('fs');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
        // Exclude API routes from wildcard catch-all
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: 'API route not found' });
        }
        res.sendFile(path.resolve(distPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('API is running successfully. (Frontend not served from backend)');
    });
}

// Socket.io for real-time bidding
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins for socket to avoid connection issues in prod/dev mix
        methods: ["GET", "POST"],
        credentials: true
    }
});
app.set('io', io);

const Player = require('./models/Player');
const User = require('./models/User');
const Bid = require('./models/Bid');

io.on('connection', (socket) => {
    socket.on('join-tournament', (tournamentId) => {
        if (tournamentId) {
            socket.join(`tournament_${tournamentId}`);
            console.log(`Socket ${socket.id} joined tournament_${tournamentId}`);
        }
    });

    // Place bid
    socket.on('place-bid', async (data) => {
        try {
            const { playerId, userId, amount } = data;

            const player = await Player.findById(playerId);
            const user = await User.findById(userId);

            // Validate bid
            if (!player || player.status !== 'in-auction') {
                socket.emit('bid-error', { message: 'Player not in auction' });
                return;
            }

            if (amount <= player.currentPrice) {
                socket.emit('bid-error', { message: 'Bid must be higher than current price' });
                return;
            }

            if (amount > user.budget) {
                socket.emit('bid-error', { message: 'Insufficient budget' });
                return;
            }

            // Update player
            player.currentPrice = amount;
            player.currentBidder = userId;
            await player.save();

            // Save bid history
            const bid = new Bid({
                player: playerId,
                bidder: userId,
                amount,
                tournamentId: user.tournamentId
            });
            await bid.save();
            await bid.save();

            // Broadcast to all clients
            const updatedPlayer = await Player.findById(playerId)
                .populate('currentBidder', 'username teamName');

            io.to(`tournament_${user.tournamentId}`).emit('bid-update', {
                player: updatedPlayer,
                bidder: user.teamName || user.username,
                amount
            });

        } catch (error) {
            socket.emit('bid-error', { message: error.message });
        }
    });

    socket.on('disconnect', () => {
    });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
