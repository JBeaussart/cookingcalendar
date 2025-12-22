// scripts/exportFirebaseToJSON.js
// Export toutes les collections Firebase vers des fichiers JSON
// Utilise le client Firebase standard (pas Admin SDK)
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { writeFile, mkdir } from "node:fs/promises";
import { config } from "dotenv";

// Charger les variables d'environnement
config();

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

/**
 * Exporte une collection Firestore vers un fichier JSON
 * @param {string} collectionName - Nom de la collection à exporter
 * @returns {Promise<Array>} - Les données exportées
 */
async function exportCollection(collectionName) {
    console.log(`📦 Export de la collection "${collectionName}"...`);

    const snapshot = await getDocs(collection(db, collectionName));
    const data = [];

    snapshot.forEach((doc) => {
        const docData = doc.data();

        // Convertir les Timestamps Firestore en ISO strings
        const cleanData = {};
        for (const [key, value] of Object.entries(docData)) {
            if (value && typeof value === 'object' && value.toDate) {
                // C'est un Timestamp Firestore
                cleanData[key] = value.toDate().toISOString();
            } else {
                cleanData[key] = value;
            }
        }

        data.push({
            id: doc.id,
            ...cleanData
        });
    });

    // Créer le dossier exports s'il n'existe pas
    await mkdir('./exports', { recursive: true });

    // Sauvegarder dans un fichier JSON
    await writeFile(
        `./exports/${collectionName}.json`,
        JSON.stringify(data, null, 2),
        'utf8'
    );

    console.log(`✅ ${data.length} documents exportés depuis "${collectionName}"`);
    return data;
}

/**
 * Exporte toutes les collections Firebase
 */
async function exportAll() {
    console.log('🚀 Début de l\'export Firebase...\n');

    const collections = [
        'recipes',
        'planning',
        'reception',
        'shoppingTotals',
        'shoppingCustom'
    ];

    const stats = {};

    for (const coll of collections) {
        try {
            const data = await exportCollection(coll);
            stats[coll] = data.length;
        } catch (error) {
            console.error(`❌ Erreur lors de l'export de "${coll}":`, error.message);
            stats[coll] = 0;
        }
    }

    console.log('\n📊 Résumé de l\'export:');
    console.log('─'.repeat(40));
    for (const [coll, count] of Object.entries(stats)) {
        console.log(`  ${coll.padEnd(20)} : ${count} documents`);
    }
    console.log('─'.repeat(40));
    console.log(`  TOTAL : ${Object.values(stats).reduce((a, b) => a + b, 0)} documents`);

    console.log('\n🎉 Export terminé ! Fichiers disponibles dans ./exports/');
}

// Exécution
await exportAll();
