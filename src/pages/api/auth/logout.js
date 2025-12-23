// src/pages/api/auth/logout.js
import { supabase } from "../../../supabase";

export async function POST({ request }) {
  try {
    // Déconnecter l'utilisateur
    await supabase.auth.signOut();

    // Supprimer les cookies et rediriger vers la landing page
    const response = new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });

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
    // En cas d'erreur, rediriger quand même vers la landing page
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  }
}


