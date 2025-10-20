function Animacao(context) {
    this.context = context;
    this.sprites = [];
    this.ligado = false;
    this.ultimoTempo = 0;
    this.idAnimacao = null;
}

Animacao.prototype = {
    novoSprite: function(sprite) {
        this.sprites.push(sprite);
    },

    ligar: function() {
        this.ligado = true;
        this.proximoFrame();
    },

    desligar: function() {
        this.ligado = false;
        if (this.idAnimacao) {
            cancelAnimationFrame(this.idAnimacao);
            this.idAnimacao = null;
        }
    },

    proximoFrame: function() {
        if (!this.ligado) return;

        const agora = new Date().getTime();
        if (this.ultimoTempo === 0) this.ultimoTempo = agora;
        const decorrido = agora - this.ultimoTempo;

        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);

        for (let i in this.sprites) {
            const sprite = this.sprites[i];
            if (typeof sprite.atualizar === "function") {
                sprite.atualizar(decorrido);
            }
            if (typeof sprite.desenhar === "function") {
                sprite.desenhar();
            }
        }

        this.ultimoTempo = agora;
        this.idAnimacao = requestAnimationFrame(() => this.proximoFrame());
    }
};
