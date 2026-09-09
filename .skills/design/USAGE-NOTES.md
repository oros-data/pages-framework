# Notas de uso (Oros, específico deste projeto)

O `SKILL.md` nesta pasta é conteúdo original do repositório
`nextlevelbuilder/ui-ux-pro-max-skill` (vendorizado, `LICENSE-ui-ux-pro-max`
mantido conforme exigido pela licença MIT). Estas notas são nossas, não
deles — leia antes de usar `--design-system`.

## Testado de verdade, dois achados que mudam como usar

1. **`--design-system` não respeitou "minimal"/"clean" em duas tentativas
   diferentes** — pediu explicitamente estilo minimalista pra uma landing
   de curso e voltou "Vibrant & Block-based" (gaming) numa vez,
   "Claymorphism" (chunky/bubbly) na outra. O motor de reasoning parece
   pesar mais a categoria de produto do que a palavra-chave de estilo
   pedida. **Não confie no `--design-system` pra decidir o estilo sozinho.**

2. **Não existe stack "vanilla JS / sem framework"** entre os 22 stacks
   (`data/stacks/`) — o mais próximo é `html-tailwind`, que assume
   Tailwind. Uma busca direta por "vanilla javascript no framework
   lightweight" voltou só 1 resultado genérico. A ferramenta foi pensada
   pra quem usa React/Vue/Tailwind/etc. — trate qualquer resultado
   `--stack` como inspiração, nunca como implementação pronta pro nosso
   caso.

## Como usar aqui: cirúrgico, nunca o gerador automático

Prefira busca pontual por domínio, e escolha manualmente entre os
resultados — a curadoria final é sua, a ferramenta é catálogo, não
decisor:

```bash
python3 .skills/design/scripts/search.py "<produto/contexto>" --domain color -n 3
python3 .skills/design/scripts/search.py "<mood/estilo>" --domain typography -n 3
python3 .skills/design/scripts/search.py "<preocupação específica>" --domain ux -n 5
```

Domínios úteis pro nosso caso: `color`, `typography`, `ux` (acessibilidade
— esse é sólido e stack-agnóstico, WCAG de verdade), `landing` (estrutura
de seção, não visual). Evite `--design-system` e `--stack` sem revisar
manualmente o resultado.

Nada disso é servido pelo Worker nem entra em `public/` — é ferramenta de
consulta em tempo de desenvolvimento, mesma categoria de `utils/`.
