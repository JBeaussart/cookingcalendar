-- scripts/fix_rls_recursion.sql
-- Script pour corriger la récursion infinie dans les policies RLS

-- ============================================
-- Créer la fonction helper pour vérifier si un utilisateur est admin
-- Cette fonction utilise SECURITY DEFINER pour bypass RLS et éviter la récursion
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
-- Supprimer les anciennes policies qui causent la récursion
-- ============================================
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all recipes" ON recipes;
DROP POLICY IF EXISTS "Admins can manage all planning" ON planning;
DROP POLICY IF EXISTS "Admins can manage all reception" ON reception;
DROP POLICY IF EXISTS "Admins can manage all shopping_totals" ON shopping_totals;
DROP POLICY IF EXISTS "Admins can manage all shopping_custom" ON shopping_custom;

-- ============================================
-- Recréer les policies avec la fonction helper
-- ============================================

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Admins can do everything on recipes
CREATE POLICY "Admins can manage all recipes" ON recipes
  FOR ALL USING (public.is_admin(auth.uid()));

-- Admins can manage all planning
CREATE POLICY "Admins can manage all planning" ON planning
  FOR ALL USING (public.is_admin(auth.uid()));

-- Admins can manage all reception
CREATE POLICY "Admins can manage all reception" ON reception
  FOR ALL USING (public.is_admin(auth.uid()));

-- Admins can manage all shopping_totals
CREATE POLICY "Admins can manage all shopping_totals" ON shopping_totals
  FOR ALL USING (public.is_admin(auth.uid()));

-- Admins can manage all shopping_custom
CREATE POLICY "Admins can manage all shopping_custom" ON shopping_custom
  FOR ALL USING (public.is_admin(auth.uid()));


