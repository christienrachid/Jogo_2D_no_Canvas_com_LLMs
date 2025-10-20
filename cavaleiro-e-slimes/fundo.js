function FundoParallax(context, imagem, velocidade) {
  this.context = context;
  this.imagem = imagem;
  this.velocidade = velocidade;
  this.deslocamento = 0;
}

FundoParallax.prototype = {
  atualizar: function() {
    this.deslocamento += this.velocidade;
    if (this.deslocamento >= this.imagem.width) {
      this.deslocamento = 0;
    }
  },

  desenhar: function() {
    const ctx = this.context;
    const img = this.imagem;
    const canvas = ctx.canvas;
    const alturaCanvas = canvas.height;
    const larguraImagem = img.width;

    // Desenha a imagem atual
    ctx.drawImage(img, this.deslocamento, 0, larguraImagem, alturaCanvas);

    // Desenha a imagem anterior para criar o loop
    ctx.drawImage(img, this.deslocamento - larguraImagem, 0, larguraImagem, alturaCanvas);
  }
};
