# 🎮 Jogo 2D no Canvas com LLMs (ChatGPT, Gemini ou Claude)

**Atividade Prática — 7 e 8 de outubro de 2025**📚 *Disciplina: Desenvolvimento de Jogos Digitais*👨🏻‍🏫 **Professor:** [Christien Lana Rachid](https://github.com/christienrachid)📍 _Centro Universitário Academia_

---

## 🧭 Descrição

Este é o **repositório modelo oficial** da atividade avaliativa **“Jogo 2D no Canvas com LLMs”**, valendo **10 pontos**.Os alunos devem trabalhar **em duplas**, desenvolvendo um **jogo 2D em HTML5 Canvas, JavaScript e CSS**, utilizando **duas LLMs (ChatGPT, Gemini ou Claude)** para apoio técnico e criativo.

---

## ⚙️ Entregas

- **Código-fonte:** via **Pull Request (PR)** neste repositório.

- **Relatório técnico (PDF):** via **tarefa no Canvas**.

📅 **Prazo final:** 08/10/2025, até 23h59.

---

## 🗂️ Estrutura do Template

index.html style.css main.js

/assets/ → sprites, sons, fundos /docs/ → prints, relatório completo e README detalhado /prompts/ → prompts utilizados nas LLMs (.txt)

---

## 🧩 Instruções resumidas

1. Clique em **Use this template → Create a new repository**

1. Nomeie seu repositório:

dupla-sobrenome1-sobrenome2-tema

Exemplo: `dupla-oliveira-gomes-asteroides`

1. Desenvolva o jogo seguindo os requisitos e orientações.

1. Abra um **Pull Request (PR)** para este repositório até a data limite.

1. Envie o **relatório técnico** no Canvas.

---

## 🔗 Documentos

🎓 [Acesse o Canvas para envio do relatório](https://uniacademia.instructure.com/)

---

> “Criar é aprender duas vezes.”— _Joseph Joubert_

---

---

# MacaquiSlime: Um Jogo de Sobrevivência 2D

Este projeto é um jogo simples de sobrevivência 2D desenvolvido com HTML5 Canvas e JavaScript puro. O objetivo é controlar um herói que atira machados para derrotar slimes que aparecem de todas as direções, acumulando pontos e sobrevivendo o máximo possível. O jogo apresenta uma estética retrô, inspirada em consoles portáteis clássicos, com gráficos pixelados e uma paleta de cores limitada.

## Como Executar o Jogo

Para jogar, você precisará de um navegador web moderno e um servidor HTTP local. Siga os passos abaixo:

1. **Navegue até a pasta do projeto**: Abra o terminal ou prompt de comando e vá para o diretório `dupla-BrunoJesus-LucasLeite-MacacoSlime/assets`.

1. **Inicie um servidor local**: Você pode usar o módulo `http.server` do Python para isso. Se você não tem Python instalado, pode usar outras alternativas como o `Live Server` do VS Code ou `serve` do Node.js.

1. **Acesse o jogo no navegador**: Abra seu navegador (Chrome, Firefox, Edge, etc.) e digite o seguinte endereço:

Pronto! O jogo estará carregado e pronto para ser jogado.

## Controles

- **Setas do teclado (↑ ↓ ← →)**: Mover o herói.

- **Barra de Espaço**: Atirar machados.

## Funcionalidades

- **Movimentação do Herói**: O personagem principal pode se mover em 8 direções.

- **Ataque**: O herói pode atirar machados na direção em que está olhando.

- **Inimigos (Slimes)**: Slimes aparecem aleatoriamente nas bordas da tela e perseguem o herói.

- **Colisões**: Detecção de colisão entre machados e slimes, e entre o herói e slimes.

- **Sistema de Vida e Pontuação**: O herói possui uma barra de vida e acumula pontos ao derrotar slimes.

- **Tela de Game Over**: Uma animação de morte do herói e uma tela de "Game Over" com a pontuação final.

- **Estilo Visual Retrô**: Gráficos pixelados e efeitos de tela que simulam um Game Boy clássico.

## Estrutura do Projeto

```
. # Raiz do projeto
├── README.md # Este arquivo
└── assets/
    ├── index.html # Estrutura principal da página web
    ├── style.css # Estilos CSS para o jogo e a moldura do Game Boy
    ├── main.js # Lógica principal do jogo (inicialização, loop, spawn de slimes, parallax, estados do jogo)
    ├── map.json # Dados do mapa do jogo (gerado pelo Tiled)
    ├── img/ # Imagens dos sprites e elementos do jogo
    │   ├── character/ # Sprites do herói
    │   ├── enemy/ # Sprites dos slimes
    │   ├── gameplay/ # Sprites de machados, corações
    │   └── scenarios/ # Sprites de elementos do cenário
    └── src/
        ├── extras/
        │   └── font/ # Fonte "Early GameBoy" para o estilo retrô
        └── js/
            ├── enemy/
            │   ├── collision.js # Lógica de detecção de colisão
            │   └── slime.js # Classe e lógica dos slimes
            ├── gameController/
            │   └── ui.js # Lógica da interface do usuário (HUD)
            └── player/
                ├── animacao.js # Sistema de animação genérico
                ├── axe.js # Classe e lógica dos machados (projéteis)
                ├── heroi.js # Classe e lógica do herói
                └── teclado.js # Lógica de captura de entrada do teclado
```

## Tecnologias Utilizadas

- **HTML5**: Estrutura da página.

- **CSS3**: Estilização e efeitos visuais.

- **JavaScript (ES6+)**: Lógica de programação do jogo.

- **Canvas API**: Renderização de gráficos 2D.

- **Tiled Map Editor**: Utilizado para criar o mapa do jogo (o arquivo `map.json` é a exportação do Tiled).

## Recursos Gráficos / Créditos de Sprites

Os sprites utilizados neste jogo foram obtidos de recursos gratuitos online. Agradecemos aos autores pelo trabalho:

- **Personagem em 8 direções (Game Boy)** – [GibbonGL](https://gibbongl.itch.io/8-directional-gameboy-character-template)
- **Diversos elementos gráficos e inimigos** – [Toadzill Art](https://toadzillart.itch.io/)

Todos os sprites foram utilizados de acordo com as permissões fornecidas pelos autores nos links acima.

## Desenvolvedores

- Bruno Jesus

- Lucas Leite

Este projeto foi desenvolvido como parte de um trabalho ou estudo, demonstrando conceitos básicos de desenvolvimento de jogos 2D no navegador.
