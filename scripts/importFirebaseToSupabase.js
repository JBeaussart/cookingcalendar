// scripts/importFirebaseToSupabase.js
// Script complet pour importer toutes les données Firebase dans Supabase avec user_id
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { createClient } from '@supabase/supabase-js';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { config } from 'dotenv';
import readline from 'readline';

// Charger les variables d'environnement
config();

// Configuration Firebase
const firebaseConfig = {
    apiKey: process.env.PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.PUBLIC_FIREBASE_APP_ID,
};

// Configuration Supabase
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
// Service role key bypass RLS (recommandé pour l'import)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Vérifier les variables d'environnement
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('❌ Variables Firebase manquantes !');
    console.error('💡 Assurez-vous d\'avoir défini les variables Firebase dans .env');
    process.exit(1);
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variables Supabase manquantes !');
    console.error('💡 Assurez-vous d\'avoir défini PUBLIC_SUPABASE_URL et PUBLIC_SUPABASE_ANON_KEY dans .env');
    process.exit(1);
}

// Initialiser Firebase et Supabase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Utiliser service role key si disponible (bypass RLS), sinon anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

if (supabaseServiceKey) {
    console.log('✅ Utilisation de la clé service role (bypass RLS)');
} else {
    console.log('⚠️  Utilisation de la clé anon (RLS activé)');
    console.log('💡 Pour bypasser RLS, ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env');
    console.log('💡 Trouvez-la dans Supabase Dashboard > Settings > API > service_role key\n');
}

/**
 * Demande un user_id à l'utilisateur ou récupère les utilisateurs disponibles
 */
async function getUserId() {
    // Récupérer tous les utilisateurs de Supabase
    const { data: users, error } = await supabase
        .from('user_profiles')
        .select('id, email, user_role')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Erreur lors de la récupération des utilisateurs:', error.message);
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    if (users && users.length > 0) {
        console.log('\n👥 Utilisateurs disponibles dans Supabase :\n');
        users.forEach((user, index) => {
            const roleBadge = user.user_role === 'admin' ? '🔴 Admin' : 
                            user.user_role === 'premium' ? '🟡 Premium' : 
                            '⚪ Free';
            console.log(`  ${index + 1}. ${user.email} (${roleBadge})`);
            console.log(`     UUID: ${user.id}\n`);
        });

        return new Promise((resolve) => {
            rl.question(`💡 Choisissez un utilisateur (1-${users.length}) ou entrez un UUID personnalisé : `, (answer) => {
                const choice = answer.trim();
                
                // Si c'est un nombre, utiliser l'index
                const index = parseInt(choice);
                if (!isNaN(index) && index >= 1 && index <= users.length) {
                    const selectedUser = users[index - 1];
                    console.log(`\n✅ Utilisation de : ${selectedUser.email} (${selectedUser.id})`);
                    rl.close();
                    resolve(selectedUser.id);
                } else if (choice.length > 0) {
                    // Sinon, considérer comme UUID
                    console.log(`\n✅ Utilisation de l'UUID : ${choice}`);
                    rl.close();
                    resolve(choice);
                } else {
                    // Par défaut, utiliser le premier
                    const defaultUser = users[0];
                    console.log(`\n✅ Utilisation par défaut : ${defaultUser.email} (${defaultUser.id})`);
                    rl.close();
                    resolve(defaultUser.id);
                }
            });
        });
    } else {
        console.log('\n⚠️  Aucun utilisateur trouvé dans Supabase.');
        console.log('💡 Vous devez d\'abord créer un utilisateur via l\'inscription sur votre site.');
        console.log('💡 Ou trouvez l\'UUID dans Supabase Dashboard > Authentication > Users');
        
        return new Promise((resolve) => {
            rl.question('\nEntrez l\'UUID de l\'utilisateur pour les données importées : ', (userId) => {
                rl.close();
                if (!userId.trim()) {
                    console.error('❌ UUID requis !');
                    process.exit(1);
                }
                resolve(userId.trim());
            });
        });
    }
}

/**
 * Exporte une collection Firestore
 */
async function exportCollection(collectionName) {
    console.log(`📦 Export de "${collectionName}" depuis Firebase...`);

    const snapshot = await getDocs(collection(db, collectionName));
    const data = [];

    snapshot.forEach((doc) => {
        const docData = doc.data();
        const cleanData = {};
        
        for (const [key, value] of Object.entries(docData)) {
            if (value && typeof value === 'object' && value.toDate) {
                cleanData[key] = value.toDate().toISOString();
            } else {
                cleanData[key] = value;
            }
        }

        data.push({
            firebase_id: doc.id,
            ...cleanData
        });
    });

    await mkdir('./exports', { recursive: true });
    await writeFile(
        `./exports/${collectionName}.json`,
        JSON.stringify(data, null, 2),
        'utf8'
    );

    console.log(`✅ ${data.length} documents exportés`);
    return data;
}

