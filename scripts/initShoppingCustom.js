// scripts/initShoppingCustom.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// ⚠️ Remplace par ta config (même que /src/firebase.js)
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

async function init() {
  await setDoc(doc(db, "shoppingCustom", "current"), {
    items: [
      { item: "Eau pétillante", quantity: 6, unit: "bouteilles", checked: false },
      { item: "Sac poubelle", quantity: 1, unit: "rouleau", checked: true }
    ],
    savedAt: new Date()
  }, { merge: true });

  console.log("✅ shoppingCustom/current créé ou mis à jour.");
}

init().catch(e => {
  console.error("❌", e);
  process.exit(1);
});
