const TIER_LIMITS = {
    free: { tournaments: 1, teams: 4, players: 20 },
    basic: { tournaments: 3, teams: 20, players: 100 },
    pro: { tournaments: Infinity, teams: 40, players: 300 }
};

module.exports = TIER_LIMITS;
