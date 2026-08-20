# Site — Nevena Mitić

Site pessoal estático, sem bundler/build step, feito em HTML/CSS/JS vanilla.
Três libs de animação são carregadas via CDN (`<script defer>`, sem npm/node_modules) —
ver "Camada de animação" abaixo.

## Estrutura

```
/
├── index.html
├── style.css
├── script.js
├── i18n/
│   ├── pt.json   (idioma padrão)
│   ├── en.json
│   ├── ru.json   (⚠️ revisão pendente — ver abaixo)
│   └── sr.json   (⚠️ revisão pendente — ver abaixo)
└── assets/       (8 imagens, já em uso)
```

## Como funciona

- **Idioma**: seletor com bandeiras (🇧🇷 🇬🇧 🇷🇺 🇷🇸), duplicado na nav desktop e na
  gaveta mobile — ambos ficam sincronizados automaticamente (mesma classe `.lang-switch`).
  Troca instantânea via `fetch` do JSON, sem reload. Preferência salva em `localStorage`
  (`nevena_lang`). Detecta `navigator.language` na primeira visita (sugere RU/SR
  automaticamente se o navegador estiver nesses idiomas), sempre com PT como base.
- **Nav mobile**: abaixo de 640px vira um botão hambúrguer que abre uma gaveta lateral
  com os links e o seletor de idioma. Fecha ao clicar num link, no scrim ou com Esc.
  Pausa o Lenis enquanto está aberta (senão o scroll suave por trás continuaria ativo).
- **Trilho de timeline**: elemento de assinatura da seção "A história" — uma linha
  vertical que se preenche em `--bronze` conforme o scroll avança pelos 4 capítulos,
  com um ponto em cada numeral que acende quando o capítulo entra em vista. A imagem
  ao lado fica `position:sticky` enquanto os capítulos passam (desativado <768px).
- **Ticker de imprensa**: faixa com os nomes dos veículos rolando em loop estilo
  "breaking news", decorativa (`aria-hidden`), estática quando `prefers-reduced-motion`.
- **Filmstrip de mídia**: os 5 cards de aparições rolam horizontalmente com scroll-snap
  — cada card é um link inteiro (`<a>`) com legenda "Assistir ↗" no hover/foco/toque.

## Camada de animação (GSAP + Lenis + SplitType, via CDN)

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/gsap.min.js" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/ScrollTrigger.min.js" defer></script>
<script src="https://unpkg.com/lenis@1.3.26/dist/lenis.min.js" defer></script>
<script src="https://unpkg.com/split-type@0.3.4/umd/index.min.js" defer></script>
```

Versões conferidas e resolvendo em 20/08/2026 (as do brief original, gsap 3.12.5 /
lenis 1.1.13, estavam desatualizadas — atualizei pras versões estáveis mais recentes
disponíveis nesse momento). Se algum dia uma dessas URLs passar a 404, é só checar a
versão atual em `unpkg.com/<pacote>` e atualizar o número na tag.

O que cada uma faz aqui:
- **Lenis** — inertia suave no scroll da página inteira, integrado ao `gsap.ticker`
  (padrão oficial da documentação Lenis+GSAP). Cliques em links `#âncora` são
  interceptados pra usar `lenis.scrollTo()` em vez do `scroll-behavior:smooth` nativo
  (evita os dois sistemas de smooth-scroll brigando entre si).
- **ScrollTrigger** — substituiu o `IntersectionObserver` manual no reveal-on-scroll
  (`ScrollTrigger.batch`, mesma lógica de fade+translateY+blur, mas com stagger e
  easing controlados pelo GSAP).
- **SplitType** — quebra o título do hero ("Nevena / Mitić") em linhas e revela uma
  a uma, uma única vez no carregamento, com máscara (`overflow:hidden` no wrapper de
  cada linha via CSS).
- **Pin na seção de citação** (`.quote-section`, só ≥769px): a imagem fica fixa por
  ~60% da altura da seção enquanto o texto da citação faz fade in, com scrub ligado
  à posição do scroll. Abaixo de 769px o pin é desativado (`gsap.matchMedia`) e sobra
  só o fade normal.
- **Hover magnético** nos links do CTA final — deslocamento pequeno (máx. 4px) na
  direção do cursor, com release elástico.

**Se alguma dessas libs falhar ao carregar** (CDN fora do ar): o site não quebra —
`hasGSAP`/`hasLenis`/`hasSplitType` são checados em `script.js` antes de cada bloco,
e o reveal cai pra "aparece direto, sem animação" (mesmo caminho do `prefers-reduced-motion`).

**Com `prefers-reduced-motion: reduce`**: Lenis nunca é instanciado (scroll nativo do
navegador), o SplitType/reveal/pin/hover magnético são todos pulados, o ticker fica
estático e a Ken Burns/parallax do hero são desligados via CSS.

## ⚠️ Pendência — links reais das matérias

Todos os cards de "Na mídia" e a lista "Também na imprensa" (Telegraf/Blic) estão com
`href="#"` — marcados com comentário `<!-- TODO -->` no `index.html`. Antes de publicar,
trocar cada um pela URL real da matéria/vídeo correspondente.

## ⚠️ Pendência — tradução RU/SR

As traduções para **russo** e **sérvio** em `i18n/ru.json` e `i18n/sr.json` são uma
primeira versão gerada por IA. Como o conteúdo trata de tráfico humano e o público
mais próximo da história (sérvio/russo) é justamente o desses idiomas, **é
indispensável revisão por um falante nativo antes de publicar** — um erro de
tradução nesse contexto pode ser sério.

## Imagens (já em `assets/`)

| Arquivo         | Conteúdo                                                          |
|------------------|--------------------------------------------------------------------|
| `hero.jpg`       | Objektiv TV, na rua (foto "digna", sem título sensacionalista)     |
| `historia.jpg`   | Bastidores da gravação do documentário (equipe filmando ela)       |
| `citacao.jpg`    | Still em close do vídeo de depoimento ("dream coming true")        |
| `midia-1.jpg`    | Estúdio do Praktična Žena                                          |
| `midia-2.jpg`    | Mesa do 150 Minuta                                                 |
| `midia-3.jpg`    | Still da peça projetada em palco (documentário/teatro)             |
| `midia-4.jpg`    | Still do vídeo-depoimento, plano de perfil ("waiting for a sign")  |
| `midia-5.jpg`    | Capa da matéria "Glas života" (tratada com duotone pra suavizar)   |

## Performance

- `loading="lazy"` + `width`/`height` reais (lidos do header de cada JPEG) em todas
  as imagens abaixo da dobra — sem layout shift.
- Fontes com `display=swap` + `preconnect` pra `fonts.googleapis.com`/`fonts.gstatic.com`.
- CDN scripts com `defer` (não bloqueiam o parse do HTML).
- Não rodei Lighthouse de verdade aqui (sem navegador headless neste ambiente) — as
  otimizações acima seguem as boas práticas, mas vale rodar Lighthouse localmente antes
  de publicar pra confirmar Performance 90+ / Accessibility 95+ na prática.
