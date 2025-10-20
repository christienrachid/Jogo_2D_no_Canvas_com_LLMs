function Explosao(context, imagem, x, y, som) {
    this.context = context;
    this.x = x;
    this.y = y;

    // Spritesheet com 3 linhas e 7 colunas (21 quadros)
    this.sheet = new Spritesheet(context, imagem, 3, 7);
    this.sheet.intervalo = 50;
    this.sheet.quadroAtual = 0;

    this.largura = imagem.width / this.sheet.numColunas;
    this.altura = imagem.height / this.sheet.numLinhas;
    this.escala = 2.5;

    this.expirou = false;

    // 🔊 Toca o som de explosão ao criar
    if (som) {
        try {
            som.currentTime = 0;
            som.play();
        } catch (e) {
            console.warn("Erro ao tocar som da explosão:", e);
        }
    }
}

Explosao.prototype.atualizar = function () {
    this.sheet.proximoQuadro();

    const totalQuadros = this.sheet.numColunas * this.sheet.numLinhas;
    if (this.sheet.quadroAtual >= totalQuadros) {
        this.expirou = true;
    }
};

Explosao.prototype.desenhar = function () {
    if (!this.expirou) {
        const larguraFinal = this.largura * this.escala;
        const alturaFinal = this.altura * this.escala;
        this.sheet.desenhar(this.x, this.y, larguraFinal, alturaFinal);
    }
};
