# Skill — Onboarding

Descoberta antes de construir qualquer página pro cliente. Cada resposta
risca uma ferramenta que já existe no projeto — nada é construído "por
via das dúvidas" antes de confirmado que vai ser usado de verdade.

Não perguntamos "quantas páginas" — o framework assume múltiplas páginas
como padrão (roteamento básico independente da resposta), não é decisão
do cliente.

---

Antes da hospedagem: se o repo ainda está com o nome genérico do
template (`pages-framework` / Worker `pages-site`), rode o init
(`python3 utils/init.py "Nome do projeto"`). Isso só grava identidade
local (slug, títulos, nomes de Worker **caso** o deploy seja Cloudflare).
Não pergunta nem configura provedor.

## 1. Hospedagem

**Pergunta:** onde a página vai ser publicada?

Não há provedor padrão de publicação. `public/` sai igual pra qualquer
host estático. Cloudflare só tem extras locais (`worker.js`,
`wrangler.jsonc`, `npm run dev`).

- **Cloudflare** → `.skills/deploy-cloudflare/`.
- **Vercel / Netlify / outro com skill** → `.skills/deploy-<provedor>/`.
- **Ainda não existe skill** (ex.: FTP/Hostinger): avise que o caminho
  de deploy específico não foi construído — `public/` já serve pra
  subir na mão. Só construa skill depois de cliente real pedindo.

## 2. Marca / identidade visual

**Pergunta:** você já tem uma marca definida? Quer usar seu site atual
como base?

- **Sim** → peça o link do site.
  - Use como referência de **modelo de negócio e copy** por padrão —
    não a estética (entender produto/mensagem, não copiar layout).
  - Pergunte explicitamente se o cliente quer manter a estética atual
    também — só nesse caso a estética do site vira referência.
- **Não** → pergunta seguinte:
  - **"Quer extrair uma paleta de cor de alguma imagem (logo, foto,
    print de tela)?"**
    - **Sim** → peça pra adicionar a(s) imagem(ns) em
      `references/company/images/`. Rode `utils/palette.py` nelas (ver
      `.skills/design/`).
    - **Não** → segue pra pergunta 3.

## 3. Referência visual (estética/mood — não é a marca do cliente)

**Pergunta:** tem algum site de referência pra estética que você gosta?

- **Sim** → peça o link, ou uma imagem/screenshot. Salve em
  `references/inspiration/`.
- **Não** → ofereça a lista curada de fontes de inspiração em
  `.skills/design/INSPIRATION-SOURCES.md`, pro cliente escolher algo de
  lá antes de prosseguir sem referência nenhuma.

---

## O que não entra nesse roteiro

- **Tracking**: sempre ativo, independente de tudo acima — a skill de
  tracking (`.skills/tracking/`) não depende de o cliente ter
  formulário de captura ou não. Funciona igual em qualquer página, sem
  pergunta de onboarding pra "ligar".
- **Quantidade de página**: não perguntamos — ver nota no topo.
