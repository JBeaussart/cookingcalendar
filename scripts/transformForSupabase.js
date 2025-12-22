// scripts/transformForSupabase.js
// Transforme les données Firebase exportées au format Supabase
import { readFile, writeFile } from "node:fs/promises";

/**
 * Transforme les recettes pour Supabase
 */
async function transformRecipes() {
    console.log('🔄 Transformation des recettes...');

    const recipes = JSON.parse(await readFile('./exports/recipes.json', 'utf8'));

    const transformed = recipes.map(recipe => ({
        // Garder l'ID Firebase comme référence temporaire
        firebase_id: recipe.id,
        title: recipe.title,
        image: recipe.image || null,
        ingredients: recipe.ingredients, // Sera stocké en JSONB
        steps: recipe.steps || [], // Sera stocké en JSONB
        maman: recipe.maman || false,
        salt: recipe.salt !== false, // default true
        created_at: recipe.createdAt || new Date().toISOString()
    }));

    await writeFile(
        './exports/supabase_recipes.json',
        JSON.stringify(transformed, null, 2),
        'utf8'
    );

    console.log(`✅ ${transformed.length} recettes transformées`);
    return transformed;
}

/**
 * Transforme le planning pour Supabase
 */
async function transformPlanning() {
    console.log('🔄 Transformation du planning...');

    const planning = JSON.parse(await readFile('./exports/planning.json', 'utf8'));

    const transformed = planning.map(p => ({
        day: p.id, // L'ID Firebase devient la clé 'day'
        recipe_id: null, // À mapper après import des recettes
        firebase_recipe_id: p.recipeId, // Référence temporaire
        entries: p.entries || null // Support pour plusieurs repas par jour
    }));

    await writeFile(
        './exports/supabase_planning.json',
        JSON.stringify(transformed, null, 2),
        'utf8'
    );

    console.log(`✅ ${transformed.length} jours de planning transformés`);
    return transformed;
}

/**
 * Transforme la réception pour Supabase
 */
async function transformReception() {
    console.log('🔄 Transformation de la réception...');

    const reception = JSON.parse(await readFile('./exports/reception.json', 'utf8'));

    const transformed = reception.map(r => ({
        firebase_id: r.id,
        // Ajouter les autres champs selon votre structure
        data: r, // Stocker toutes les données en JSONB pour l'instant
        created_at: r.createdAt || new Date().toISOString()
    }));

    await writeFile(
        './exports/supabase_reception.json',
        JSON.stringify(transformed, null, 2),
        'utf8'
    );

    console.log(`✅ ${transformed.length} éléments de réception transformés`);
    return transformed;
}

/**
 * Transforme shopping_totals pour Supabase
 */
async function transformShoppingTotals() {
    console.log('🔄 Transformation de shopping_totals...');

    const shoppingTotals = JSON.parse(await readFile('./exports/shoppingTotals.json', 'utf8'));

    const transformed = shoppingTotals.map(st => ({
        firebase_id: st.id,
        data: st, // Stocker en JSONB
        created_at: st.createdAt || new Date().toISOString()
    }));

    await writeFile(
        './exports/supabase_shoppingTotals.json',
        JSON.stringify(transformed, null, 2),
        'utf8'
    );

    console.log(`✅ ${transformed.length} éléments de shopping_totals transformés`);
    return transformed;
}

/**
 * Transforme shopping_custom pour Supabase
 */
async function transformShoppingCustom() {
    console.log('🔄 Transformation de shopping_custom...');

    const shoppingCustom = JSON.parse(await readFile('./exports/shoppingCustom.json', 'utf8'));

    const transformed = shoppingCustom.map(sc => ({
        firebase_id: sc.id,
        item: sc.item || sc.name || '',
        checked: sc.checked || false,
        created_at: sc.createdAt || new Date().toISOString()
    }));

    await writeFile(
        './exports/supabase_shoppingCustom.json',
        JSON.stringify(transformed, null, 2),
        'utf8'
    );

    console.log(`✅ ${transformed.length} articles personnalisés transformés`);
    return transformed;
}

/**
 * Transforme toutes les collections
 */
async function transformAll() {
    console.log('🚀 Début de la transformation des données...\n');

    try {
        await transformRecipes();
        await transformPlanning();
        await transformReception();
        await transformShoppingTotals();
        await transformShoppingCustom();

        console.log('\n🎉 Transformation terminée ! Fichiers disponibles dans ./exports/');
        console.log('\n📝 Prochaine étape : Exécuter importToSupabase.js');
    } catch (error) {
        console.error('\n❌ Erreur lors de la transformation:', error.message);
        console.error('\n💡 Assurez-vous d\'avoir d\'abord exécuté exportFirebaseToJSON.js');
        process.exit(1);
    }
}

// Exécution
await transformAll();
