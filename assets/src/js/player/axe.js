function Axe(context) {
  this.context = context; // Contexto do canvas para desenhar o machado
  this.x = 0; // Posição X inicial
  this.y = 0; // Posição Y inicial

  // Velocidades do machado
  this.velocidadeX = 0;
  this.velocidadeY = 0;
  this.velocidadeBase = 1.6; // Velocidade padrão do machado

  // Dimensões do sprite
  this.largura = 16;
  this.altura = 16;

  // Sprite do machado
  this.imagem = new Image();
  this.imagem.src = "img/gameplay/axe.png";

  // Animação do sprite
  this.totalFrames = 8; // Total de frames do sprite
  this.frameAtual = 0; // Frame atual
  this.tempoPorFrame = 100; // Tempo entre frames em ms
  this.ultimoTempo = 0; // Último tempo que frame foi atualizado
}

Axe.prototype = {
  // ==============================
  // ATUALIZA A POSIÇÃO E ANIMAÇÃO
  // ==============================
  atualizar: function () {
    // Move o machado
    this.x += this.velocidadeX;
    this.y += this.velocidadeY;

    // Atualiza frame do sprite baseado no tempo
    let agora = performance.now();
    if (agora - this.ultimoTempo > this.tempoPorFrame) {
      this.frameAtual = (this.frameAtual + 1) % this.totalFrames; // Loop dos frames
      this.ultimoTempo = agora;
    }
  },

  // ==============================
  // DESENHA O MACHADO NO CANVAS
  // ==============================
  desenhar: function () {
    // Verifica se a imagem já carregou
    if (!this.imagem.complete || this.imagem.naturalHeight === 0) return;

    // Calcula posição do frame dentro do sprite sheet
    let sx = this.frameAtual * this.largura;
    let sy = 0; // Linha única do sprite sheet

    // Desenha o machado centralizado na posição (x, y)
    this.context.drawImage(
      this.imagem,
      sx,
      sy,
      this.largura,
      this.altura,
      this.x - this.largura / 2,
      this.y - this.altura / 2,
      this.largura,
      this.altura
    );
  },
};
