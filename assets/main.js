// Referência para o canvas e contexto 2D
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Desativa suavização de imagem para manter aparência pixel-art nítida
ctx.imageSmoothingEnabled = false;

// Instâncias de utilitários (Teclado e Animacao presumidos definidos em outro lugar)
const teclado = new Teclado(window);
const animacao = new Animacao(ctx);

// Variáveis globais do jogo
let mapa; // objeto JSON do mapa (carregado de map.json)
let tilesets = []; // array com imagens/infos dos tilesets usados no mapa
let slimes = []; // array de inimigos Slime ativos

// Controle de geração de inimigos (slimes)
let spawnInterval = 2000; // intervalo entre spawns em ms
let ultimoSpawnTime = 0; // timestamp do último spawn

// Estado do jogo: "jogando", "morte", "gameover"
let estadoJogo = "jogando";

// Variáveis para efeito de fechamento/anim de morte (círculo)
let raioCirculo = 300;
let inicioFechamento = null;
let tempoInicioParada = null;
let faseMorte = 0;

// --- Carregamento do mapa (map.json) ---
// Após carregar, define tamanho do canvas e inicia tilesets/jogo
fetch("map.json")
  .then((res) => res.json())
  .then((json) => {
    mapa = json;
    canvas.width = mapa.width * mapa.tilewidth;
    canvas.height = mapa.height * mapa.tileheight;
    carregarTilesets();
    iniciarJogo();
  });

// --- Fonte para o texto GAME OVER ---
// Carrega fonte customizada e adiciona ao document.fonts
const fonteGameOver = new FontFace(
  "EarlyGameBoy",
  "url('src/extras/font/Early GameBoy.ttf')"
);
fonteGameOver.load().then((f) => document.fonts.add(f));

// --- Tilesets ---
// Constrói array `tilesets` com imagens e metadados para desenhar o mapa
function carregarTilesets() {
  mapa.tilesets.forEach((ts) => {
    const img = new Image();
    img.src = ts.image;
    tilesets.push({
      firstgid: ts.firstgid,
      image: img,
      tilewidth: ts.tilewidth,
      tileheight: ts.tileheight,
      columns: ts.columns,
    });
  });
}

// --- Desenha o mapa na tela ---
// Percorre a camada 0 (presumivelmente a camada base) do Tiled e desenha cada tile
function drawMapa() {
  if (!mapa || tilesets.length === 0) return;
  const layer = mapa.layers[0];
  for (let row = 0; row < mapa.height; row++) {
    for (let col = 0; col < mapa.width; col++) {
      const index = row * mapa.width + col;
      const gid = layer.data[index];
      if (gid === 0) continue; // 0 = tile vazio

      // Acha o tileset correto verificando firstgid
      let ts;
      for (let i = tilesets.length - 1; i >= 0; i--) {
        if (gid >= tilesets[i].firstgid) {
          ts = tilesets[i];
          break;
        }
      }
      if (!ts) continue;

      // Calcula coords na imagem do tileset
      const localGid = gid - ts.firstgid;
      const sx = (localGid % ts.columns) * ts.tilewidth;
      const sy = Math.floor(localGid / ts.columns) * ts.tileheight;
      const dx = col * ts.tilewidth;
      const dy = row * ts.tileheight;

      ctx.drawImage(
        ts.image,
        sx,
        sy,
        ts.tilewidth,
        ts.tileheight,
        dx,
        dy,
        ts.tilewidth,
        ts.tileheight
      );
    }
  }
}

// --- Sistema de Nuvens (parallax / sombras) ---
// Imagem usada para as nuvens
const imgNuvem = new Image();
imgNuvem.src = "img/scenarios/cloud.png";

let nuvens = [];
let ultimoSpawnNuvem = 0;
const cooldownNuvem = 2000; // 2s entre nuvens

