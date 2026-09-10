/**
 * Rapport de compensation des quantites - TMS CEG Antanimbarinandriana
 * Genere le .docx (mise en page identique a la v3, sans la conclusion).
 *   node build.js  ->  Rapport_de_compensation_TMS_CEG_Antanimbarinandriana.docx
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Tab, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, VerticalAlign,
  Header, Footer, PageNumber, ImageRun, LevelFormat, LineRuleType,
} = require('docx');

/* ------------------------------------------------------------------ couleurs */
const NAVY = '123A4E';   // titres, en-tetes de tableau
const BLUE = '1F6F8B';   // sous-titres A / B / C
const TEAL = '2E9CA6';   // filets et encadres
const LIGHT = 'DCEAF0';  // lignes de total
const ZEBRA = 'F2F7FA';  // lignes alternees
const SOLDE = 'BFE3E6';  // ligne « solde »
const BOXBG = 'EAF6F7';  // fond des encadres de lecture
const GRID = 'C9D8DF';   // filets des tableaux
const TEXT = '24333B';   // texte courant
const GRAY = '6B7A85';   // mentions secondaires

const FONT = 'Calibri';
const W = 9746;          // largeur utile en DXA
const NB = ' ';     // espace insecable
const MINUS = '−';  // signe moins typographique

/* ------------------------------------------------------------------ helpers */
const run = (text, o = {}) =>
  new TextRun({ text, font: FONT, size: o.size || 19, bold: o.bold, italics: o.italics, color: o.color || TEXT });

const para = (text, o = {}) =>
  new Paragraph({
    alignment: o.align || AlignmentType.JUSTIFIED,
    spacing: { before: o.before || 0, after: o.after === undefined ? 120 : o.after, line: o.line || 259 },
    indent: o.indent,
    children: Array.isArray(text) ? text : [run(text, o)],
  });

/** Titre de section : « 1.<tab>TEXTE » en 14 pt gras marine, filet turquoise dessous. */
const heading = (num, text, before = 200) =>
  new Paragraph({
    spacing: { before, after: 80, line: 259 },
    indent: { left: 340, hanging: 340 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: TEAL, space: 3 } },
    children: [new TextRun({ children: [num, new Tab(), text], font: FONT, size: 28, bold: true, color: NAVY })],
  });

/** Sous-titre A. / B. / C. en 12 pt gras bleu. */
const subheading = (letter, text) =>
  new Paragraph({
    spacing: { before: 240, after: 60, line: 259 },
    indent: { left: 320, hanging: 320 },
    children: [new TextRun({ children: [letter, new Tab(), text], font: FONT, size: 24, bold: true, color: BLUE })],
  });

/** Encadre (fond + filet turquoise) : intitule en gras puis texte justifie. */
const boxed = (label, bodyRuns, o = {}) => {
  const fill = o.fill || LIGHT;
  const edge = { style: BorderStyle.SINGLE, size: 10, color: TEAL };
  return new Table({
    columnWidths: [W],
    width: { size: W, type: WidthType.DXA },
    margins: { top: 60, left: 108, bottom: 60, right: 108 },
    borders: { top: edge, left: edge, bottom: edge, right: edge, insideHorizontal: edge, insideVertical: edge },
    rows: [
      new TableRow({ cantSplit: true,
        children: [
          new TableCell({
            width: { size: W, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill },
            children: [
              new Paragraph({
                spacing: { after: 20, line: 259 },
                children: [run(label, { size: 20, bold: true, color: NAVY })],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 0, line: 259 },
                children: bodyRuns,
              }),
            ],
          }),
        ],
      }),
    ],
  });
};

/** Cellule de tableau. */
const cell = (content, o = {}) =>
  new TableCell({
    width: { size: o.width, type: WidthType.DXA },
    columnSpan: o.span,
    shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
    children: (Array.isArray(content) ? content : [content]).map((c) =>
      c instanceof Paragraph
        ? c
        : new Paragraph({
            alignment: o.align || AlignmentType.LEFT,
            spacing: { before: 0, after: 0, line: 240 },
            children: [run(c, { size: o.size || 19, bold: o.bold, color: o.color || TEXT, italics: o.italics })],
          })
    ),
  });

