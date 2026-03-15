import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB_I04OscPttl9ohJ7-zTXBvWFncCtLxjk",
  authDomain: "parolapark-6d702.firebaseapp.com",
  projectId: "parolapark-6d702",
  storageBucket: "parolapark-6d702.firebasestorage.app",
  messagingSenderId: "243334222642",
  appId: "1:243334222642:web:fa2c5e933406ab63137d2b",
  measurementId: "G-M7PSSFC59Z",
  databaseURL: "https://parolapark-6d702-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
