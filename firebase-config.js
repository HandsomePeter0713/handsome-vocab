// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCQFLdUrzC_2Szk4icubn3aNXP8o0kB4Z0",
  authDomain: "handsome-vocab.firebaseapp.com",
  databaseURL: "https://handsome-vocab-default-rtdb.firebaseio.com",
  projectId: "handsome-vocab",
  storageBucket: "handsome-vocab.firebasestorage.app",
  messagingSenderId: "249842188497",
  appId: "1:249842188497:web:601869ca80fb8a93e985f0",
  measurementId: "G-0B2WTH2JVP"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
// const analytics = firebase.getAnalytics(app);
const auth = firebase.auth();
const db = firebase.database();
const googleProvider = new firebase.auth.GoogleAuthProvider();