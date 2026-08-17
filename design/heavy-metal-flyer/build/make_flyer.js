/**
 * AFFICHE / FLYER — SERPENT THRONE « The Molten Crown Tour »
 * Concert Heavy Metal fictif — PowerPoint 100 % éditable (A4 portrait).
 *
 *   node make_flyer.js
 *
 * Slide 1 : recto — l'affiche
 * Slide 2 : verso — infos pratiques (déroulé, tarifs, accès, règlement)
 * Slide 3 : kit de marque & guide d'édition
 */

const path = require("path");
const PptxGenJS = require("pptxgenjs");

const A = (f) => path.join(__dirname, "assets", f);
const OUT = path.join(__dirname, "..", "AFFICHE-SERPENT-THRONE-LYON-2026.pptx");

/* ── Palette « fonderie » ───────────────────────────────────────────────── */
const INK = "08070A"; // noir de forge (dominante)
const CHAR = "141110"; // charbon — fond des cartouches
const EDGE = "3B2A24"; // filet brun/braise
const BLOOD = "9E0B12"; // sang séché
const EMBER = "FF5A1F"; // braise
const GOLD = "F2B43A"; // or fondu
const BONE = "F2ECE0"; // os / blanc chaud
const ASH = "9A8F85"; // cendre

/* ── Typographie ────────────────────────────────────────────────────────── */
const DISPLAY = "Arial Black"; // titres, chiffres, noms de groupes
const BODY = "Arial"; // textes courants

/* A4 portrait */
const PW = 8.27;
const PH = 11.69;
const M = 0.55; // marge
const CW = PW - 2 * M; // largeur utile = 7.17"

/* pptxgenjs mute les objets d'options : on en fabrique un neuf à chaque appel */
const glow = (color = "FF3B00", blur = 26, opacity = 0.6) => ({
  type: "outer",
  color,
  blur,
  offset: 0,
  angle: 45,
  opacity,
});

const pres = new PptxGenJS();
pres.defineLayout({ name: "A4P", width: PW, height: PH });
pres.layout = "A4P";
pres.author = "Black Anvil Concerts";
pres.company = "Black Anvil Concerts";
pres.title = "SERPENT THRONE — Halle Vulcain, Lyon — 24 octobre 2026";
pres.subject = "Affiche de concert Heavy Metal (contenu fictif)";

/* ── Briques réutilisables ──────────────────────────────────────────────── */

/** Cartouche sombre à filet fin + losange de braise (motif de la série). */
function card(slide, o) {
  slide.addShape(pres.ShapeType.roundRect, {
    x: o.x,
    y: o.y,
    w: o.w,
    h: o.h,
    rectRadius: 0.05,
    fill: { color: o.fill || CHAR, transparency: o.transparency ?? 12 },
    line: { color: o.edge || EDGE, width: 1 },
  });
  slide.addShape(pres.ShapeType.diamond, {
    x: o.x + 0.22,
    y: o.y + 0.26,
    w: 0.1,
    h: 0.16,
    fill: { color: EMBER },
    line: { color: EMBER, width: 0 },
  });
  slide.addText(o.title, {
    x: o.x + 0.42,
    y: o.y + 0.18,
    w: o.w - 0.62,
    h: 0.3,
    fontFace: DISPLAY,
    fontSize: o.titleSize || 11.5,
    color: GOLD,
    charSpacing: 1.2,
    margin: 0,
    valign: "middle",
  });
  if (o.lines && o.lines.length) {
    slide.addText(
      o.lines.map((t, i) => ({
        text: typeof t === "string" ? t : t.text,
        options: {
          breakLine: i < o.lines.length - 1,
          bold: typeof t === "object" && t.bold,
          color: typeof t === "object" && t.color ? t.color : o.textColor || "D9D0C4",
          fontSize: typeof t === "object" && t.size ? t.size : o.textSize || 9.5,
        },
      })),
      {
        x: o.x + 0.22,
        y: o.y + 0.52,
        w: o.w - 0.44,
        h: o.h - 0.7,
        fontFace: BODY,
        fontSize: o.textSize || 9.5,
        color: "D9D0C4",
        lineSpacingMultiple: 1.18,
        paraSpaceAfter: o.spaceAfter ?? 3,
        margin: 0,
        valign: "top",
      }
    );
  }
}

