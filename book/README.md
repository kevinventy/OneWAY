# The Turning of the Bones

A novel. 34,000 words, 141 pages, typeset as a 5.5 × 8.5 in trade-paperback interior.

**Read it:** [`The_Turning_of_the_Bones.pdf`](The_Turning_of_the_Bones.pdf)

A Malagasy engineer who made a fortune abroad comes home, buys a headland in the far
north, and spends eleven years turning a 1942 French coastal battery into the most
heavily defended private residence in the southern hemisphere — without ever admitting
to himself why. Then he finds the ledger, and publishes it, and discovers what a
fortress can and cannot buy.

Fiction. Every character, ministry, company and document in it is invented; see the
Author's Note at the back.

## Contents of this directory

| File | What it is |
| --- | --- |
| `The_Turning_of_the_Bones.pdf` | The finished book |
| `manuscript.txt` … `manuscript_4.txt` | The manuscript, in a small `@`-directive markup |
| `build_book.py` | The typesetter |

## Building

```sh
pip install reportlab pyphen     # pyphen is optional; it enables hyphenation
python3 build_book.py
```

The typesetter uses Bitstream Charter (Type 1, from `/usr/share/fonts/X11/Type1`) and
falls back to Times if it is missing. It sets alternating recto/verso margins so the
gutter follows the spine, running heads and folios (suppressed on chapter openers,
part titles and blanks), three-line drop caps, part-title pages forced onto rectos,
and a PDF outline. It runs several passes: the first few settle part titles onto
right-hand pages, the last two discover and then suppress page furniture.

## Manuscript markup

```
@PART|ONE|THE LEDGER          part-title page
@CH|1|Three Minutes Past Three chapter opener (drop cap follows)
@EPI|quotation|attribution     chapter epigraph
@BREAK                         scene break ornament
@ENDMARK                       closing ornament
@BACKMATTER|AUTHOR'S NOTE      back-matter section
```

Plain paragraphs are separated by blank lines. `*italic*` and `**bold**` work;
quotation marks and dashes are curled at build time.
