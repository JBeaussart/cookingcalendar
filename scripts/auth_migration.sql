-- scripts/auth_migration.sql
-- Migration pour ajouter l'authentification et les niveaux d'utilisateurs

-- ============================================
-- Table: user_profiles
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  user_role TEXT NOT NULL DEFAULT 'free' CHECK (user_role IN ('admin', 'premium', 'free')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(user_role);

-- ============================================
-- Ajouter user_id aux tables existantes
-- ============================================

-- Recipes
-- Ajouter la colonne user_id
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Définir REPLICA IDENTITY si nécessaire (pour les tables avec réplication)
ALTER TABLE recipes REPLICA IDENTITY FULL;

-- Supprimer les recettes existantes sans user_id (elles ne sont pas associées à un utilisateur)
DELETE FROM recipes WHERE user_id IS NULL;

-- Remettre REPLICA IDENTITY à DEFAULT
ALTER TABLE recipes REPLICA IDENTITY DEFAULT;

CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);

-- Planning (changer la clé primaire pour inclure user_id)
-- Supprimer l'ancienne contrainte de clé primaire
ALTER TABLE planning DROP CONSTRAINT IF EXISTS planning_pkey;

-- Ajouter la colonne user_id (sera NULL pour les données existantes)
ALTER TABLE planning ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Définir REPLICA IDENTITY pour permettre les DELETE (nécessaire pour la réplication Supabase)
ALTER TABLE planning REPLICA IDENTITY FULL;

-- Supprimer toutes les données existantes sans user_id (elles ne sont pas associées à un utilisateur)
-- Ces données seront recréées par les utilisateurs lors de leur première utilisation
DELETE FROM planning WHERE user_id IS NULL;

-- Remettre REPLICA IDENTITY à DEFAULT (utilise la clé primaire)
-- On le fera après avoir créé la nouvelle clé primaire

-- Maintenant on peut créer la clé primaire composite
ALTER TABLE planning ADD PRIMARY KEY (day, user_id);
CREATE INDEX IF NOT EXISTS idx_planning_user_id ON planning(user_id);

-- Remettre REPLICA IDENTITY à DEFAULT (utilise maintenant la clé primaire composite)
ALTER TABLE planning REPLICA IDENTITY DEFAULT;

-- Reception
-- Ajouter la colonne user_id
ALTER TABLE reception ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Définir REPLICA IDENTITY si nécessaire
ALTER TABLE reception REPLICA IDENTITY FULL;

-- Supprimer les données existantes sans user_id
DELETE FROM reception WHERE user_id IS NULL;

-- Remettre REPLICA IDENTITY à DEFAULT
ALTER TABLE reception REPLICA IDENTITY DEFAULT;

CREATE INDEX IF NOT EXISTS idx_reception_user_id ON reception(user_id);

-- Shopping Totals
-- Ajouter la colonne user_id
ALTER TABLE shopping_totals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Définir REPLICA IDENTITY si nécessaire
ALTER TABLE shopping_totals REPLICA IDENTITY FULL;

-- Supprimer les données existantes sans user_id
DELETE FROM shopping_totals WHERE user_id IS NULL;

-- Remettre REPLICA IDENTITY à DEFAULT
ALTER TABLE shopping_totals REPLICA IDENTITY DEFAULT;

CREATE INDEX IF NOT EXISTS idx_shopping_totals_user_id ON shopping_totals(user_id);

-- Shopping Custom
-- Ajouter la colonne user_id
ALTER TABLE shopping_custom ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Définir REPLICA IDENTITY si nécessaire
ALTER TABLE shopping_custom REPLICA IDENTITY FULL;

-- Supprimer les données existantes sans user_id
DELETE FROM shopping_custom WHERE user_id IS NULL;

-- Remettre REPLICA IDENTITY à DEFAULT
ALTER TABLE shopping_custom REPLICA IDENTITY DEFAULT;

CREATE INDEX IF NOT EXISTS idx_shopping_custom_user_id ON shopping_custom(user_id);

-- ============================================
-- Fonction helper pour vérifier si un utilisateur est admin
-- Utilise SECURITY DEFINER pour bypass RLS et éviter la récursion
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_uuid AND user_role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- Fonction pour créer automatiquement un profil utilisateur
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, user_role)
  VALUES (NEW.id, NEW.email, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil lors de l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Mettre à jour les policies RLS
-- ============================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Allow all on recipes" ON recipes;
DROP POLICY IF EXISTS "Allow all on planning" ON planning;
DROP POLICY IF EXISTS "Allow all on reception" ON reception;
DROP POLICY IF EXISTS "Allow all on shopping_totals" ON shopping_totals;
DROP POLICY IF EXISTS "Allow all on shopping_custom" ON shopping_custom;

-- Activer RLS sur user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies pour user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = id);

-- Admins can view all profiles (utilise la fonction helper pour éviter la récursion)
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Policies pour recipes
CREATE POLICY "Users can view own recipes" ON recipes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own recipes" ON recipes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE USING (user_id = auth.uid());

-- Admins can do everything on recipes
CREATE POLICY "Admins can manage all recipes" ON recipes
  FOR ALL USING (public.is_admin(auth.uid()));

-- Policies pour planning
CREATE POLICY "Users can manage own planning" ON planning
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all planning" ON planning
  FOR ALL USING (public.is_admin(auth.uid()));

-- Policies pour reception
CREATE POLICY "Users can manage own reception" ON reception
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all reception" ON reception
  FOR ALL USING (public.is_admin(auth.uid()));

-- Policies pour shopping_totals
CREATE POLICY "Users can manage own shopping_totals" ON shopping_totals
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all shopping_totals" ON shopping_totals
  FOR ALL USING (public.is_admin(auth.uid()));

-- Policies pour shopping_custom
CREATE POLICY "Users can manage own shopping_custom" ON shopping_custom
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all shopping_custom" ON shopping_custom
  FOR ALL USING (public.is_admin(auth.uid()));

