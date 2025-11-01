// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDoFxOJKSOb-b1dDV0ERtCaNRvBDAcsQfU",
  authDomain: "aquabill-e7b76.firebaseapp.com",
  projectId: "aquabill-e7b76",
  storageBucket: "aquabill-e7b76.firebasestorage.app",
  messagingSenderId: "999846775887",
  appId: "1:999846775887:web:0fdfa9564af935c6612e3a",
  measurementId: "G-J01ZF7WYSL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only works on web, so we check if available)
let analytics;
try {
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.log('Analytics not available (likely React Native)');
}

// Initialize Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Firebase Storage
const storage = getStorage(app);

/**
 * Upload an image to Firebase Storage and return the download URL
 * @param uri - Local URI of the image
 * @param path - Storage path (e.g., 'profile-pictures/user123.jpg')
 * @returns Promise<string> - Download URL of the uploaded image
 */
export const uploadImageToStorage = async (uri: string, path: string): Promise<string> => {
  try {
    // Fetch the image from the local URI
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create a reference to the storage location
    const storageRef = ref(storage, path);

    // Upload the blob
    await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image to Firebase Storage:', error);
    throw error;
  }
};

export { addDoc, collection, db, deleteDoc, doc, getDocs, onSnapshot, query, storage, updateDoc, where };

