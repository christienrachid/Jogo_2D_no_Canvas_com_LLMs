function Slime(context, imagem, x) {
    this.context = context;
    this.x = x;
    this.velocidade = 2.5;
    this.ativo = true;

    this.sheet = new Spritesheet(context, imagem, 2, 4);
    this.sheet.intervalo = 100;
    this.escala = 2.5;

    const larguraFrame = imagem.width / this.sheet.numColunas;
    const alturaFrame = imagem.height / this.sheet.numLinhas;

    this.larguraSprite = larguraFrame * this.escala;
    this.alturaSprite = alturaFrame * this.escala;

    this.largura = larguraFrame * 0.6;
    this.altura = alturaFrame * 0.5;

    const alturaHitboxNaTela = this.altura * this.escala;
    const ajuste = 60; // ajuste fino para alinhar com o cavaleiro
    this.y = context.canvas.height - alturaHitboxNaTela - ajuste;

    this.deslocamentoX = (this.larguraSprite - this.largura * this.escala) / 2;
    this.deslocamentoY = this.alturaSprite - alturaHitboxNaTela - ajuste;
}

Slime.prototype.atualizar = function () {
    if (this.ativo) {
        this.x -= this.velocidade;
        this.sheet.proximoQuadro();

        if (this.x < -this.larguraSprite) {
            this.ativo = false;
        }
    }
};

Slime.prototype.desenhar = function () {
    if (this.ativo) {
        this.sheet.desenhar(this.x, this.y, this.larguraSprite, this.alturaSprite);
    }
};
