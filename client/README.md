# Football Auction Platform (MERN Stack)

A real-time football player auction system built with the MERN stack (MongoDB, Express, React, Node.js).

## Features
- **Admin Dashboard**: Manage players, teams, and control the auction flow.
- **Bidder Dashboard**: Real-time bidding interface for team owners.
- **Live Auction Console**: Big-screen display for the current player on auction.
- **Real-time Updates**: Powered by Socket.IO for instant bid reflection.

## Tech Stack
- **Frontend**: React, Vite, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO
- **Database**: MongoDB

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB running locally or a cloud URI

### Installation

1.  **Backend Setup**
    ```bash
    cd backend
    npm install
    cp .env.example .env # (If you have one, otherwise create .env)
    node server.js
    ```

2.  **Frontend Setup**
    ```bash
    cd client
    npm install
    npm run dev
    ```

3.  **Access**
    - Frontend: `http://localhost:5173`
    - Backend API: `http://localhost:5001`
