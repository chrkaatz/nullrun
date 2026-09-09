# Art source

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

Encoding: contacts `cwebp -q 70 -resize 176 0`, constructs `cwebp -q 58 -resize 400 0`.
Chosen against NFR-7: the whole set is 57 KB raw, 76 KB as base64, taking the build from
33 KB to 92 KB of the 150 KB budget.

**Unused.** The sheet's third row-3 tile is labelled CONSTRUCT SWEEP and duplicates
CORPSEC SWEEP; §C has no such construct, so it was not cut.

**Missing.** No art for NINE-TENTHS, CARDINAL, WREN, SAINT or DOLOROSA (tiers 2 and 3).
They fall back to a text placeholder.
