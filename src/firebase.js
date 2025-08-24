import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCFQHBm3Hng9tzVtO3ZrjjFEtJ1xj0hJvA",
  authDomain: "cookingcalendar-38722.firebaseapp.com",
  projectId: "cookingcalendar-38722",
  storageBucket: "cookingcalendar-38722.firebasestorage.app",
  messagingSenderId: "780270414824",
  appId: "1:780270414824:web:bf4009dbb0ba6883a8d25d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
