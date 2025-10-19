// ==============================
// CÓDIGOS DE TECLAS
// ==============================
var SETA_ESQUERDA = 37;
var SETA_CIMA = 38;
var SETA_DIREITA = 39;
var SETA_BAIXO = 40;
var ESPACO = 32; // tecla de ação/ataque

// ==============================
// OBJETO TECLADO
// ==============================
function Teclado(elemento) {
  this.elemento = elemento; // elemento DOM que recebe eventos de teclado
  this.pressionadas = []; // array para rastrear teclas pressionadas
  this.disparadas = []; // evita múltiplos disparos contínuos de uma tecla
  this.funcoesDisparo = []; // funções associadas a cada tecla

  var teclado = this;

  // ==============================
  // TECLA PRESSIONADA
  // ==============================
  elemento.addEventListener("keydown", function (evento) {
    var tecla = evento.keyCode;
    teclado.pressionadas[tecla] = true; // marca tecla como pressionada

    // dispara callback apenas uma vez por pressionamento
    if (teclado.funcoesDisparo[tecla] && !teclado.disparadas[tecla]) {
      teclado.disparadas[tecla] = true;
      teclado.funcoesDisparo[tecla](); // chama função associada à tecla
    }
  });

  // ==============================
  // TECLA SOLTA
  // ==============================
  elemento.addEventListener("keyup", function (evento) {
    teclado.pressionadas[evento.keyCode] = false; // marca como solta
    teclado.disparadas[evento.keyCode] = false; // permite novo disparo
  });
}

// ==============================
// MÉTODOS
// ==============================
Teclado.prototype = {
  // Verifica se uma tecla está pressionada
  pressionada: function (tecla) {
    return this.pressionadas[tecla];
  },

  // Associa uma função a uma tecla (disparo único por pressionamento)
  disparou: function (tecla, callback) {
    this.funcoesDisparo[tecla] = callback;
  },
};
