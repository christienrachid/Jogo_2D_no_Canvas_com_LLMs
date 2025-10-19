function Animacao(context) {
  this.context = context; // Contexto do canvas para desenhar os sprites
  this.sprites = []; // Lista de todos os sprites que serão animados
  this.ligado = false; // Controle para ligar/desligar o loop de animação
}

Animacao.prototype = {
  // ==============================
  // ADICIONA UM NOVO SPRITE À ANIMAÇÃO
  // ==============================
  novoSprite: function (sprite) {
    this.sprites.push(sprite);
  },

  // ==============================
  // LIGA A ANIMAÇÃO (inicia loop)
  // ==============================
  ligar: function () {
    this.ligado = true;
    this.proximoFrame(); // inicia o loop chamando a função de próximo frame
  },

  // ==============================
  // DESLIGA A ANIMAÇÃO (para loop)
  // ==============================
  desligar: function () {
    this.ligado = false;
  },

  // ==============================
  // LOOP PRINCIPAL DE ANIMAÇÃO
  // ==============================
  proximoFrame: function () {
    if (!this.ligado) return; // Se desligado, não faz nada

    this.limparTela(); // Limpa o canvas antes de desenhar o próximo frame

    // Atualiza cada sprite (movimento, lógica, animação)
    for (var i in this.sprites) this.sprites[i].atualizar();

    // Desenha cada sprite no canvas
    for (var i in this.sprites) this.sprites[i].desenhar();

    // Chama o próximo frame usando requestAnimationFrame (loop recursivo)
    var animacao = this; // referência para o contexto correto dentro do callback
    requestAnimationFrame(function () {
      animacao.proximoFrame();
    });
  },

  // ==============================
  // LIMPA O CANVAS
  // ==============================
  limparTela: function () {
    var ctx = this.context;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // limpa toda a área do canvas
  },
};