const tableOf = (widths, rows, o = {}) =>
  new Table({
    columnWidths: widths,
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    alignment: o.alignment,
    margins: { top: 30, bottom: 30, left: 108, right: 108 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: GRID },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: GRID },
      left: { style: BorderStyle.SINGLE, size: 4, color: GRID },
      right: { style: BorderStyle.SINGLE, size: 4, color: GRID },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: GRID },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: GRID },
    },
    rows,
  });

/** Ligne d'en-tete : fond marine, texte blanc centre. */
const headRow = (widths, labels, size = 19) =>
  new TableRow({ cantSplit: true,
    tableHeader: false,
    children: labels.map((t, i) =>
      cell(t, { width: widths[i], fill: NAVY, color: 'FFFFFF', bold: true, align: AlignmentType.CENTER, size })
    ),
  });

const gap = (pts) =>
  new Paragraph({ spacing: { after: pts * 20, line: 20, lineRule: LineRuleType.EXACT }, children: [new TextRun({ text: '', size: 2 })] });

/* ------------------------------------------------------------------ tableaux */
const W1 = [3624, 1248, 1074, 1078, 1136, 1586];               // 1. moins-value
const W2 = [4078, 1814, 1020, 1132, 1702];                     // 2.A plate-forme
const W3 = [4530, 1928, 1360, 1928];                           // 2.B caillasse
const W4 = [1810, 2720, 5216];                                 // 2.C vestiaires
const WB = [6458, 3288];                                       // 3. bilan

const R = AlignmentType.RIGHT;
const C = AlignmentType.CENTER;

const tableMoinsValue = tableOf(W1, [
  headRow(W1, ['Poste (réf. BDQE)', 'Prévu BDQE', 'Réalisé', 'Écart', 'P.U. (Ar)', 'Moins-value (Ar)']),
  new TableRow({ cantSplit: true,
    children: [
      cell('Faïence murale 20 × 30 cm — vestiaires (VEST 8.9)', { width: W1[0] }),
      cell(`32${NB}m²`, { width: W1[1], align: R }),
      cell(`15${NB}m²`, { width: W1[2], align: R }),
      cell(`${MINUS}${NB}17${NB}m²`, { width: W1[3], align: R }),
      cell(`77${NB}000`, { width: W1[4], align: R }),
      cell(`${MINUS}${NB}1${NB}309${NB}000`, { width: W1[5], align: R }),
    ],
  }),
  new TableRow({ cantSplit: true,
    children: [
      cell('TOTAL MOINS-VALUE', { width: W1[0], fill: LIGHT, bold: true, color: NAVY }),
      cell('', { width: W1[1], fill: LIGHT }),
      cell('', { width: W1[2], fill: LIGHT }),
      cell('', { width: W1[3], fill: LIGHT }),
      cell('', { width: W1[4], fill: LIGHT }),
      cell(`${MINUS}${NB}1${NB}309${NB}000`, { width: W1[5], fill: LIGHT, bold: true, color: NAVY, align: R }),
    ],
  }),
]);

const ligneTerrain = (poste, supp, qte, pu, pv, fill) =>
  new TableRow({ cantSplit: true,
    children: [
      cell(poste, { width: W2[0], fill }),
      cell(supp, { width: W2[1], fill, align: R }),
      cell(qte, { width: W2[2], fill, align: R }),
      cell(pu, { width: W2[3], fill, align: R }),
      cell(pv, { width: W2[4], fill, align: R }),
    ],
  });

