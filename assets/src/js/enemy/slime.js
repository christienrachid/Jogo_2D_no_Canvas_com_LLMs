function Slime(context, heroi) {
  this.context = context; // Contexto do canvas para desenhar o slime
  this.heroi = heroi; // Referência ao herói para que o slime possa persegui-lo

  // Posição inicial aleatória dentro do canvas
  this.x = Math.random() * context.canvas.width;
  this.y = Math.random() * context.canvas.height;

  this.velocidade = 0.3; // Velocidade de movimento do slime
  this.largura = 16; // Largura do sprite
  this.altura = 16; // Altura do sprite

  // Sprites do slime
  this.imagem = new Image();
  this.imagem.src = "img/enemy/slime.png"; // Sprite normal do slime

  this.imagemMorte = new Image();
  this.imagemMorte.src = "img/enemy/slimeDeath.png"; // Sprite de morte do slime

  // Controle da animação normal (andar)
  this.totalFrames = 2; // Total de frames da animação de andar
  this.frameAtual = 0; // Frame atual
  this.tempoPorFrame = 300; // Tempo entre frames em ms
  this.ultimoTempo = 0; // Último tempo que frame foi atualizado

  // Controle da animação de morte
  this.totalFramesMorte = 4; // Total de frames da animação de morte
  this.frameMorte = 0; // Frame atual da animação de morte
  this.tempoPorFrameMorte = 150; // Tempo entre frames de morte
  this.ultimoTempoMorte = 0; // Último tempo que frame de morte foi atualizado
  this.animacaoMorteFinalizada = false; // Marca quando a animação de morte acabou

  // Estado e direção do slime
  this.estado = "vivo"; // "vivo" | "morrendo" | "morto"
  this.direcao = "direita"; // Direção que o slime está olhando
}

Slime.prototype = {
  atualizar: function () {
    if (this.estado === "morto") return; // Slime morto não faz nada

    // ==============================
    // ANIMAÇÃO DE MORTE
    // ==============================
    if (this.estado === "morrendo") {
      let agora = performance.now();

      // Atualiza frame da animação de morte baseado no tempo
      if (agora - this.ultimoTempoMorte > this.tempoPorFrameMorte) {
        this.frameMorte++;
        this.ultimoTempoMorte = agora;

        // Quando termina a animação, marca slime como morto
        if (this.frameMorte >= this.totalFramesMorte) {
          this.frameMorte = this.totalFramesMorte - 1;
          this.animacaoMorteFinalizada = true;
        }
      }
      return; // Não faz nada além de animar a morte
    }

    // ==============================
    // MOVIMENTO NORMAL
    // ==============================
    // Calcula distância entre o slime e o centro do herói
    const heroiCentroX = this.heroi.x + this.heroi.larguraFrame / 2;
    const heroiCentroY = this.heroi.y + this.heroi.alturaFrame / 2;

    let dx = heroiCentroX - this.x;
    let dy = heroiCentroY - this.y;
    let dist = Math.sqrt(dx * dx + dy * dy);

    // Move o slime em direção ao herói, mantendo a velocidade constante
    if (dist > 0) {
      this.x += (dx / dist) * this.velocidade;
      this.y += (dy / dist) * this.velocidade;
    }

    // Atualiza direção do sprite com base no movimento
    this.direcao = dx >= 0 ? "direita" : "esquerda";

    // Atualiza frame da animação de andar baseado no tempo
    let agora = performance.now();
    if (agora - this.ultimoTempo > this.tempoPorFrame) {
      this.frameAtual = (this.frameAtual + 1) % this.totalFrames;
      this.ultimoTempo = agora;
    }
  },

  desenhar: function () {
    let img, sx, sy;

    // Define sprite e posição do frame dependendo do estado e direção
    if (this.estado === "morrendo") {
      img = this.imagemMorte;
      sx = this.frameMorte * this.largura;
      sy = this.direcao === "direita" ? 0 : this.altura;
    } else {
      img = this.imagem;
      sx = this.frameAtual * this.largura;
      sy = this.direcao === "direita" ? 0 : this.altura;
    }

    // Se a imagem ainda não carregou, não desenha
    if (!img.complete || img.naturalHeight === 0) return;

    // Desenha o sprite no canvas, centralizado na posição do slime
    this.context.drawImage(
      img,
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

  // Método para iniciar a animação de morte do slime
  morrer: function () {
    if (this.estado !== "vivo") return; // Só pode morrer se estiver vivo

    this.estado = "morrendo";
    this.frameMorte = 0; // Começa do primeiro frame de morte
    this.animacaoMorteFinalizada = false; // Reseta controle de finalização
    this.ultimoTempoMorte = performance.now();
  },
};
