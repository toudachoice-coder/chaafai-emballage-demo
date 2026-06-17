# Chaafai Emballage — Démo

> Solutions d'emballage pour professionnels

Prototype de système de gestion (ERP) pour **Chaafai Emballage**, une entreprise
de vente de produits d'emballage et de fournitures professionnelles.

⚠️ **Démo uniquement.** Aucune base de données externe, aucun backend.
Toutes les données sont des données de démonstration stockées dans le
`localStorage` du navigateur. Pas de Supabase, pas d'API.

## Stack technique

- **Next.js 14** (App Router, export statique)
- **TypeScript**
- **Tailwind CSS**
- **lucide-react** (icônes)
- Persistance : **localStorage** (100 % côté client)
- Déploiement : **Netlify** (`netlify.toml` inclus, dossier publié : `out`)

## Modules de cette phase

Cette première version livre :

1. **Configuration du projet**
2. **Mise en page globale** (layout, typographie, espacements)
3. **Logo & identité visuelle** (logo SVG carton + charte de couleurs)
4. **Sidebar + Header** (navigation responsive)
5. **Couche de données / localStorage** (seed démo + opérations métier)
6. **Tableau de bord** (KPIs, alertes stock bas, factures impayées, mouvements)
7. **Module Produits** (recherche, filtres, tri, ajout/édition/suppression,
   catégories dynamiques)

Les autres modules (Achats, Ventes, Frais, Stock, Factures, Clients,
Fournisseurs, Rapports) apparaissent dans la navigation avec la mention
« Bientôt » et seront construits dans les phases suivantes.

## Règles métier déjà câblées

- Un **achat** augmente le stock ; une **vente** le diminue.
- Toute variation de stock crée un **mouvement de stock**.
- Le **bénéfice estimé** = Ventes − Achats − Frais.
- **Alertes de stock bas** quand `stock ≤ seuil minimum`.
- **Factures impayées** mises en évidence sur le tableau de bord.

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000

## Build de production

```bash
npm run build      # génère le site statique dans ./out
```

## Déploiement Netlify

Le fichier `netlify.toml` est déjà configuré :

- Commande de build : `npm run build`
- Dossier publié : `out`

Connectez le dépôt à Netlify : le déploiement fonctionne sans configuration
supplémentaire.

## Réinitialiser les données de démo

Un bouton **« Réinitialiser la démo »** dans le header restaure les données
de démonstration d'origine (efface le `localStorage`).
