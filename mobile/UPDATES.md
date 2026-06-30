# 🔄 Mises à jour de l'app ONE WAY (sans retélécharger à l'aveugle)

L'app vérifie au démarrage un manifeste `mobile/latest.json` (hébergé sur
GitHub). Si une version plus récente y est annoncée, un **bandeau « Mise à jour
disponible »** apparaît avec un bouton **« Mettre à jour »** qui ouvre le
téléchargement du nouvel APK en 1 tap.

Toutes les APK sont signées avec la **même clé** (`credentials/debug.keystore`),
donc la nouvelle s'installe **par-dessus l'ancienne sans désinstaller**.

> ⚠️ Important : il faut installer **une fois** l'APK qui contient ce système
> (la version 1.0.0 et au-delà). Ensuite les utilisateurs sont prévenus
> automatiquement des versions suivantes.

## Publier une mise à jour (procédure)

1. Faire les changements (JS/UI/logique).
2. **Bumper la version** dans `mobile/app.json` :
   - `expo.version` → ex. `1.0.1`
   - `expo.android.versionCode` → +1 (ex. `2`)  ← obligatoire pour installer par-dessus
3. Builder l'APK : GitHub → **Actions → Expo APK → Run workflow** (publie une
   Release `expo-apk-N` avec `app-release.apk`).
4. Mettre à jour `mobile/latest.json` puis commit/push :
   ```json
   {
     "version": "1.0.1",
     "versionCode": 2,
     "apkUrl": "https://github.com/kevinventy/OneWAY/releases/latest/download/app-release.apk",
     "notes": "Ce qui change dans cette version."
   }
   ```
   *(`latest.json` est lu en direct depuis GitHub : pas besoin de rebuild pour
   que les utilisateurs voient le bandeau.)*

Les utilisateurs sur l'ancienne version verront le bandeau au prochain
démarrage, toucheront « Mettre à jour », et installeront le nouvel APK
par-dessus.

> 💡 Pour des mises à jour 100 % automatiques (sans téléchargement manuel),
> passer plus tard à **EAS Update (OTA)** — nécessite un compte Expo.
