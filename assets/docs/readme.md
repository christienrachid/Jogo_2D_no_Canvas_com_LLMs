# 🛰️ Relatório Técnico – Projeto “Nave no Espaço”

## 🎯 Como o Objetivo da Atividade foi Aplicado
A equipe desenvolveu um **jogo 2D de defesa espacial** com **duas IAs** (Gemini e Copilot) colaborando na implementação.  
O jogo contém:
- **Loop de animação** com `requestAnimationFrame`;
- **Eventos de teclado** (movimentação e disparo);
- **Efeito de paralaxe** nos fundos;
- **Detecção de colisão** entre projéteis e inimigos;
- **Sistema de disparos** com cooldown;
- **Telas de início e game over**.

O desafio era reproduzir a lógica e a arquitetura descritas no arquivo `prompt.txt`, mantendo um código **modular, funcional e visualmente coerente**, rodando inteiramente em **HTML, CSS e JavaScript puro**.

---

## 🧠 Abordagem Utilizada
As IAs **Gemini** e **Copilot** foram utilizadas para gerar o esqueleto inicial do jogo.  
Ambas apresentaram soluções **lógicas e estruturadas**, com:
- Classes principais para representar a **nave** controlada pelo jogador, os **projéteis** disparados e os **asteróides** inimigos;  
- Loop de jogo baseado em **delta time**;  
- Sistema de spawn e destruição de entidades.

No entanto, foi necessário **refinar o código** manualmente, pois as IAs apresentaram:
- **Bugs de sobreposição de telas** (a tela de *game over* aparecia sobre a de *start* e corrompia o jogo, sendo impossível iniciar uma nova tentativa);  
- **Disparo contínuo sem controle**, causando excesso de projéteis na tela;  
- Pequenas falhas de sincronização entre colisões e reposição de entidades.

Esses pontos foram ajustados com:
- Lógica de **estado global de jogo** (start, playing, game over);  
- **Cooldown** para tiros (intervalo fixo entre disparos);  
- Controle de **limite de projéteis ativos**;  
- Revisão na renderização dos *overlays* (uso de `display: none` / `flex` no CSS).

---

## 🪐 Implementações Realizadas

| Elemento | Descrição |
|-----------|------------|
| **Loop de Animação** | Baseado em `requestAnimationFrame`, com cálculo de `deltaTime` para suavizar a movimentação e evitar saltos em mudanças de aba. |
| **Eventos de Teclado** | Setas ← → e teclas A/D para movimentar a nave; barra de espaço (`Space`) para disparar projéteis. |
| **Paralaxe** | Camadas de fundo com imagens de estrelas e nebulosas obtidas do [itch.io](https://itch.io), movendo-se para criar efeito de profundidade. |
| **Detecção de Colisão** | Implementada para garantir a destruição	dos asteróides e da nave controlada pelo jogador. |
| **Disparo / Projéteis** | Cada tiro é uma instância da classe `Projectile`. Adicionado intervalo mínimo entre disparos (0,25s). |
| **Imagens e Estilo** | Nave principal, asteróides e fundo obtidos no *itch.io*.<br> - Cores e tema ajustados para roxos (#7c4dff), conforme especificado no prompt.

---
## 🚀 Funcionalidades do Jogo

1. **Movimentação lateral da nave** limitada às bordas do canvas.  
2. **Disparo de projéteis** verticais com intervalo de cooldown.  
3. **Spawn automático de asteróides**, com velocidade crescente.  
4. **Pontuação** exibida em tempo real.  
5. **Tela de Game Over** com pontuação final e botão de reinício.  
6. **Paralaxe contínua** do fundo, simulando movimento espacial.  
7. **Resiliência a erros de carregamento** — o jogo funciona mesmo que alguma imagem falhe.

---

## 🔧 Principais Correções e Melhorias

| Problema | Solução Implementada |
|-----------|----------------------|
| Tela de *game over* sobreposta à tela inicial | Controle de estado global e manipulação de visibilidade no DOM |
| Múltiplos disparos simultâneos | Adicionado cooldown de 250 ms entre tiros |
| Queda de FPS por excesso de entidades | Sistema de *flag* “ativo/inativo” para remover objetos fora da tela |
| Colisões inconsistentes | Normalização das bounding boxes e checagem AABB simplificada |
| Falha de preload | Implementação de `Promise.all()` com fallback de placeholders coloridos |

---

## 🧩 Conclusão
O projeto alcançou o objetivo proposto: criar um **jogo funcional, modular e visualmente coerente**, com suporte a:
- **Animações fluidas (delta time)**,  
- **Eventos de teclado responsivos**,  
- **Efeito de paralaxe**,  
- **Sistema de colisões e disparos**,  
- **Controle de fluxo de jogo entre as telas**.

Apesar dos pequenos ajustes necessários após o código inicial das IAs, o resultado final apresentou **comportamento estável, boa jogabilidade e aderência ao escopo técnico exigido**.

---

## 👥 Créditos
- **Desenvolvimento base:** Gemini e Copilot (IA)  
- **Refinamento e correções:** João Vitor Lopes e Marcos Vinícius dos Reis 
- **Recursos visuais:** itch.io (licença livre)  
- **Orientação:** Prof. Christien – Disciplina de Jogos Digitais  
