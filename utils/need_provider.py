"""Não há provedor padrão — o aluno escolhe na hora do deploy."""

from __future__ import annotations

import sys

KIND = sys.argv[1] if len(sys.argv) > 1 else "producao"
STAGING = KIND == "staging"
SUFFIX = ":staging" if STAGING else ""
LABEL = "staging" if STAGING else "produção"

print(f"Não há provedor padrão de {LABEL}. Escolha um:")
print(f"  npm run deploy:cloudflare{SUFFIX}")
print(f"  npm run deploy:vercel{SUFFIX}")
print(f"  npm run deploy:netlify{SUFFIX}")
print()
print("Cada comando baixa o CLI daquele provedor na hora (npx),")
print("sem instalar nada no computador nem no npm install do projeto.")
raise SystemExit(1)
