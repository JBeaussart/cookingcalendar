# 📧 Désactiver la Confirmation d'Email dans Supabase

Pour que les utilisateurs n'aient pas besoin de confirmer leur email lors de l'inscription, vous devez désactiver cette fonctionnalité dans le dashboard Supabase.

## 🔧 Étapes

1. **Connectez-vous à votre dashboard Supabase** : https://app.supabase.com
2. **Sélectionnez votre projet**
3. **Allez dans "Authentication"** (menu de gauche)
4. **Cliquez sur "Providers"** dans le sous-menu
5. **Trouvez "Email"** dans la liste des providers
6. **Cliquez sur "Email"** pour ouvrir les paramètres
7. **Désactivez "Confirm email"** :
   - Décochez la case "Enable email confirmations"
   - Ou mettez "Confirm email" à "OFF"
8. **Sauvegardez** les modifications

## ✅ Résultat

Après cette configuration :
- ✅ Les utilisateurs seront automatiquement connectés après l'inscription
- ✅ Aucun email de confirmation ne sera envoyé
- ✅ La session sera créée immédiatement
- ✅ Redirection automatique vers `/planning`

## ⚠️ Note de Sécurité

Désactiver la confirmation d'email réduit la sécurité car :
- N'importe qui peut créer un compte avec n'importe quel email
- Les emails invalides peuvent être utilisés

Pour un environnement de production, vous pourriez vouloir :
- Activer la confirmation d'email
- Ou utiliser d'autres méthodes de vérification (SMS, OAuth, etc.)

## 🔄 Alternative : Confirmation d'Email Optionnelle

Si vous voulez garder la confirmation d'email mais permettre l'utilisation immédiate :
- Laissez "Confirm email" activé
- Les utilisateurs pourront utiliser l'application mais avec des limitations
- Ils recevront un email pour confirmer leur compte

