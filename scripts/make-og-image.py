#!/usr/bin/env python3
"""
Render the Open Graph share card.

Dev-time only; never imported by the page.

REGENERATE
    python3 scripts/make-og-image.py

WHY THIS IS DRAWN RATHER THAN SUMMONED
The card is built from the site's own tokens so it cannot drift from the
palette. It is flat colour and black type with no gradient, no blur and no
radius, because those are the rules the stylesheet enforces and a share card
that broke them would advertise a design the site does not have.

The previous renderer drew a phosphor bloom with soft interference bands. That
was a correct picture of the build this replaced, and a wrong picture of this
one, so it was not re-tinted — it was redrawn.

FONTS
    /tmp/ogfonts/ArchivoBlack-Regular.ttf
    /tmp/ogfonts/GeistMono[wght].ttf
Fetch them from the upstream repositories before running; neither is committed,
because neither is needed to serve the site — only to re-render this card.
"""

import os

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630

# --- tokens, mirrored from assets/v2/css/base.css ----------------------------
INK = (0, 0, 0)
CREAM = (0xFF, 0xF8, 0xE7)

# The grounds, in the order they appear down the page.
BLUE = (0x35, 0xC4, 0xF5)
YELLOW = (0xFF, 0xD9, 0x3D)
RED = (0xFF, 0x4D, 0x3D)
GREEN = (0x7B, 0xE0, 0x4A)
PURPLE = (0xA9, 0x7B, 0xFF)
PINK = (0xFF, 0x6F, 0xD8)
ORANGE = (0xFF, 0x9E, 0x2C)

DISPLAY_TTF = "/tmp/ogfonts/ArchivoBlack-Regular.ttf"
MONO_TTF = "/tmp/ogfonts/GeistMono-Regular.ttf"

NAME = "Aditya Danapurkar"
ROLE = "Full-Stack Blockchain & AI Engineer"


def font(path, size):
    return ImageFont.truetype(path, size)


def main():
    for path in (DISPLAY_TTF, MONO_TTF):
        if not os.path.exists(path):
            raise SystemExit(
                f"missing {path}\n"
                "  curl -sSL -o /tmp/ogfonts/ArchivoBlack-Regular.ttf \\\n"
                "    https://raw.githubusercontent.com/google/fonts/main/ofl/archivoblack/ArchivoBlack-Regular.ttf\n"
                "  curl -sSL -o /tmp/ogfonts/GeistMono-Regular.ttf \\\n"
                "    https://raw.githubusercontent.com/google/fonts/main/ofl/geistmono/GeistMono%5Bwght%5D.ttf"
            )

    img = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(img)

    # --- the colour stack on the right, one hard band per section -------------
    # Sized from the page's own order so a viewer who knows the site reads it
    # as a compressed copy of it rather than as decoration.
    stack_w = 300
    bands = [BLUE, YELLOW, RED, GREEN, PURPLE, PINK, ORANGE]
    gap = 6
    band_h = (H - gap * (len(bands) - 1)) / len(bands)
    for i, colour in enumerate(bands):
        y0 = int(i * (band_h + gap))
        y1 = int(y0 + band_h)
        d.rectangle([W - stack_w, y0, W, y1], fill=colour, outline=INK, width=3)

    # --- the name, set as large as the measure allows -------------------------
    pad = 64
    measure = W - stack_w - pad * 2
    size = 200
    while size > 60:
        f = font(DISPLAY_TTF, size)
        if d.textlength(NAME, font=f) <= measure:
            break
        size -= 4

    f = font(DISPLAY_TTF, size)
    d.text((pad, 168), NAME, font=f, fill=INK)

    # --- the role line under it, mono, small, the page's label size -----------
    fr = font(MONO_TTF, 30)
    d.text((pad, 168 + size + 34), ROLE, font=fr, fill=INK)

    # --- a rule and the domain, the way the masthead signs itself -------------
    d.rectangle([pad, 120, pad + 132, 120 + 14], fill=INK)
    fd = font(MONO_TTF, 34)
    d.text((pad, 466), "adityadanapurkar.com", font=fd, fill=INK)

    out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "og-image.jpg")
    img.save(out, "JPEG", quality=92, optimize=True)
    print(f"wrote {out} — {W}x{H}")


if __name__ == "__main__":
    main()