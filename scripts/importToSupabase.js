// scripts/importToSupabase.js
// Importe les données transformées dans Supabase
import { createClient } from '@supabase/supabase-js';
import { readFile, writeFile } from 'node:fs/promises';
import { config } from 'dotenv';

// Charger les variables d'environnement
config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variables d\'environnement manquantes !');
    console.error('💡 Assurez-vous d\'avoir défini PUBLIC_SUPABASE_URL et PUBLIC_SUPABASE_ANON_KEY dans .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Importe les recettes dans Supabase
 * @returns {Promise<Object>} Mapping Firebase ID → Supabase UUID
 */
async function importRecipes() {
    console.log('📥 Import des recettes...');

    const recipes = JSON.parse(
        await readFile('./exports/supabase_recipes.json', 'utf8')
    );

    const idMapping = {};
    let successCount = 0;
    let errorCount = 0;

    for (const recipe of recipes) {
        const { firebase_id, ...data } = recipe;

        try {
            const { data: inserted, error } = await supabase
                .from('recipes')
                .insert(data)
                .select('id')
                .single();

            if (error) {
                console.error(`  ❌ Erreur pour "${data.title}":`, error.message);
                errorCount++;
            } else {
                idMapping[firebase_id] = inserted.id;
                successCount++;
                console.log(`  ✅ ${data.title}`);
            }
        } catch (err) {
            console.error(`  ❌ Exception pour "${data.title}":`, err.message);
            errorCount++;
        }
    }

    // Sauvegarder le mapping pour le planning
    await writeFile(
        './exports/id_mapping.json',
        JSON.stringify(idMapping, null, 2),
        'utf8'
    );

    console.log(`✅ ${successCount} recettes importées, ${errorCount} erreurs`);
    return idMapping;
}

/**
 * Importe le planning dans Supabase
 * @param {Object} idMapping - Mapping Firebase ID → Supabase UUID
 */
async function importPlanning(idMapping) {
    console.log('📥 Import du planning...');

    const planning = JSON.parse(
        await readFile('./exports/supabase_planning.json', 'utf8')
    );

    let successCount = 0;
    let errorCount = 0;

    for (const p of planning) {
        const { firebase_recipe_id, ...data } = p;

        // Mapper l'ancien ID Firebase vers le nouveau UUID Supabase
        if (firebase_recipe_id && idMapping[firebase_recipe_id]) {
            data.recipe_id = idMapping[firebase_recipe_id];
        }

        try {
            const { error } = await supabase
                .from('planning')
                .insert(data);

            if (error) {
                console.error(`  ❌ Erreur pour le jour ${p.day}:`, error.message);
                errorCount++;
            } else {
                successCount++;
                console.log(`  ✅ ${p.day}`);
            }
        } catch (err) {
            console.error(`  ❌ Exception pour le jour ${p.day}:`, err.message);
            errorCount++;
        }
    }

    console.log(`✅ ${successCount} jours importés, ${errorCount} erreurs`);
}

/**
 * Importe la réception dans Supabase
 */
async function importReception() {
    console.log('📥 Import de la réception...');

    const reception = JSON.parse(
        await readFile('./exports/supabase_reception.json', 'utf8')
    );

    if (reception.length === 0) {
        console.log('  ℹ️  Aucune donnée de réception à importer');
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const r of reception) {
        const { firebase_id, ...data } = r;

        try {
            const { error } = await supabase
                .from('reception')
                .insert(data);

            if (error) {
                console.error(`  ❌ Erreur:`, error.message);
                errorCount++;
            } else {
                successCount++;
            }
        } catch (err) {
            console.error(`  ❌ Exception:`, err.message);
            errorCount++;
        }
    }

    console.log(`✅ ${successCount} éléments importés, ${errorCount} erreurs`);
}

/**
 * Importe shopping_totals dans Supabase
 */
async function importShoppingTotals() {
    console.log('📥 Import de shopping_totals...');

    const shoppingTotals = JSON.parse(
        await readFile('./exports/supabase_shoppingTotals.json', 'utf8')
    );

    if (shoppingTotals.length === 0) {
        console.log('  ℹ️  Aucune donnée shopping_totals à importer');
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const st of shoppingTotals) {
        const { firebase_id, ...data } = st;

        try {
            const { error } = await supabase
                .from('shopping_totals')
                .insert(data);

            if (error) {
                console.error(`  ❌ Erreur:`, error.message);
                errorCount++;
            } else {
                successCount++;
            }
        } catch (err) {
            console.error(`  ❌ Exception:`, err.message);
            errorCount++;
        }
    }

    console.log(`✅ ${successCount} éléments importés, ${errorCount} erreurs`);
}

/**
 * Importe shopping_custom dans Supabase
 */
async function importShoppingCustom() {
    console.log('📥 Import de shopping_custom...');

    const shoppingCustom = JSON.parse(
        await readFile('./exports/supabase_shoppingCustom.json', 'utf8')
    );

    if (shoppingCustom.length === 0) {
        console.log('  ℹ️  Aucun article personnalisé à importer');
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const sc of shoppingCustom) {
        const { firebase_id, ...data } = sc;

        try {
            const { error } = await supabase
                .from('shopping_custom')
                .insert(data);

            if (error) {
                console.error(`  ❌ Erreur pour "${data.item}":`, error.message);
                errorCount++;
            } else {
                successCount++;
            }
        } catch (err) {
            console.error(`  ❌ Exception pour "${data.item}":`, err.message);
            errorCount++;
        }
    }

    console.log(`✅ ${successCount} articles importés, ${errorCount} erreurs`);
}

/**
 * Importe toutes les données dans Supabase
 */
async function importAll() {
    console.log('🚀 Début de l\'import dans Supabase...\n');

    try {
        // 1. Importer les recettes et obtenir le mapping des IDs
        const idMapping = await importRecipes();

        console.log('');

        // 2. Importer le planning avec le mapping
        await importPlanning(idMapping);

        console.log('');

        // 3. Importer les autres collections
        await importReception();
        console.log('');
        await importShoppingTotals();
        console.log('');
        await importShoppingCustom();

        console.log('\n🎉 Import terminé !');
        console.log('\n📝 Prochaine étape : Vérifier les données dans Supabase Dashboard');
    } catch (error) {
        console.error('\n❌ Erreur lors de l\'import:', error.message);
        console.error('\n💡 Vérifiez que les tables existent dans Supabase');
        process.exit(1);
    }
}

// Exécution
await importAll();