/**
 * Importe les recettes dans Supabase
 */
async function importRecipes(userId) {
    console.log('\n📥 Import des recettes...');

    const recipes = JSON.parse(await readFile('./exports/recipes.json', 'utf8'));
    const idMapping = {};
    let successCount = 0;
    let errorCount = 0;

    for (const recipe of recipes) {
        const { firebase_id, id, createdAt, ...data } = recipe;

        const recipeData = {
            user_id: userId,
            title: data.title || '',
            image: data.image || null,
            ingredients: data.ingredients || [],
            steps: data.steps || [],
            maman: data.maman || false,
            salt: data.salt !== false,
            created_at: createdAt || new Date().toISOString()
        };

        try {
            const { data: inserted, error } = await supabase
                .from('recipes')
                .insert(recipeData)
                .select('id')
                .single();

            if (error) {
                console.error(`  ❌ "${recipeData.title}":`, error.message);
                errorCount++;
            } else {
                idMapping[firebase_id || id] = inserted.id;
                successCount++;
                if (successCount % 10 === 0) {
                    console.log(`  ✅ ${successCount} recettes importées...`);
                }
            }
        } catch (err) {
            console.error(`  ❌ Exception pour "${recipeData.title}":`, err.message);
            errorCount++;
        }
    }

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
 */
async function importPlanning(userId, idMapping) {
    console.log('\n📥 Import du planning...');

    const planning = JSON.parse(await readFile('./exports/planning.json', 'utf8'));
    let successCount = 0;
    let errorCount = 0;

    for (const p of planning) {
        // Le jour est dans firebase_id (ex: "lundi", "mardi", etc.)
        const day = p.firebase_id || p.id || p.day;
        const firebaseRecipeId = p.recipeId || p.recipe_id;
        
        // Ignorer si pas de jour valide
        if (!day) {
            console.error(`  ⚠️  Entrée ignorée (pas de jour) :`, JSON.stringify(p));
            errorCount++;
            continue;
        }
        
        const planningData = {
            day: day,
            user_id: userId,
            recipe_id: firebaseRecipeId && idMapping[firebaseRecipeId] ? idMapping[firebaseRecipeId] : null,
            entries: p.entries || null
        };

        try {
            const { error } = await supabase
                .from('planning')
                .upsert(planningData, { onConflict: 'day,user_id' });

            if (error) {
                console.error(`  ❌ Jour ${day}:`, error.message);
                errorCount++;
            } else {
                successCount++;
                console.log(`  ✅ ${day}`);
            }
        } catch (err) {
            console.error(`  ❌ Exception pour ${day}:`, err.message);
            errorCount++;
        }
    }

    console.log(`✅ ${successCount} jours importés, ${errorCount} erreurs`);
}

/**
 * Importe la réception dans Supabase
 */
async function importReception(userId) {
    console.log('\n📥 Import de la réception...');

    const reception = JSON.parse(await readFile('./exports/reception.json', 'utf8'));
    
    if (reception.length === 0) {
        console.log('  ℹ️  Aucune donnée de réception');
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const r of reception) {
        const receptionData = {
            user_id: userId,
            data: r,
            created_at: r.createdAt || new Date().toISOString()
        };

        try {
            const { error } = await supabase
                .from('reception')
                .insert(receptionData);

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
async function importShoppingTotals(userId) {
    console.log('\n📥 Import de shopping_totals...');

    const shoppingTotals = JSON.parse(await readFile('./exports/shoppingTotals.json', 'utf8'));
    
    if (shoppingTotals.length === 0) {
        console.log('  ℹ️  Aucune donnée shopping_totals');
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const st of shoppingTotals) {
        const shoppingData = {
            user_id: userId,
            data: st,
            created_at: st.createdAt || new Date().toISOString()
        };

        try {
            const { error } = await supabase
                .from('shopping_totals')
                .insert(shoppingData);

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
async function importShoppingCustom(userId) {
    console.log('\n📥 Import de shopping_custom...');

    const shoppingCustom = JSON.parse(await readFile('./exports/shoppingCustom.json', 'utf8'));
    
    if (shoppingCustom.length === 0) {
        console.log('  ℹ️  Aucun article personnalisé');
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const sc of shoppingCustom) {
        const customData = {
            user_id: userId,
            item: sc.item || sc.name || '',
            checked: sc.checked || false,
            created_at: sc.createdAt || new Date().toISOString()
        };

        try {
            const { error } = await supabase
                .from('shopping_custom')
                .insert(customData);

            if (error) {
                console.error(`  ❌ "${customData.item}":`, error.message);
                errorCount++;
            } else {
                successCount++;
            }
        } catch (err) {
            console.error(`  ❌ Exception pour "${customData.item}":`, err.message);
            errorCount++;
        }
    }

    console.log(`✅ ${successCount} articles importés, ${errorCount} erreurs`);
}

/**
 * Affiche les instructions pour désactiver RLS
 */
function showRLSInstructions() {
    console.log('\n' + '═'.repeat(50));
    console.log('⚠️  IMPORTANT : Désactiver RLS avant l\'import');
    console.log('═'.repeat(50));
    console.log('\n📝 Étapes à suivre :\n');
    console.log('1. Allez sur Supabase Dashboard → SQL Editor');
    console.log('2. Copiez-collez ce SQL :\n');
    console.log('   ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;');
    console.log('   ALTER TABLE planning DISABLE ROW LEVEL SECURITY;');
    console.log('   ALTER TABLE reception DISABLE ROW LEVEL SECURITY;');
    console.log('   ALTER TABLE shopping_totals DISABLE ROW LEVEL SECURITY;');
    console.log('   ALTER TABLE shopping_custom DISABLE ROW LEVEL SECURITY;');
    console.log('\n3. Cliquez sur "Run" pour exécuter');
    console.log('4. Revenez ici et appuyez sur Entrée pour continuer l\'import\n');
    console.log('💡 Ou utilisez le script : scripts/disable_rls_for_import.sql\n');
}

/**
 * Processus complet d'import
 */
async function importAll() {
    console.log('🚀 Import Firebase → Supabase\n');
    console.log('═'.repeat(50));

    try {
        // 0. Vérifier si RLS est désactivé et afficher les instructions si nécessaire
        if (!supabaseServiceKey) {
            showRLSInstructions();
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            await new Promise((resolve) => {
                rl.question('Appuyez sur Entrée une fois que RLS est désactivé... ', () => {
                    rl.close();
                    resolve();
                });
            });
        }

        // 1. Exporter depuis Firebase
        console.log('\n📤 ÉTAPE 1 : Export depuis Firebase\n');
        await exportCollection('recipes');
        await exportCollection('planning');
        await exportCollection('reception');
        await exportCollection('shoppingTotals');
        await exportCollection('shoppingCustom');

        // 2. Obtenir le user_id
        console.log('\n\n👤 ÉTAPE 2 : Sélection de l\'utilisateur\n');
        const userId = await getUserId();
        console.log(`\n✅ Utilisation de l'utilisateur : ${userId}\n`);

        // 3. Importer dans Supabase
        console.log('📥 ÉTAPE 3 : Import dans Supabase\n');
        const idMapping = await importRecipes(userId);
        await importPlanning(userId, idMapping);
        await importReception(userId);
        await importShoppingTotals(userId);
        await importShoppingCustom(userId);

        console.log('\n' + '═'.repeat(50));
        console.log('🎉 Import terminé avec succès !');
        console.log('\n📝 Vérifiez les données dans Supabase Dashboard');
        console.log(`💡 Toutes les données ont été associées à l'utilisateur : ${userId}`);
        
        console.log('\n' + '═'.repeat(50));
        console.log('⚠️  IMPORTANT : Réactiver RLS après l\'import');
        console.log('═'.repeat(50));
        console.log('\n📝 Étapes à suivre :\n');
        console.log('1. Allez sur Supabase Dashboard → SQL Editor');
        console.log('2. Copiez-collez ce SQL :\n');
        console.log('   ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;');
        console.log('   ALTER TABLE planning ENABLE ROW LEVEL SECURITY;');
        console.log('   ALTER TABLE reception ENABLE ROW LEVEL SECURITY;');
        console.log('   ALTER TABLE shopping_totals ENABLE ROW LEVEL SECURITY;');
        console.log('   ALTER TABLE shopping_custom ENABLE ROW LEVEL SECURITY;');
        console.log('\n3. Cliquez sur "Run" pour exécuter');
        console.log('\n💡 Ou utilisez le script : scripts/enable_rls_after_import.sql\n');
    } catch (error) {
        console.error('\n❌ Erreur lors de l\'import:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Exécution
await importAll();