// Atualiza posições e cria novas nuvens periodicamente
function atualizarNuvens(deltaTime) {
  const agora = performance.now();

  // Se passou o cooldown e a imagem está carregada, cria uma nova nuvem
  if (agora - ultimoSpawnNuvem >= cooldownNuvem && imgNuvem.complete) {
    ultimoSpawnNuvem = agora;

    // variações para tornar movimento e tamanho mais natural
    const escala = 0.8 + Math.random() * 0.4;
    const largura = imgNuvem.width * escala;
    const altura = imgNuvem.height * escala;

    nuvens.push({
      x: canvas.width + Math.random() * 200, // surgem à direita, fora da tela
      y: Math.random() * (canvas.height - altura),
      velocidade: 0.05 + Math.random() * 0.15, // velocidade lenta
      largura,
      altura,
      alpha: 0.2 + Math.random() * 0.1, // transparência
    });
  }

  // Move as nuvens para a esquerda proporcional ao deltaTime
  nuvens.forEach((nuvem) => {
    nuvem.x -= nuvem.velocidade * deltaTime;
  });

  // Remove nuvens que saíram totalmente da tela
  nuvens = nuvens.filter((n) => n.x + n.largura > 0);
}

// Desenha as nuvens usando composição multiply para efeito de sombra/scuro
function drawNuvens() {
  ctx.save();
  ctx.globalCompositeOperation = "multiply"; // mistura como sombra
  nuvens.forEach((nuvem) => {
    ctx.globalAlpha = nuvem.alpha;
    ctx.drawImage(imgNuvem, nuvem.x, nuvem.y, nuvem.largura, nuvem.altura);
  });
  ctx.restore();
}

