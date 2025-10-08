# 🎮 Campo Minado 2D - Projeto Completo

> 🚀 **Desenvolvido com auxílio do DeepSeek AI** - Este projeto foi criado utilizando prompts e orientações do modelo de linguagem DeepSeek para implementação de funcionalidades e solução de desafios técnicos.

![Status](https://img.shields.io/badge/Status-Completo-brightgreen)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![DeepSeek](https://img.shields.io/badge/DeepSeek-AI_Assisted-blue)

Um jogo de Campo Minado desenvolvido em HTML5 Canvas com JavaScript puro, featuring animações, sistema de pontuação e múltiplas personalizações.

## 📋 Índice
- [🎮 Demo](#-demo)
- [🚀 Características](#-características-principais)
- [🛠️ Tecnologias](#️-tecnologias-utilizadas)
- [🎯 Como Jogar](#-como-jogar)
- [📁 Estrutura](#-estrutura-do-projeto)
- [⚙️ Configuração](#️-configuração-do-jogo)
- [🏆 Sistema de Pontuação](#-sistema-de-pontuação)
- [🎨 Recursos Gráficos](#-recursos-gráficos)
- [🔧 Instalação](#-instalação-e-uso)
- [🤝 Contribuição](#-contribuição)
- [📄 Licença](#-licença)

## 🎮 Demo

![Gameplay](https://via.placeholder.com/800x400/1a2a6c/ffffff?text=Campo+Minado+2D+Gameplay)
> *Interface do jogo com tabuleiro personalizável e painel de estatísticas*

## 🚀 Características Principais

### 🎯 **Funcionalidades Implementadas**
- ✅ **Tabuleiro Dinâmico** - 5x5 até 10x10
- ✅ **Sistema de Configuração** - Escolha de dificuldade personalizada
- ✅ **Controles por Teclado** - Navegação intuitiva
- ✅ **Sistema de Pontuação** - Em tempo real e final
- ✅ **Animação de Moeda** - Spritesheet com 7 frames
- ✅ **Estatísticas Detalhadas** - Eficiência, ações, progresso
- ✅ **Cheat Code** - Revelação instantânea de minas
- ✅ **Interface Moderna** - Design responsivo e atrativo

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Finalidade | Badge |
|------------|------------|-------|
| **HTML5** | Estrutura do jogo e canvas | ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white) |
| **CSS3** | Estilização e animações | ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white) |
| **JavaScript** | Lógica do jogo e interatividade | ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) |
| **Canvas API** | Renderização gráfica | ![Canvas](https://img.shields.io/badge/Canvas-API-ff6b6b) |
| **Spritesheets** | Animações e texturas | ![Sprites](https://img.shields.io/badge/Spritesheets-7_frames-green) |

## 🎮 Como Jogar

### **Controles:**
| Tecla | Ação |
|-------|------|
| **🔼🔽◀️▶️ Setas** | Navegar pelo tabuleiro |
| **␣ Espaço** | Revelar célula selecionada |
| **Q** | Marcar/desmarcar bandeira |
| **WWSSADAD + Espaço** | Cheat code (revela todas as minas) |

### **Objetivo:**
Revelar todas as células sem minas ou marcar corretamente todas as minas com bandeiras.

## 📁 Estrutura do Projeto
projeto/
├── 📄 index.html # Arquivo principal
├── 🎨 style.css # Estilos e animações
├── ⚙️ main.js # Lógica principal do jogo
└── 📁 sheet/
├── 🟩 Grass.png # Textura do tabuleiro
└── 🪙 coin.png # Spritesheet da moeda (7 frames)

text

## ⚙️ Configuração do Jogo

### **Tamanhos Disponíveis:**
| Tamanho | Dificuldade | Células |
|---------|-------------|---------|
| **5x5** | Fácil | 25 células |
| **7x7** | Normal | 49 células |
| **8x8** | Intermediário | 64 células |
| **10x10** | Difícil | 100 células |

### **Número de Bombas:**
- 🔧 Configurável pelo jogador
- ⚠️ Máximo: 50% do total de células
- 🎯 Padrão: 6 bombas (7x7)

## 🏆 Sistema de Pontuação

### **Na Vitória:**
| Componente | Pontuação | Descrição |
|------------|-----------|-----------|
| **Bônus de Tempo** | Até 3000 pts | (300s - tempo) × 10 |
| **Bônus de Eficiência** | Até 500 pts | 100% × 5 |
| **Penalidade por Ações** | Até 500 pts | 500 - ações × 2 |

### **Na Derrota:**
| Componente | Pontuação | Descrição |
|------------|-----------|-----------|
| **Eficiência** | Até 800 pts | 100% × 8 |
| **Células Reveladas** | 2 pts/célula | Progresso alcançado |
| **Penalidade Temporal** | Variável | 500 - tempo × 2 |

## 🎨 Recursos Gráficos

### **Spritesheet da Moeda:**
- 🪙 **7 frames** de animação
- ➡️ **Layout horizontal** (da esquerda para direita)
- ⚡ **Animação contínua** durante o jogo
- 🎯 **Feedback visual** em eventos especiais

### **Texturas:**
- 🟩 **Grass.png** - Base do tabuleiro
- 🎨 **Gradientes CSS** - Efeitos visuais
- ✨ **Animações CSS** - Transições suaves

## 🔧 Instalação e Uso

### **Requisitos:**
- Navegador moderno com suporte a HTML5 Canvas
- Servidor web local (opcional, para carregar assets)

### **Execução:**
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/campo-minado-2d.git

# Acesse o diretório
cd campo-minado-2d

# Abra o arquivo HTML no navegador
open index.html
# ou
python -m http.server 8000
Execução Rápida:
📥 Faça o download dos arquivos

🌐 Abra index.html no seu navegador

🎮 Configure e jogue!

🤝 Contribuição
Contribuições são bem-vindas! Siga estos passos:

🍴 Faça um fork do projeto

🌿 Crie uma branch para sua feature (git checkout -b feature/AmazingFeature)

💾 Commit suas mudanças (git commit -m 'Add some AmazingFeature')

📤 Push para a branch (git push origin feature/AmazingFeature)

🔀 Abra um Pull Request

📄 Licença
Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

🎯 Desenvolvimento com IA
Processo de Criação:
Este projeto foi desenvolvido utilizando DeepSeek AI como ferramenta de assistência para:

🏗️ Estruturação do código base

🎨 Implementação de animações e spritesheets

⚡ Otimização de performance

🎮 Lógica de game design

🐛 Debugging e solução de problemas

Prompt Examples:
javascript
// Exemplo de prompts utilizados durante o desenvolvimento:
"Implemente um sistema de pontuação em tempo real para Campo Minado"
"Crie uma animação de moeda girando com spritesheet de 7 frames"
"Adicione controles de teclado personalizados com cheat codes"
Agradecimentos:
🤖 DeepSeek AI pela assistência técnica

🎮 Comunidade de desenvolvimento de games

🚀 Tutoriais e documentações de referência

<div align="center">
Desenvolvido com ❤️ e 🤖

https://img.shields.io/github/license/seu-usuario/campo-minado-2d
https://img.shields.io/github/last-commit/seu-usuario/campo-minado-2d
https://img.shields.io/github/issues/seu-usuario/campo-minado-2d

</div> ```