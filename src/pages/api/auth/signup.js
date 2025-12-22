// src/pages/api/auth/signup.js
import { supabase } from "../../../supabase";

export async function POST({ request }) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email et mot de passe requis" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Créer l'utilisateur
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Le profil utilisateur est créé automatiquement par le trigger
    // Retourner les tokens dans les cookies si on a une session
    const response = new Response(
      JSON.stringify({
        user: data.user,
        message: "Inscription réussie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

    // Si on a une session, on peut stocker les tokens
    if (data.session) {
      const maxAge = 60 * 60 * 24 * 7; // 7 jours
      response.headers.append(
        "Set-Cookie",
        `sb-access-token=${data.session.access_token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`
      );
      response.headers.append(
        "Set-Cookie",
        `sb-refresh-token=${data.session.refresh_token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`
      );
    }

    return response;
  } catch (err) {
    console.error("Erreur signup:", err);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

