const admin = require('firebase-admin');

// Ensure that you have created a service account in Firebase Console
// and downloaded the JSON file, then set FIREBASE_SERVICE_ACCOUNT_PATH 
// in your .env or parsed a base64 string.
// For now, securely loading it if the path exists. 
try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (serviceAccountPath) {
        const path = require('path');
        const resolvedPath = path.resolve(__dirname, serviceAccountPath);
        console.log("Loading Firebase Service Account from:", resolvedPath);
        const serviceAccount = require(resolvedPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin Initialized successfully.");
    } else {
        console.warn("FIREBASE_SERVICE_ACCOUNT_PATH is not defined in .env! Make sure to fully restart your backend server so it can read the new .env file.");
        // Initialize an empty app to prevent crashes, but auth checks will fail.
        admin.initializeApp();
    }
} catch (error) {
    console.error("Firebase Admin initialization error:", error);
}

module.exports = admin;
