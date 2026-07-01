# ✅ Guide d'activation ONE WAY (Firebase) — pas à pas

Les clés du projet **oneway-77f85** sont **déjà intégrées** dans l'app : tu n'as
**rien à saisir**, seulement 4 activations dans la console Firebase (~5 min).

Va sur **https://console.firebase.google.com** → projet **oneway-77f85**
(connecte-toi avec le compte Google propriétaire du projet).

---

## 1) Authentication — activer E-mail / Mot de passe
1. Menu de gauche : **Build → Authentication**.
2. Bouton **Commencer** (Get started) si demandé.
3. Onglet **Sign-in method** → **E-mail/Mot de passe** → **Activer** → **Enregistrer**.

## 2) Firestore — créer la base
1. Menu : **Build → Firestore Database** → **Créer une base de données**.
2. Emplacement : **eur3 (europe-west)** (ou le plus proche).
3. Mode : **production** → **Activer**.
4. Onglet **Règles** : **efface tout** et **colle** le contenu du fichier
   `mobile/firestore.rules` (voir le repo) → **Publier**.

## 3) Storage — pour les photos de preuve de livraison
1. Menu : **Build → Storage** → **Commencer** → **Suivant** → **OK** (mode production).
2. Onglet **Règles** : colle le contenu de `mobile/storage.rules` → **Publier**.

*(Sans cette étape, la livraison marche quand même : signature + nom + géoloc
sont conservés, seule la photo est ignorée.)*

## 4) Notifications (facultatif, pour plus tard)
Rien à faire maintenant : les notifications **locales** (bannières système
quand l'app tourne) fonctionnent déjà. Le vrai push « app fermée » viendra avec
Cloud Messaging + une Cloud Function (plan Blaze).

---

## C'est prêt ✅
Ouvre l'app → **Créer un compte** (Gérant, Chauffeur ou Client) → tout est
persistant. Le gérant partage son **code entreprise** (écran Flotte / Profil)
pour que les chauffeurs rejoignent la flotte.

### (Optionnel) Données de démonstration
Depuis un ordinateur avec Node :
```
cd mobile
npm i -D firebase-admin tsx
# Firebase → ⚙️ Paramètres du projet → Comptes de service → Générer une clé privée → serviceAccount.json
export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json
node --import tsx scripts/seed.ts
```
Crée : gérant **gerant**, chauffeurs **chauffeur** / **koto**, client **client**
(mot de passe **oneway123**), une flotte et 3 courses de démo (codes de suivi
**OWTOA01**, **OWANT02**, **OWMAH03**). Code entreprise démo : **OWDEMO**.
