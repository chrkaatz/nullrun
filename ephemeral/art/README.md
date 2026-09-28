# Art source

**Provenance.** Both sheets were generated with Google Gemini. The tiles here are cuts of them,
resized and colour-matched by hand, and are shared by all three arms. AI-generated images may not
be protected by copyright; the repository's MIT licence covers them only as far as any rights exist.

Tiles cut from a single 1408×768 sheet (`Gemini_Generated_Image_bjz6vcbjz6vcbjz6.jpeg`).
Kept here so the build can be regenerated without re-cutting the sheet by hand — the build
embeds these as base64 data URIs and is the only artifact that ships.

Tile boxes were detected from the sheet's brightness profile, not eyeballed:

| id | box on sheet (x0,y0,x1,y1) |
|---|---|
| velvet | 29,22,342,155 |
| bishop | 367,22,691,155 |
| sparrow | 716,22,1040,155 |
| mole | 1065,22,1378,155 |
| hatchet | 29,196,342,329 |
| grief | 367,196,564,329 |
| tally | 588,196,823,329 |
| ash | 846,196,1040,329 |
| prior | 1065,196,1378,329 |
| wall | 29,393,460,535 |
| sweep | 483,393,924,535 |
| cold | 29,582,460,725 |
| hunter | 483,582,924,725 |
| archon | 948,582,1378,725 |

## Second sheet (tiers 1–3), 2752×1536

| id | box on sheet (x0,y0,x1,y1) |
|---|---|
| ninth | 92,232,906,673 |
| cardinal | 969,232,1782,673 |
| wren | 1845,232,2660,673 |
| saint | 555,810,1368,1251 |
| dolorosa | 1412,810,2225,1251 |

Row 1 detected cleanly and uniformly (814×441). Row 2's boxes were clipped by the detector
where the glitch bands go dark, so its left/top edges were taken from detection and the size
from row 1's nominal tile.

**Saturation matched to the first sheet.** The second sheet rendered greyer: mean HSL
saturation 24–36 against the first sheet's 47–52, at the same hue (~183). Each tile was
corrected per-tile toward 48 — `magick -modulate 100,<factor>,100`, factors 1.00 to 2.01 —
before encoding. Hue was already correct and was not touched.

Encoding: contacts `cwebp -q 70 -resize 176 0`, constructs `cwebp -q 58 -resize 400 0`.
Chosen against NFR-7: the whole set is 57 KB raw, 76 KB as base64, taking the build from
33 KB to 92 KB of the 150 KB budget.

**Unused.** The sheet's third row-3 tile is labelled CONSTRUCT SWEEP and duplicates
CORPSEC SWEEP; §C has no such construct, so it was not cut.

**Missing.** No art for NINE-TENTHS, CARDINAL, WREN, SAINT or DOLOROSA (tiers 2 and 3).
They fall back to a text placeholder.
