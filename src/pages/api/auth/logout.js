// src/pages/api/auth/logout.js
import { supabase } from "../../../supabase";

export async function POST({ request }) {
  try {
    // Déconnecter l'utilisateur
    await supabase.auth.signOut();

    // Supprimer les cookies
    const response = new Response(
      JSON.stringify({ message: "Déconnexion réussie" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

    response.headers.append(
      "Set-Cookie",
      "sb-access-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
    );
    response.headers.append(
      "Set-Cookie",
      "sb-refresh-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
    );

    return response;
  } catch (err) {
    console.error("Erreur logout:", err);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

