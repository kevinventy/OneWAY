#!/usr/bin/env python3
"""Typeset THE TURNING OF THE BONES as a print-quality PDF book.

Reads the @-marked manuscript files and produces a 5.5 x 8.5 in trade-paperback
interior: Bitstream Charter body text, alternating recto/verso margins, running
heads, folios, drop caps, part-title pages, front matter and back matter.

Usage:  python3 build_book.py
"""

import os
import re
import sys
import unicodedata

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import (BaseDocTemplate, Flowable, Frame, KeepTogether,
                                PageBreak, PageTemplate, Paragraph,
                                ParagraphAndImage, Spacer)

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCES = ["manuscript.txt", "manuscript_2.txt", "manuscript_3.txt", "manuscript_4.txt"]
OUT = os.path.join(HERE, "The_Turning_of_the_Bones.pdf")

BOOK_TITLE = "THE TURNING OF THE BONES"

# ------------------------------------------------------------------ fonts

T1DIR = "/usr/share/fonts/X11/Type1"
CHARTER = [("Charter", "c0648bt_"), ("Charter-Bold", "c0632bt_"),
           ("Charter-Italic", "c0649bt_"), ("Charter-BoldItalic", "c0633bt_")]


def register_fonts():
    try:
        for name, stem in CHARTER:
            face = pdfmetrics.EmbeddedType1Face(os.path.join(T1DIR, stem + ".afm"),
                                                os.path.join(T1DIR, stem + ".pfb"))
            pdfmetrics.registerTypeFace(face)
            pdfmetrics.registerFont(pdfmetrics.Font(name, face.name, "WinAnsiEncoding"))
        pdfmetrics.registerFontFamily("Charter", normal="Charter", bold="Charter-Bold",
                                      italic="Charter-Italic",
                                      boldItalic="Charter-BoldItalic")
        return "Charter", "Charter-Bold", "Charter-Italic", "Charter-BoldItalic"
    except Exception as exc:                                    # pragma: no cover
        sys.stderr.write("Charter unavailable (%s); using Times.\n" % exc)
        return "Times-Roman", "Times-Bold", "Times-Italic", "Times-BoldItalic"


F_R, F_B, F_I, F_BI = register_fonts()

INK = colors.Color(0.10, 0.10, 0.11)
FAINT = colors.Color(0.44, 0.44, 0.47)
MID = colors.Color(0.26, 0.26, 0.28)

# ------------------------------------------------------------------ page

PW, PH = 5.5 * inch, 8.5 * inch
M_TOP, M_BOT = 0.72 * inch, 0.80 * inch
M_IN, M_OUT = 0.82 * inch, 0.60 * inch
FW = PW - M_IN - M_OUT
FH = PH - M_TOP - M_BOT

SIZE, LEAD = 10.6, 14.6

_state = {"running": "", "front": True}
_plain_pages = set()      # chapter openers: folio, no running head
_bare_pages = set()       # part titles and blanks: nothing at all
_part_pages = {}          # part label -> page it landed on (for recto forcing)
_recto_fix = {}           # part label -> insert a blank page before it


