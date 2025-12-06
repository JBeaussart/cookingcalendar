// scripts/initShoppingCustom.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

async function init() {
  await setDoc(
    doc(db, "shoppingCustom", "current"),
    {
      items: [
        {
          item: "Eau pétillante",
          quantity: 6,
          unit: "bouteilles",
          checked: false,
        },
        { item: "Sac poubelle", quantity: 1, unit: "rouleau", checked: true },
      ],
      savedAt: new Date(),
    },
    { merge: true },
  );

  console.log("✅ shoppingCustom/current créé ou mis à jour.");
}

init().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
