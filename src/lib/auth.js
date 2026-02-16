// src/lib/auth.js
import { createClient } from '@supabase/supabase-js';

/**
 * Récupère la session utilisateur depuis les cookies
 * Rafraîchit automatiquement les tokens expirés si un refresh token est disponible
 * @param {Request} request - La requête HTTP
 * @returns {Promise<{user: object | null, profile: object | null, session: object | null, supabase: object | null, refreshed: boolean, newTokens: object | null}>}
 */
export async function getServerSession(request) {
  try {
    // Récupérer le token depuis les cookies
    const cookies = request.headers.get("cookie") || "";
    let accessToken = extractTokenFromCookies(cookies, "sb-access-token");
    let refreshToken = extractTokenFromCookies(cookies, "sb-refresh-token");

    if (!accessToken && !refreshToken) {
      return { user: null, profile: null, session: null, supabase: null, refreshed: false, newTokens: null };
    }

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { user: null, profile: null, session: null, supabase: null, refreshed: false, newTokens: null };
    }

    // Créer un client Supabase de base (sans token pour le refresh)
    const baseClient = createClient(supabaseUrl, supabaseAnonKey);

    let client;
    let user;
    let userError = null;
    let tokensRefreshed = false;
    let newTokens = null;

    // Si on a un access token, essayer de l'utiliser
    if (accessToken) {
      client = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      });

      // Vérifier la session
      const result = await client.auth.getUser(accessToken);
      user = result.data?.user;
      userError = result.error;
    }

    // Si le token est expiré ou invalide, essayer de rafraîchir avec le refresh token
    if (userError || !user) {
      if (refreshToken) {
        try {
          // Rafraîchir la session avec le refresh token
          const { data: refreshData, error: refreshError } = await baseClient.auth.refreshSession({
            refresh_token: refreshToken,
          });

          if (!refreshError && refreshData?.session) {
            // Mettre à jour les tokens
            accessToken = refreshData.session.access_token;
            refreshToken = refreshData.session.refresh_token;
            tokensRefreshed = true;
            newTokens = {
              access_token: accessToken,
              refresh_token: refreshToken,
            };

            // Créer un nouveau client avec le token rafraîchi
            client = createClient(supabaseUrl, supabaseAnonKey, {
              global: {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              },
            });

            // Vérifier la session avec le nouveau token
            const result = await client.auth.getUser(accessToken);
            user = result.data?.user;
            userError = result.error;
          } else {
            // Le refresh token est aussi expiré, déconnexion nécessaire
            console.error("Refresh token expired or invalid:", refreshError);
            return { user: null, profile: null, session: null, supabase: null, refreshed: false, newTokens: null };
          }
        } catch (refreshErr) {
          console.error("Error refreshing session:", refreshErr);
          return { user: null, profile: null, session: null, supabase: null, refreshed: false, newTokens: null };
        }
      } else {
        // Pas de refresh token disponible
        return { user: null, profile: null, session: null, supabase: null, refreshed: false, newTokens: null };
      }
    }

    // Si toujours pas d'utilisateur après refresh, retourner null
    if (!user) {
      return { user: null, profile: null, session: null, supabase: null, refreshed: false, newTokens: null };
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
      profile, // Exposer le profil complet pour éviter un re-fetch
      session: { access_token: accessToken, refresh_token: refreshToken },
      supabase: client, // Retourner le client pour réutilisation
      refreshed: tokensRefreshed, // Indiquer si les tokens ont été rafraîchis
      newTokens: newTokens, // Nouveaux tokens à mettre à jour dans les cookies
    };
  } catch (error) {
    console.error("Error getting server session:", error);
    return { user: null, profile: null, session: null, supabase: null, refreshed: false, newTokens: null };
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
 * Met à jour les cookies de session dans une réponse
 * @param {Response} response - La réponse HTTP
 * @param {object} tokens - Les nouveaux tokens { access_token, refresh_token }
 * @returns {Response} La réponse avec les cookies mis à jour
 */
export function setSessionCookies(response, tokens) {
  if (!tokens || !tokens.access_token || !tokens.refresh_token) {
    return response;
  }

  // Durée de vie des cookies : 30 jours (au lieu de 7)
  const maxAge = 60 * 60 * 24 * 30; // 30 jours
  
  // Déterminer si on est en HTTPS (production)
  const isSecure = import.meta.env.PROD || import.meta.env.PUBLIC_SUPABASE_URL?.startsWith('https://');
  const secureFlag = isSecure ? '; Secure' : '';

  response.headers.append(
    "Set-Cookie",
    `sb-access-token=${tokens.access_token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secureFlag}`
  );
  response.headers.append(
    "Set-Cookie",
    `sb-refresh-token=${tokens.refresh_token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secureFlag}`
  );

  return response;
}

/**
 * Crée un client Supabase authentifié pour les endpoints API
 * IMPORTANT: Cette fonction est un alias de getServerSession pour les APIs
 * Pour éviter les doubles appels, utilisez getServerSession directement dans les pages
 * @param {Request} request - La requête HTTP
 * @returns {Promise<{supabase: object, user: object | null}>}
 */
export async function getAuthenticatedSupabase(request) {
  const { user, supabase: existingClient } = await getServerSession(request);
  return { supabase: existingClient, user };
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
