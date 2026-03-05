SecureScan Backend

1.	Présentation
SecureScan est une plateforme interne pour CyberSafe Solutions, permettant d’analyser automatiquement la sécurité et la qualité du code source des projets.
Elle intègre des outils open-source (Semgrep, ESLint Security, npm audit…) et propose un workflow complet :
soumission → analyse → résultats → corrections → push Git.


2.	Stack technologique
Frontend :  React, HTML, CSS
Backend : Node.js, Express
Base de données : MySQL
Outils de sécurité intégrés : Semgrep, ESLint, npm audit



3.	Installation
Cloner le projet
  git clone https://github.com/SprigganTwelve/Hackaton-Scanner.git
  cd Hackaton-Scanner

Installer les dépendances
   npm install
   pip install semgrep
   npm install -g eslint
   npm audit

Configurer les variables d’environnement
   Créer un fichier .env à la racine et ajouter :
      DATABASE_URL="mysql://root:motdepasse@localhost:3306/secure_scann"



4.	Lancer l’application
   Lancer le backend
       cd backend
       node server.js
  
 Lancer le frontend
        cd frontend
        npm run dev


5.	Structure du projet
/backend
     /config             # Paramètres et connexion à la DB
     /controllers      # Logique des endpoints API(soumission, analyse, corrections) 
     /entities            # Objets métier (Project, Analysis)
     /enums            # Énumérations (OWASP Top 10, sévérité, types d’outils)
     /middlewares   # Fonctions intermédiaires (auth JWT, validation, erreurs)
     /repositories    # Accès à la base de données (CRUD, stockage des analyses)
     /ressources     # Bdd, diagrammes
     /routes            # Définition des endpoints HTTP et mapping vers les controllers
     /services         # Logique métier (corrections)
     /utils                # Fonctions utilitaires réutilisables (parsing, scoring, diff)
     /valueObjects  # Objets immuables représentant des données importantes

/frontend
      /public
      /src
      /assets            # Images, icônes, polices
      /components  # Formulaires 
      /layouts          # Header, Footer
      /pages           # Pages complètes correspondant aux routes(Home, Dashboard, Login, Register)
      /services       # Communication avec le backend
      App.css        # Styles globaux pour App.jsx
      App.jsx         # Composant racine contenant le routage principal
      index.css     # Styles globaux (reset, variables, typographie)
      main.jsx       # Point d’entrée principal de l’application



6.	Mapping OWASP Top 10 :  
![alt text](image.png)

7.	Outils intégrés

Semgrep, ESLint -> Analyse du code source pour détecter des patterns vulnérables.
Npm audit -> Scan des dépendances pour identifier les vulnérabilités.


