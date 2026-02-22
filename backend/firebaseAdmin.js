const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// THE SOLUTIONS: START FROM 0
// We are moving away from fragile Base64 strings and using "Secret Files" (The standard on Render)
const secretFilePath = '/etc/secrets/firebase-admin.json';
const localFilePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ? path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH) : path.resolve(__dirname, './firebase-admin.json');

try {
    let serviceAccount;

    if (fs.existsSync(secretFilePath)) {
        // Method 1: Render Secret File (MOST RELIABLE - NO CORRUPTION)
        console.log("Initializing Firebase Admin from Render Secret File...");
        serviceAccount = JSON.parse(fs.readFileSync(secretFilePath, 'utf8'));
    } else if (fs.existsSync(localFilePath)) {
        // Method 2: Local development file
        console.log("Initializing Firebase Admin from Local File...");
        serviceAccount = JSON.parse(fs.readFileSync(localFilePath, 'utf8'));
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        // Method 3: Fallback Base64 (With cleanup)
        console.log("Fallback: Initializing from Base64 env var...");
        const cleaned = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.replace(/\s/g, '');
        serviceAccount = JSON.parse(Buffer.from(cleaned, 'base64').toString('utf8'));
    }

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("✅ Firebase Admin initialized successfully.");
    } else {
        console.error("❌ CRITICAL: No Firebase credentials found! Please upload firebase-admin.json to Render Secret Files.");
        admin.initializeApp(); // Prevent total crash, but auth will fail
    }
} catch (error) {
    console.error("❌ Firebase Admin Initialization Failed:", error.message);
}

module.exports = admin;