def letterspace(canvas, text, cx, y, font, size, tracking, color=None):
    canvas.setFont(font, size)
    if color is not None:
        canvas.setFillColor(color)
    widths = [pdfmetrics.stringWidth(c, font, size) for c in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = cx - total / 2.0
    for ch, w in zip(text, widths):
        canvas.drawString(x, y, ch)
        x += w + tracking


def furniture(canvas, doc, verso):
    page = canvas.getPageNumber()
    if _state["front"] or page in _bare_pages:
        return
    left = M_OUT if verso else M_IN
    cx = left + FW / 2.0
    canvas.saveState()
    if page not in _plain_pages:
        head = BOOK_TITLE if verso else _state["running"].upper()
        letterspace(canvas, head, cx, PH - M_TOP + 20.5, F_R, 7.2, 1.7, FAINT)
    letterspace(canvas, str(page), cx, M_BOT - 27, F_R, 9.0, 0.8, MID)
    canvas.restoreState()


def on_recto(canvas, doc):
    furniture(canvas, doc, False)


def on_verso(canvas, doc):
    furniture(canvas, doc, True)


class BookDoc(BaseDocTemplate):
    """Alternates recto/verso page templates so the gutter margin follows the spine."""

    def handle_pageBegin(self):
        idx = 0 if (self.page + 1) % 2 == 1 else 1
        self.pageTemplate = self.pageTemplates[idx]
        BaseDocTemplate.handle_pageBegin(self)


# ------------------------------------------------------------------ styles

try:
    import pyphen                                              # noqa: F401
    HYPHEN = dict(hyphenationLang="en_GB", embeddedHyphenation=1,
                  hyphenationMinWordLength=6, uriWasteReduce=0.3)
except ImportError:                                            # pragma: no cover
    HYPHEN = {}


def S(name, **kw):
    base = dict(name=name, fontName=F_R, fontSize=SIZE, leading=LEAD,
                textColor=INK, alignment=TA_JUSTIFY,
                allowWidows=0, allowOrphans=0)
    base.update(HYPHEN)
    base.update(kw)
    return ParagraphStyle(**base)


st_body = S("body", firstLineIndent=13)
st_flush = S("flush", firstLineIndent=0)
st_drop = S("drop", firstLineIndent=0)
st_epi = S("epi", fontName=F_I, fontSize=9.0, leading=12.3, alignment=TA_LEFT,
           leftIndent=30, rightIndent=14, textColor=MID)
st_epi_src = S("episrc", fontSize=7.5, leading=10.2, alignment=TA_RIGHT,
               leftIndent=30, rightIndent=14, textColor=FAINT)
st_chaptitle = S("chaptitle", fontName=F_B, fontSize=16, leading=20, alignment=TA_CENTER)
st_parttitle = S("parttitle", fontName=F_B, fontSize=20, leading=25, alignment=TA_CENTER)
st_title = S("title", fontName=F_B, fontSize=25, leading=30, alignment=TA_CENTER)
st_subtitle = S("subtitle", fontName=F_I, fontSize=11.5, leading=16, alignment=TA_CENTER,
                textColor=FAINT)
st_ded = S("ded", fontName=F_I, fontSize=9.8, leading=14.6, alignment=TA_CENTER,
           leftIndent=22, rightIndent=22, textColor=MID)
st_epig = S("epig", fontName=F_I, fontSize=11.4, leading=16.4, alignment=TA_CENTER,
            leftIndent=26, rightIndent=26)
st_epig_tr = S("epigtr", fontName=F_I, fontSize=9.3, leading=13, alignment=TA_CENTER,
               leftIndent=26, rightIndent=26, textColor=FAINT)
st_epig_src = S("epigsrc", fontSize=8.2, leading=12, alignment=TA_CENTER, textColor=FAINT)
st_copy = S("copy", fontSize=8.2, leading=12.6, alignment=TA_CENTER,
            leftIndent=14, rightIndent=14, textColor=MID)
st_toc = S("toc", fontSize=9.5, leading=15.2, alignment=TA_LEFT,
              leftIndent=44, firstLineIndent=-22)
st_back_h = S("backh", fontName=F_B, fontSize=13.5, leading=18, alignment=TA_CENTER)
st_gloss = S("gloss", fontSize=9.1, leading=13.0, alignment=TA_LEFT,
             leftIndent=15, firstLineIndent=-15, spaceAfter=4.5)


# ------------------------------------------------------------------ flowables

class SpacedLine(Flowable):
    """A centred, letterspaced display line (small-caps feel without a SC font)."""

    def __init__(self, text, size=8.2, tracking=2.3, color=None, font=None, space=0):
        Flowable.__init__(self)
        self.text, self.size, self.tracking = text, size, tracking
        self.color = color if color is not None else FAINT
        self.font = font or F_R
        self.width, self.height = FW, size + space

    def wrap(self, aw, ah):
        self.width = aw
        return aw, self.height

    def draw(self):
        letterspace(self.canv, self.text, self.width / 2.0, self.height - self.size,
                    self.font, self.size, self.tracking, self.color)


class Rule(Flowable):
    def __init__(self, width=44, thickness=0.6, space=7, color=None):
        Flowable.__init__(self)
        self.w, self.t, self.space = width, thickness, space
        self.color = color if color is not None else FAINT
        self.width, self.height = FW, space * 2 + thickness

    def wrap(self, aw, ah):
        self.width = aw
        return aw, self.height

    def draw(self):
        c = self.canv
        c.setStrokeColor(self.color)
        c.setLineWidth(self.t)
        cx = self.width / 2.0
        c.line(cx - self.w / 2.0, self.space, cx + self.w / 2.0, self.space)


class Ornament(Flowable):
    """Scene break: a small diamond flanked by hairlines."""

    def __init__(self, gap=15):
        Flowable.__init__(self)
        self.width, self.height = FW, gap * 2
        self.gap = gap

    def wrap(self, aw, ah):
        self.width = aw
        return aw, self.height

    def draw(self):
        c = self.canv
        cx, cy, r = self.width / 2.0, self.height / 2.0, 2.4
        c.setFillColor(FAINT)
        c.setStrokeColor(FAINT)
        p = c.beginPath()
        p.moveTo(cx, cy + r)
        p.lineTo(cx + r, cy)
        p.lineTo(cx, cy - r)
        p.lineTo(cx - r, cy)
        p.close()
        c.drawPath(p, fill=1, stroke=0)
        c.setLineWidth(0.4)
        c.line(cx - 26, cy, cx - 9, cy)
        c.line(cx + 9, cy, cx + 26, cy)


class DropCap(Flowable):
    """Three-line initial for ParagraphAndImage to flow the paragraph around."""

    LINES = 3

    def __init__(self, letter):
        Flowable.__init__(self)
        self.letter = letter
        face = pdfmetrics.getFont(F_B).face
        cap = (face.capHeight or 700) / 1000.0
        self.height = LEAD * self.LINES - 3.0
        self.size = self.height / cap
        self.width = pdfmetrics.stringWidth(letter, F_B, self.size) + 1.5

    def wrap(self, aw, ah):
        return self.width, self.height

    def draw(self):
        c = self.canv
        c.setFont(F_B, self.size)
        c.setFillColor(INK)
        c.drawString(0, 0.5, self.letter)


class Mark(Flowable):
    """Zero-height: records PDF outline entries, plain pages and running heads."""

    def __init__(self, title=None, level=0, plain=False, bare=False,
                 running=None, front=None, part=None):
        Flowable.__init__(self)
        self.title, self.level, self.plain, self.bare = title, level, plain, bare
        self.running, self.front, self.part = running, front, part
        self.width = self.height = 0

    def wrap(self, aw, ah):
        return 0, 0

    def draw(self):
        page = self.canv.getPageNumber()
        if self.plain:
            _plain_pages.add(page)
        if self.bare:
            _bare_pages.add(page)
        if self.part is not None:
            _part_pages[self.part] = page
        if self.running is not None:
            _state["running"] = self.running
        if self.front is not None:
            _state["front"] = self.front
        if self.title:
            key = "s%d" % id(self)
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(self.title, key, level=self.level,
                                      closed=(self.level == 0))


# ------------------------------------------------------------------ text

def smart(t):
    t = t.replace("--", "—")
    out, in_dq, prev = [], False, ""
    for ch in t:
        if ch == '"':
            out.append("“" if not in_dq else "”")
            in_dq = not in_dq
        elif ch == "'":
            out.append("‘" if prev in ("", " ", "(", "“", "—") else "’")
        else:
            out.append(ch)
        prev = ch
    return "".join(out)


def markup(t):
    t = t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    t = smart(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t, flags=re.S)
    t = re.sub(r"(?<!\*)\*([^*\n]+?)\*(?!\*)", r"<i>\1</i>", t)
    return t


def P(text, style):
    return Paragraph(markup(text), style)


def nice_title(t):
    t = t.title().replace("'S", "’s").replace("On The", "on the")
    return t


ORDINALS = {1: "ONE", 2: "TWO", 3: "THREE", 4: "FOUR", 5: "FIVE", 6: "SIX", 7: "SEVEN",
            8: "EIGHT", 9: "NINE", 10: "TEN", 11: "ELEVEN", 12: "TWELVE",
            13: "THIRTEEN", 14: "FOURTEEN", 15: "FIFTEEN", 16: "SIXTEEN",
            17: "SEVENTEEN", 18: "EIGHTEEN", 19: "NINETEEN", 20: "TWENTY"}


def read_manuscript():
    parts = []
    for name in SOURCES:
        with open(os.path.join(HERE, name), encoding="utf-8") as fh:
            parts.append(fh.read().strip("\n"))
    return "\n\n".join(parts)


def parse(text):
    """Directive lines (@KIND|...) are always their own block; runs of plain
    lines collapse into a single justified paragraph."""
    blocks = []
    for chunk in text.split("\n\n"):
        if not chunk.strip():
            continue
        buf = []
        for line in chunk.strip("\n").splitlines():
            line = line.strip()
            if not line:
                continue
            if line.startswith("@"):
                if buf:
                    blocks.append(("TEXT", " ".join(buf)))
                    buf = []
                head, _, rest = line.partition("|")
                blocks.append((head[1:].strip(), rest))
            else:
                buf.append(line)
        if buf:
            blocks.append(("TEXT", " ".join(buf)))
    return blocks


def check_encodable(blocks):
    bad = {}
    for _, rest in blocks:
        for ch in smart(rest):
            try:
                ch.encode("cp1252")
            except UnicodeEncodeError:
                bad[ch] = bad.get(ch, 0) + 1
    if bad:
        sys.stderr.write("WARNING: characters outside WinAnsi: %s\n"
                         % {unicodedata.name(k, repr(k)): v for k, v in bad.items()})


# ------------------------------------------------------------------ build

def build():
    _state["front"] = True
    _state["running"] = ""
    blocks = parse(read_manuscript())
    check_encodable(blocks)
    meta = {k: r for k, r in blocks if k in ("TITLE", "SUBTITLE", "AUTHOR")}
    toc_items = [(k, r) for k, r in blocks
                 if k in ("PART", "CH", "EPILOGUE", "BACKMATTER")]

    story = [Mark(front=True)]

    # -- half title
    story += [Spacer(1, FH * 0.30), SpacedLine(BOOK_TITLE, 10.5, 2.6, FAINT),
              PageBreak(), Mark(bare=True), PageBreak()]

    # -- title page
    story += [Spacer(1, FH * 0.19),
              P(meta.get("TITLE", BOOK_TITLE), st_title),
              Spacer(1, 12), Rule(width=96, thickness=0.8, space=5), Spacer(1, 8),
              P(meta.get("SUBTITLE", "A Novel"), st_subtitle),
              Spacer(1, FH * 0.35),
              SpacedLine("ONE WAY EDITIONS", 8.0, 3.0, FAINT),
              PageBreak()]

    # -- copyright
    story += [Spacer(1, FH * 0.40),
              P("This is a work of fiction. Names, characters, places, organisations, "
                "agencies, ministries, companies, incidents and documents are the product "
                "of the author's imagination or are used fictitiously. Any resemblance to "
                "actual persons, living or dead, to actual government bodies or officials, "
                "or to actual events is entirely coincidental.", st_copy),
              Spacer(1, 13),
              P("The Republic of Madagascar, its institutions and its people are real, and "
                "are held here in affection. Nothing in these pages is intended as an "
                "allegation against any real individual, company or institution.", st_copy),
              Spacer(1, 13),
              P("Technical descriptions are impressionistic and deliberately incomplete. "
                "They are written to be read, not followed.", st_copy),
              Spacer(1, 22), SpacedLine("FIRST EDITION", 7.4, 2.4, FAINT),
              PageBreak()]

    # -- dedication
    for k, r in blocks:
        if k != "DEDICATION":
            continue
        story += [Spacer(1, FH * 0.33)]
        for line in r.split("|"):
            story += [P(line, st_ded), Spacer(1, 10)]
        story += [PageBreak(), Mark(bare=True), PageBreak()]

    # -- epigraphs
    story += [Spacer(1, FH * 0.24)]
    for key in ("EPIGRAPH", "EPIGRAPH2"):
        for k, r in blocks:
            if k != key:
                continue
            bits = r.split("|")
            story += [P(bits[0], st_epig)]
            if len(bits) == 3:
                story += [Spacer(1, 4), P(bits[1], st_epig_tr),
                          Spacer(1, 9), P(bits[2], st_epig_src)]
            elif len(bits) == 2:
                story += [Spacer(1, 9), P(bits[1], st_epig_src)]
            story += [Spacer(1, FH * 0.085)]
    story += [PageBreak(), Mark(bare=True), PageBreak()]

    # -- contents
    story += [Spacer(1, 16), SpacedLine("CONTENTS", 10.0, 3.2, INK),
              Rule(width=36, space=12), Spacer(1, 8)]
    for kind, rest in toc_items:
        f = rest.split("|")
        if kind == "PART":
            story += [Spacer(1, 9),
                      SpacedLine("PART %s  ·  %s" % (f[0], f[1]), 8.2, 2.0, MID, F_B, 6)]
        elif kind == "CH":
            story += [P("%s  %s" % (f[0], f[1]), st_toc)]
        elif kind == "EPILOGUE":
            story += [Spacer(1, 8), P("Epilogue  %s" % f[0], st_toc)]
        elif kind == "BACKMATTER":
            story += [P(nice_title(f[0]), st_toc)]
    story += [PageBreak(), Mark(front=False)]

    # -- body
    pending = None       # None | "drop" | "flush"
    in_glossary = False

    for kind, rest in blocks:
        f = rest.split("|")

        if kind in ("TITLE", "SUBTITLE", "AUTHOR", "DEDICATION", "EPIGRAPH", "EPIGRAPH2"):
            continue

        if kind == "PART":
            story += [PageBreak()]
            if _recto_fix.get(f[0]):                 # push the part title to a recto
                story += [Mark(bare=True), PageBreak()]
            story += [Mark("PART %s: %s" % (f[0], f[1]), 0, bare=True,
                           running="PART %s" % f[0], part=f[0]),
                      Spacer(1, FH * 0.30),
                      SpacedLine("PART %s" % f[0], 9.5, 3.4, FAINT),
                      Spacer(1, 16), Rule(width=40, space=5), Spacer(1, 13),
                      P(f[1], st_parttitle),
                      PageBreak(), Mark(bare=True)]   # blank verso after a part title
            pending = None
            continue

        if kind in ("CH", "EPILOGUE"):
            if kind == "CH":
                num, title = int(f[0]), f[1]
                label = "CHAPTER " + ORDINALS.get(num, str(num))
                bm = "%d. %s" % (num, title)
            else:
                title, label, bm = f[0], "EPILOGUE", "Epilogue: " + f[0]
            story += [PageBreak(),
                      Mark(bm, 1, plain=True, running=title),
                      Spacer(1, FH * 0.085),
                      SpacedLine(label, 8.2, 2.8, FAINT),
                      Spacer(1, 11), Rule(width=26, space=3), Spacer(1, 11),
                      P(title, st_chaptitle), Spacer(1, 22)]
            pending = "drop"
            in_glossary = False
            continue

        if kind == "BACKMATTER":
            title = nice_title(f[0])
            in_glossary = "MALAGASY" in f[0].upper()
            story += [PageBreak(),
                      Mark(title, 1, plain=True, running=title),
                      Spacer(1, FH * 0.06), P(title, st_back_h),
                      Rule(width=30, space=10), Spacer(1, 10)]
            pending = "flush"
            continue

        if kind == "EPI":
            story += [P(f[0], st_epi), Spacer(1, 3)]
            if len(f) > 1:
                story += [P("— " + f[1], st_epi_src)]
            story += [Spacer(1, 19)]
            continue

        if kind == "BREAK":
            story += [Ornament()]
            pending = "flush"
            continue

        if kind == "ENDMARK":
            tail = [Spacer(1, 14), Rule(width=18, thickness=1.0, space=4, color=MID)]
            if story:                      # never let the end ornament sit alone
                story.append(KeepTogether([story.pop()] + tail))
            else:
                story += tail
            continue

        if kind == "TEXT":
            if in_glossary:
                story.append(P(rest, st_gloss))
                continue
            if pending == "drop" and rest[:1].isalpha():
                try:
                    story.append(ParagraphAndImage(Paragraph(markup(rest[1:]), st_drop),
                                                   DropCap(rest[0]),
                                                   xpad=2.5, ypad=0, side="left"))
                except Exception:
                    story.append(P(rest, st_flush))
                pending = None
            elif pending in ("drop", "flush"):
                story.append(P(rest, st_flush))
                pending = None
            else:
                story.append(P(rest, st_body))
            continue

    doc = BookDoc(OUT, pagesize=(PW, PH),
                  title="The Turning of the Bones",
                  author="One Way Editions",
                  subject="A novel of the Red Island",
                  creator="One Way Editions",
                  leftMargin=M_IN, rightMargin=M_OUT,
                  topMargin=M_TOP, bottomMargin=M_BOT)

    pad = dict(leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([
        PageTemplate(id="Recto", frames=[Frame(M_IN, M_BOT, FW, FH, id="r", **pad)],
                     onPage=on_recto),
        PageTemplate(id="Verso", frames=[Frame(M_OUT, M_BOT, FW, FH, id="v", **pad)],
                     onPage=on_verso),
    ])
    doc.build(story)
    return OUT, doc.page


if __name__ == "__main__":
    # Two passes: the first discovers which pages are chapter openers, part
    # titles and blanks (page furniture is painted before those flowables are
    # laid out); the second suppresses heads and folios on them. Pagination is
    # identical between passes because the content is.
    for _ in range(4):                     # settle part titles onto rectos
        build()
        changed = False
        for label, page in _part_pages.items():
            if page % 2 == 0:                          # landed on a verso: flip
                _recto_fix[label] = not _recto_fix.get(label, False)
                changed = True
        if not changed:
            break
    _plain_pages.clear()
    _bare_pages.clear()
    build()                                # pass A: discover furniture pages
    path, pages = build()                  # pass B: final
    print("wrote %s  (%d pages, %.1f KB)" % (path, pages, os.path.getsize(path) / 1024.0))
