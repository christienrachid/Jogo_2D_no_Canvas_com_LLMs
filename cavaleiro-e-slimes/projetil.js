function Projetil(context, x, y, direcao, som) {
    this.context = context;
    this.x = x;
    this.y = y;
    this.direcao = direcao; 
    this.velocidade = 15;
    this.ativo = true;
    this.removivel = false;

    this.cor = 'rgba(0, 150, 255, 0.8)'; 
    this.raio = 5;

    this.largura = this.raio * 2;
    this.altura = this.raio * 2;
    this.escala = 1;

    // 🔊 Toca som de ataque ao criar
    if (som) {
        som.currentTime = 0;
        som.play();
    }
}

Projetil.prototype = {
    atualizar: function() {
        if (!this.ativo) return;

        this.x += this.velocidade * this.direcao; 

        if (this.x < 0 || this.x > this.context.canvas.width) {
            this.ativo = false;
            this.removivel = true;
        }
    },

    desenhar: function() {
        if (!this.ativo) return;

        this.context.save();
        this.context.fillStyle = this.cor;
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.raio, 0, 2 * Math.PI);
        this.context.fill();
        this.context.restore();
    }
};
