-- scripts/add_delete_profile_policy.sql
-- Ajouter la policy pour permettre aux utilisateurs de supprimer leur propre profil

-- Policy pour permettre aux utilisateurs de supprimer leur propre profil
CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = id);

