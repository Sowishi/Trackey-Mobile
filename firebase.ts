// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, off, onValue, ref } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAksBfuSTJe4kQnqlAY-RDeqErCsuf00lY",
  authDomain: "projects-b1c71.firebaseapp.com",
  databaseURL: "https://projects-b1c71-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "projects-b1c71",
  storageBucket: "projects-b1c71.firebasestorage.app",
  messagingSenderId: "727119489398",
  appId: "1:727119489398:web:51f05555f160312db5f257"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

export { database, off, onValue, ref };

