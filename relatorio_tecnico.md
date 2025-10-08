# Relatório Técnico

O tema escolhido foi 'Plataforma educacional (coletar letras)’. E os LLMs escolhidos foram ChatGPT e Gemini.

## Assets Usados

### Brackeys' Platformer Bundle

Disponível em: https://brackeysgames.itch.io/brackeys-platformer-bundle

### Tech Dungeon Roguelite

Disponível em: https://trevor-pupkin.itch.io/tech-dungeon-roguelite

## Perguntas feitas ao ChatGPT

### Pergunta Inicial

Atue como desenvolvedor de jogos 2D em HTML5 Canvas. Sugira 3 ideias de jogo no tema ‘Plataforma educacional (coletar letras)’, cada uma com: mecânicas centrais, entidades, estados do jogo, eventos de teclado, uso de paralaxe, colisão, spritesheet/clipping e disparo. Inclua uma lista de tarefas priorizadas (MVP → Polimento).

### Segunda Pergunta

Usando o Jogo 1: "Alfabeto Perdido", crie um projeto base de jogo 2D em Canvas com:

* index.html simples;
* style.css básico (centralização e fonte legível);
* main.js contendo:
  * loop de animação com requestAnimationFrame,
  * funções update() e draw(),
  * controle de teclado (WASD/setas),
  * cenário com 2–3 camadas de paralaxe,
  * estrutura de entidades (player, inimigos, balas),
  * sistema de colisão AABB.
  * Inclua comentários explicativos em cada seção do código.

### Terceira Pergunta

Estenda o código para incluir letras coletáveis e sistema de pontuação

### Quinta Pergunta

Implemente um sistema de disparo:

* array de balas,
* criação ao pressionar tecla (Espaço),
* velocidade e direção,
* remoção quando sair da tela.
* Adicione colisão bala vs inimigo (AABB) e atualização de pontuação no HUD.

### Sexta Pergunta

Analise o código a seguir (arquivo main.js inteiro).
Sugira melhorias como:
separação de update() e draw(),
evitar criação de objetos dentro do loop,
culling de entidades off-screen,
organização entre input, física e renderização.
Retorne um diff comentando as mudanças realizadas.

### Sétima Pergunta

Sugira melhorias gráficas leves: paralaxe mais profunda, camadas com offsets diferentes, motion blur falso com trailing, tipografia do HUD, feedback de colisão (flash ou knockback). Inclua trechos de código prontos para colar.

## Perguntas feitas ao Gemini

### Pergunta Inicial

Atue como desenvolvedor de jogos 2D em HTML5 Canvas. Sugira 3 ideias de jogo no tema ‘Plataforma educacional (coletar letras)’, cada uma com: mecânicas centrais, entidades, estados do jogo, eventos de teclado, uso de paralaxe, colisão, spritesheet/clipping e disparo. Inclua uma lista de tarefas priorizadas (MVP → Polimento).

### Segunda Pergunta

Usando o Jogo 1: "O Arquivista do Tempo", Crie um projeto base de jogo 2D em Canvas com:

index.html simples;
style.css básico (centralização e fonte legível);
main.js contendo:
loop de animação com requestAnimationFrame,
funções update() e draw(),
controle de teclado (WASD/setas),
cenário com 2–3 camadas de paralaxe,
estrutura de entidades (player, inimigos, balas),
sistema de colisão AABB.
Inclua comentários explicativos em cada seção do código.

### Terceira Pergunta

O movimento do personagem, ao encostar no chão, para de responder corretamente e ele é jogado para fora da tela. Como corrigir esse erro?

### Quarta Pergunta

Cair da plataforma não gera um game over, além disso, não tem opção de reiniciar para que seja possível continuar jogando após o fim

### Quinta Pergunta

Ao reiniciar, os inimigos não retornam pro jogo

### Sexta Pergunta

Dado um spritesheet com 64px x 64px e 8 colunas × 13 linhas,

implemente a animação do player (idle, run, shoot) no Canvas.

Utilize drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) para realizar o clipping.

Adicione controle de taxa de quadros (frameTimer).

### Sétima Pergunta

Implemente um sistema de disparo:

array de balas,
criação ao pressionar tecla (Espaço),
velocidade e direção,
remoção quando sair da tela.
Adicione colisão bala vs inimigo (AABB) e atualização de pontuação no HUD

### Oitava Pergunta

Analise o útlimo código que você gerou e Sugira melhorias como:
separação de update() e draw(),
evitar criação de objetos dentro do loop,
culling de entidades off-screen,
organização entre input, física e renderização.
Retorne um diff comentando as mudanças realizadas.

### Nona Pergunta

Sugira melhorias gráficas leves:

paralaxe mais profunda,
camadas com offsets diferentes,
motion blur falso com trailing,
tipografia do HUD,
feedback de colisão (flash ou knockback).
Inclua trechos de código prontos para colar.

### Décima Pergunta

O spritesheet tem quantidade de frames diferentes para cada tipo de animação, como implementar um sistema para escolher a qauntidade de frames além da indicação de index

## Diferenças entre as LLMs

O código gerado pelo ChatGPT se mostrou preciso e funcional desde a primeira iteração. Sem necessidade de correções ou alterações. O código já veio inicialmente dividido entre js, html e css. Além disso, ao solicitar alterações, somente os trechos de códigos alterados eram exibidos, facilitando a alterações no código na IDE.

Enquanto no Gemini, tiveram vários problemas. O código foi gerado todo num index.html único gigantesco. Também, a primeira iteração estava com um bug que tornava o jogo injogável (lançava o jogador para fora da tela ao tentar mover pros lados após encostar no chão). Precisou algumas rodadas de prompts para correções no jogo antes de conseguir continuar com os prompts da atividade.

O Gemini também, ficou sempre fornecendo o arquivo index.html completo a cada novo prompt. O que dificultou entender o que estava mudando de uma versão para a outra.

Apesar disso tudo, o projeto base do Gemini foi bem mais completo tanto em funcionamento quanto em estética, mesmo antes de adicionar o suporte a spritesheets.
