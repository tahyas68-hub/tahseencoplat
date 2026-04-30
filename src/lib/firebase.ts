import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

// Connectivity check
async function testConnection() {
  try {
    // We try to fetch the specific user doc or a test doc
    // Using the specified database ID from config
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    // If it's just 'not-found', the connection is actually OK
    if (error.code === 'permission-denied' || error.message.includes('permission')) {
        console.log("Firebase connection established (Rules active).");
        return;
    }
    if (error.message?.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    } else {
      console.error("Firebase connection error:", error.message);
    }
  }
}
testConnection();
