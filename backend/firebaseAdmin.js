const admin = require('firebase-admin');

try {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    const serviceAccountJsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (serviceAccountBase64) {
        console.log("Loading Firebase Service Account from Base64 String...");
        const decodedJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(decodedJson);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin Initialized successfully from Base64 String.");
    } else if (serviceAccountJsonStr) {
        console.log("Loading Firebase Service Account from JSON String...");
        const serviceAccount = JSON.parse(serviceAccountJsonStr);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin Initialized successfully from JSON String.");
    } else if (serviceAccountPath) {
        const path = require('path');
        const resolvedPath = path.resolve(__dirname, serviceAccountPath);
        console.log("Loading Firebase Service Account from path:", resolvedPath);
        const serviceAccount = require(resolvedPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin Initialized successfully from file.");
    } else {
        console.warn("FIREBASE credentials not found in env! Make sure to fully restart your backend server so it can read the new .env file.");
        // Initialize an empty app to prevent crashes, but auth checks will fail.
        admin.initializeApp();
    }
} catch (error) {
    console.error("Firebase Admin initialization error:", error);
}

module.exports = admin;
