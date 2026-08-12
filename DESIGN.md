# Design System

## Theme

Minimalismo agressivo em preto puro, com ouro joalheria na identidade e vermelho concentrado na ação. A interface é direta e ambiciosa, mas evita os clichês visuais de cassino, criptomoeda e infoproduto genérico.

## Color Strategy

Paleta restrita sobre fundo preto puro. O gradiente de ouro joalheria identifica a marca, o vermelho concentra urgência e o verde identifica as ações principais.

```css
--color-bg: oklch(0 0 0);
--color-surface: oklch(0.12 0 0);
--color-ink: oklch(0.965 0.006 80);
--color-muted: oklch(0.76 0 0);
--color-gold-shadow: #9a7428;
--color-gold: #d2aa4f;
--color-gold-light: #ead27f;
--gradient-gold: linear-gradient(
  180deg,
  #9a7428 0%,
  #b88b32 16%,
  #d2aa4f 31%,
  #ead27f 44%,
  #f4e2a5 50%,
  #d9b85f 61%,
  #bc9137 78%,
  #9c7628 100%
);
--color-action: oklch(0.56 0.225 27);
--color-action-dark: oklch(0.405 0.19 24);
```

## Typography

- Display: Saira Condensed, peso 500 no H1 e pesos 700 e 800 na marca e em títulos curtos.
- Interface: Source Sans 3, pesos 400 a 700. Usada no corpo, botões, campos, erros e textos auxiliares.
- H1 fluido com teto de 120px, caixa alta, peso-base 500, espaçamento positivo de 0.025em, medida máxima de 27ch e quebra balanceada. O trecho final, de “ganhe” a “YouTube”, usa peso 600 e gradiente vertical de ouro joalheria com oito tons próximos entre si, repetido em cada fragmento de linha e com fallback sólido acessível.
- Corpo limitado a 70 caracteres por linha.

## Layout

- Mobile first, com arte principal, logotipo, H1, corpo e CTA empilhados e centralizados.
- A composição permanece central em mobile, tablet, desktop e ultrawide.
- A hero ocupa pelo menos o viewport visível descontando a barra do evento.
- Largura máxima estrutural de 1600px para permanecer composta em ultrawide.
- A arte da hero usa direção responsiva por viewport. Desktop e ultrawide compartilham um recorte final 2:1, equivalente à proporção do mockup, exibido sem `object-fit: cover`; assim a composição não amplia nem recorta em telas de 2880 px. O logotipo pequeno fica centralizado e sobreposto à transição esfumaçada entre a arte e o H1.

## Components

- Event bar: faixa vermelha translúcida com blur discreto, compacta, sticky e presente somente na captura e no agradecimento.
- Brand mark: logotipo em PNG transparente, com símbolo original de dólar e play em espaço negativo, wordmark condensado e o gradiente de ouro joalheria com oito tons do H1.
- Hero artwork: composição fotográfica gerada pelo ImageGen a partir da foto original dos dois experts como referência principal de identidade, em escala reduzida sobre preto; emblema vermelho de play/cifrão dourado e três notificações de PIX recebido pelo YouTube ficam em segundo plano. A base termina em preto para conectar a imagem ao restante da página.
- Primary CTA: implementação fiel do componente React fornecido, com os mesmos brilhos, reflexo e interações, alterando a paleta para gradientes verdes.
- Capture dialog: modal nativo acessível, sem título, com instrução curta e campos de nome, WhatsApp, e-mail e consentimento.
- Thank-you page: confirmação direta na rota `/ob`, composta somente por logotipo, título e mensagem, sem navegação, ícone ou rodapé.
- Lead badge: data limite da captura em um badge translúcido com a mesma família de ouro joalheria do H1 em gradiente diagonal, compacto e centralizado.
- Institutional footer: rodapé amplo e reutilizável com logotipo compacto, termos, privacidade, data do evento, copyright e declaração de marca; sua camada fica acima do reflexo luminoso do CTA.

## Motion

Entrada curta e coordenada da marca e do conteúdo. O modal usa opacidade e deslocamento breve. Todas as animações são removidas quando `prefers-reduced-motion: reduce` estiver ativo.
