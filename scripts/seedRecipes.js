// scripts/seedRecipes.js
// Exécuter avec : node scripts/seedRecipes.js

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// ⚠️ Mets ici ta config Firebase
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

const randMaman = () => Math.random() < 0.3; // ~30% des recettes

// 30 RECETTES SALÉES
const savoryRecipes = [
  {
    title: "Curry de pois chiches et épinards",
    ingredients: [
      { item: "pois chiches", quantity: 400, unit: "g" },
      { item: "épinards frais", quantity: 200, unit: "g" },
      { item: "lait de coco", quantity: 200, unit: "ml" },
    ],
    steps: [
      "Faire revenir les épices",
      "Ajouter les pois chiches",
      "Incorporer épinards et lait de coco",
      "Mijoter 15 min",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Lasagnes végétariennes aux légumes du soleil",
    ingredients: [
      { item: "feuilles de lasagnes", quantity: 12, unit: "pièces" },
      { item: "courgette", quantity: 1, unit: "pièce" },
      { item: "aubergine", quantity: 1, unit: "pièce" },
    ],
    steps: [
      "Préparer sauce tomate",
      "Alterner pâtes et légumes",
      "Recouvrir de fromage",
      "Cuire au four 40 min",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Soupe de potiron et carottes",
    ingredients: [
      { item: "potiron", quantity: 500, unit: "g" },
      { item: "carottes", quantity: 2, unit: "pièces" },
      { item: "oignon", quantity: 1, unit: "pièce" },
    ],
    steps: [
      "Éplucher et couper légumes",
      "Cuire dans bouillon",
      "Mixer",
      "Servir chaud",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Salade de quinoa et avocat",
    ingredients: [
      { item: "quinoa", quantity: 150, unit: "g" },
      { item: "avocat", quantity: 1, unit: "pièce" },
      { item: "tomates cerises", quantity: 100, unit: "g" },
    ],
    steps: ["Cuire le quinoa", "Couper légumes", "Mélanger", "Assaisonner"],
    image: "",
    salt: true,
  },
  {
    title: "Ratatouille traditionnelle",
    ingredients: [
      { item: "aubergine", quantity: 1, unit: "pièce" },
      { item: "courgette", quantity: 2, unit: "pièces" },
      { item: "poivron", quantity: 1, unit: "pièce" },
    ],
    steps: [
      "Tailler les légumes",
      "Saisir séparément",
      "Mijoter ensemble",
      "Assaisonner",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Burger végétarien aux haricots rouges",
    ingredients: [
      { item: "haricots rouges", quantity: 400, unit: "g" },
      { item: "chapelure", quantity: 50, unit: "g" },
      { item: "oeuf", quantity: 1, unit: "pièce" },
    ],
    steps: [
      "Écraser haricots",
      "Former galettes",
      "Cuire à la poêle",
      "Assembler le burger",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Pâtes aux champignons et épinards",
    ingredients: [
      { item: "pâtes", quantity: 300, unit: "g" },
      { item: "champignons", quantity: 200, unit: "g" },
      { item: "épinards", quantity: 100, unit: "g" },
    ],
    steps: [
      "Cuire les pâtes",
      "Faire revenir champignons",
      "Ajouter épinards",
      "Mélanger avec pâtes",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Omelette aux légumes",
    ingredients: [
      { item: "oeufs", quantity: 3, unit: "pièces" },
      { item: "poivron", quantity: 1, unit: "pièce" },
      { item: "oignon", quantity: 1, unit: "pièce" },
    ],
    steps: [
      "Battre les oeufs",
      "Ajouter légumes coupés",
      "Cuire à la poêle",
      "Servir chaud",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Chili sin carne",
    ingredients: [
      { item: "haricots rouges", quantity: 300, unit: "g" },
      { item: "maïs", quantity: 150, unit: "g" },
      { item: "poivron", quantity: 1, unit: "pièce" },
    ],
    steps: [
      "Faire revenir oignon et épices",
      "Ajouter légumes et haricots",
      "Mijoter 30 min",
      "Servir chaud",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Risotto aux champignons",
    ingredients: [
      { item: "riz arborio", quantity: 200, unit: "g" },
      { item: "champignons", quantity: 150, unit: "g" },
      { item: "parmesan", quantity: 50, unit: "g" },
    ],
    steps: [
      "Faire revenir oignon",
      "Ajouter riz et mouiller progressivement",
      "Incorporer champignons",
      "Finir au parmesan",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Gratin dauphinois végétarien",
    ingredients: [
      { item: "pommes de terre", quantity: 800, unit: "g" },
      { item: "crème fraîche", quantity: 200, unit: "ml" },
      { item: "fromage râpé", quantity: 100, unit: "g" },
    ],
    steps: [
      "Éplucher pommes de terre",
      "Disposer en couches",
      "Verser crème",
      "Cuire au four 45 min",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Tian de légumes",
    ingredients: [
      { item: "courgette", quantity: 2, unit: "pièces" },
      { item: "aubergine", quantity: 1, unit: "pièce" },
      { item: "tomates", quantity: 2, unit: "pièces" },
    ],
    steps: [
      "Couper légumes en rondelles",
      "Disposer en spirale",
      "Arroser huile d’olive",
      "Cuire 40 min",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Paella végétarienne",
    ingredients: [
      { item: "riz", quantity: 300, unit: "g" },
      { item: "poivrons", quantity: 2, unit: "pièces" },
      { item: "petits pois", quantity: 150, unit: "g" },
    ],
    steps: [
      "Faire revenir légumes",
      "Ajouter riz et bouillon",
      "Cuire 25 min",
      "Servir chaud",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Pizza végétarienne maison",
    ingredients: [
      { item: "pâte à pizza", quantity: 1, unit: "pièce" },
      { item: "sauce tomate", quantity: 100, unit: "g" },
      { item: "fromage râpé", quantity: 100, unit: "g" },
    ],
    steps: [
      "Étaler pâte",
      "Garnir de sauce et légumes",
      "Parsemer fromage",
      "Cuire au four 15 min",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Falafels maison",
    ingredients: [
      { item: "pois chiches secs", quantity: 250, unit: "g" },
      { item: "ail", quantity: 2, unit: "gousses" },
      { item: "persil", quantity: 1, unit: "botte" },
    ],
    steps: [
      "Mixer ingrédients",
      "Former boulettes",
      "Frire dans huile chaude",
      "Servir avec sauce",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Couscous végétarien aux légumes",
    ingredients: [
      { item: "semoule", quantity: 300, unit: "g" },
      { item: "carottes", quantity: 2, unit: "pièces" },
      { item: "navet", quantity: 1, unit: "pièce" },
    ],
    steps: [
      "Préparer bouillon avec légumes",
      "Cuire semoule",
      "Mélanger ensemble",
      "Servir chaud",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Galettes de courgettes",
    ingredients: [
      { item: "courgettes", quantity: 2, unit: "pièces" },
      { item: "oeuf", quantity: 1, unit: "pièce" },
      { item: "farine", quantity: 50, unit: "g" },
    ],
    steps: [
      "Râper courgettes",
      "Mélanger avec oeuf et farine",
      "Former galettes",
      "Cuire à la poêle",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Taboulé libanais",
    ingredients: [
      { item: "boulgour", quantity: 150, unit: "g" },
      { item: "tomates", quantity: 2, unit: "pièces" },
      { item: "persil", quantity: 1, unit: "botte" },
    ],
    steps: [
      "Cuire boulgour",
      "Couper légumes",
      "Mélanger avec persil",
      "Assaisonner",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Soupe minestrone",
    ingredients: [
      { item: "pâtes", quantity: 100, unit: "g" },
      { item: "haricots blancs", quantity: 150, unit: "g" },
      { item: "courgette", quantity: 1, unit: "pièce" },
    ],
    steps: [
      "Faire revenir oignons",
      "Ajouter légumes et bouillon",
      "Cuire pâtes",
      "Servir",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Poêlée de légumes d’hiver",
    ingredients: [
      { item: "chou-fleur", quantity: 200, unit: "g" },
      { item: "brocoli", quantity: 200, unit: "g" },
      { item: "carotte", quantity: 1, unit: "pièce" },
    ],
    steps: [
      "Couper légumes",
      "Faire revenir à la poêle",
      "Assaisonner",
      "Servir",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Riz sauté aux légumes",
    ingredients: [
      { item: "riz", quantity: 200, unit: "g" },
      { item: "carotte", quantity: 1, unit: "pièce" },
      { item: "poivron", quantity: 1, unit: "pièce" },
    ],
    steps: [
      "Cuire riz",
      "Faire revenir légumes",
      "Mélanger avec sauce soja",
      "Servir chaud",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Tacos végétariens",
    ingredients: [
      { item: "tortillas", quantity: 4, unit: "pièces" },
      { item: "haricots noirs", quantity: 200, unit: "g" },
      { item: "avocat", quantity: 1, unit: "pièce" },
    ],
    steps: ["Préparer garniture", "Réchauffer tortillas", "Garnir", "Servir"],
    image: "",
    salt: true,
  },
  {
    title: "Gratin de courge butternut",
    ingredients: [
      { item: "butternut", quantity: 500, unit: "g" },
      { item: "crème", quantity: 200, unit: "ml" },
      { item: "fromage râpé", quantity: 100, unit: "g" },
    ],
    steps: [
      "Éplucher butternut",
      "Couper en tranches",
      "Enfourner 40 min",
      "Servir chaud",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Polenta crémeuse aux champignons",
    ingredients: [
      { item: "polenta", quantity: 150, unit: "g" },
      { item: "champignons", quantity: 200, unit: "g" },
      { item: "parmesan", quantity: 50, unit: "g" },
    ],
    steps: [
      "Cuire polenta",
      "Faire revenir champignons",
      "Assembler avec parmesan",
      "Servir",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Wok de légumes croquants",
    ingredients: [
      { item: "brocoli", quantity: 150, unit: "g" },
      { item: "carotte", quantity: 1, unit: "pièce" },
      { item: "sauce soja", quantity: 30, unit: "ml" },
    ],
    steps: [
      "Découper légumes",
      "Sauter dans wok",
      "Ajouter sauce soja",
      "Servir",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Gratin de chou-fleur",
    ingredients: [
      { item: "chou-fleur", quantity: 500, unit: "g" },
      { item: "béchamel", quantity: 200, unit: "ml" },
      { item: "fromage râpé", quantity: 100, unit: "g" },
    ],
    steps: [
      "Cuire chou-fleur",
      "Préparer béchamel",
      "Assembler et gratiner",
      "Servir chaud",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Buddha bowl aux légumes rôtis",
    ingredients: [
      { item: "quinoa", quantity: 100, unit: "g" },
      { item: "patate douce", quantity: 1, unit: "pièce" },
      { item: "pois chiches", quantity: 100, unit: "g" },
    ],
    steps: ["Cuire quinoa", "Rôtir légumes", "Assembler dans bol", "Servir"],
    image: "",
    salt: true,
  },
  {
    title: "Pizza blanche aux épinards",
    ingredients: [
      { item: "pâte à pizza", quantity: 1, unit: "pièce" },
      { item: "ricotta", quantity: 150, unit: "g" },
      { item: "épinards", quantity: 100, unit: "g" },
    ],
    steps: [
      "Étaler pâte",
      "Garnir ricotta et épinards",
      "Cuire 15 min",
      "Servir chaud",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Tartines aux légumes grillés",
    ingredients: [
      { item: "pain de campagne", quantity: 4, unit: "tranches" },
      { item: "courgette", quantity: 1, unit: "pièce" },
      { item: "aubergine", quantity: 1, unit: "pièce" },
    ],
    steps: ["Griller légumes", "Toaster pain", "Assembler tartines", "Servir"],
    image: "",
    salt: true,
  },
  {
    title: "Quiche aux poireaux",
    ingredients: [
      { item: "pâte brisée", quantity: 1, unit: "pièce" },
      { item: "poireaux", quantity: 2, unit: "pièces" },
      { item: "oeufs", quantity: 2, unit: "pièces" },
    ],
    steps: [
      "Précuire poireaux",
      "Préparer appareil",
      "Verser sur pâte",
      "Cuire 30 min",
    ],
    image: "",
    salt: true,
  },
  {
    title: "Tarte aux pommes",
    ingredients: [
      { item: "pâte brisée", quantity: 1, unit: "pièce" },
      { item: "pommes", quantity: 4, unit: "pièces" },
      { item: "sucre", quantity: 50, unit: "g" },
    ],
    steps: [
      "Étaler pâte",
      "Disposer pommes tranchées",
      "Saupoudrer de sucre",
      "Cuire 30 min au four",
    ],
    image: "",
    salt: false,
  },
  {
    title: "Moelleux au chocolat",
    ingredients: [
      { item: "chocolat noir", quantity: 200, unit: "g" },
      { item: "oeufs", quantity: 3, unit: "pièces" },
      { item: "beurre", quantity: 100, unit: "g" },
    ],
    steps: [
      "Faire fondre chocolat et beurre",
      "Ajouter oeufs",
      "Verser dans moule",
      "Cuire 20 min",
    ],
    image: "",
    salt: false,
  },
  {
    title: "Crêpes sucrées",
    ingredients: [
      { item: "farine", quantity: 250, unit: "g" },
      { item: "lait", quantity: 500, unit: "ml" },
      { item: "oeufs", quantity: 3, unit: "pièces" },
    ],
    steps: [
      "Mélanger ingrédients",
      "Repos 30 min",
      "Cuire dans poêle",
      "Servir avec sucre ou confiture",
    ],
    image: "",
    salt: false,
  },
  {
    title: "Cheesecake aux fruits rouges",
    ingredients: [
      { item: "fromage frais", quantity: 300, unit: "g" },
      { item: "biscuits", quantity: 200, unit: "g" },
      { item: "fruits rouges", quantity: 150, unit: "g" },
    ],
    steps: [
      "Mixer biscuits",
      "Préparer appareil fromage",
      "Assembler",
      "Réfrigérer 4h",
    ],
    image: "",
    salt: false,
  },
  {
    title: "Tiramisu classique",
    ingredients: [
      { item: "mascarpone", quantity: 250, unit: "g" },
      { item: "biscuits cuillère", quantity: 12, unit: "pièces" },
      { item: "café", quantity: 100, unit: "ml" },
    ],
    steps: [
      "Préparer crème mascarpone",
      "Tremper biscuits dans café",
      "Monter en couches",
      "Réfrigérer 6h",
    ],
    image: "",
    salt: false,
  },
  {
    title: "Clafoutis aux cerises",
    ingredients: [
      { item: "cerises", quantity: 300, unit: "g" },
      { item: "lait", quantity: 200, unit: "ml" },
      { item: "oeufs", quantity: 3, unit: "pièces" },
    ],
    steps: [
      "Préparer appareil",
      "Ajouter cerises",
      "Cuire au four 35 min",
      "Servir tiède",
    ],
    image: "",
    salt: false,
  },
  {
    title: "Cookies aux pépites de chocolat",
    ingredients: [
      { item: "farine", quantity: 200, unit: "g" },
      { item: "sucre", quantity: 100, unit: "g" },
      { item: "pépites de chocolat", quantity: 100, unit: "g" },
    ],
    steps: [
      "Préparer pâte",
      "Former boules",
      "Cuire 12 min",
      "Laisser refroidir",
    ],
    image: "",
    salt: false,
  },
  {
    title: "Mousse au chocolat",
    ingredients: [
      { item: "chocolat noir", quantity: 200, unit: "g" },
      { item: "oeufs", quantity: 4, unit: "pièces" },
      { item: "sucre", quantity: 50, unit: "g" },
    ],
    steps: [
      "Faire fondre chocolat",
      "Monter blancs en neige",
      "Mélanger",
      "Réfrigérer 4h",
    ],
    image: "",
    salt: false,
  },
  {
    title: "Brownie aux noix",
    ingredients: [
      { item: "chocolat noir", quantity: 200, unit: "g" },
      { item: "noix", quantity: 100, unit: "g" },
      { item: "oeufs", quantity: 3, unit: "pièces" },
    ],
    steps: [
      "Faire fondre chocolat",
      "Mélanger avec noix",
      "Cuire 25 min",
      "Servir",
    ],
    image: "",
    salt: false,
  },
  {
    title: "Panna cotta à la vanille",
    ingredients: [
      { item: "crème liquide", quantity: 500, unit: "ml" },
      { item: "sucre", quantity: 80, unit: "g" },
      { item: "gélatine", quantity: 2, unit: "feuilles" },
    ],
    steps: [
      "Chauffer crème et sucre",
      "Ajouter gélatine",
      "Verser en verrines",
      "Réfrigérer 4h",
    ],
    image: "",
    salt: false,
  },
];

async function seed() {
  const col = collection(db, "recipes");

  for (const r of savoryRecipes) {
    await addDoc(col, { ...r, maman: randMaman() });
  }

  console.log("✅ 30 recettes salées + 10 sucrées ajoutées avec maman & salt");
}

seed();
