// src/pages/api/delete-account.js
import { getAuthenticatedSupabase } from "../../lib/auth";

export async function DELETE({ request }) {
  try {
    // Récupérer un client Supabase authentifié
    const { supabase: authSupabase, user } = await getAuthenticatedSupabase(request);

    if (!authSupabase || !user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    console.log("Début de la suppression du compte pour l'utilisateur:", userId);

    // Supprimer toutes les données associées à l'utilisateur
    // Les contraintes CASCADE dans la base de données devraient gérer la plupart des suppressions
    // mais on supprime explicitement pour être sûr

    // Supprimer les recettes
    const { error: recipesError } = await authSupabase
      .from("recipes")
      .delete()
      .eq("user_id", userId);
    
    if (recipesError) {
      console.warn("Erreur lors de la suppression des recettes:", recipesError);
    }

    // Supprimer le planning
    const { error: planningError } = await authSupabase
      .from("planning")
      .delete()
      .eq("user_id", userId);
    
    if (planningError) {
      console.warn("Erreur lors de la suppression du planning:", planningError);
    }

    // Supprimer les totaux de courses
    const { error: shoppingTotalsError } = await authSupabase
      .from("shopping_totals")
      .delete()
      .eq("user_id", userId);
    
    if (shoppingTotalsError) {
      console.warn("Erreur lors de la suppression des totaux de courses:", shoppingTotalsError);
    }

    // Supprimer les items personnalisés de courses
    const { error: shoppingCustomError } = await authSupabase
      .from("shopping_custom")
      .delete()
      .eq("user_id", userId);
    
    if (shoppingCustomError) {
      console.warn("Erreur lors de la suppression des items personnalisés:", shoppingCustomError);
    }

    // Supprimer la réception
    const { error: receptionError } = await authSupabase
      .from("reception")
      .delete()
      .eq("user_id", userId);
    
    if (receptionError) {
      console.warn("Erreur lors de la suppression de la réception:", receptionError);
    }

    // Supprimer le profil utilisateur
    // La suppression du profil déclenchera CASCADE pour supprimer toutes les données associées
    // grâce aux contraintes ON DELETE CASCADE définies dans la base de données
    const { error: profileError, data: profileData } = await authSupabase
      .from("user_profiles")
      .delete()
      .eq("id", userId)
      .select();

    if (profileError) {
      console.error("Erreur lors de la suppression du profil:", profileError);
      return new Response(
        JSON.stringify({ 
          error: "Erreur lors de la suppression du profil",
          details: profileError.message,
          code: profileError.code
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Profil supprimé avec succès:", profileData);

    // Note: La suppression de l'utilisateur dans auth.users nécessite des droits admin
    // Les données sont déjà supprimées grâce à CASCADE. L'utilisateur devra contacter
    // le support pour supprimer complètement son compte auth, ou cela peut être fait
    // manuellement par un admin via le dashboard Supabase.

    return new Response(
      JSON.stringify({ 
        message: "Compte supprimé avec succès",
        success: true 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Erreur delete-account:", err);
    return new Response(
      JSON.stringify({ 
        error: "Une erreur est survenue lors de la suppression du compte",
        details: err.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

