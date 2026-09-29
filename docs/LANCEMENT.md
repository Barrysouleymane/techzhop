# 🚀 Lancer TechZhop — la checklist

Tout ce qu'il faut faire, dans l'ordre, pour passer de « ça marche sur mon Mac » à « les clients achètent ».
Coche au fur et à mesure.

---

## 0. Tout de suite (5 min)

- [ ] **Supabase → SQL Editor** : coller et exécuter `supabase/migrations/20260929e_returns.sql`
      (active les annulations, retours et remboursements).
- [ ] Vérifier que les autres fichiers de `supabase/migrations/` ont bien été exécutés (roles, lock_tables, store_features).

---

## 1. Entreprise et légal (le plus long — commence tôt)

- [ ] **Statut d'entreprise** (ex. LLC dans l'État de New York) + numéro **EIN** (gratuit sur irs.gov).
- [ ] **Taxe de vente** : pour vendre à New York il faut un *Certificate of Authority* (NY Department of Taxation, gratuit).
      Ensuite : Admin → Boutique → Taxes → activer et mettre `US / NY / 8.875` (et les autres États si besoin).
- [ ] **Compte bancaire professionnel** (Stripe versera l'argent dessus).
- [ ] **Pages légales** : ajouter dans `shared/locales/*.json` (sections `legal.terms` et `legal.privacy`) le nom de l'entreprise,
      l'adresse, l'e-mail de contact et **l'adresse où les clients renvoient les retours**.
- [ ] Choisir un vrai e-mail de support (ex. `support@techzhop.com`) et un numéro WhatsApp.

> Je ne suis pas avocat ni comptable : fais valider les pages légales et la taxe de vente par un professionnel.

---

## 2. Nom de domaine (≈ 10–15 $/an)

- [ ] Acheter `techzhop.com` (Namecheap, Cloudflare, Google/Squarespace Domains…).
- Tu utiliseras :
  - `techzhop.com` → le site (Vercel)
  - `api.techzhop.com` → le serveur (Render)

---

## 3. Mettre le serveur en ligne — Render (≈ 7 $/mois)

1. render.com → **New → Blueprint** → choisir le dépôt GitHub `techzhop` (le fichier `render.yaml` est déjà prêt).
2. Remplir les variables :

| Variable | Valeur |
|---|---|
| `FRONTEND_URL` | `https://techzhop.com,https://www.techzhop.com` |
| `STRIPE_SECRET_KEY` | clé **live** `sk_live_…` (étape 5) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` (étape 5) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | comme dans `backend/.env` |
| `ADMIN_EMAILS` | ton e-mail |
| `RESEND_API_KEY` / `EMAIL_FROM` | `re_…` / `TechZhop <noreply@techzhop.com>` |

3. Settings → Custom Domain → `api.techzhop.com` (Render te donne l'enregistrement DNS à ajouter).
4. Vérifier : `https://api.techzhop.com/health` doit répondre `"success": true`.

> Le plan gratuit de Render « s'endort » après 15 min : le 1er client attendrait ~1 min. Prends le plan payant pour le lancement.

---

## 4. Mettre le site en ligne — Vercel (gratuit)

1. vercel.com → **Add New → Project** → dépôt `techzhop` (le fichier `vercel.json` est prêt).
2. Environment Variables :

| Variable | Valeur |
|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | comme dans `.env` |
| `VITE_API_URL` | `https://api.techzhop.com` |
| `VITE_SITE_URL` | `https://techzhop.com` |
| `VITE_SUPPORT_EMAIL` / `VITE_SUPPORT_WHATSAPP` | tes contacts |

3. Settings → Domains → ajouter `techzhop.com` et `www.techzhop.com`.
4. Le site génère tout seul `robots.txt` ; le plan du site pour Google est sur `https://api.techzhop.com/sitemap.xml`.
5. **Google Search Console** → ajouter `techzhop.com` → Sitemaps → coller l'adresse du sitemap.

---

## 5. Stripe en mode réel

- [ ] Stripe → **Activer le compte** (infos entreprise, EIN, compte bancaire).
- [ ] Developers → API keys → copier `sk_live_…` dans Render.
- [ ] Developers → **Webhooks → Add endpoint** :
      URL `https://api.techzhop.com/stripe-webhook`, événement `checkout.session.completed`
      → copier le *Signing secret* `whsec_…` dans Render.
- [ ] Les **codes promo** créés en mode test n'existent pas en mode réel : les recréer dans Admin → Promos.
- [ ] Faire **un vrai achat** avec ta carte (petit produit), puis le **rembourser** depuis Admin → la commande → Remboursement.

---

## 6. Supabase

- [ ] Authentication → URL Configuration :
      *Site URL* = `https://techzhop.com` ; *Redirect URLs* = `https://techzhop.com/reset-password`, `https://techzhop.com/account`.
- [ ] Authentication → SMTP (Resend) + les 3 modèles de `supabase/email-templates/` (voir `docs/EMAILS.md`).
- [ ] **Plan Pro (25 $/mois) recommandé** : le plan gratuit **met le projet en pause** après une semaine sans activité
      (c'est ce qui t'est arrivé) et n'a pas de sauvegardes quotidiennes.

---

## 7. E-mails — Resend

- [ ] Resend → Domains → ajouter `techzhop.com` et copier les enregistrements DNS.
- [ ] `EMAIL_FROM=TechZhop <noreply@techzhop.com>` dans Render.

---

## 8. L'app sur l'App Store et Google Play

| | Coût | Lien |
|---|---|---|
| Apple Developer | 99 $/an | developer.apple.com |
| Google Play Console | 25 $ une fois | play.google.com/console |

Dans le terminal, dossier `mobile` :

```bash
npx eas-cli@latest login
npx eas-cli@latest init          # relie le projet à ton compte Expo « techzhop »
npx eas-cli@latest env:create --name EXPO_PUBLIC_API_URL --value https://api.techzhop.com --environment production
npx eas-cli@latest env:create --name EXPO_PUBLIC_WEB_URL --value https://techzhop.com --environment production
npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_URL --value <ton url> --environment production
npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <ta clé anon> --environment production
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest submit -p ios
```

(`eas.json` est prêt. Pour Android : mêmes commandes avec `-p android`.)

Apple demandera :
- [ ] URL de la politique de confidentialité → `https://techzhop.com/privacy`
- [ ] URL du support → `https://techzhop.com/help`
- [ ] Captures d'écran (iPhone 6,7″ et 6,5″)
- [ ] **Un compte de démonstration** (e-mail + mot de passe) pour le testeur Apple
- [ ] Suppression de compte dans l'app ✅ (déjà faite)

---

## 9. Contenu de la boutique

- [ ] Vrais produits : photos (fond blanc), descriptions, prix, **stock réel**, catégories, marques.
- [ ] Supprimer / passer en brouillon les produits de test.
- [ ] Bannières et barre promo à jour.
- [ ] Frais de livraison et délais réalistes (Admin → Boutique).

---

## 10. Tests finaux (sur le vrai site et l'app installée)

- [ ] Créer un compte → e-mail de bienvenue reçu
- [ ] Mot de passe oublié → e-mail reçu → nouveau mot de passe OK
- [ ] Commander → paiement → e-mail de confirmation + alerte admin
- [ ] Admin : Expédiée + numéro de suivi → e-mail + notification au client
- [ ] Client : demander une annulation → admin : Accepter et rembourser → e-mail de remboursement
- [ ] Livrée → client : Retourner des articles → admin : Accepter (avec l'adresse de retour) → puis Rembourser
- [ ] Changer la langue, la devise, le thème clair/sombre
- [ ] Sur téléphone : site + app

---

## 💰 Budget mensuel estimé

| Service | Prix |
|---|---|
| Domaine | ~1 $/mois (≈ 12 $/an) |
| Render (serveur) | ~7 $ |
| Supabase Pro | 25 $ |
| Vercel, Resend (3 000 e-mails/mois), Expo | 0 $ |
| Apple Developer | ~8 $/mois (99 $/an) |
| Stripe | ~2,9 % + 0,30 $ par vente |

*Prix indicatifs, à vérifier sur les sites de chaque service.*
