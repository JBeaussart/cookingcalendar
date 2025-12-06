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

import "dotenv/config";

// ⚠️ Utilise les variables d'environnement
const firebaseConfig = {
  apiKey: process.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.PUBLIC_FIREBASE_APP_ID,
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
