-- scripts/supabase_schema.sql
-- Schéma SQL pour créer les tables Supabase

-- ============================================
-- Table: recipes
-- ============================================
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps JSONB DEFAULT '[]'::jsonb,
  maman BOOLEAN DEFAULT false,
  salt BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes(title);
CREATE INDEX IF NOT EXISTS idx_recipes_maman ON recipes(maman);
CREATE INDEX IF NOT EXISTS idx_recipes_salt ON recipes(salt);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);

-- ============================================
-- Table: planning
-- ============================================
CREATE TABLE IF NOT EXISTS planning (
  day TEXT PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  entries JSONB DEFAULT NULL
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_planning_recipe_id ON planning(recipe_id);

-- ============================================
-- Table: reception
-- ============================================
CREATE TABLE IF NOT EXISTS reception (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_reception_created_at ON reception(created_at DESC);

-- ============================================
-- Table: shopping_totals
-- ============================================
CREATE TABLE IF NOT EXISTS shopping_totals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_shopping_totals_created_at ON shopping_totals(created_at DESC);

-- ============================================
-- Table: shopping_custom
-- ============================================
CREATE TABLE IF NOT EXISTS shopping_custom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item TEXT NOT NULL,
  checked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_shopping_custom_checked ON shopping_custom(checked);
CREATE INDEX IF NOT EXISTS idx_shopping_custom_created_at ON shopping_custom(created_at DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
-- Note: À adapter selon vos besoins d'authentification
-- Pour l'instant, on autorise tout en lecture/écriture

-- Activer RLS sur toutes les tables
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE reception ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_custom ENABLE ROW LEVEL SECURITY;

-- Policies pour permettre toutes les opérations (à ajuster selon vos besoins)
-- ATTENTION: Ces policies sont très permissives, à sécuriser en production !

-- Recipes
CREATE POLICY "Allow all on recipes" ON recipes
  FOR ALL USING (true) WITH CHECK (true);

-- Planning
CREATE POLICY "Allow all on planning" ON planning
  FOR ALL USING (true) WITH CHECK (true);

-- Reception
CREATE POLICY "Allow all on reception" ON reception
  FOR ALL USING (true) WITH CHECK (true);

-- Shopping Totals
CREATE POLICY "Allow all on shopping_totals" ON shopping_totals
  FOR ALL USING (true) WITH CHECK (true);

-- Shopping Custom
CREATE POLICY "Allow all on shopping_custom" ON shopping_custom
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Commentaires sur les tables
-- ============================================
COMMENT ON TABLE recipes IS 'Stocke toutes les recettes de cuisine';
COMMENT ON TABLE planning IS 'Planning des repas par jour';
COMMENT ON TABLE reception IS 'Données de réception';
COMMENT ON TABLE shopping_totals IS 'Liste de courses agrégée';
COMMENT ON TABLE shopping_custom IS 'Articles personnalisés dans la liste de courses';
