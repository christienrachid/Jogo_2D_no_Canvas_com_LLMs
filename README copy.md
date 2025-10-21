# Space Drift - Jogo de Nave 2D

![Space Drift](https://img.shields.io/badge/Status-Em%20Desenvolvimento-blue)
![Tecnologia](https://img.shields.io/badge/Tecnologia-Canvas%202D-orange)

## 📋 Descrição

**Space Drift** é um jogo de nave 2D desenvolvido em JavaScript usando Canvas. Controle sua nave espacial, destrua inimigos, evite colisões e marque o máximo de pontos possível!

## 🎮 Como Jogar

### Controles
- **W / Seta ↑**: Mover para cima
- **S / Seta ↓**: Mover para baixo  
- **A / Seta ←**: Mover para esquerda
- **D / Seta →**: Mover para direita
- **Espaço**: Atirar
- **P**: Pausar/Despausar

### Objetivo
- Destrua naves inimigas para ganhar pontos (+10 por inimigo)
- Evite colidir com inimigos (perde -25 pontos)
- Sobreviva o máximo tempo possível!

## 🛠️ Tecnologias Utilizadas

- **HTML5 Canvas** - Renderização gráfica
- **JavaScript ES6+** - Lógica do jogo
- **CSS3** - Estilização da interface

## 🎯 Características do Jogo

### Sistema de Entidades
- **Player**: Nave controlável pelo jogador com animações
- **Enemies**: Inimigos com movimentação aleatória
- **Bullets**: Sistema de projéteis com object pooling
- **Particles**: Efeitos visuais para explosões

### Recursos Técnicos
- **Parallax Scrolling**: 3 camadas de fundo com diferentes velocidades
- **Sprite Animation**: Animação de spritesheet para a nave
- **Collision Detection**: Sistema de detecção de colisão AABB
- **Object Pooling**: Otimização de performance para projéteis
- **Asset Management**: Carregamento e gerenciamento de assets

## 📁 Estrutura do Projeto
space-drift/
├── index.html # Estrutura principal
├── style.css # Estilos da interface
├── game.js # Motor principal do jogo
├── player.js # Classe do jogador
├── enemy.js # Classe dos inimigos
├── particles.js # Sistema de partículas
└── assets/ # Recursos gráficos
├── bg-nebula.jpg
├── bg_asteroids1.jpg
├── bg_asteroids.png
├── player.png
├── enemy.png
└── bullet.png


## 🚀 Como Executar

1. Clone ou baixe o projeto
2. Certifique-se que todos os arquivos estão na mesma estrutura
3. Abra `index.html` em um navegador moderno
4. Divirta-se!

## 🔧 Personalização

### Dificuldade
- Modifique `enemyTimer` em `game.js` para alterar frequência de inimigos
- Ajuste velocidades nas classes `Enemy` e `Player`

### Gráficos
- Substitua os arquivos na pasta `assets/`
- Mantenha as dimensões recomendadas para melhor performance

## 📊 Sistema de Pontuação

- **+10 pontos**: Destruir uma nave inimiga
- **-25 pontos**: Colidir com inimigo
- Pontuação mínima: 0 (não permite valores negativos)

## 🎨 Assets

Os assets utilizados são exemplos gerados para demonstração. Para uso comercial, recomenda-se substituir por assets originais ou com licença apropriada.

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir novas features
- Melhorar a documentação
- Otimizar código

## 📄 Licença

Este projeto é para fins educacionais e demonstração.

---

**Desenvolvido com 💫 para entusiastas de jogos 2D!**