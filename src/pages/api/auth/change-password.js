// src/pages/api/auth/change-password.js
import { getServerSession } from "../../../lib/auth";
import { supabase } from "../../../supabase";
import { createClient } from '@supabase/supabase-js';

export async function POST({ request }) {
  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ error: "L'ancien mot de passe et le nouveau mot de passe sont requis" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Le nouveau mot de passe doit contenir au moins 6 caractères" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier que l'utilisateur est connecté
    const { user } = await getServerSession(request);

    if (!user || !user.email) {
      return new Response(
        JSON.stringify({ error: "Non authentifié" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier l'ancien mot de passe en essayant de se connecter
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError || !signInData.session) {
      return new Response(
        JSON.stringify({ error: "L'ancien mot de passe est incorrect" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Créer un client Supabase avec la session de vérification
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Configuration serveur manquante" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey);

    // Définir la session sur le client
    const { error: setSessionError } = await authenticatedClient.auth.setSession({
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
    });

    if (setSessionError) {
      console.error("Erreur setSession:", setSessionError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'authentification" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Mettre à jour le mot de passe avec la session vérifiée
    const { error: updateError } = await authenticatedClient.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message || "Erreur lors de la mise à jour du mot de passe" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: "Mot de passe modifié avec succès" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Erreur change-password:", err);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

