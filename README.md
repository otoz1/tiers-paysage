# Tiers-Paysage

Ce projet est un site informatif avec gestion de documents/pages via une interface d'administration.

## Fonctionnalités
- **Page d'accueil** : liste des documents, bouton "En savoir +" pour chaque document
- **Page de détail** : affiche le contenu formaté du document
- **Administration** :
  - Authentification par mot de passe
  - Ajout, suppression de documents (pages) avec éditeur riche (gras, italique, etc.)

## Installation

### 1. Cloner le dépôt
```bash
git clone https://github.com/otoz1/tiers-paysage.git
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
- Accédez à http://localhost:3000 pour voir la page d'accueil.
- Accédez à /admin pour ajouter/supprimer des documents (mot de passe par défaut : `admin123`).
- Les documents ajoutés via l'admin apparaissent automatiquement sur la page d'accueil.

## Dépannage
- Si une dépendance refuse de s'installer (ex : `react-quill`), essayez :
  ```bash
  npm install <package> --legacy-peer-deps
  ```
- Si vous avez un problème de connexion npm, vérifiez votre réseau ou réessayez plus tard.

## Git : pousser vos modifications

Pour forcer la mise à jour de la branche `main` sur GitHub (⚠️ cela écrase l'historique distant) :
```bash
git add .
git commit -m "Votre message"
git branch -M main
git push -f origin main
```

---