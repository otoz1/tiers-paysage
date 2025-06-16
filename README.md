# Tiers-Paysage

Ceci est un site informatif avec gestion de pages pour le projet du Tiers Paysage.

## Fonctionnalités
- **Page d'accueil** : liste des documents, bouton "En savoir plus" pour chaque document
- **Page de détail** : affiche le contenu formaté du document
- **Administration** :
  - Authentification par mot de passe
  - Ajout, suppression de pages avec formatage de texte.

## Installation

### 1. Cloner le répertoire
```bash
git clone https://github.com/otoz1/tiers-paysage
cd tiers-paysage
```

### 2. Installer le backend
```bash
cd backend
npm install
```

### 3. Installer le frontend
```bash
cd ../frontend
npm install
```

## Lancement du projet

### 1. Lancer le backend (API Express)
```bash
cd backend
node index.js
```
Le backend tourne sur http://localhost:4000

### 2. Lancer le frontend (React)
```bash
cd frontend
npm start
```
Le site est accessible sur http://localhost:3000

## Utilisation
- Sur http://localhost:3000 il y a la page d'accueil.
- Sur /admin pour ajouter/supprimer des pages (mot de passe par défaut : `admin123`).
- Les documents ajoutés via l'admin apparaissent automatiquement sur la page d'accueil.

---
![Screenshot1](https://myoctocat.com/assets/images/base-octocat.svg)
![Screenshot2](https://myoctocat.com/assets/images/base-octocat.svg)
![Screenshot3](https://myoctocat.com/assets/images/base-octocat.svg)
![Screenshot4](https://myoctocat.com/assets/images/base-octocat.svg)
