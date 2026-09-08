"""Monta public/ a partir de src/, injetando os snippets de templates/head/.

public/ é 100% gerado — nunca edite ali direto, edite src/. Precisa do
mesmo ambiente Python de utils/palette.py (veja AGENTS.md).

Qualquer arquivo em templates/head/ entra automaticamente no bloco
injetado em toda página que tiver o marcador HEAD_MARKER — não precisa
tocar neste script pra adicionar um novo (Facebook Pixel, outro
analytics, o que for). Placeholders no formato {{NOME_DA_VAR}} dentro de
um template são resolvidos a partir da variável de ambiente de mesmo
nome; sem ela, o placeholder some sozinho, propositalmente quebrado, com
aviso no terminal.

    GTM_ID=GTM-XXXXXXX utils/venv/bin/python utils/build.py
"""

from __future__ import annotations

import os
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC = ROOT / "src"
PUBLIC = ROOT / "public"
HEAD_TEMPLATES = ROOT / "templates" / "head"
HEAD_MARKER = "<!-- build:head -->"

PLACEHOLDER = re.compile(r"\{\{(\w+)\}\}")


def resolve_placeholders(text: str, source_name: str) -> str:
    def replace(match: re.Match[str]) -> str:
        var_name = match.group(1)
        value = os.environ.get(var_name)
        if value is None:
            print(f"aviso: variável {var_name} não definida (usada em {source_name}) — placeholder fica sem preencher")
            return match.group(0)
        return value

    return PLACEHOLDER.sub(replace, text)


def load_head_snippets() -> str:
    if not HEAD_TEMPLATES.exists():
        return ""
    snippets = []
    for template_path in sorted(HEAD_TEMPLATES.glob("*.html")):
        raw = template_path.read_text()
        snippets.append(resolve_placeholders(raw, template_path.name))
    return "\n".join(snippets)


def build() -> None:
    if PUBLIC.exists():
        shutil.rmtree(PUBLIC)
    PUBLIC.mkdir(parents=True)

    head_snippets = load_head_snippets()

    for src_path in SRC.rglob("*"):
        if src_path.is_dir():
            continue
        dest_path = PUBLIC / src_path.relative_to(SRC)
        dest_path.parent.mkdir(parents=True, exist_ok=True)

        if src_path.suffix == ".html":
            content = src_path.read_text().replace(HEAD_MARKER, head_snippets)
            dest_path.write_text(content)
        else:
            shutil.copy2(src_path, dest_path)

    print(f"build concluído: {SRC} -> {PUBLIC}")


if __name__ == "__main__":
    build()
