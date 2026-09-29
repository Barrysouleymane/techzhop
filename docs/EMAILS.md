# E-mails TechZhop — configuration

## Ce qui est envoyé

| E-mail | Envoyé par | Quand |
|---|---|---|
| Bienvenue | serveur (Resend) | 1re connexion d'un nouveau compte |
| Confirmation de commande | serveur | paiement réussi |
| Suivi (en préparation / expédiée / livrée / annulée) | serveur | l'admin change le statut (si le client a gardé « Suivi des commandes » activé) |
| Rôle dans l'équipe | serveur | l'admin donne un rôle (page Équipe) |
| Nouvelle commande (pour toi) | serveur | chaque paiement — envoyé aux e-mails de `ADMIN_EMAILS` |
| Compte supprimé | serveur | le client supprime son compte |
| Confirmer l'e-mail / Mot de passe oublié / Invitation | Supabase | inscription, « mot de passe oublié », invitation d'équipe |

Tous les e-mails du serveur sont traduits en 6 langues (langue choisie par le client).

## 1. Créer un compte Resend (gratuit)
1. https://resend.com → **Sign up**.
2. **API Keys → Create API Key** → copier la clé (`re_...`).
3. Dans `backend/.env` :
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   EMAIL_FROM=TechZhop <onboarding@resend.dev>
   ADMIN_EMAIL_LANGUAGE=fr
   ```
4. Le serveur redémarre tout seul (nodemon).

⚠️ Avec `onboarding@resend.dev`, Resend n'envoie **qu'à ta propre adresse** (celle du compte Resend) : parfait pour tester.

## 2. Envoyer à tous les clients (nom de domaine)
1. Acheter un nom de domaine (ex. `techzhop.com`, ~10 $/an).
2. Resend → **Domains → Add domain** → ajouter les enregistrements DNS indiqués chez ton registrar.
3. Quand le domaine est « Verified », changer :
   ```
   EMAIL_FROM=TechZhop <contact@techzhop.com>
   ```

## 3. E-mails Supabase aux couleurs de TechZhop
### a) Passer par Resend (sinon Supabase limite à ~2 e-mails/heure)
Supabase → **Authentication → Emails → SMTP Settings → Enable custom SMTP** :
- Host : `smtp.resend.com` — Port : `465`
- Username : `resend` — Password : ta clé `re_...`
- Sender email : `contact@techzhop.com` (domaine vérifié) — Sender name : `TechZhop`

### b) Modèles
Supabase → **Authentication → Emails → Templates**, puis pour chaque modèle coller le contenu du fichier :
| Modèle Supabase | Fichier | Sujet conseillé |
|---|---|---|
| Confirm signup | `supabase/email-templates/confirm-signup.html` | `TechZhop — Confirm your email / Confirmez votre e-mail` |
| Reset password | `supabase/email-templates/reset-password.html` | `TechZhop — Reset your password / Mot de passe` |
| Invite user | `supabase/email-templates/invite-user.html` | `TechZhop — Team invitation / Invitation` |

### c) Adresses autorisées
Supabase → **Authentication → URL Configuration → Redirect URLs** : ajouter
`http://localhost:5173/reset-password` et `http://localhost:5173/account`
(puis les mêmes avec ton vrai domaine quand le site sera en ligne).
