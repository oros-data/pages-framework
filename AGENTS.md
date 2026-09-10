# AGENTS.md — pages-framework

Instruções para agentes (e humanos) trabalhando neste projeto.

## O que é este projeto

Template de páginas rápidas (HTML + JS quando precisar). A fonte é
`src/`; um passo de build gera `public/` pronto pra qualquer host
estático (Cloudflare, Netlify, Vercel, FTP, etc.). Cloudflare tem
extras (`worker.js`, `wrangler.jsonc`, `npm run dev:cloudflare`) — o
init do projeto **não** escolhe provedor. `npm run dev` é o
`http.server` do Python, sem CLI de host. DNS: skill
`deploy-<provedor>`. GTM: `.skills/gtm/` (import JSON, sem API).
Veja o `README.md`.

**`src/` é a fonte de verdade. `public/` é 100% gerado — nunca edite lá
direto**, e não se surpreenda se ele nem existir num clone limpo (é
gitignored, `npm run build`/`dev`/`deploy` recriam sozinhos).

## `utils/` — ferramentas de apoio, nunca deployadas

Tudo em `utils/` (`init.py`, identidade do projeto; `palette.py`,
extração de paleta; `build.py`, monta `public/` a partir de `src/`)
roda em Python, **nunca** entra em `public/` nem é servido no deploy.
`init.py` e `build.py` são stdlib — rodam com `python3` do sistema,
sem venv. Venv só entra em `palette.py` (Pillow).

Este projeto roda no computador de terceiros (alunos) — sistema
operacional desconhecido até este momento, então nada abaixo pode ser
assumido como já pronto, e o **primeiro passo é sempre identificar o
ambiente**, antes de qualquer comando de Python.

### 0. Detectar sistema operacional

Cada SO muda o caminho do binário dentro do venv e às vezes o próprio
nome do comando Python. Detecte antes de escolher qual comando rodar:

```bash
uname -s 2>/dev/null || echo "sem uname — provavelmente Windows (cmd/PowerShell)"
```

- **`Linux` ou `Darwin` (macOS)**: binário do venv fica em `utils/venv/bin/`
  (`utils/venv/bin/python`, `utils/venv/bin/pip`).
- **Sem `uname` (Windows, cmd/PowerShell nativo, não WSL)**: binário do
  venv fica em `utils/venv/Scripts/` (`utils/venv/Scripts/python.exe`,
  `utils/venv/Scripts/pip.exe`) — caminho com `\`, não `/`.
- **WSL**: conta como Linux (tem `uname -s` = `Linux`) — mesmo caminho de
  Unix, mesmo dentro do Windows.

O resto deste documento usa a forma Unix (`utils/venv/bin/...`) como
exemplo — troque para `utils\venv\Scripts\...` se a detecção acima
indicar Windows nativo.

### 1. Python instalado?

```bash
python3 --version   # Linux/macOS
python --version    # Windows costuma só ter "python", não "python3"
```

Se não existir, oriente a instalação (não tenta instalar Python sozinho —
isso é decisão do usuário, sistema operacional dele).

### 2. Venv criado?

Sempre em `utils/venv/` (nunca um venv global/do sistema), usando o
caminho identificado no passo 0:

```bash
test -d utils/venv || python3 -m venv utils/venv
```

### 3. `requirements.txt` instalado dentro do venv?

Nunca com o `pip` do sistema — sempre pelo binário do próprio venv
(`utils/venv/bin/pip` ou `utils/venv/Scripts/pip.exe`, conforme o passo 0):

```bash
utils/venv/bin/pip install -r utils/requirements.txt
```

Só depois desses passos confirmados, rode o script com o Python do venv
(nunca `python3` do sistema, nunca depender de `source venv/bin/activate`
ter surtido efeito — invoque o binário direto):

```bash
python3 utils/init.py "Nome do projeto"   # stdlib, sem venv
python3 utils/build.py                    # stdlib, sem venv
utils/venv/bin/python utils/palette.py <imagem>
```

`npm run build`/`dev`/`deploy` já chamam `utils/build.py` sozinhos — só rode
na mão pra debugar.

## Idioma

Mensagens de script e documentação deste projeto: **português**.
