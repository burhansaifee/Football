# ⚽ Football Player Auction Web App

A real-time football player auction application built with Node.js, Express, MongoDB, and Socket.io.

## 🎯 Features

### Admin Features
- ✅ Login as Admin
- ✅ Add new players (name, position, base price)
- ✅ Start/End auctions one player at a time
- ✅ See which team won each player
- ✅ Real-time auction updates

### Team Owner Features
- ✅ Login as Team Owner
- ✅ Fixed budget (100 coins)
- ✅ View all available players
- ✅ Place bids in real-time
- ✅ Cannot bid more than remaining budget
- ✅ See remaining budget after purchases
- ✅ View owned players

### Auction Rules
- ✅ Show current highest bid
- ✅ Real-time bid updates using Socket.io
- ✅ Player sold to highest bidder when admin ends auction
- ✅ Automatic budget deduction for winners

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Start MongoDB** (if using local MongoDB):
```bash
mongod
```

3. **Start the server:**
```bash
npm run dev
```

4. **Open your browser:**
```
http://localhost:5000/login.html
```

## 📁 Project Structure

```
football-auction/
├── backend/
│   ├── models/          # Database schemas
│   │   ├── User.js      # User schema (Admin/Bidder)
│   │   ├── Player.js    # Player schema
│   │   └── Bid.js       # Bid history schema
│   ├── routes/          # API routes
│   │   ├── auth.js      # Authentication routes
│   │   ├── players.js   # Player CRUD operations
│   │   └── auction.js   # Auction management
│   ├── middleware/
│   │   └── auth.js      # JWT authentication
│   ├── config/
│   │   └── db.js        # MongoDB connection
│   └── server.js        # Main server file
├── frontend/
│   ├── css/
│   │   └── style.css    # All styles
│   ├── js/
│   │   ├── login.js     # Login/Register logic
│   │   ├── admin.js     # Admin dashboard
│   │   └── bidder.js    # Team owner dashboard
│   ├── login.html       # Login page
│   ├── admin.html       # Admin dashboard
│   └── bidder.html      # Bidder dashboard
└── package.json
```

## 🔧 Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Real-time:** Socket.io
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs

## 📖 How to Use

### 1. Register Users

**Register an Admin:**
1. Open http://localhost:5000/login.html
2. Use the Register form
3. Select "Admin" as role
4. Create username and password

**Register Team Owners:**
1. Use the Register form
2. Select "Team Owner" as role
3. Provide team name
4. Create username and password

### 2. Admin Workflow

1. Login as Admin
2. Add players with:
   - Player name
   - Position (Forward/Midfielder/Defender/Goalkeeper)
   - Base price
3. Click "Start Auction" on a player
4. Wait for bids to come in
5. Click "End Auction" when ready
6. Player is sold to highest bidder

### 3. Team Owner Workflow

1. Login as Team Owner
2. View your budget (starts at 100 coins)
3. Wait for admin to start an auction
4. Enter your bid amount
5. Click "Place Bid"
6. See real-time updates when others bid
7. If you win, amount is deducted from your budget
8. View your team in "My Team" section

## 🎮 Try It Out

### Sample Users to Create

**Admin Account:**
- Username: `admin`
- Password: `admin123`
- Role: Admin

**Team Owner Accounts:**
- Username: `team1`, Password: `pass123`, Role: Team Owner, Team: Manchester FC
- Username: `team2`, Password: `pass123`, Role: Team Owner, Team: Liverpool FC
- Username: `team3`, Password: `pass123`, Role: Team Owner, Team: Chelsea FC

### Sample Players to Add

1. **Cristiano Ronaldo** - Forward - Base: 50 coins
2. **Lionel Messi** - Forward - Base: 50 coins
3. **Luka Modric** - Midfielder - Base: 30 coins
4. **Virgil van Dijk** - Defender - Base: 35 coins
5. **Alisson Becker** - Goalkeeper - Base: 25 coins

## 🔐 Environment Variables (Optional)

Create a `.env` file for custom configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/football-auction
JWT_SECRET=your-secret-key-here
```

## 🐛 Troubleshooting

**Issue:** Cannot connect to MongoDB
- **Solution:** Make sure MongoDB is running (`mongod` command)
- Or use MongoDB Atlas (cloud database)

**Issue:** Port 5000 already in use
- **Solution:** Change PORT in `.env` file or stop other process

**Issue:** Socket.io not updating in real-time
- **Solution:** Check browser console for errors
- Make sure all users are on the same server URL

## 🎓 Learning Resources

This project teaches:
- ✅ Full-stack JavaScript development
- ✅ RESTful API design
- ✅ MongoDB/Mongoose data modeling
- ✅ JWT authentication
- ✅ Real-time communication with Socket.io
- ✅ Role-based access control
- ✅ Frontend-backend integration

## 🚀 Future Enhancements

Want to improve the app? Try adding:

1. **Auction Timer** - Auto-end auctions after 60 seconds
2. **Minimum Bid Increment** - Force bids to increase by at least 5 coins
3. **Player Images** - Upload and display player photos
4. **Leaderboard** - Show team rankings by total player value
5. **Chat Feature** - Real-time communication between bidders
6. **Email Notifications** - Notify winners via email
7. **Export Data** - Download team roster as PDF
8. **Bid History** - View all bids for each player
9. **Admin Analytics** - Show statistics and charts
10. **Mobile App** - Build React Native version

## 📝 License

This project is for educational purposes. Feel free to use and modify!

## 🤝 Contributing

This is a beginner tutorial project. Feel free to fork and enhance!

---

**Happy Coding! 🎉**
