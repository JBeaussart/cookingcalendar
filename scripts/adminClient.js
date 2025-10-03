// scripts/adminClient.js
// CLI CRUD utilitaire pour Firestore via Firebase Admin SDK.
import { argv, exit } from "node:process";
import { readFile } from "node:fs/promises";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../serviceAccountKey.json" assert { type: "json" };

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = getFirestore();

const HELP = `Usage: node scripts/adminClient.js <action> <collection> [args]

Actions disponibles:
  list <collection> [limit]           Liste les documents (limite par défaut: 50)
  get <collection> <id>              Récupère un document
  add <collection> <json|@fichier>   Ajoute un document avec id auto
  set <collection> <id> <json|@f>    Crée/remplace un document
  update <collection> <id> <json|@f> Met à jour partiellement un document
  delete <collection> <id>           Supprime un document
  help                               Affiche cette aide

Astuce: passez un payload JSON inline ("{\"title\":\"Test\"}") ou via @chemin/fichier.json.
`;

const VALID_COLLECTIONS = new Set([
  "recipes",
  "planning",
  "reception",
  "shoppingTotals",
  "shoppingCustom",
]);

function ensureCollection(name) {
  if (!name) {
    console.error("⚠️ Collection manquante");
    console.log(HELP);
    exit(1);
  }
  if (!VALID_COLLECTIONS.has(name)) {
    console.error(`⚠️ Collection inconnue: ${name}`);
    console.log(`Collections autorisées: ${Array.from(VALID_COLLECTIONS).join(", ")}`);
    exit(1);
  }
  return name;
}

async function loadPayload(raw) {
  if (!raw) {
    console.error("⚠️ Payload JSON manquant");
    exit(1);
  }
  if (raw.startsWith("@")) {
    const filePath = raw.slice(1);
    const data = await readFile(filePath, "utf8");
    return JSON.parse(data);
  }
  return JSON.parse(raw);
}

async function actionList(collection, limitArg) {
  const limit = limitArg ? Number(limitArg) : 50;
  if (Number.isNaN(limit) || limit <= 0) {
    console.error("⚠️ La limite doit être un nombre strictement positif");
    exit(1);
  }
  const ref = db.collection(collection).limit(limit);
  const snap = await ref.get();
  const results = [];
  snap.forEach((doc) => {
    results.push({ id: doc.id, ...doc.data() });
  });
  console.log(JSON.stringify({ count: results.length, documents: results }, null, 2));
}

async function actionGet(collection, id) {
  if (!id) {
    console.error("⚠️ Identifiant manquant");
    exit(1);
  }
  const doc = await db.collection(collection).doc(id).get();
  if (!doc.exists) {
    console.error(`❌ Document ${collection}/${id} introuvable`);
    exit(1);
  }
  console.log(JSON.stringify({ id: doc.id, ...doc.data() }, null, 2));
}

async function actionAdd(collection, payloadRaw) {
  const data = await loadPayload(payloadRaw);
  const ref = await db.collection(collection).add(data);
  console.log(JSON.stringify({ ok: true, id: ref.id }, null, 2));
}

async function actionSet(collection, id, payloadRaw) {
  if (!id) {
    console.error("⚠️ Identifiant manquant");
    exit(1);
  }
  const data = await loadPayload(payloadRaw);
  await db.collection(collection).doc(id).set(data, { merge: false });
  console.log(JSON.stringify({ ok: true, id }, null, 2));
}

async function actionUpdate(collection, id, payloadRaw) {
  if (!id) {
    console.error("⚠️ Identifiant manquant");
    exit(1);
  }
  const data = await loadPayload(payloadRaw);
  await db.collection(collection).doc(id).set(data, { merge: true });
  console.log(JSON.stringify({ ok: true, id }, null, 2));
}

async function actionDelete(collection, id) {
  if (!id) {
    console.error("⚠️ Identifiant manquant");
    exit(1);
  }
  await db.collection(collection).doc(id).delete();
  console.log(JSON.stringify({ ok: true, id }, null, 2));
}

async function main() {
  const [, , action = "help", collectionArg, ...rest] = argv;

  if (action === "help") {
    console.log(HELP);
    return;
  }

  const collection = ensureCollection(collectionArg);

  try {
    switch (action) {
      case "list":
        await actionList(collection, rest[0]);
        break;
      case "get":
        await actionGet(collection, rest[0]);
        break;
      case "add":
        await actionAdd(collection, rest[0]);
        break;
      case "set":
        await actionSet(collection, rest[0], rest[1]);
        break;
      case "update":
        await actionUpdate(collection, rest[0], rest[1]);
        break;
      case "delete":
        await actionDelete(collection, rest[0]);
        break;
      default:
        console.error(`⚠️ Action inconnue: ${action}`);
        console.log(HELP);
        exit(1);
    }
  } catch (err) {
    console.error("❌ Erreur Firestore:", err.message || err);
    exit(1);
  }
}

await main();