const tableTerrain = tableOf(W2, [
  headRow(W2, ['Poste BDQE (plate-forme)', 'Supplément', 'Quantité', 'P.U. (Ar)', 'Plus-value (Ar)']),
  ligneTerrain('TMS 1.1 — Béton de propreté 150 kg, ép. 5 cm', `99${NB}m² × 0,05${NB}m`, `4,95${NB}m³`, `300${NB}000`, `1${NB}485${NB}000`),
  ligneTerrain('TMS 1.2 — Béton dosé à 350 kg, ép. 8 cm', `99${NB}m² × 0,08${NB}m`, `7,92${NB}m³`, `590${NB}000`, `4${NB}672${NB}800`, ZEBRA),
  ligneTerrain(`TMS 1.3 — Armatures (1${NB}344${NB}kg / 33,6${NB}m³ au BDQE = 40${NB}kg/m³)`, `7,92${NB}m³ × 40${NB}kg/m³`, `316,8${NB}kg`, `12${NB}000`, `3${NB}801${NB}600`),
  new TableRow({ cantSplit: true,
    children: [
      cell('SOUS-TOTAL A — TERRAIN', { width: W2[0], fill: LIGHT, bold: true, color: NAVY }),
      cell('', { width: W2[1], fill: LIGHT }),
      cell('', { width: W2[2], fill: LIGHT }),
      cell('', { width: W2[3], fill: LIGHT }),
      cell(`9${NB}959${NB}400`, { width: W2[4], fill: LIGHT, bold: true, color: NAVY, align: R }),
    ],
  }),
]);

const tableCaillasse = tableOf(W3, [
  headRow(W3, ['Poste hors BDQE', 'Surface réelle mesurée', 'P.U. (Ar/m²)', 'Plus-value (Ar)']),
  new TableRow({ cantSplit: true,
    children: [
      cell('Caillasse 0/31,5, ép. 10 cm, compactée (fourniture et mise en œuvre)', { width: W3[0] }),
      cell(`519${NB}m²`, { width: W3[1], align: R }),
      cell(`13${NB}000`, { width: W3[2], align: R }),
      cell(`6${NB}747${NB}000`, { width: W3[3], align: R }),
    ],
  }),
  new TableRow({ cantSplit: true,
    children: [
      cell('SOUS-TOTAL B — CAILLASSE', { width: W3[0], fill: LIGHT, bold: true, color: NAVY }),
      cell('', { width: W3[1], fill: LIGHT }),
      cell('', { width: W3[2], fill: LIGHT }),
      cell(`6${NB}747${NB}000`, { width: W3[3], fill: LIGHT, bold: true, color: NAVY, align: R }),
    ],
  }),
]);

const tableVestiaires = tableOf(W4, [
  headRow(W4, ['Élément', 'Prévu au BDQE (VEST 8.2)', "Réalisé par l'ECAE"]),
  new TableRow({ cantSplit: true,
    children: [
      cell('Équipement', { width: W4[0] }),
      cell('2 sièges turcs', { width: W4[1] }),
      cell("2 WC à l'anglaise complets (cuvette, réservoir, abattant)", { width: W4[2] }),
    ],
  }),
  new TableRow({ cantSplit: true,
    children: [
      cell('Standard', { width: W4[0], fill: ZEBRA }),
      cell('Basique', { width: W4[1], fill: ZEBRA }),
      cell('Supérieur : confort, hygiène, entretien facilité', { width: W4[2], fill: ZEBRA }),
    ],
  }),
  new TableRow({ cantSplit: true,
    children: [
      cell('Incidence financière', { width: W4[0], fill: LIGHT, bold: true, color: NAVY }),
      cell('Prix du BDQE conservé, aucun supplément demandé', { width: W4[1], fill: LIGHT, bold: true, color: NAVY }),
      cell("Différence de coût prise en charge par l'ECAE — amélioration offerte, non comptée au bilan", { width: W4[2], fill: LIGHT, bold: true, color: NAVY }),
    ],
  }),
]);

