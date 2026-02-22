const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');

// Add a new match result (Admin only)
router.post('/', auth, isAdmin, async (req, res) => {
    try {
        const { teamA, teamB, goalsA, goalsB, date } = req.body;

        if (!teamA || !teamB) {
            return res.status(400).json({ error: 'teamA and teamB are required' });
        }

        if (teamA === teamB) {
            return res.status(400).json({ error: 'A team cannot play against itself' });
        }

        const match = new Match({
            teamA,
            teamB,
            goalsA,
            goalsB,
            date: date || Date.now(),
            tournamentId: req.user.tournamentId
        });

        await match.save();

        // Populate team names for the response
        const populatedMatch = await Match.findById(match._id)
            .populate('teamA', 'username teamName')
            .populate('teamB', 'username teamName');

        res.status(201).json(populatedMatch);
    } catch (error) {
        console.error('Error recording match:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all matches
router.get('/', auth, async (req, res) => {
    try {
        const matches = await Match.find({ tournamentId: req.user.tournamentId })
            .populate('teamA', 'username teamName')
            .populate('teamB', 'username teamName')
            .sort({ date: -1 });
        res.json(matches);
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get points table (standings)
router.get('/standings', auth, async (req, res) => {
    try {
        // Fetch all bidders (teams)
        const teams = await User.find({ role: 'bidder', tournamentId: req.user.tournamentId }).select('username teamName');

        // Fetch all matches
        const matches = await Match.find({ tournamentId: req.user.tournamentId });

        // Initialize standings object
        const standingsMap = {};
        teams.forEach(team => {
            standingsMap[team._id.toString()] = {
                teamId: team._id,
                teamName: team.teamName || team.username,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                points: 0
            };
        });

        // Calculate points and stats from matches
        matches.forEach(match => {
            const teamAId = match.teamA.toString();
            const teamBId = match.teamB.toString();
            const goalsA = match.goalsA;
            const goalsB = match.goalsB;

            // Only process if both teams exist in our current teams list
            if (standingsMap[teamAId] && standingsMap[teamBId]) {
                // Team A Stats
                standingsMap[teamAId].played += 1;
                standingsMap[teamAId].goalsFor += goalsA;
                standingsMap[teamAId].goalsAgainst += goalsB;

                // Team B Stats
                standingsMap[teamBId].played += 1;
                standingsMap[teamBId].goalsFor += goalsB;
                standingsMap[teamBId].goalsAgainst += goalsA;

                // Match Result
                if (goalsA > goalsB) {
                    standingsMap[teamAId].won += 1;
                    standingsMap[teamAId].points += 3;
                    standingsMap[teamBId].lost += 1;
                } else if (goalsA < goalsB) {
                    standingsMap[teamBId].won += 1;
                    standingsMap[teamBId].points += 3;
                    standingsMap[teamAId].lost += 1;
                } else {
                    // Draw
                    standingsMap[teamAId].drawn += 1;
                    standingsMap[teamAId].points += 1;
                    standingsMap[teamBId].drawn += 1;
                    standingsMap[teamBId].points += 1;
                }
            }
        });

        // Calculate Goal Difference and convert to array
        let standings = Object.values(standingsMap).map(team => {
            team.goalDifference = team.goalsFor - team.goalsAgainst;
            return team;
        });

        // Sort Standings: Points (Desc), Goal Difference (Desc), Goals For (Desc), Name (Asc)
        standings.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
            return a.teamName.localeCompare(b.teamName);
        });

        res.json(standings);
    } catch (error) {
        console.error('Error calculating standings:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
