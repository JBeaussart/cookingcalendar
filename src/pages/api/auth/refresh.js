// src/pages/api/auth/refresh.js
import { getServerSession, setSessionCookies } from "../../../lib/auth";

export async function POST({ request }) {
  try {
    // getServerSession va automatiquement rafraîchir les tokens si nécessaire
    const { user, session, refreshed, newTokens } = await getServerSession(request);

    if (!user || !session) {
      return new Response(
        JSON.stringify({ error: "Session invalide ou expirée" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const response = new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        refreshed: refreshed,
        message: refreshed ? "Session rafraîchie" : "Session valide",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

    // Si les tokens ont été rafraîchis, mettre à jour les cookies
    if (refreshed && newTokens) {
      setSessionCookies(response, newTokens);
    }

    return response;
  } catch (err) {
    console.error("Erreur refresh:", err);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}


