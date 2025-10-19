// ==============================
// DIREÇÕES
// ==============================
var DIRECAO_BAIXO = 0;
var DIRECAO_BAIXO_ESQUERDA = 1;
var DIRECAO_ESQUERDA = 2;
var DIRECAO_CIMA_ESQUERDA = 3;
var DIRECAO_CIMA = 4;
var DIRECAO_CIMA_DIREITA = 5;
var DIRECAO_DIREITA = 6;
var DIRECAO_BAIXO_DIREITA = 7;
var DIRECAO_PARADO = -1; // usado quando o herói não se move

// ==============================
// HERÓI
// ==============================
function Heroi(context, teclado, animacao) {
  this.context = context; // Contexto do canvas
  this.teclado = teclado; // Input do jogador
  this.animacao = animacao; // Referência à animação para adicionar tiros

  this.x = 0; // Posição inicial X
  this.y = 0; // Posição inicial Y
  this.velocidade = 0.5; // Velocidade de movimento

  // ==============================
  // ESTADO DO HERÓI
  // ==============================
  this.vida = 3;
  this.slimesMortos = 0;
  this.pontuacao = 0;
  this.ultimaDirecao = DIRECAO_BAIXO; // direção inicial

  // ==============================
  // SPRITE E ANIMAÇÃO
  // ==============================
  this.imagem = new Image();
  this.imagem.src = "img/character/character.png";

  this.larguraFrame = 16;
  this.alturaFrame = 16;
  this.totalFrames = 4; // frames de animação por direção
  this.frameAtual = 0;
  this.tempoPorFrame = 100;
  this.ultimoTempo = 0;

  this.animacaoMorteIniciada = false; // flag para animação de morte
}

