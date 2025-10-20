function Teclado(elemento) {
  this.pressionadas = [];

  const self = this;

  elemento.addEventListener('keydown', function(evento) {
    self.pressionadas[evento.keyCode] = true;
  });

  elemento.addEventListener('keyup', function(evento) {
    self.pressionadas[evento.keyCode] = false;
  });
}

Teclado.prototype.pressionada = function(tecla) {
  return this.pressionadas[tecla] === true;
};