// --- Inicialização do jogo: cria herói, UI e monta loop ---
function iniciarJogo() {
  const heroi = new Heroi(ctx, teclado, animacao);
  // centraliza o herói no canvas
  heroi.x = canvas.width / 2 - heroi.larguraFrame / 2;
  heroi.y = canvas.height / 2 - heroi.alturaFrame / 2;
  heroi.vida = 3;
  heroi.slimesMortos = 0;
  heroi.pontuacao = 0;
  heroi.ultimoTiro = 0;

  // Registra o herói e UI como sprites da animação
  animacao.novoSprite(heroi);
  const ui = new UI(ctx, heroi);
  animacao.novoSprite(ui);

  // Substitui/define o método proximoFrame do gerenciador de animação.
  // Esse método é chamado recursivamente via requestAnimationFrame.
  animacao.proximoFrame = function () {
    if (!this.ligado) return;
    this.limparTela();

    const agora = performance.now();

    if (estadoJogo === "jogando") {
      // Spawn de inimigos baseado no intervalo
      if (agora - ultimoSpawnTime >= spawnInterval) {
        spawnSlime();
        ultimoSpawnTime = agora;
      }

      // 1) Desenha mapa
      drawMapa();

      // 2) Atualiza e desenha nuvens (parallax)
      atualizarNuvens(16);
      drawNuvens();

      // 3) Atualiza sprites (herói, slimes, projéteis, UI, etc.)
      for (let i in this.sprites)
        if (this.sprites[i].atualizar) this.sprites[i].atualizar();

      // Colisões e limpeza de sprites fora da tela
      verificarColisoes(this, heroi);
      removerForaDaTela(this);

      // 4) Desenha os sprites na ordem registrada
      for (let i in this.sprites)
        if (this.sprites[i].desenhar) this.sprites[i].desenhar();
    } else if (estadoJogo === "morte") {
      // Sequência de morte especial: usa um clipping circular para "fechar"
      const centroX = heroi.x + heroi.larguraFrame / 2;
      const centroY = heroi.y + heroi.alturaFrame / 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(centroX, centroY, Math.max(0, raioCirculo), 0, Math.PI * 2);
      ctx.clip();

      // Dentro do círculo ainda mostra o mapa, nuvens e sprites
      drawMapa();
      drawNuvens();
      for (let i in animacao.sprites)
        if (animacao.sprites[i].desenhar) animacao.sprites[i].desenhar();
      ctx.restore();

      // Define um "raio justo" em torno do herói para a primeira fase da animação
      const raioJusto =
        Math.max(heroi.larguraFrame, heroi.alturaFrame) / 2 + 25;

      if (faseMorte === 0) faseMorte = 1;

      // Fase 1: reduz o raio até o `raioJusto` (efeito de fechamento inicial)
      if (faseMorte === 1) {
        const velocidadeFase1 = 6;
        if (raioCirculo > raioJusto) {
          raioCirculo = Math.max(raioJusto, raioCirculo - velocidadeFase1);
        } else {
          raioCirculo = raioJusto;
          faseMorte = 2;
          if (!heroi.animacaoMorteIniciada) {
            heroi.iniciarAnimacaoMorte();
            inicioFechamento = null;
            tempoInicioParada = null;
          }
        }
      }

      // Fase 2: toca animação de morte do herói; espera finalizar frames
      if (faseMorte === 2) {
        heroi.atualizarAnimacaoMorte();
        if (heroi.frameAtual === heroi.totalFrames - 1) {
          if (!inicioFechamento) inicioFechamento = performance.now();
          else if (performance.now() - inicioFechamento >= 200) faseMorte = 3;
        }
      }

      // Fase 3: reduz gradualmente o raio até 0 e espera antes de transitar para gameover
      if (faseMorte === 3) {
        const velocidadeFase3 = 4;
        if (raioCirculo > 0)
          raioCirculo = Math.max(0, raioCirculo - velocidadeFase3);
        else {
          if (!tempoInicioParada) tempoInicioParada = performance.now();
          else if (performance.now() - tempoInicioParada >= 800)
            estadoJogo = "gameover";
        }
      }
    } else if (estadoJogo === "gameover") {
      // Tela de GAME OVER: desenha mapa e sprites por trás e um overlay escuro
      drawMapa();
      drawNuvens();

      for (let i in animacao.sprites)
        if (animacao.sprites[i].desenhar) animacao.sprites[i].desenhar();

      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "white";
      ctx.textAlign = "center";

      // Texto com leve oscilação vertical (efeito dinâmico)
      const amplitude = 20;
      const frequencia = 0.005;
      const baseY = canvas.height / 3;
      const yOscilado =
        baseY + Math.sin(performance.now() * frequencia) * amplitude;

      ctx.font = "20px EarlyGameBoy";
      ctx.fillText("GAME OVER", canvas.width / 2, yOscilado);

      ctx.font = "10px EarlyGameBoy";
      ctx.fillText(
        `Slimes derrotados: ${heroi.slimesMortos}`,
        canvas.width / 2,
        yOscilado + 50
      );
      ctx.fillText(
        `Pontuação final: ${heroi.pontuacao}`,
        canvas.width / 2,
        yOscilado + 80
      );

      ctx.fillText(
        "Pressione F5 para recomeçar",
        canvas.width / 2,
        yOscilado + 120
      );

      ctx.restore();
    }

    // Continua o loop
    requestAnimationFrame(() => this.proximoFrame());
  };

  // Liga a animação (começa o loop)
  animacao.ligar();

  // Input: espaço para atirar (com cooldown de 500ms)
  teclado.disparou(ESPACO, () => {
    if (estadoJogo === "jogando") {
      const agora = performance.now();
      if (agora - heroi.ultimoTiro >= 500) {
        heroi.atirar();
        heroi.ultimoTiro = agora;
      }
    }
  });

  // --- Função para criar e posicionar um Slime na borda do mapa ---
  function spawnSlime() {
    if (estadoJogo !== "jogando") return;
    const slime = new Slime(ctx, heroi);
    const borda = Math.floor(Math.random() * 4);
    switch (borda) {
      case 0:
        slime.x = Math.random() * canvas.width;
        slime.y = 0;
        break;
      case 1:
        slime.x = Math.random() * canvas.width;
        slime.y = canvas.height - slime.altura;
        break;
      case 2:
        slime.x = 0;
        slime.y = Math.random() * canvas.height;
        break;
      case 3:
        slime.x = canvas.width - slime.largura;
        slime.y = Math.random() * canvas.height;
        break;
    }
    slimes.push(slime);
    animacao.novoSprite(slime);
  }

  // --- Intercepta a função tomarDano do herói para iniciar a sequência de morte ---
  const heroiTomarDanoOriginal = heroi.tomarDano;
  heroi.tomarDano = function () {
    // chama o comportamento original (subtrai vida, etc.)
    heroiTomarDanoOriginal.call(heroi);
    // se morreu, inicia a sequência de morte/limpeza
    if (heroi.vida <= 0 && estadoJogo === "jogando") {
      estadoJogo = "morte";
      slimes = [];
      // remove todos os Slime dos sprites da animação
      animacao.sprites = animacao.sprites.filter(
        (sprite) => !(sprite instanceof Slime)
      );
      raioCirculo = 300;
      inicioFechamento = null;
      tempoInicioParada = null;
      faseMorte = 1;
      heroi.animacaoMorteIniciada = false;
      heroi.frameAtual = 0;
      heroi.ultimoTempo = performance.now();
    }
  };
}