const ligneBilan = (poste, montant, o = {}) =>
  new TableRow({ cantSplit: true,
    children: [
      cell(poste, { width: WB[0], fill: o.fill, bold: o.bold, color: o.bold ? NAVY : TEXT, size: 20 }),
      cell(montant, { width: WB[1], fill: o.fill, bold: o.bold, color: o.bold ? NAVY : TEXT, size: 20, align: R }),
    ],
  });

const tableBilan = tableOf(WB, [
  headRow(WB, ['Poste', 'Montant TTC (Ar)'], 20),
  ligneBilan(`Moins-value : faïence murale non réalisée (17${NB}m²)`, `${MINUS}${NB}1${NB}309${NB}000`),
  ligneBilan(`Plus-value A : supplément de terrain (+${NB}99${NB}m² aux prix BDQE)`, `+${NB}9${NB}959${NB}400`, { fill: ZEBRA }),
  ligneBilan(`Plus-value B : couche de caillasse sur 519${NB}m² (hors BDQE, prix estimatif)`, `+${NB}6${NB}747${NB}000`),
  ligneBilan("Plus-value C : WC à l'anglaise (amélioration offerte)", 'pour mémoire', { fill: ZEBRA }),
  ligneBilan('TOTAL DES PLUS-VALUES RÉALISÉES SANS FACTURATION', `+${NB}16${NB}706${NB}400`, { fill: LIGHT, bold: true }),
  ligneBilan("SOLDE EN FAVEUR DE L'OUVRAGE ET DES BÉNÉFICIAIRES", `+${NB}15${NB}397${NB}400`, { fill: SOLDE, bold: true }),
]);

/* ------------------------------------- bloc de signature : cachet ECAE seul */
const SIGW = 3400;
const tableSignature = tableOf([SIGW], [
  new TableRow({ cantSplit: true,
    children: [
      cell("Pour l'ECAE — Directeur Général", { width: SIGW, fill: LIGHT, bold: true, color: NAVY, size: 17, align: C }),
    ],
  }),
  new TableRow({ cantSplit: true,
    children: [
      new TableCell({
        width: { size: SIGW, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: C,
            spacing: { before: 80, after: 80, line: 240, lineRule: LineRuleType.AUTO },
            children: [
              new ImageRun({
                type: 'jpg',
                data: fs.readFileSync(path.join(__dirname, 'stamp.jpg')),
                transformation: { width: 137, height: 120 },
              }),
            ],
          }),
        ],
      }),
    ],
  }),
], { alignment: AlignmentType.RIGHT });

