// ==============================
// RETORNA CAIXA DE COLISÃO CENTRALIZADA
// ==============================
function getBoundingBox(s) {
  let left = s.x; // Posição X do sprite
  let top = s.y; // Posição Y do sprite
  let w = s.largura || 0; // Largura do sprite
  let h = s.altura || 0; // Altura do sprite

  // Ajusta posição para sprites centralizados (ex.: Axe, Slime)
  if (s instanceof Axe || s instanceof Slime) {
    left = s.x - w / 2;
    top = s.y - h / 2;
  }

  // Ajuste especial para o herói: colisão só no tronco
  if (s instanceof Heroi) {
    const alturaColisao = 7; // Altura da caixa de colisão (tronco)
    const offsetY = 9; // Offset do topo para posicionar a caixa
    return {
      left: s.x - w / 2,
      top: s.y - h / 2 + offsetY,
      w: w,
      h: alturaColisao,
    };
  }

  return { left, top, w, h }; // Retorna caixa de colisão padrão
}

// ==============================
// VERIFICA COLISÃO ENTRE DOIS SPRITES (AABB)
// ==============================
function colidiu(a, b) {
  const A = getBoundingBox(a); // Caixa de colisão do sprite A
  const B = getBoundingBox(b); // Caixa de colisão do sprite B

  // Checa sobreposição das caixas (Axis-Aligned Bounding Box)
  return (
    A.left < B.left + B.w &&
    A.left + A.w > B.left &&
    A.top < B.top + B.h &&
    A.top + A.h > B.top
  );
}

// ==============================
// VERIFICA COLISÕES ENTRE MACHADO, SLIMES E HERÓI
// ==============================
function verificarColisoes(animacao, heroi) {
  // Itera todos os sprites da animação (do fim para o início para facilitar remoção)
  for (let i = animacao.sprites.length - 1; i >= 0; i--) {
    const sprite = animacao.sprites[i];

    // ===== COLISÃO: Axe x Slime =====
    if (sprite instanceof Axe) {
      for (let j = slimes.length - 1; j >= 0; j--) {
        const slime = slimes[j];

        // Ignora slimes já mortos ou morrendo
        if (slime.estado !== "vivo") continue;

        // Se colidiu, mata o slime e remove o machado
        if (colidiu(sprite, slime)) {
          animacao.sprites.splice(i, 1); // Remove machado
          slime.morrer(); // Inicia animação de morte do slime
          heroi.slimesMortos = (heroi.slimesMortos || 0) + 1; // Conta morte
          break;
        }
      }
    }

    // ===== COLISÃO: Slime x Herói =====
    if (
      sprite instanceof Slime &&
      sprite.estado === "vivo" &&
      colidiu(sprite, heroi)
    ) {
      // Remove slime da lista e da animação
      const j = slimes.indexOf(sprite);
      if (j !== -1) slimes.splice(j, 1);
      animacao.sprites.splice(i, 1);

      heroi.tomarDano(); // Herói recebe dano
    }
  }

  // ===== REMOVER SLIMES MORTOS (APÓS ANIMAÇÃO) =====
  for (let k = slimes.length - 1; k >= 0; k--) {
    const slime = slimes[k];
    // Se animação de morte finalizou, remove completamente
    if (slime.estado === "morrendo" && slime.animacaoMorteFinalizada) {
      slime.estado = "morto";
      slimes.splice(k, 1);
      const idx = animacao.sprites.indexOf(slime);
      if (idx !== -1) animacao.sprites.splice(idx, 1);
    }
  }
}

// ==============================
// REMOVE SPRITES FORA DA TELA
// ==============================
function removerForaDaTela(animacao) {
  const largura = animacao.context.canvas.width;
  const altura = animacao.context.canvas.height;

  // Itera todos os sprites
  for (let i = animacao.sprites.length - 1; i >= 0; i--) {
    const s = animacao.sprites[i];
    const box = getBoundingBox(s);

    // Se a caixa estiver totalmente fora do canvas
    if (
      box.left + box.w < 0 || // Saiu pela esquerda
      box.left > largura || // Saiu pela direita
      box.top + box.h < 0 || // Saiu pelo topo
      box.top > altura // Saiu pela base
    ) {
      if (s instanceof Slime) {
        const k = slimes.indexOf(s);
        if (k !== -1) slimes.splice(k, 1); // Remove slime da lista global
      }
      animacao.sprites.splice(i, 1); // Remove sprite da animação
    }
  }
}
