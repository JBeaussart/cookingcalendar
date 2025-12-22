// src/lib/auth.js
import { createClient } from '@supabase/supabase-js';

/**
 * Récupère la session utilisateur depuis les cookies
 * @param {Request} request - La requête HTTP
 * @returns {Promise<{user: object | null, session: object | null}>}
 */
export async function getServerSession(request) {
  try {
    // Récupérer le token depuis les cookies
    const cookies = request.headers.get("cookie") || "";
    const accessToken = extractTokenFromCookies(cookies, "sb-access-token");
    const refreshToken = extractTokenFromCookies(cookies, "sb-refresh-token");

    if (!accessToken) {
      return { user: null, session: null, supabase: null };
    }

    // Créer un client Supabase avec le token
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { user: null, session: null, supabase: null };
    }

    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    // Vérifier la session
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser(accessToken);

    if (userError || !user) {
      return { user: null, session: null, supabase: null };
    }

    // Récupérer le profil utilisateur avec le rôle
    const { data: profile, error: profileError } = await client
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
    }

    return {
      user: {
        ...user,
        role: profile?.user_role || "free",
        user_role: profile?.user_role || "free", // Alias pour compatibilité
      },
      session: { access_token: accessToken, refresh_token: refreshToken },
      supabase: client, // Retourner le client pour réutilisation
    };
  } catch (error) {
    console.error("Error getting server session:", error);
    return { user: null, session: null, supabase: null };
  }
}

/**
 * Extrait un token depuis les cookies
 */
function extractTokenFromCookies(cookies, name) {
  const match = cookies.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Crée un client Supabase authentifié pour les endpoints API
 * Optimisé pour réutiliser le client créé dans getServerSession
 * @param {Request} request - La requête HTTP
 * @returns {Promise<{supabase: object, user: object | null}>}
 */
export async function getAuthenticatedSupabase(request) {
  const { user, session, supabase: existingClient } = await getServerSession(request);
  
  if (!user || !session) {
    return { supabase: null, user: null };
  }

  // Si on a déjà un client, on le réutilise
  if (existingClient) {
    return { supabase: existingClient, user };
  }

  // Sinon, on en crée un nouveau
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { supabase: null, user: null };
  }

  const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  });

  return { supabase: authenticatedClient, user };
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export function hasRole(user, role) {
  if (!user || !user.role) return false;
  
  const roleHierarchy = { admin: 3, premium: 2, free: 1 };
  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[role] || 0;
  
  return userLevel >= requiredLevel;
}

/**
 * Vérifie si l'utilisateur est admin
 */
export function isAdmin(user) {
  return hasRole(user, "admin");
}

/**
 * Vérifie si l'utilisateur est premium ou admin
 */
export function isPremiumOrAdmin(user) {
  return hasRole(user, "premium");
}

