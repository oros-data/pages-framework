"""Extrai uma paleta de cores de uma imagem e gera variáveis CSS.

Não roda sozinho sem ambiente preparado — veja AGENTS.md (Python, venv,
requirements.txt) antes de usar.

    utils/venv/bin/python utils/palette.py <imagem> [--count N] [--out public/theme.css]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from colorthief import ColorThief

DEFAULT_COUNT = 6
DEFAULT_OUT = Path(__file__).parent.parent / "public" / "theme.css"

RGB = tuple[int, int, int]


def extract_palette(image_path: Path, count: int) -> list[RGB]:
    thief = ColorThief(str(image_path))
    return thief.get_palette(color_count=count)


def to_hex(rgb: RGB) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)


def relative_luminance(rgb: RGB) -> float:
    def channel(c: int) -> float:
        c_norm = c / 255
        return c_norm / 12.92 if c_norm <= 0.03928 else ((c_norm + 0.055) / 1.055) ** 2.4

    r, g, b = (channel(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(rgb_a: RGB, rgb_b: RGB) -> float:
    l1, l2 = relative_luminance(rgb_a), relative_luminance(rgb_b)
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def wcag_grade(ratio: float) -> str:
    if ratio >= 7:
        return "AAA"
    if ratio >= 4.5:
        return "AA"
    if ratio >= 3:
        return "AA (só texto grande)"
    return "reprovado"


def write_css(palette: list[RGB], out_path: Path) -> None:
    lines = [":root {"]
    for i, rgb in enumerate(palette, start=1):
        lines.append(f"  --color-{i}: {to_hex(rgb)};")
    lines.append("}")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(lines) + "\n")


def print_report(palette: list[RGB], out_path: Path) -> None:
    print(f"paleta escrita em {out_path}")
    for i, rgb in enumerate(palette, start=1):
        print(f"  --color-{i}: {to_hex(rgb)}")

    bg = palette[0]
    print("\ncontraste vs --color-1 (assumindo fundo):")
    for i, rgb in enumerate(palette[1:], start=2):
        ratio = contrast_ratio(bg, rgb)
        print(f"  --color-{i}: {ratio:.2f} ({wcag_grade(ratio)})")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path, help="imagem de referência (logo, foto, etc.)")
    parser.add_argument("--count", type=int, default=DEFAULT_COUNT, help="quantidade de cores na paleta")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="arquivo CSS de saída")
    args = parser.parse_args()

    if not args.image.exists():
        sys.exit(f"imagem não encontrada: {args.image}")

    palette = extract_palette(args.image, args.count)
    write_css(palette, args.out)
    print_report(palette, args.out)


if __name__ == "__main__":
    main()
