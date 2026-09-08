# Skill — Onboarding

Descoberta antes de construir qualquer página pro cliente. Cada resposta
risca uma ferramenta que já existe no projeto — nada é construído "por
via das dúvidas" antes de confirmado que vai ser usado de verdade.

Não perguntamos "quantas páginas" — o framework assume múltiplas páginas
como padrão (roteamento básico independente da resposta), não é decisão
do cliente.

---

## 1. Hospedagem

**Pergunta:** onde a página vai ser publicada?

- **Cloudflare** (padrão do projeto) → segue `.skills/deploy-cloudflare/`.
  Nada extra a decidir, é o caminho já implementado e testado.
- **Outro provedor** (Netlify, Vercel, hospedagem tradicional/FTP, etc.) →
  procure `.skills/deploy-<provedor>/`.
  - **Existe:** siga aquela skill.
  - **Não existe ainda:** avise o cliente/usuário que esse caminho não
    foi construído — `public/` já sai pronto pra qualquer host estático
    (ver `README.md`), mas o script/skill de deploy específico daquele
    provedor ainda não existe. Só construa depois de confirmado que vai
    ser usado de verdade — não constrói especulativamente pra provedor
    nenhum sem cliente real pedindo.

## 2. Marca / identidade visual

**Pergunta:** você já tem uma marca definida? Quer usar seu site atual
como base?

- **Sim** → peça o link do site.
  - Use como referência de **modelo de negócio e copy** por padrão —
    não a estética (mesma lógica usada na LP do Teuzin: entender o
    produto/mensagem, não copiar layout).
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
