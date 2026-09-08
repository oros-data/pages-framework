# AGENTS.md — oros-pages

Instruções para agentes (e humanos) trabalhando neste projeto.

## O que é este projeto

Esqueleto de deploy pra páginas rápidas (HTML + JS quando precisar) em
Cloudflare Workers, com staging e produção separados. Ainda em construção —
veja o `README.md` pra estado atual e próximos passos.

## `utils/` — ferramentas de apoio, nunca deployadas

Tudo em `utils/` é ferramenta de build/apoio (ex.: `palette.py`, extração de
paleta de cor) — roda em Python, **nunca** entra em `public/` nem é servido
pelo Worker. Antes de tocar em qualquer script Python aqui, sempre confirme
o ambiente, nessa ordem — este projeto roda no computador de terceiros
(alunos), então nada disso pode ser assumido como já pronto:

1. **Python instalado?**
   ```bash
   python3 --version
   ```
   Se não existir, oriente a instalação (não tenta instalar Python sozinho —
   isso é decisão do usuário, sistema operacional dele).

2. **Venv criado?** Sempre em `utils/venv/` (nunca um venv global/do sistema).
   ```bash
   test -d utils/venv || python3 -m venv utils/venv
   ```

3. **`requirements.txt` instalado dentro do venv?** Nunca com o `pip` do
   sistema — sempre pelo binário do próprio venv.
   ```bash
   utils/venv/bin/pip install -r utils/requirements.txt
   ```

Só depois desses três passos confirmados, rode o script com o Python do
venv (nunca `python3` do sistema, nunca depender de `source venv/bin/activate`
ter surtido efeito — invoque o binário direto):

```bash
utils/venv/bin/python utils/palette.py <imagem>
```

## Idioma

Mensagens de script e documentação deste projeto: **português**.
