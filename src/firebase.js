// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_911zYtZ2oEz4DpFADPKwkOK-nmIC550",
  authDomain: "appmedica-9a1c9.firebaseapp.com",
  projectId: "appmedica-9a1c9",
  storageBucket: "appmedica-9a1c9.firebasestorage.app",
  messagingSenderId: "199753910024",
  appId: "1:199753910024:web:961ad9a85278f640648ebd"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
export const provider = new GoogleAuthProvider();
