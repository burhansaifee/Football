const mongoose = require('mongoose');
const User = require('./backend/models/User');

mongoose.connect('mongodb+srv://admin123:nlWfXu0NT9odU3Y5@cluster0.bfmhhvs.mongodb.net/football-auction')
    .then(async () => {
        try {
            const res = await User.updateMany(
                { role: 'admin' },
                { $set: { subscriptionTier: 'basic', subscriptionStatus: 'active' } }
            );
            console.log('Update result:', res);
        } catch (e) {
            console.error(e);
        } finally {
            process.exit(0);
        }
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
