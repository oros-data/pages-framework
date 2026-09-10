"""Identidade do projeto no template — não escolhe provedor.

Roda com o Python do sistema (stdlib só). Não precisa do venv, não faz
login, não cria projeto em nenhum host.

    python3 utils/init.py "Minha LP"
    python3 utils/init.py minha-lp
    python3 utils/init.py          # pergunta o nome

Atualiza:
  - package.json `name` (slug)
  - wrangler.jsonc `name` e `env.staging.name` — só entra em jogo se o
    deploy for Cloudflare; nos outros provedores o arquivo é ignorado
  - título/h1 de src/index.html se ainda estiver no placeholder do template
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).parent.parent
PACKAGE_JSON = ROOT / "package.json"
WRANGLER = ROOT / "wrangler.jsonc"
INDEX = ROOT / "src" / "index.html"

DEFAULT_TITLE = "Nova página"
SLUG_RE = re.compile(r"[^a-z0-9-]+")
WRANGLER_NAME_RE = re.compile(
    r'^(\s*"name"\s*:\s*")([^"]+)(")',
    re.MULTILINE,
)


def slugify(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", text)
    ascii_text = nfkd.encode("ascii", "ignore").decode("ascii")
    slug = ascii_text.strip().lower().replace(" ", "-")
    slug = SLUG_RE.sub("-", slug).strip("-")
    slug = re.sub(r"-{2,}", "-", slug)
    return slug or "pages-site"


def wrangler_names(slug: str) -> tuple[str, str]:
    """Cloudflare limita o nome do Worker: minúsculas, números, hífen."""
    base = slug[:50].strip("-") or "pages-site"
    return base, f"{base}-staging"


def update_package_json(slug: str) -> None:
    data = json.loads(PACKAGE_JSON.read_text())
    data["name"] = slug
    PACKAGE_JSON.write_text(json.dumps(data, indent=2) + "\n")


def update_wrangler(prod_name: str, staging_name: str) -> None:
    """Troca os dois `"name"` de topo (produção, depois staging) sem
    parsear JSONC. Ordem no arquivo atual: name raiz, depois env.staging.name."""
    text = WRANGLER.read_text()
    names = [prod_name, staging_name]
    index = 0

    def replace(match: re.Match[str]) -> str:
        nonlocal index
        if index >= len(names):
            return match.group(0)
        replacement = f"{match.group(1)}{names[index]}{match.group(3)}"
        index += 1
        return replacement

    new_text, count = WRANGLER_NAME_RE.subn(replace, text)
    if count < 2:
        raise SystemExit(
            "init: wrangler.jsonc não tem os dois campos name esperados "
            "(produção e staging) — não alterei o arquivo."
        )
    WRANGLER.write_text(new_text)


def update_index_title(title: str) -> bool:
    if not INDEX.exists():
        return False
    html = INDEX.read_text()
    if f"<title>{DEFAULT_TITLE}</title>" not in html:
        return False
    html = html.replace(f"<title>{DEFAULT_TITLE}</title>", f"<title>{title}</title>", 1)
    html = html.replace(f"<h1>{DEFAULT_TITLE}</h1>", f"<h1>{title}</h1>", 1)
    INDEX.write_text(html)
    return True


def main() -> None:
    raw = " ".join(sys.argv[1:]).strip()
    if not raw:
        try:
            raw = input("Nome do projeto: ").strip()
        except EOFError:
            raw = ""
    if not raw:
        raise SystemExit("init: informe um nome (ex.: python3 utils/init.py minha-lp)")

    slug = slugify(raw)
    prod, staging = wrangler_names(slug)
    update_package_json(slug)
    update_wrangler(prod, staging)
    titled = update_index_title(raw)

    print(f"projeto: {raw}")
    print(f"  package.json name: {slug}")
    print(f"  Cloudflare (se for usar): {prod} / {staging}")
    if titled:
        print(f"  src/index.html título: {raw}")
    print()
    print("Provedor não foi escolhido aqui. Build é sempre `npm run build`.")
    print("Deploy: Cloudflare (`npm run deploy`), Vercel, Netlify — ver README.")
    print("Próximo: cp .env.example .env  e preencha GTM_ID (e o que mais precisar).")


if __name__ == "__main__":
    main()
