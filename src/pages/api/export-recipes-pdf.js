// src/pages/api/export-recipes-pdf.js
import { getAuthenticatedSupabase, hasRole } from "../../lib/auth";
import { supabase } from "../../supabase";

export async function GET({ request }) {
  try {
    // Vérifier l'authentification
    const { supabase: authSupabase, user } = await getAuthenticatedSupabase(request);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Non authentifié" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier le rôle : seuls Premium et Admin peuvent exporter
    if (!hasRole(user, "premium")) {
      return new Response(
        JSON.stringify({ error: "Export PDF réservé aux utilisateurs Premium" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer les recettes de l'utilisateur
    const authenticatedSupabase = authSupabase || supabase;
    const { data: recipes, error: recipesError } = await authenticatedSupabase
      .from("recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("title", { ascending: true });

    if (recipesError) {
      console.error("Erreur récupération recettes:", recipesError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la récupération des recettes" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!recipes || recipes.length === 0) {
      return new Response(
        JSON.stringify({ error: "Aucune recette à exporter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Générer le PDF avec pdfkit
    // Utiliser createRequire pour importer pdfkit (CommonJS)
    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    const PDFDocument = require("pdfkit");

    // Créer le document PDF
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
    });

    // Créer un buffer pour stocker le PDF
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    // En-tête
    doc.fontSize(20).text("Mes Recettes", { align: "center" });
    doc.moveDown();

    // Parcourir les recettes
    recipes.forEach((recipe, index) => {
      // Nouvelle page pour chaque recette (sauf la première)
      if (index > 0) {
        doc.addPage();
      }

      // Titre de la recette
      doc.fontSize(18).text(recipe.title || "Sans titre", { underline: true });
      doc.moveDown(0.5);

      // Recette de maman
      if (recipe.maman) {
        doc.fontSize(12).text("👩 Recette de maman", { continued: false });
      }

      doc.moveDown();

      // Ingrédients
      if (recipe.ingredients && Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
        doc.fontSize(14).text("Ingrédients", { underline: true });
        doc.moveDown(0.3);

        recipe.ingredients.forEach((ing) => {
          let ingText = "";
          if (typeof ing === "string") {
            ingText = `• ${ing}`;
          } else if (ing && ing.item) {
            ingText = `• ${ing.item}`;
            if (ing.quantity !== undefined && ing.quantity !== null) {
              ingText += ` : ${ing.quantity}`;
              if (ing.unit) {
                ingText += ` ${ing.unit}`;
              }
            }
          }

          if (ingText) {
            doc.fontSize(11).text(ingText, { indent: 20 });
          }
        });

        doc.moveDown();
      }

      // Étapes de préparation
      if (recipe.steps && Array.isArray(recipe.steps) && recipe.steps.length > 0) {
        doc.fontSize(14).text("Préparation", { underline: true });
        doc.moveDown(0.3);

        recipe.steps.forEach((step, stepIndex) => {
          if (step && step.trim()) {
            doc.fontSize(11).text(`${stepIndex + 1}. ${step}`, { indent: 20 });
            doc.moveDown(0.2);
          }
        });
      }

      // Ligne de séparation
      doc.moveDown();
      doc.strokeColor("#cccccc").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
    });

    // Finaliser le PDF
    doc.end();

    // Attendre que le PDF soit complètement généré
    const pdfBuffer = await new Promise((resolve, reject) => {
      doc.on("end", () => {
        // Concaténer tous les chunks en un seul buffer
        resolve(Buffer.concat(chunks));
      });
      doc.on("error", reject);
    });

    // Retourner le PDF
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="mes-recettes-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erreur export PDF:", error);
    return new Response(
      JSON.stringify({ error: "Erreur lors de la génération du PDF" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

