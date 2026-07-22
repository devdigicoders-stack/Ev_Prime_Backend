const { initializeApp, cert, getApps } = require('firebase-admin/app');

function initializeFirebase() {
  try {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.warn('Firebase environment variables are missing. Push notifications will not work.');
      return;
    }

    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace literal \n with actual newline character for the private key
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };

    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('Firebase Admin initialized successfully.');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

module.exports = {
  initializeFirebase,
  getApps
};
