import { initializeApp } from 'firebase/app';
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  "projectId": "studio-3581372645-f9bc5",
  "appId": "1:565384159901:web:074c9eee82727a16bbea74",
  "storageBucket": "studio-3581372645-f9bc5.firebasestorage.app",
  "apiKey": "AIzaSyCbze9Yz4oUDCC3fW3LaeKUDva5N8x_3xk",
  "authDomain": "studio-3581372645-f9bc5.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "565384159901"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