/** Intertitre de section : losange + libellé or espacé. */
function sectionLabel(slide, x, y, w, text) {
  slide.addShape(pres.ShapeType.diamond, {
    x,
    y: y + 0.045,
    w: 0.1,
    h: 0.16,
    fill: { color: EMBER },
    line: { color: EMBER, width: 0 },
  });
  slide.addText(text, {
    x: x + 0.2,
    y,
    w: w - 0.2,
    h: 0.25,
    fontFace: DISPLAY,
    fontSize: 10.5,
    color: GOLD,
    charSpacing: 3.5,
    margin: 0,
    valign: "middle",
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   SLIDE 1 — RECTO : L'AFFICHE
   ═══════════════════════════════════════════════════════════════════════════ */
const s1 = pres.addSlide();
s1.background = { color: INK };
s1.addImage({ path: A("bg-recto.jpg"), x: 0, y: 0, w: PW, h: PH });
s1.addImage({ path: A("rays.png"), x: -0.6, y: 0.35, w: 9.47, h: 6.63, transparency: 72 });
s1.addImage({ path: A("sparks.png"), x: 0, y: 0.2, w: PW, h: 5.32, transparency: 30 });

s1.addText("BLACK ANVIL CONCERTS   ×   RADIO VULCAIN 101.7   PRÉSENTENT", {
  x: M,
  y: 0.42,
  w: CW,
  h: 0.24,
  align: "center",
  fontFace: BODY,
  fontSize: 9,
  bold: true,
  color: ASH,
  charSpacing: 2.2,
  margin: 0,
});

s1.addImage({ path: A("emblem.png"), x: (PW - 1.08) / 2, y: 0.76, w: 1.08, h: 1.08 });

s1.addText("TOURNÉE EUROPÉENNE MMXXVI   ·   34 VILLES   ·   19 PAYS", {
  x: M,
  y: 1.98,
  w: CW,
  h: 0.24,
  align: "center",
  fontFace: BODY,
  fontSize: 9.5,
  bold: true,
  color: EMBER,
  charSpacing: 3,
  margin: 0,
});

s1.addText("SERPENT", {
  x: 0.2,
  y: 2.34,
  w: PW - 0.4,
  h: 1.14,
  align: "center",
  valign: "middle",
  fontFace: DISPLAY,
  fontSize: 88,
  color: BONE,
  charSpacing: 1,
  margin: 0,
  shadow: glow(),
});
s1.addText("THRONE", {
  x: 0.2,
  y: 3.44,
  w: PW - 0.4,
  h: 1.14,
  align: "center",
  valign: "middle",
  fontFace: DISPLAY,
  fontSize: 88,
  color: BONE,
  charSpacing: 14,
  margin: 0,
  shadow: glow(),
});

s1.addImage({ path: A("divider.png"), x: (PW - 4.2) / 2, y: 4.66, w: 4.2, h: 0.37 });

s1.addText("“ THE MOLTEN CROWN ”  ·  LIVE 2026", {
  x: M,
  y: 5.04,
  w: CW,
  h: 0.3,
  align: "center",
  fontFace: DISPLAY,
  fontSize: 14,
  color: GOLD,
  charSpacing: 5,
  margin: 0,
});

s1.addText("EN PREMIÈRE PARTIE", {
  x: M,
  y: 5.58,
  w: CW,
  h: 0.22,
  align: "center",
  fontFace: BODY,
  fontSize: 9,
  bold: true,
  color: ASH,
  charSpacing: 5,
  margin: 0,
});
s1.addText("NIGHTFORGE", {
  x: M,
  y: 5.82,
  w: CW,
  h: 0.44,
  align: "center",
  valign: "middle",
  fontFace: DISPLAY,
  fontSize: 27,
  color: BONE,
  charSpacing: 2,
  margin: 0,
});
s1.addText("ASHEN CROWN   ·   VULTURE MASS", {
  x: M,
  y: 6.26,
  w: CW,
  h: 0.36,
  align: "center",
  valign: "middle",
  fontFace: DISPLAY,
  fontSize: 18,
  color: "E4DACB",
  charSpacing: 1.5,
  margin: 0,
});
s1.addText("OUVERTURE : SŒURS DE FER  (LYON)", {
  x: M,
  y: 6.64,
  w: CW,
  h: 0.26,
  align: "center",
  fontFace: BODY,
  fontSize: 11,
  bold: true,
  color: ASH,
  charSpacing: 2,
  margin: 0,
});

s1.addText("SAMEDI", {
  x: M,
  y: 7.16,
  w: CW,
  h: 0.24,
  align: "center",
  fontFace: BODY,
  fontSize: 12.5,
  bold: true,
  color: EMBER,
  charSpacing: 8,
  margin: 0,
});
s1.addText("24 OCTOBRE 2026", {
  x: 0.2,
  y: 7.38,
  w: PW - 0.4,
  h: 0.62,
  align: "center",
  valign: "middle",
  fontFace: DISPLAY,
  fontSize: 40,
  color: BONE,
  charSpacing: 1,
  margin: 0,
  shadow: glow("FF3B00", 20, 0.45),
});
s1.addText("HALLE VULCAIN   ·   LYON, FRANCE", {
  x: M,
  y: 8.04,
  w: CW,
  h: 0.26,
  align: "center",
  fontFace: DISPLAY,
  fontSize: 14,
  color: GOLD,
  charSpacing: 3,
  margin: 0,
});
s1.addText("PORTES 18H30   ·   PREMIER RIFF 19H15   ·   COUVRE-FEU 01H00   ·   JAUGE 4 800", {
  x: M,
  y: 8.3,
  w: CW,
  h: 0.26,
  align: "center",
  fontFace: BODY,
  fontSize: 10,
  color: ASH,
  charSpacing: 1,
  margin: 0,
});

/* Trois tarifs — cartouches */
const tiers = [
  ["PRÉVENTE", "39 €", "jusqu'au 20 octobre"],
  ["SUR PLACE", "45 €", "selon disponibilité"],
  ["FOSSE VIP", "89 €", "120 pass — meet & greet"],
];
tiers.forEach(([label, price, note], i) => {
  const x = M + i * (2.23 + 0.24);
  const y = 8.82;
  s1.addShape(pres.ShapeType.roundRect, {
    x,
    y,
    w: 2.23,
    h: 1.02,
    rectRadius: 0.05,
    fill: { color: CHAR, transparency: 18 },
    line: { color: i === 2 ? BLOOD : EDGE, width: i === 2 ? 1.5 : 1 },
  });
  s1.addText(label, {
    x,
    y: y + 0.11,
    w: 2.23,
    h: 0.2,
    align: "center",
    fontFace: BODY,
    fontSize: 9,
    bold: true,
    color: ASH,
    charSpacing: 3,
    margin: 0,
  });
  s1.addText(price, {
    x,
    y: y + 0.31,
    w: 2.23,
    h: 0.42,
    align: "center",
    valign: "middle",
    fontFace: DISPLAY,
    fontSize: 24,
    color: i === 2 ? EMBER : BONE,
    margin: 0,
  });
  s1.addText(note, {
    x,
    y: y + 0.73,
    w: 2.23,
    h: 0.22,
    align: "center",
    fontFace: BODY,
    fontSize: 8.5,
    color: ASH,
    margin: 0,
  });
});

s1.addText("BILLETTERIE : SERPENTTHRONE-TOUR.FR · FNAC · DIGITICK · L'ENCLUME RECORDS", {
  x: M,
  y: 10.14,
  w: CW,
  h: 0.24,
  align: "center",
  fontFace: BODY,
  fontSize: 9.5,
  bold: true,
  color: BONE,
  charSpacing: 0.4,
  margin: 0,
});
s1.addText("16+  ·  MOINS DE 16 ANS ACCOMPAGNÉS D'UN ADULTE  ·  FOUILLE À L'ENTRÉE  ·  BILLETS NON REMBOURSABLES", {
  x: M,
  y: 10.42,
  w: CW,
  h: 0.22,
  align: "center",
  fontFace: BODY,
  fontSize: 8,
  color: ASH,
  margin: 0,
});
s1.addText("BLACK ANVIL CONCERTS · RADIO VULCAIN 101.7 · HELLFIRE AMPS · CORBEAU BIÈRE NOIRE · VILLE DE LYON", {
  x: M,
  y: 10.82,
  w: CW,
  h: 0.24,
  align: "center",
  fontFace: BODY,
  fontSize: 7.5,
  color: "6F665E",
  charSpacing: 0.6,
  margin: 0,
});
s1.addNotes(
  "RECTO — affiche A4. Tout est éditable : double-cliquez sur un texte pour le remplacer. " +
    "Les fonds (bg-recto.jpg), l'emblème et l'ornement sont des images posées en arrière-plan ; " +
    "sélectionnez-les avec Alt+clic si besoin. Contenu 100 % fictif."
);

/* ═══════════════════════════════════════════════════════════════════════════
   SLIDE 2 — VERSO : INFOS PRATIQUES
   ═══════════════════════════════════════════════════════════════════════════ */
const s2 = pres.addSlide();
s2.background = { color: INK };
s2.addImage({ path: A("bg-verso.jpg"), x: 0, y: 0, w: PW, h: PH });

s2.addText("SERPENT THRONE  —  THE MOLTEN CROWN TOUR", {
  x: M,
  y: 0.52,
  w: CW - 1.3,
  h: 0.24,
  fontFace: BODY,
  fontSize: 10,
  bold: true,
  color: EMBER,
  charSpacing: 4,
  margin: 0,
});
s2.addText("INFOS PRATIQUES", {
  x: M,
  y: 0.76,
  w: CW - 1.3,
  h: 0.62,
  valign: "middle",
  fontFace: DISPLAY,
  fontSize: 34,
  color: BONE,
  charSpacing: 1,
  margin: 0,
  shadow: glow("FF3B00", 18, 0.4),
});
s2.addText("Halle Vulcain · 12 quai des Forges, 69007 Lyon · samedi 24 octobre 2026", {
  x: M,
  y: 1.4,
  w: CW - 1.3,
  h: 0.26,
  fontFace: BODY,
  fontSize: 11.5,
  color: ASH,
  margin: 0,
});
s2.addImage({ path: A("emblem.png"), x: PW - M - 1.0, y: 0.6, w: 1.0, h: 1.0 });

const COLW = (CW - 0.25) / 2; // 3.46"
const X1 = M;
const X2 = M + COLW + 0.25;

/* Colonne gauche — déroulé */
sectionLabel(s2, X1, 1.95, COLW, "DÉROULÉ DE LA SOIRÉE");
const runOrder = [
  ["17H15", "MEET & GREET VIP", "Entrée artistes — pass « Ordre du Crâne »"],
  ["18H30", "OUVERTURE DES PORTES", "Vestiaire 3 € · stand merch hall Nord"],
  ["19H15", "SŒURS DE FER", "Lyon (FR) — 25 min"],
  ["20H00", "VULTURE MASS", "Montréal (CA) — 35 min"],
  ["20H55", "ASHEN CROWN", "Göteborg (SE) — 40 min"],
  ["22H00", "NIGHTFORGE", "Sheffield (UK) — 45 min"],
  ["23H05", "SERPENT THRONE", "Oslo (NO) — 90 min + rappel"],
  ["00H40", "FIN DU CONCERT", "Évacuation 01H00 — navettes jusqu'à 01H30"],
];
runOrder.forEach(([time, name, detail], i) => {
  const y = 2.36 + i * 0.585;
  const head = i === 6;
  s2.addText(time, {
    x: X1,
    y,
    w: 0.78,
    h: 0.26,
    fontFace: DISPLAY,
    fontSize: 11.5,
    color: head ? EMBER : GOLD,
    margin: 0,
    valign: "middle",
  });
  s2.addText(name, {
    x: X1 + 0.85,
    y,
    w: COLW - 0.85,
    h: 0.26,
    fontFace: DISPLAY,
    fontSize: head ? 13 : 11.5,
    color: BONE,
    margin: 0,
    valign: "middle",
  });
  s2.addText(detail, {
    x: X1 + 0.85,
    y: y + 0.25,
    w: COLW - 0.85,
    h: 0.22,
    fontFace: BODY,
    fontSize: 9,
    color: ASH,
    margin: 0,
    valign: "middle",
  });
});

/* Colonne droite — deux cartouches */
sectionLabel(s2, X2, 1.95, COLW, "PRÉPARER SA SOIRÉE");
card(s2, {
  x: X2,
  y: 2.36,
  w: COLW,
  h: 2.3,
  title: "BILLETTERIE & TARIFS",
  lines: [
    { text: "Prévente 39 €  —  jusqu'au 20/10 à 23h59", bold: true, color: BONE },
    "Sur place 45 €  —  caisse ouverte à 18h00",
    { text: "Fosse VIP « Ordre du Crâne » 89 €", bold: true, color: BONE },
    "120 pass : entrée anticipée, meet & greet 17h15, vinyle dédicacé, laminé collector.",
    "Tarif réduit 32 € (−26 ans, étudiants, demandeurs d'emploi) sur justificatif.",
    "Groupes 10+ : −15 % via groupes@blackanvil.fr",
  ],
});
card(s2, {
  x: X2,
  y: 4.79,
  w: COLW,
  h: 2.31,
  title: "ACCÈS & TRANSPORTS",
  lines: [
    {
      text: "Métro B & tram T1 — arrêt « Quai des Forges », 4 min à pied. Dernier passage 00h55.",
      color: BONE,
    },
    "Navettes Part-Dieu ↔ Halle : toutes les 20 min de 17h30 à 19h30, retours 00h45–01h30 (3 €).",
    "Parking P+R Vulcain — 600 places, 4 € la soirée, sortie libre jusqu'à 02h00.",
    "Vélo : 80 arceaux quai des Forges.",
  ],
});

/* Bande basse — trois cartouches */
const bottom = [
  {
    title: "RÈGLEMENT",
    lines: [
      "Sacs limités à 20 × 30 cm (consigne 3 €).",
      "Interdits : photo pro, bouteilles, parapluies, laser, fumigènes.",
      "Fouille à l'entrée. Sortie définitive.",
      "Slam toléré devant la régie ; stage diving interdit.",
    ],
  },
  {
    title: "MERCH & MEET",
    lines: [
      "Stand hall Nord, 18h30 → 00h55.",
      "Tee « Molten Crown » 28 € · hoodie 62 € · vinyle 180 g (300 ex.) 35 €.",
      "CB uniquement après 00h00.",
      "Dédicaces NIGHTFORGE à 21h50.",
    ],
  },
  {
    title: "SÉCURITÉ",
    lines: [
      "Plateforme PMR côté cour, sur réservation avant le 17/10.",
      "Bouchons d'oreille gratuits (105 dB en fosse).",
      "Poste de secours hall Sud, 6 secouristes.",
      "Point d'écoute « Safer Nights » au bar 2.",
    ],
  },
];
bottom.forEach((c, i) => {
  card(s2, {
    x: M + i * (2.23 + 0.24),
    y: 7.45,
    w: 2.23,
    h: 2.25,
    title: c.title,
    titleSize: 10.5,
    textSize: 8.5,
    lines: c.lines,
    spaceAfter: 4,
  });
});

sectionLabel(s2, M, 10.0, CW, "CONTACTS");
s2.addText(
  [
    {
      text: "Billetterie : serpentthrone-tour.fr · Fnac · Digitick · L'Enclume Records, 4 rue Burdeau, Lyon 1er",
      options: { breakLine: true, color: BONE, bold: true },
    },
    {
      text: "Presse : presse@blackanvil.fr — +33 4 78 00 12 44 (Camille Roux) · Halle Vulcain : +33 4 78 00 55 10",
      options: { breakLine: true },
    },
    {
      text: "Production : Black Anvil Concerts, 8 rue des Fondeurs, 69003 Lyon — licence L-R-26-004821",
      options: { breakLine: true },
    },
    {
      text: "Événement fictif créé à des fins de démonstration graphique. Toute ressemblance serait fortuite.",
      options: { color: "6F665E", italic: true, fontSize: 8 },
    },
  ],
  {
    x: M,
    y: 10.32,
    w: CW,
    h: 0.85,
    fontFace: BODY,
    fontSize: 9.5,
    color: "C9C0B5",
    lineSpacingMultiple: 1.2,
    paraSpaceAfter: 2,
    margin: 0,
  }
);
s2.addNotes(
  "VERSO — infos pratiques. Horaires, tarifs, accès, règlement : remplacez les blocs texte directement. " +
    "Les cartouches sont des rectangles arrondis groupés avec leur texte : Ctrl+D pour dupliquer une carte."
);

/* ═══════════════════════════════════════════════════════════════════════════
   SLIDE 3 — KIT DE MARQUE & GUIDE D'ÉDITION
   ═══════════════════════════════════════════════════════════════════════════ */
const s3 = pres.addSlide();
s3.background = { color: INK };
s3.addImage({ path: A("bg-kit.jpg"), x: 0, y: 0, w: PW, h: PH });

s3.addText("MODE D'EMPLOI", {
  x: M,
  y: 0.52,
  w: CW,
  h: 0.24,
  fontFace: BODY,
  fontSize: 10,
  bold: true,
  color: EMBER,
  charSpacing: 4,
  margin: 0,
});
s3.addText("KIT DE MARQUE", {
  x: M,
  y: 0.76,
  w: CW,
  h: 0.62,
  valign: "middle",
  fontFace: DISPLAY,
  fontSize: 34,
  color: BONE,
  margin: 0,
  shadow: glow("FF3B00", 18, 0.4),
});
s3.addText("Tout ce qu'il faut pour décliner l'affiche sans casser la direction artistique.", {
  x: M,
  y: 1.4,
  w: CW,
  h: 0.26,
  fontFace: BODY,
  fontSize: 11.5,
  color: ASH,
  margin: 0,
});

/* Palette */
sectionLabel(s3, M, 1.95, CW, "PALETTE");
const swatches = [
  [INK, "08070A", "Noir de forge"],
  [BLOOD, "9E0B12", "Sang séché"],
  [EMBER, "FF5A1F", "Braise"],
  [GOLD, "F2B43A", "Or fondu"],
  [BONE, "F2ECE0", "Os"],
  [ASH, "9A8F85", "Cendre"],
];
const sw = 1.09;
const swGap = (CW - 6 * sw) / 5;
swatches.forEach(([hex, label, name], i) => {
  const x = M + i * (sw + swGap);
  s3.addShape(pres.ShapeType.rect, {
    x,
    y: 2.36,
    w: sw,
    h: 0.9,
    fill: { color: hex },
    line: { color: EDGE, width: 1 },
  });
  s3.addText(label, {
    x,
    y: 3.3,
    w: sw,
    h: 0.2,
    align: "center",
    fontFace: DISPLAY,
    fontSize: 9,
    color: BONE,
    margin: 0,
  });
  s3.addText(name, {
    x,
    y: 3.49,
    w: sw,
    h: 0.2,
    align: "center",
    fontFace: BODY,
    fontSize: 8,
    color: ASH,
    margin: 0,
  });
});
s3.addText(
  "Répartition visée : 65 % noir de forge, 20 % os/cendre, 10 % or fondu, 5 % braise. La braise ne sert qu'aux accents (losanges, prix VIP, halo du titre).",
  {
    x: M,
    y: 3.78,
    w: CW,
    h: 0.24,
    fontFace: BODY,
    fontSize: 9,
    italic: true,
    color: ASH,
    margin: 0,
  }
);

/* Typo + hiérarchie */
sectionLabel(s3, X1, 4.24, COLW, "TYPOGRAPHIE");
card(s3, {
  x: X1,
  y: 4.62,
  w: COLW,
  h: 2.55,
  title: "DEUX POLICES",
  lines: [
    { text: "Arial Black — titres, groupes, prix, heures", bold: true, color: BONE },
    "Nom du groupe 88 pt · date 40 pt · titres de page 34 pt · intertitres 10–12 pt.",
    { text: "Arial — tout le reste", bold: true, color: BONE },
    "Courant 9–11 pt · mentions légales 7,5–8,5 pt.",
    "Interlettrage : 3 à 8 pt sur les capitales, 0 à 1 pt sur les gros titres.",
    "Si Arial Black manque : Impact (plus étroit, remontez la taille de ~10 %).",
  ],
});
sectionLabel(s3, X2, 4.24, COLW, "MODIFIER L'AFFICHE");
card(s3, {
  x: X2,
  y: 4.62,
  w: COLW,
  h: 2.55,
  title: "EN 4 GESTES",
  lines: [
    { text: "1. Textes", bold: true, color: BONE },
    "Double-clic, retapez. Rien n'est vectorisé.",
    { text: "2. Fonds et ornements", bold: true, color: BONE },
    "Alt+clic pour saisir une image sous le texte.",
    { text: "3. Couleurs", bold: true, color: BONE },
    "Remplissage ▸ Autres couleurs ▸ Personnalisées, puis le code hexadécimal ci-dessus.",
    { text: "4. Nouvelle date", bold: true, color: BONE },
    "Clic droit sur la miniature ▸ Dupliquer la diapositive.",
  ],
  spaceAfter: 2,
});

/* Checklist + export */
sectionLabel(s3, X1, 7.45, COLW, "AVANT IMPRESSION");
card(s3, {
  x: X1,
  y: 7.83,
  w: COLW,
  h: 2.55,
  title: "CHECKLIST",
  lines: [
    "☐ Date, jour et heures cohérents (recto ↔ verso).",
    "☐ Nom de la salle et adresse vérifiés.",
    "☐ Tarifs à jour + date limite de prévente.",
    "☐ Logos partenaires fournis en vectoriel.",
    "☐ Licence d'entrepreneur du spectacle affichée.",
    "☐ Mentions 16+ et non-remboursement présentes.",
    "☐ Noms des groupes relus par le tourneur.",
  ],
  spaceAfter: 5,
});
sectionLabel(s3, X2, 7.45, COLW, "FORMATS DE SORTIE");
card(s3, {
  x: X2,
  y: 7.83,
  w: COLW,
  h: 2.55,
  title: "EXPORTS",
  lines: [
    { text: "Affiche A4 — 210 × 297 mm", bold: true, color: BONE },
    "Fichier ▸ Exporter ▸ PDF, qualité « Impression ». Fond perdu : agrandissez les images de fond de 3 mm par bord.",
    { text: "Grand format A2 / A1", bold: true, color: BONE },
    "Tout est vectoriel hors fonds : agrandissement 200 % sans perte visible.",
    { text: "Réseaux sociaux", bold: true, color: BONE },
    "Diapositive 1080 × 1080 px : emblème, titre et date, sans mentions légales.",
  ],
  spaceAfter: 2,
});

s3.addImage({ path: A("divider.png"), x: (PW - 3.4) / 2, y: 10.55, w: 3.4, h: 0.3 });
s3.addText("BLACK ANVIL CONCERTS  —  DOSSIER GRAPHIQUE FICTIF  —  SERPENT THRONE 2026", {
  x: M,
  y: 10.9,
  w: CW,
  h: 0.24,
  align: "center",
  fontFace: BODY,
  fontSize: 8.5,
  color: "6F665E",
  charSpacing: 1.2,
  margin: 0,
});
s3.addNotes(
  "KIT — page de service, à supprimer avant impression (clic droit sur la miniature ▸ Supprimer la diapositive)."
);

pres.writeFile({ fileName: OUT }).then((f) => console.log("écrit :", f));