/* ------------------------------------------------------------------ document */
const doc = new Document({
  creator: 'ECAE',
  title: 'Rapport de compensation des quantités — TMS CEG Antanimbarinandriana',
  description: 'Réf. ECAE/TMS-ANT/2026-RC-01',
  styles: {
    default: {
      document: { run: { font: FONT, size: 19, color: TEXT }, paragraph: { spacing: { after: 0, line: 259 } } },
    },
  },
  numbering: {
    config: [
      {
        reference: 'puces',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '•',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 360 } }, run: { font: FONT, size: 21 } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        titlePage: true,
        page: { margin: { top: 1020, right: 1080, bottom: 1080, left: 1080, header: 720, footer: 720 } },
      },
      headers: {
        first: new Header({ children: [new Paragraph({ children: [] })] }),
        default: new Header({
          children: [
            new Paragraph({
              spacing: { after: 0, line: 240 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: TEAL, space: 3 } },
              children: [
                new TextRun({ text: 'ECAE', font: FONT, size: 20, bold: true, color: NAVY }),
                new TextRun({
                  text: '   |   Rapport de compensation — TMS CEG Antanimbarinandriana   |   ECAE/TMS-ANT/2026-RC-01',
                  font: FONT, size: 16, color: GRAY,
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        first: new Footer({ children: [new Paragraph({ children: [] })] }),
        default: new Footer({
          children: [
            new Paragraph({
              alignment: C,
              spacing: { after: 0, line: 240 },
              children: [
                new TextRun({
                  text: 'ECAE — Lot I AB 11 Ter D Andrononobe — Antananarivo, Madagascar • ecae@live.fr • +261 34 08 142 16   —   Page ',
                  font: FONT, size: 16, color: GRAY,
                }),
                new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20, color: GRAY }),
                new TextRun({ text: ' / ', font: FONT, size: 20, color: GRAY }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 20, color: GRAY }),
              ],
            }),
          ],
        }),
      },
      children: [
        /* ----------------------------------------------------------- en-tete */
        new Paragraph({
          alignment: C,
          spacing: { after: 100, line: 259 },
          children: [run('RAPPORT DE COMPENSATION DES QUANTITÉS', { size: 32, bold: true, color: NAVY })],
        }),
        new Paragraph({
          alignment: C,
          spacing: { after: 40, line: 259 },
          children: [run('Terrain multisport et vestiaires — CEG ANTANIMBARINANDRIANA', { size: 24, bold: true, color: BLUE })],
        }),
        new Paragraph({
          alignment: C,
          spacing: { after: 0, line: 259 },
          children: [run('Projet PE_MVOLA_14 financé par la Fondation AXIAN  •  Réception provisoire  •  Réf. ECAE/TMS-ANT/2026-RC-01', { size: 18, italics: true, color: GRAY })],
        }),
        new Paragraph({
          alignment: C,
          spacing: { after: 140, line: 259 },
          children: [run('Antananarivo, le 10 septembre 2026', { size: 18, italics: true, color: GRAY })],
        }),

        /* ------------------------------------------------------------- objet */
        boxed('Objet', [
          run("À la réception, il a été relevé que la faïence murale des vestiaires a été réalisée sur 15 m² au lieu des 32 m² prévus au BDQE. Le présent rapport chiffre cet écart. Il le compare aux travaux que l'ECAE a réalisés en plus du BDQE, sans les facturer, parce qu'ils étaient nécessaires à la solidité et à la durée de vie de l'ouvrage pour les élèves du CEG. La moins-value et le supplément de terrain sont calculés aux prix unitaires TTC du BDQE contractuel révisé (lots Terrain multisport et Vestiaires) ; la couche de caillasse, poste inexistant au bordereau, est valorisée à un prix estimatif de "),
          run(`13${NB}000${NB}Ar/m² TTC.`),
        ]),

        /* --------------------------------------------------------- section 1 */
        heading('1.', 'CE QUI A ÉTÉ RÉALISÉ EN MOINS (MOINS-VALUE)', 480),
        tableMoinsValue,

        /* --------------------------------------------------------- section 2 */
        heading('2.', 'CE QUI A ÉTÉ RÉALISÉ EN PLUS, SANS FACTURATION (PLUS-VALUES)', 270),

        subheading('A.', `Terrain : 519${NB}m² réalisés au lieu de 420${NB}m² prévus (+${NB}99${NB}m², soit +${NB}23,6${NB}%)`),
        para("Le BDQE quantifie la plate-forme sur la seule aire de jeu de 28 × 15 m = 420 m² (postes TMS 1.1 à 1.3, « Concerne : plate-forme 420 m² »), sans marge de dégagement autour de l'aire de jeu. L'ECAE a réalisé la plate-forme élargie de ses marges de sécurité sur tout le pourtour, soit 519 m² mesurés sur site à la réception. Le supplément de 99 m² est valorisé aux prix unitaires du BDQE pour les trois postes de la plate-forme :", { after: 100 }),
        tableTerrain,
        para(`Méthode : quantités du supplément calculées comme au BDQE (ép. 0,05${NB}m et 0,08${NB}m ; acier 40${NB}kg/m³), au prorata de la surface.`, { size: 17, italics: true, before: 20, after: 0, align: AlignmentType.LEFT }),

        subheading('B.', 'Couche de fondation en caillasse sous le béton (poste absent du BDQE)'),
        para("Le BDQE fait reposer la dalle (béton de propreté puis béton armé) directement sur le sol naturel, sans couche de fondation. Le sol latéritique du site, de faible portance, ne le permettait pas : l'ECAE a mis en œuvre sur toute la surface réelle une couche de caillasse 0/31,5 de 10 cm compactée à 95 % OPM (structure multicouche de la note de calcul NDC-TMS-ANT-2026 Rév. 05 ; quantités établies sur la surface mesurée), indispensable au drainage et à la portance. Ce poste, absent du BDQE, n'a pas été facturé ; il est valorisé à titre estimatif à 13 000 Ar/m² TTC (fourniture, transport, réglage, compactage).", { after: 100 }),
        tableCaillasse,

        subheading('C.', "Vestiaires : WC à l'anglaise à la place des sièges turcs (amélioration de standard)"),
        tableVestiaires,

        /* --------------------------------------------------------- section 3 */
        heading('3.', 'BILAN DE LA COMPENSATION', 150),
        tableBilan,
        gap(3),
        boxed('Lecture du bilan', [
          run(`Les travaux réalisés en plus valent 12,8 fois la faïence manquante. Chaque plus-value la couvre à elle seule : le supplément de terrain 7,6 fois, la couche de caillasse 5,2 fois. Après compensation, l'ouvrage livré vaut 15${NB}397${NB}400${NB}Ar de plus que le BDQE, sans facturation supplémentaire.`),
        ], { fill: BOXBG }),

        /* --------------------------------------------------------- section 4 */
        heading('4.', 'POURQUOI CES CHOIX ONT ÉTÉ FAITS', 400),
        new Paragraph({
          numbering: { reference: 'puces', level: 0 },
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 80, after: 60, line: 259 },
          children: [
            run('Sécurité des élèves — ', { size: 20, bold: true }),
            run(`des marges de dégagement autour de l'aire de jeu évitent que les élèves sortent de la dalle en pleine course ; elles n'étaient pas comprises dans les 420${NB}m² du bordereau.`, { size: 20 }),
          ],
        }),
        new Paragraph({
          numbering: { reference: 'puces', level: 0 },
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 259 },
          children: [
            run('Durabilité de la dalle — ', { size: 20, bold: true }),
            run('sans caillasse compactée, la dalle de 8 cm reposerait sur une latérite de faible portance et se fissurerait dès les premières pluies ; la caillasse porte et draine la plate-forme (note de calcul).', { size: 20 }),
          ],
        }),
        new Paragraph({
          numbering: { reference: 'puces', level: 0 },
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 259 },
          children: [
            run('Hygiène et confort — ', { size: 20, bold: true }),
            run("les WC à l'anglaise sont plus confortables, plus faciles à nettoyer et mieux adaptés à un usage scolaire que les sièges turcs.", { size: 20 }),
          ],
        }),
        new Paragraph({
          numbering: { reference: 'puces', level: 0 },
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 259 },
          children: [
            run('Faïence murale — ', { size: 20, bold: true }),
            run(`posée sur les zones humides utiles (douches et WC, 15${NB}m²) ; les autres parois sont enduites et peintes, sans effet sur l'usage ni l'entretien des locaux.`, { size: 20 }),
          ],
        }),

        /* ------------------------------------------------- remarque (finale) */
        gap(8),
        boxed('Remarque', [
          run("Les plus-values réalisées hors BDQE ne font l'objet d'aucune demande de règlement de la part de l'ECAE. Ces travaux n'ont pas été engagés pour obtenir un supplément de prix : ils ont été exécutés parce qu'ils étaient nécessaires à la sécurité des élèves, à la solidité et à la durée de vie de l'ouvrage remis au CEG."),
        ], { fill: BOXBG }),

        /* ------------------------------------------------------- signature */
        gap(14),
        tableSignature,
      ],
    },
  ],
});

const out = path.join(__dirname, 'Rapport_de_compensation_TMS_CEG_Antanimbarinandriana.docx');
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log('OK ->', out, buf.length, 'octets');
});
