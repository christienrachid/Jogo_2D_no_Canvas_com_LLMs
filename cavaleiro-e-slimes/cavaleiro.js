function Cavaleiro(context, teclado, imagem, setaDireita, setaEsquerda) {
    this.context = context;
    this.teclado = teclado;
    this.x = 50;
    this.velocidade = 10;

    this.imagem = imagem;
    this.sheet = new Spritesheet(context, imagem, 1, 3);
    this.sheet.intervalo = 60;

    this.andando = false;
    this.direcao = 1;
    this.SETA_DIREITA = setaDireita;
    this.SETA_ESQUERDA = setaEsquerda;

    const larguraFrame = imagem.width / 3;
const alturaFrame = imagem.height;

this.escala = 2.0;
this.larguraSprite = larguraFrame * this.escala;
this.alturaSprite = alturaFrame * this.escala;

this.largura = larguraFrame * 0.5;
this.altura = alturaFrame * 0.8;

// Alinhar pela base da hitbox, como o slime
const alturaHitboxNaTela = this.altura * this.escala;
this.y = context.canvas.height - alturaHitboxNaTela;

this.deslocamentoX = (this.larguraSprite - alturaHitboxNaTela) / 2;
this.deslocamentoY = this.alturaSprite - alturaHitboxNaTela;
}

Cavaleiro.prototype.atualizar = function () {
    if (this.teclado.pressionada(this.SETA_DIREITA)) {
        this.sheet.linha = 0;
        this.andando = true;
        this.direcao = 1;
        this.sheet.espelhado = false;
        this.sheet.proximoQuadro();
        this.x += this.velocidade;
    } else if (this.teclado.pressionada(this.SETA_ESQUERDA)) {
        this.sheet.linha = 0;
        this.andando = true;
        this.direcao = -1;
        this.sheet.espelhado = true;
        this.sheet.proximoQuadro();
        this.x -= this.velocidade;
    } else {
        this.sheet.linha = 0;
        this.sheet.coluna = 0;
        this.andando = false;
    }

    if (this.x < 0) this.x = 0;
    if (this.x > this.context.canvas.width - this.larguraSprite) {
        this.x = this.context.canvas.width - this.larguraSprite;
    }
};

Cavaleiro.prototype.desenhar = function () {
    this.sheet.desenhar(this.x, this.y, this.larguraSprite, this.alturaSprite);
};
