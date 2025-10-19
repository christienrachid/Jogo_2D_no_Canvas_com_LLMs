function UI(context, heroi) {
  this.context = context; // Contexto do canvas para desenhar a UI
  this.heroi = heroi; // Referência ao herói, para vida, slimes mortos e pontuação

  // Sprite dos corações de vida
  this.imagem = new Image();
  this.imagem.src = "img/gameplay/hearts.png";

  // Dimensões e quantidade de corações
  this.larguraCoracao = 16;
  this.alturaCoracao = 16;
  this.totalCoroes = 3;

  // Controle de animação dos corações
  this.tempoPorFrame = 300; // tempo entre frames do sprite
  this.ultimoTempo = 0;
  this.frameAtual = 0;

  // Animação de flutuação
  this.offsetY = 0;
  this.subindo = true;
  this.tempoOscilacao = 0;

  // Posições fixas na tela
  this.posicaoCoracaoX = 16;
  this.posicaoCoracaoY = 16;
  this.posicaoSlimesX = 128; // posição do contador de slimes mortos
  this.posicaoSlimesY = 28;
  this.posicaoPontuacaoX = this.context.canvas.width - 20; // canto superior direito
  this.posicaoPontuacaoY = 28;

  // Inicializa pontuação e controle de slimes mortos
  this.heroi.pontuacao = this.heroi.pontuacao || 0;
  this.heroi.slimesMortosAnterior = 0;
}

UI.prototype = {
  // ==============================
  // ATUALIZA A UI
  // ==============================
  atualizar: function () {
    // Animação de flutuação dos corações (subindo/descendo)
    this.tempoOscilacao += 1;
    if (this.tempoOscilacao >= 20) {
      this.subindo = !this.subindo;
      this.tempoOscilacao = 0;
    }
    this.offsetY = this.subindo ? -1 : 1;

    // Animação do sprite dos corações
    const agora = performance.now();
    if (agora - this.ultimoTempo > this.tempoPorFrame) {
      this.frameAtual = (this.frameAtual + 1) % 4; // 4 frames do sprite
      this.ultimoTempo = agora;
    }

    // Atualiza a pontuação baseado nos slimes mortos
    this.atualizarPontuacao();
  },

  // ==============================
  // ATUALIZA PONTUAÇÃO
  // ==============================
  atualizarPontuacao: function () {
    const novosSlimes =
      this.heroi.slimesMortos - this.heroi.slimesMortosAnterior;

    if (novosSlimes > 0) {
      this.heroi.pontuacao += novosSlimes * 7; // 7 pontos por slime
      this.heroi.slimesMortosAnterior = this.heroi.slimesMortos;
    }
  },

  // ==============================
  // DESENHA A UI NO CANVAS
  // ==============================
  desenhar: function () {
    if (!this.imagem.complete || this.imagem.naturalHeight === 0) return;

    this.context.save();
    this.context.shadowColor = "white";
    this.context.shadowBlur = 4;

    const dxBase = this.posicaoCoracaoX;
    const dyBase = this.posicaoCoracaoY + this.offsetY;

    // Desenha corações de vida (cheios ou vazios)
    for (let i = 0; i < this.totalCoroes; i++) {
      const cheio = i < this.heroi.vida; // verifica se o coração está cheio
      const linha = cheio ? 0 : 1; // linha do sprite (cheio ou vazio)
      const sx = this.frameAtual * this.larguraCoracao;
      const sy = linha * this.alturaCoracao;
      const dx = dxBase + i * (this.larguraCoracao + 2);
      const dy = dyBase;

      this.context.drawImage(
        this.imagem,
        sx,
        sy,
        this.larguraCoracao,
        this.alturaCoracao,
        dx,
        dy,
        this.larguraCoracao,
        this.alturaCoracao
      );
    }

    // Desenha contador de slimes mortos
    this.context.font = "9px EarlyGameBoy";
    this.context.fillStyle = "black";
    this.context.textAlign = "center";
    this.context.fillText(
      `${this.heroi.slimesMortos}`,
      this.posicaoSlimesX,
      this.posicaoSlimesY
    );

    // Desenha pontuação no canto superior direito
    this.context.font = "9px EarlyGameBoy";
    this.context.fillStyle = "black";
    this.context.textAlign = "right";
    this.context.fillText(
      `${this.heroi.pontuacao}`,
      this.posicaoPontuacaoX,
      this.posicaoPontuacaoY
    );

    this.context.restore();
  },
};