Heroi.prototype = {
  // ==============================
  // ATUALIZA MOVIMENTO E ANIMAÇÃO
  // ==============================
  atualizar: function () {
    if (this.animacaoMorteIniciada) return; // não move se morto

    let dx = 0,
      dy = 0;

    // Verifica teclas pressionadas e define dx/dy
    if (this.teclado.pressionada(SETA_ESQUERDA)) dx = -this.velocidade;
    if (this.teclado.pressionada(SETA_DIREITA)) dx = this.velocidade;
    if (this.teclado.pressionada(SETA_CIMA)) dy = -this.velocidade;
    if (this.teclado.pressionada(SETA_BAIXO)) dy = this.velocidade;

    // Corrige movimento diagonal para não ultrapassar velocidade base
    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }

    this.x += dx;
    this.y += dy;

    this.aplicarLimitesInternos(); // impede sair da tela

    // Define direção do herói com base em dx/dy
    if (dx === 0 && dy > 0) this.ultimaDirecao = DIRECAO_BAIXO;
    else if (dx < 0 && dy > 0) this.ultimaDirecao = DIRECAO_BAIXO_ESQUERDA;
    else if (dx < 0 && dy === 0) this.ultimaDirecao = DIRECAO_ESQUERDA;
    else if (dx < 0 && dy < 0) this.ultimaDirecao = DIRECAO_CIMA_ESQUERDA;
    else if (dx === 0 && dy < 0) this.ultimaDirecao = DIRECAO_CIMA;
    else if (dx > 0 && dy < 0) this.ultimaDirecao = DIRECAO_CIMA_DIREITA;
    else if (dx > 0 && dy === 0) this.ultimaDirecao = DIRECAO_DIREITA;
    else if (dx > 0 && dy > 0) this.ultimaDirecao = DIRECAO_BAIXO_DIREITA;

    // Atualiza frame de animação se estiver se movendo
    if (dx !== 0 || dy !== 0) {
      let agora = performance.now();
      if (agora - this.ultimoTempo > this.tempoPorFrame) {
        this.frameAtual = (this.frameAtual + 1) % this.totalFrames;
        this.ultimoTempo = agora;
      }
    } else {
      this.frameAtual = 0; // parada: frame inicial
    }
  },

  // ==============================
  // LIMITE PARA NÃO SAIR DA TELA
  // ==============================
  aplicarLimitesInternos: function () {
    const margem = 16;
    this.x = Math.max(
      margem,
      Math.min(this.context.canvas.width - margem - this.larguraFrame, this.x)
    );
    this.y = Math.max(
      margem,
      Math.min(this.context.canvas.height - margem - this.alturaFrame, this.y)
    );
  },

  // ==============================
  // DESENHA HERÓI
  // ==============================
  desenhar: function () {
    if (!this.imagem.complete) return;

    let linha = this.animacaoMorteIniciada ? 0 : this.ultimaDirecao; // linha do sprite
    let sx = this.frameAtual * this.larguraFrame;
    let sy = linha * this.alturaFrame;

    this.context.drawImage(
      this.imagem,
      sx,
      sy,
      this.larguraFrame,
      this.alturaFrame,
      this.x,
      this.y,
      this.larguraFrame,
      this.alturaFrame
    );
  },

  // ==============================
  // ATIRA MACHADO
  // ==============================
  atirar: function () {
    let tiro = new Axe(this.context);
    tiro.x = this.x + this.larguraFrame / 2;
    tiro.y = this.y + this.alturaFrame / 2;

    const v = tiro.velocidadeBase;

    // Define velocidades X e Y do tiro baseado na direção do herói
    switch (this.ultimaDirecao) {
      case DIRECAO_BAIXO:
        tiro.velocidadeX = 0;
        tiro.velocidadeY = v;
        break;
      case DIRECAO_BAIXO_ESQUERDA:
        tiro.velocidadeX = -v * Math.SQRT1_2;
        tiro.velocidadeY = v * Math.SQRT1_2;
        break;
      case DIRECAO_ESQUERDA:
        tiro.velocidadeX = -v;
        tiro.velocidadeY = 0;
        break;
      case DIRECAO_CIMA_ESQUERDA:
        tiro.velocidadeX = -v * Math.SQRT1_2;
        tiro.velocidadeY = -v * Math.SQRT1_2;
        break;
      case DIRECAO_CIMA:
        tiro.velocidadeX = 0;
        tiro.velocidadeY = -v;
        break;
      case DIRECAO_CIMA_DIREITA:
        tiro.velocidadeX = v * Math.SQRT1_2;
        tiro.velocidadeY = -v * Math.SQRT1_2;
        break;
      case DIRECAO_DIREITA:
        tiro.velocidadeX = v;
        tiro.velocidadeY = 0;
        break;
      case DIRECAO_BAIXO_DIREITA:
        tiro.velocidadeX = v * Math.SQRT1_2;
        tiro.velocidadeY = v * Math.SQRT1_2;
        break;
    }

    this.animacao.novoSprite(tiro); // adiciona o machado à lista de sprites para desenhar
  },

  // ==============================
  // HERÓI TOMOU DANO
  // ==============================
  tomarDano: function () {
    this.vida = Math.max(0, this.vida - 1);
  },

  // ==============================
  // INICIA ANIMAÇÃO DE MORTE
  // ==============================
  iniciarAnimacaoMorte: function () {
    this.imagem.src = "img/character/characterDeath.png"; // troca sprite
    this.totalFrames = 3;
    this.frameAtual = 0;
    this.tempoPorFrame = 500;
    this.ultimoTempo = performance.now();
    this.animacaoMorteIniciada = true;
  },

  // ==============================
  // ATUALIZA ANIMAÇÃO DE MORTE
  // ==============================
  atualizarAnimacaoMorte: function () {
    if (!this.animacaoMorteIniciada) return;

    let agora = performance.now();
    if (agora - this.ultimoTempo > this.tempoPorFrame) {
      if (this.frameAtual < this.totalFrames - 1) {
        this.frameAtual++;
        this.ultimoTempo = agora;
      }
    }
  },
};
