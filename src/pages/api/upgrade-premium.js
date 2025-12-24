// src/pages/api/upgrade-premium.js
import { getAuthenticatedSupabase } from "../../lib/auth";

export async function POST({ request }) {
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
    const userRole = user.role || user.user_role;

    // Vérifier si l'utilisateur est déjà premium ou admin
    if (userRole === "premium" || userRole === "admin") {
      return new Response(
        JSON.stringify({ 
          error: "Vous êtes déjà Premium",
          message: "Vous avez déjà accès à la version Premium" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Ici, vous devriez normalement intégrer un système de paiement
    // (Stripe, PayPal, etc.) pour vérifier le paiement avant d'upgrader
    // Pour l'instant, on fait un upgrade direct (à remplacer par une vraie logique de paiement)
    
    // TODO: Intégrer la vérification de paiement ici
    // Exemple avec Stripe:
    // const { paymentIntentId } = await request.json();
    // const paymentVerified = await verifyPayment(paymentIntentId);
    // if (!paymentVerified) {
    //   return new Response(JSON.stringify({ error: "Paiement non vérifié" }), {
    //     status: 402,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    // Mettre à jour le rôle de l'utilisateur vers premium
    const { error: updateError } = await authSupabase
      .from("user_profiles")
      .update({ 
        user_role: "premium",
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Erreur lors de la mise à jour du rôle:", updateError);
      return new Response(
        JSON.stringify({ 
          error: "Erreur lors de la mise à jour du compte",
          details: updateError.message 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: "Félicitations ! Vous êtes maintenant Premium !",
        success: true 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Erreur upgrade-premium:", err);
    return new Response(
      JSON.stringify({ 
        error: "Une erreur est survenue lors de l'upgrade",
        details: err.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

