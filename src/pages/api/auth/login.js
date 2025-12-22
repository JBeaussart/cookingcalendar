// src/pages/api/auth/login.js
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

    // Connecter l'utilisateur
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Récupérer le profil utilisateur avec le rôle
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
    }

    // Retourner les tokens dans les cookies
    const response = new Response(
      JSON.stringify({
        user: {
          ...data.user,
          role: profile?.user_role || "free",
        },
        message: "Connexion réussie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

    const maxAge = 60 * 60 * 24 * 7; // 7 jours
    response.headers.append(
      "Set-Cookie",
      `sb-access-token=${data.session.access_token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`
    );
    response.headers.append(
      "Set-Cookie",
      `sb-refresh-token=${data.session.refresh_token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`
    );

    return response;
  } catch (err) {
    console.error("Erreur login:", err);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

