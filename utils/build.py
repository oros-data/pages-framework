"""Monta public/ a partir de src/, injetando o snippet do GTM nas páginas.

public/ é 100% gerado — nunca edite ali direto, edite src/. Precisa do
mesmo ambiente Python de utils/palette.py (veja AGENTS.md).

Variável de ambiente:
    GTM_ID    ID do container GTM (ex.: GTM-XXXXXXX). Sem ela, o snippet
              sai com o placeholder {{GTM_ID}}, propositalmente quebrado
              pra ficar óbvio que falta configurar.

    GTM_ID=GTM-XXXXXXX utils/venv/bin/python utils/build.py
"""

from __future__ import annotations

import os
import shutil
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC = ROOT / "src"
PUBLIC = ROOT / "public"
GTM_TEMPLATE = ROOT / "templates" / "gtm-snippet.html"
GTM_MARKER = "<!-- build:gtm -->"


def load_gtm_snippet() -> str:
    snippet = GTM_TEMPLATE.read_text()
    gtm_id = os.environ.get("GTM_ID")
    if not gtm_id:
        print("aviso: GTM_ID não definida — snippet fica com o placeholder, sem funcionar de verdade")
        return snippet
    return snippet.replace("{{GTM_ID}}", gtm_id)


def build() -> None:
    if PUBLIC.exists():
        shutil.rmtree(PUBLIC)
    PUBLIC.mkdir(parents=True)

    gtm_snippet = load_gtm_snippet()

    for src_path in SRC.rglob("*"):
        if src_path.is_dir():
            continue
        dest_path = PUBLIC / src_path.relative_to(SRC)
        dest_path.parent.mkdir(parents=True, exist_ok=True)

        if src_path.suffix == ".html":
            content = src_path.read_text().replace(GTM_MARKER, gtm_snippet)
            dest_path.write_text(content)
        else:
            shutil.copy2(src_path, dest_path)

    print(f"build concluído: {SRC} -> {PUBLIC}")


if __name__ == "__main__":
    build()
