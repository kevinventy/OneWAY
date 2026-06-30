# Logo One Way 🚛

Logo officiel **One Way**, nettoyé : la ligne de texte du bas
(« Transport, Livraison, Suivi Digital ») a été retirée ; « ONE WAY » est
conservé, et l'emblème met en évidence la **route** (perspective), la
**flèche en forme de W** et le **cercle** (le « O »).

| Fichier | Usage |
|---|---|
| `OneWay_logo.png` | Logo complet, fond blanc (1024×1024) — documents, en-têtes |
| `OneWay_logo_transparent.png` | Logo complet, **fond transparent** — sur fond coloré, web, PDF |
| `OneWay_embleme.png` | Emblème seul (sans texte), transparent (512×512) — icône appli / favicon |
| `_source_avec_tagline.png` | Logo source d'origine (avec la tagline) — provenance |

## Régénérer

```bash
pip install Pillow numpy
python3 scripts/logo-nettoyage.py docs/brand/_source_avec_tagline.png docs/brand/
```

> Le script détecte automatiquement la bande de texte du bas, l'efface, recentre
> le logo et génère les versions fond blanc / fond transparent / emblème seul.
