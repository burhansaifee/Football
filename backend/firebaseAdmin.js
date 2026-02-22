const admin = require('firebase-admin');

try {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    const serviceAccountJsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (serviceAccountBase64) {
        const cleanedBase64 = serviceAccountBase64.replace(/\s/g, '');
        console.log(`Loading Firebase from Base64 (Length: ${cleanedBase64.length}, Start: ${cleanedBase64.substring(0, 10)}...)`);

        try {
            const decodedJson = Buffer.from(cleanedBase64, 'base64').toString('utf8');
            const serviceAccount = JSON.parse(decodedJson);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("Firebase Admin Initialized successfully.");
        } catch (innerError) {
            const decodedSnippet = Buffer.from(cleanedBase64, 'base64').toString('utf8').substring(0, 50);
            console.error(`FAILED TO PARSE FIREBASE JSON. Decoded snippet: "${decodedSnippet}..."`);
            throw innerError;
        }
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
