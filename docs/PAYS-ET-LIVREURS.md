# 🌍 Pays, paiement à la livraison et livreurs

TechZhop vend aux **USA 🇺🇸** (carte bancaire) et en **Guinée 🇬🇳** (carte bancaire ou Orange Money / MTN **payés avant la livraison**, livreurs TechZhop à Conakry).
Tout se règle dans **Admin → Boutique → Pays**, sans toucher au code.

## 1. Activer (une seule fois)

1. Supabase → **SQL Editor** → coller et exécuter `supabase/migrations/20260930_countries.sql`, puis `20260930b_finances.sql` et `20260930c_momo.sql`.
2. Dans le dossier `mobile` : `npx expo install expo-location` (pour le bouton « Utiliser ma position »).
3. Envoyer sur GitHub (`git push`) → Render et Vercel se mettent à jour tout seuls.

## 2. Régler les pays — Admin → Boutique → Pays

| Réglage | USA | Guinée |
|---|---|---|
| Ouvert | ✅ | ✅ |
| Devise / taux | USD | GNF — `1 USD = 8600` (à mettre à jour toi-même) |
| Paiement | Carte | Carte + Orange Money / MTN (payé avant la livraison) |
| Stock propre | non (entrepôt principal) | ✅ oui — stock de Conakry |
| Nos propres livreurs | option (ex. `NY`) | ✅ zones : `Conakry` |
| Délai | 0 = délai général | 1 à 3 jours |

➡️ Le **taux GNF** que tu mets ici est celui affiché aux clients **et** celui que le livreur encaisse (arrondi à 500 GNF).
➡️ Pour ajouter plus tard le Sénégal ou la Côte d'Ivoire : « Ajouter le pays », devise XOF.

## 2 bis. Orange Money / MTN (payé en ligne, avant la livraison)

Admin → Boutique → Pays → Guinée → coche **Orange Money / MTN** → remplis tes **numéros marchands** (ex. Orange Money `+224 6xx…`, MTN `+224 66x…`) et le **nom du compte** → Enregistrer.

1. Le client choisit Orange Money / MTN → le site affiche **ton numéro + le montant exact en GNF**.
2. Il envoie l'argent depuis son téléphone, puis tape le **code de transaction** reçu par SMS → la commande est créée « Paiement en cours de vérification ».
3. Tu reçois l'e-mail « Nouvelle commande ». Tu vérifies sur ton compte Orange Money / MTN que l'argent est arrivé (même montant, même code).
4. Admin → la commande → **Paiement reçu — confirmer** (ou **Paiement introuvable — annuler** : le stock est remis et le client prévenu).
5. Seulement après, tu assignes un livreur. **Un livreur ne peut pas valider la livraison d'une commande non payée.**

Le **paiement à la livraison** existe toujours, mais il est désactivé par défaut (risque de refus à la porte). Coche-le seulement si tu le veux.

## 3. Mettre du stock en Guinée

Admin → Produits → un produit → **Stock – Guinée**. Un produit à 0 en Guinée s'affiche « Rupture de stock » pour les clients guinéens.

## 4. Ajouter un livreur

Admin → **Équipe** → e-mail du livreur → rôle **Livreur** → pays **Guinée** → Ajouter.
Il reçoit un e-mail pour créer son mot de passe. Demande-lui de mettre **son nom et son téléphone** dans son profil.
Dans l'app (ou sur le site), il voit un onglet **Livraisons** — et rien d'autre de l'admin.

Tu peux aussi limiter un **vendeur** à un pays : ton gérant à Conakry ne verra que les commandes de Guinée.

## 5. Une commande en Guinée, étape par étape

1. **Client** : adresse avec quartier + point de repère + téléphone (+ position GPS) → « Paiement à la livraison » → *Passer la commande*.
   Il reçoit l'e-mail de confirmation avec le montant en GNF, et voit son **code à 4 chiffres** dans l'app.
2. **Toi / gérant** : Admin → la commande → **Livreur : Mamadou**. Le livreur reçoit une notification.
3. **Livreur** : *Récupérée au magasin* → *Je pars livrer* (le client est prévenu : « Mamadou arrive, code 4821 »)
   → chez le client : appelle / WhatsApp / carte → demande le **code** → coche **« J'ai encaissé 10 311 500 GNF »** (espèces ou Mobile Money) → photo (facultatif) → **Confirmer la livraison**.
4. La commande passe **Livrée** + **Payée**. Tu vois tout dans l'admin (photo, mode d'encaissement).

## Plus tard

- Paiement en ligne Orange Money / MTN (CinetPay, PayDunya…) : demande une entreprise enregistrée en Guinée.
- Position du livreur en direct sur une carte.
