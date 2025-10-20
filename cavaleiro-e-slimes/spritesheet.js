function Spritesheet(context, imagem, numLinhas, numColunas) {
    this.context = context;
    this.imagem = imagem;
    this.numLinhas = numLinhas;
    this.numColunas = numColunas;
    this.intervalo = 0;
    this.linha = 0;
    this.coluna = 0;
    this.quadroAtual = 0;
    this.ultimoTempo = 0;
    this.espelhado = false;

    // ✅ Expor dimensões dos quadros
    this.larguraFrame = imagem.width / numColunas;
    this.alturaFrame = imagem.height / numLinhas;
}

Spritesheet.prototype = {
    proximoQuadro: function() {
        const agora = new Date().getTime();
        if (agora < this.ultimoTempo + this.intervalo) return;

        this.quadroAtual++;
        this.coluna++;
        

        if (this.coluna >= this.numColunas) {
            this.coluna = 0;
            this.linha++;
            if (this.linha >= this.numLinhas) {
                this.linha = 0;
            }
        }

        this.ultimoTempo = agora;
    },

    desenhar: function(x, y, larguraFinal, alturaFinal) {
        const larguraQuadro = this.larguraFrame;
        const alturaQuadro = this.alturaFrame;

        const sX = this.coluna * larguraQuadro;
        const sY = this.linha * alturaQuadro;

        let dX = x;
        let dY = y;
        let dW = larguraFinal;
        let dH = alturaFinal;

        this.context.save();

        if (this.espelhado) {
            this.context.translate(dX + dW, dY);
            this.context.scale(-1, 1);
            dX = 0;
            dY = 0;
        }

        this.context.drawImage(
            this.imagem,
            sX, sY, larguraQuadro, alturaQuadro,
            dX, dY, dW, dH
        );

        this.context.restore();
    }
};
