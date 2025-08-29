// scripts/deleteAllRecipes.js
// ⚠️ Attention : supprime TOUT le contenu de la collection "recipes"
// Lance avec: node scripts/deleteAllRecipes.js

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

// ⚠️ Mets ta config Firebase (copie de src/firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyCFQHBm3Hng9tzVtO3ZrjjFEtJ1xj0hJvA",
  authDomain: "cookingcalendar-38722.firebaseapp.com",
  projectId: "cookingcalendar-38722",
  storageBucket: "cookingcalendar-38722.firebasestorage.app",
  messagingSenderId: "780270414824",
  appId: "1:780270414824:web:bf4009dbb0ba6883a8d25d",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const colRef = collection(db, "recipes");
  const snap = await getDocs(colRef);

  if (snap.empty) {
    console.log("⚠️ La collection 'recipes' est déjà vide.");
    return;
  }

  console.log(`⚠️ Suppression de ${snap.size} recettes...`);

  for (const d of snap.docs) {
    await deleteDoc(doc(db, "recipes", d.id));
    console.log(`🗑️ Supprimé: ${d.id}`);
  }

  console.log("✅ Toutes les recettes ont été supprimées !");
}
main();
