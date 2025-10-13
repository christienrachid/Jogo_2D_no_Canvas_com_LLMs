# 🚀 Nave no Espaço

Um jogo 2D desenvolvido com **HTML5 Canvas**, **JavaScript** e **CSS**, onde o jogador controla uma nave espacial enfrentando ondas de inimigos e obstáculos no espaço sideral.  
O objetivo é **sobreviver o máximo possível**, destruir inimigos e **acumular pontuação**.

---

## 🧩 Funcionalidades

- **Controle por teclado**: use as **setas** ou **WASD** para mover a nave.  
- **Disparo de projéteis**: pressione **Barra de Espaço** para atirar.  
- **Paralaxe**: 2 a 3 camadas de fundo com velocidades diferentes criam sensação de profundidade.  
- **Colisões (AABB)**: detecção entre projéteis e inimigos, e entre o player e inimigos.  
- **Pontuação**: a cada inimigo destruído, a pontuação aumenta.  
- **Reinício automático**: caso o player colida com um inimigo, o jogo reinicia.  
- **Loop de animação otimizado** com `requestAnimationFrame()`.

---

## 🧱 Estrutura do Projeto

nave-no-espaco/
│
├── index.html # Estrutura principal com o <canvas>
├── style.css # Estilos e layout básico
└── main.js # Lógica completa do jogo (update, draw, colisões etc.)


---

## 🕹️ Como Jogar

1. Abra o arquivo `index.html` diretamente no navegador.
2. Use:
   - **← / → / ↑ / ↓** ou **W / A / S / D** para mover.
   - **Barra de Espaço** para atirar.
3. Destrua os inimigos e evite colisões!
4. Quando colidir, pressione **R** para reiniciar o jogo.

---

## ⚙️ Tecnologias Utilizadas

- **HTML5 Canvas** — renderização 2D do jogo  
- **JavaScript (ES6+)** — lógica, física e animações  
- **CSS3** — estilização e centralização do canvas  

---

## 🧠 Conceitos Aplicados

- **Loop de jogo com `requestAnimationFrame()`**  
- **Separação entre lógica (`update`) e renderização (`draw`)**  
- **Reutilização de objetos (object pooling)**  
- **Detecção de colisão AABB (Axis-Aligned Bounding Box)**  
- **Camadas de paralaxe para profundidade**  

---

## 💾 Execução Local

1. Baixe ou clone este repositório:
   ```bash
   git clone https://github.com/seuusuario/nave-no-espaco.git

