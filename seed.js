// seed.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// ⚡ Mets ici ta config Firebase (la même que dans ton fichier firebase.js)
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

// Exemple de recettes à insérer
const recettes = [
  {
    title: "Omellete au fromage",
    ingredients: [
      { item: "Gruyère", quantity: 200, unit: "gr" },
      { item: "oeufs", quantity: 3, unit: "pièces" },
    ],
    steps: ["Mélanger les ingrédients", "Cuire à feu moyen"],
    image:
      "https://images.unsplash.com/photo-1692737580558-b9dfdac5599c?q=80&w=1815&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    createdAt: null,
  },
  {
    title: "Poulet rôti",
    ingredients: [
      { item: "poulet", quantity: 1, unit: "pièce" },
      { item: "pommes de terre", quantity: 500, unit: "gr" },
    ],
    steps: [
      "Préchauffer le four",
      "Rôtir le poulet",
      "Ajouter les pommes de terre",
    ],
    image:
      "https://images.unsplash.com/photo-1606728035253-49e8a23146de?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    createdAt: null,
  },
  {
    title: "Chou-fleur rôti aux épices et pois chiches",
    ingredients: [
      { item: "huile d’olive", quantity: 6, unit: "c. à soupe" },
      { item: "paprika", quantity: 2, unit: "c. à soupe" },
      { item: "cumin", quantity: 2, unit: "c. à soupe" },
      { item: "curcuma", quantity: 2, unit: "c. à café" },
      { item: "coriandre moulue", quantity: 2, unit: "c. à café" },
      { item: "cannelle", quantity: 1, unit: "c. à café" },
      { item: "sel", quantity: null, unit: "à goût" },
      { item: "poivre", quantity: null, unit: "à goût" },
      { item: "jus de citron", quantity: 1, unit: "pièce" },
      { item: "chou-fleur", quantity: 2, unit: "pièces" },
      { item: "pois chiches en conserve", quantity: 800, unit: "gr" },
    ],
    steps: [
      "Préchauffer le four à 200°C",
      "Couper le chou-fleur en bouquets",
      "Égoutter et rincer les pois chiches",
      "Mélanger l’huile d’olive avec toutes les épices, sel et poivre",
      "Ajouter le chou-fleur et les pois chiches, bien mélanger pour enrober",
      "Rôtir au four sur une plaque avec papier sulfurisé pendant 30-35 minutes (remuer à mi-cuisson)",
      "Servir avec un filet de jus de citron et coriandre fraîche",
    ],
    image: "",
    createdAt: null,
  },
  {
    title: "Galettes de courgettes et fromage râpé + salade",
    ingredients: [
      { item: "farine", quantity: 200, unit: "gr" },
      { item: "œufs", quantity: 4, unit: "pièces" },
      { item: "courgettes", quantity: 8, unit: "pièces" },
      { item: "huile d’olive", quantity: null, unit: "" },
      { item: "fromage râpé", quantity: 240, unit: "gr" },
      { item: "gousses d’ail", quantity: 4, unit: "pièces" },
      { item: "salade", quantity: 1, unit: "" },
      { item: "sel", quantity: null, unit: "" },
      { item: "poivre", quantity: null, unit: "" },
    ],
    steps: [
      "Râper les courgettes et presser pour enlever un maximum d’eau",
      "Mélanger avec les œufs, la farine, le fromage râpé, l’ail écrasé, du sel et du poivre",
      "Faire chauffer un peu d’huile dans une poêle et former des galettes avec la préparation",
      "Cuire 3 à 4 minutes de chaque côté jusqu’à ce qu’elles soient bien dorées",
    ],
    image: "",
    createdAt: null,
  },
  {
    title: "Riz sauté aux légumes et tofu façon thaï",
    ingredients: [
      { item: "tofu ferme", quantity: 400, unit: "gr" },
      { item: "oignon", quantity: 2, unit: "pièces" },
      { item: "ail", quantity: 4, unit: "gousses" },
      { item: "sauce soja", quantity: 4, unit: "c. à soupe" },
      { item: "huile de sésame", quantity: 2, unit: "c. à soupe" },
      { item: "gingembre râpé", quantity: 2, unit: "c. à café" },
      { item: "jus de citron vert", quantity: 2, unit: "c. à soupe" },
      { item: "graines de sésame", quantity: null, unit: "pour la déco" },
      { item: "carotte", quantity: 2, unit: "pièces" },
      { item: "poivron rouge", quantity: 1, unit: "pièce" },
      { item: "courgette", quantity: 2, unit: "pièces" },
      { item: "riz basmati ou jasmin", quantity: 300, unit: "gr" },
      { item: "sucre de canne", quantity: 2, unit: "c. à café" },
    ],
    steps: [
      "Cuire le riz selon les instructions du paquet et réserver",
      "Couper le tofu en dés, le mariner avec 2 c. à soupe de sauce soja et le gingembre râpé (15 min)",
      "Émincer l’oignon, hacher l’ail et couper la carotte, le poivron et la courgette en lamelles",
      "Faire revenir l’oignon et l’ail dans un wok avec l’huile de sésame",
      "Ajouter le tofu mariné et cuire 5 min",
      "Ajouter les légumes et faire sauter 5 à 7 min (tendres mais croquants)",
      "Incorporer le riz, la sauce soja restante, le sucre et le jus de citron vert, cuire encore 2 min",
      "Servir chaud avec des graines de sésame",
    ],
    image: "",
    createdAt: null,
  },
  {
    title: "Tartes brocolis, champignons, tomates cerise + salade",
    ingredients: [
      { item: "pâte feuilletée ou brisée", quantity: 2, unit: "rouleaux" },
      { item: "champignons de Paris", quantity: 2, unit: "barquettes" },
      { item: "brocolis", quantity: null, unit: "têtes" },
      {
        item: "tomates cerises",
        quantity: null,
        unit: "selon taille du moule",
      },
      { item: "fromage râpé", quantity: null, unit: "au goût" },
      {
        item: "fromage à tartiner ail & fines herbes",
        quantity: null,
        unit: "au goût",
      },
      { item: "œufs", quantity: 6, unit: "(4 entiers + 2 jaunes)" },
      { item: "crème fraîche", quantity: 20, unit: "cl" },
      { item: "lait", quantity: 20, unit: "cl" },
      { item: "sel", quantity: null, unit: "au goût" },
      { item: "poivre", quantity: null, unit: "au goût" },
      { item: "muscade", quantity: 1, unit: "pincée" },
      { item: "salade", quantity: null, unit: "pour accompagner" },
    ],
    steps: [
      "Faire cuire les brocolis et réserver quelques têtes",
      "Couper les champignons en fines lamelles et les faire cuire",
      "Couper les tomates cerises en deux, les évider et les remplir de fromage à tartiner",
      "Étaler la pâte et disposer champignons, brocolis, tomates cerises et fromage râpé",
      "Préparer le flan : battre 4 œufs entiers + 2 jaunes avec la crème, le lait, sel, poivre et muscade",
      "Verser le flan sur la garniture",
      "Cuire au four à 180/190°C pendant environ 35 minutes",
    ],
    image: "",
    createdAt: null,
  },
  {
    title: "Burger végétarien aux haricots rouges",
    ingredients: [
      { item: "chapelure", quantity: 50, unit: "g" },
      { item: "œuf", quantity: 1, unit: "" },
      { item: "tomate", quantity: 1, unit: "" },
      { item: "salade", quantity: null, unit: "feuilles" },
      { item: "oignon rouge", quantity: 1, unit: "" },
      { item: "haricots rouges (égouttés)", quantity: 250, unit: "g" },
      { item: "petit oignon", quantity: 1, unit: "" },
      { item: "ail", quantity: 1, unit: "gousse" },
      { item: "paprika", quantity: 1, unit: "c. à café" },
      { item: "sel", quantity: null, unit: "au goût" },
      { item: "poivre", quantity: null, unit: "au goût" },
      { item: "pains à burger", quantity: 2, unit: "" },
      { item: "sauce soja", quantity: 1, unit: "c. à soupe" },
      { item: "fromage", quantity: null, unit: "au choix" },
      { item: "salade verte", quantity: null, unit: "pour accompagner" },
    ],
    steps: [
      "Écraser les haricots rouges à la fourchette",
      "Ajouter l’oignon et l’ail hachés, la chapelure, l’œuf, le paprika, la sauce soja, sel et poivre",
      "Mélanger et former deux steaks",
      "Cuire les steaks 5 minutes de chaque côté dans une poêle avec un peu d’huile",
      "Faire griller les pains à burger",
      "Garnir les burgers avec le steak végétarien, tomate, oignon rouge, salade et fromage",
    ],
    image: "",
    createdAt: null,
  },
  {
    title: "Buddha bowl aux légumes rôtis et pois chiches",
    ingredients: [
      { item: "avocat", quantity: 1, unit: "" },
      { item: "patate", quantity: 1, unit: "" },
      { item: "pois chiches cuits égouttés", quantity: 100, unit: "g" },
      { item: "salade verte", quantity: 1, unit: "poignée" },
      { item: "courgette", quantity: 1, unit: "" },
      { item: "carotte", quantity: 1, unit: "" },
      {
        item: "graines de sésame ou tournesol",
        quantity: null,
        unit: "optionnel",
      },
      { item: "paprika", quantity: 1, unit: "c. à café" },
      { item: "quinoa ou riz", quantity: 100, unit: "g" },
      { item: "huile d’olive", quantity: 1, unit: "c. à soupe" },
    ],
    steps: [
      "Cuire le quinoa ou le riz",
      "Couper les légumes en morceaux et les faire rôtir au four avec l’huile d’olive et le paprika (200°C, 20 minutes)",
      "Ajouter les pois chiches aux légumes en fin de cuisson",
      "Assembler le tout dans un bol avec la salade et l’avocat coupé en lamelles",
      "Saupoudrer de graines et déguster avec une sauce au yaourt ou au tahini",
    ],
    image: "",
    createdAt: null,
  },
];

async function seed() {
  for (let recette of recettes) {
    await addDoc(collection(db, "recipes"), recette);
    console.log(`✅ Recette ajoutée : ${recette.title}`);
  }
  process.exit(); // termine le script proprement
}

seed();
