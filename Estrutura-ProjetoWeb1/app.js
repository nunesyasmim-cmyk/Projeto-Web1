"use strict";

const API = "https://pokeapi.co/api/v2";
const LIMITE = 151; 
const CHAVE_FAVORITOS = "pokedex:favoritos";

const arteOficial = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
const spriteSimples = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

const TIPOS = {
  normal:   { pt: "Normal",    cor: "#8d8d73" },
  fire:     { pt: "Fogo",      cor: "#e8622c" },
  water:    { pt: "Água",      cor: "#3d7dca" },
  electric: { pt: "Elétrico",  cor: "#d9a400" },
  grass:    { pt: "Planta",    cor: "#4a9d3f" },
  ice:      { pt: "Gelo",      cor: "#4fb8c9" },
  fighting: { pt: "Lutador",   cor: "#b8322a" },
  poison:   { pt: "Veneno",    cor: "#9a45a8" },
  ground:   { pt: "Terra",     cor: "#c49a3a" },
  flying:   { pt: "Voador",    cor: "#7f8fe0" },
  psychic:  { pt: "Psíquico",  cor: "#e8467a" },
  bug:      { pt: "Inseto",    cor: "#8fa317" },
  rock:     { pt: "Pedra",     cor: "#a38f2e" },
  ghost:    { pt: "Fantasma",  cor: "#6a4f92" },
  dragon:   { pt: "Dragão",    cor: "#5b3fd1" },
  dark:     { pt: "Sombrio",   cor: "#5a4a40" },
  steel:    { pt: "Aço",       cor: "#8a8aa6" },
  fairy:    { pt: "Fada",      cor: "#d977a8" },
};

const NOMES_STATUS = {
  "hp": "HP",
  "attack": "Ataque",
  "defense": "Defesa",
  "special-attack": "Atq. especial",
  "special-defense": "Def. especial",
  "speed": "Velocidade",
};

const estado = {
  lista: null,          
  busca: "",
  tipo: "todos",
  detalhes: {},         
  idsPorTipo: {},       
  ultimaLista: "#/",    
};

let favoritos = lerFavoritos();
let tokenNavegacao = 0;   
let tokenGrade = 0;
let tentarNovamente = null;

const app = document.getElementById("app");

const esc = (texto) =>
  String(texto).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

const numero = (id) => "#" + String(id).padStart(3, "0");

const nomeBonito = (nome) =>
  nome.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");

const formatar = (valor) => valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

async function buscarJSON(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error("Erro " + resposta.status);
  return resposta.json();
}

function idDaUrl(url) {
  return Number(url.split("/").filter(Boolean).pop());
}

function lerFavoritos() {
  try {
    const valor = JSON.parse(localStorage.getItem(CHAVE_FAVORITOS));
    return Array.isArray(valor) ? valor.filter(Number.isInteger) : [];
  } catch {
    return [];
  }
}

function salvarFavoritos() {
  try {
    localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(favoritos));
  } catch {
    
  }
  atualizarContador();
}

const ehFavorito = (id) => favoritos.includes(id);

function alternarFavorito(id) {
  favoritos = ehFavorito(id) ? favoritos.filter((f) => f !== id) : [...favoritos, id];
  salvarFavoritos();
}

function atualizarContador() {
  document.getElementById("contador-fav").textContent = favoritos.length;
}

function htmlCarregando() {
  return `<div class="estado" role="status">
    <div class="spinner" aria-hidden="true"></div>
    <p>Carregando...</p>
  </div>`;
}

function htmlErro() {
  return `<div class="estado" role="alert">
    <div class="alerta" aria-hidden="true">!</div>
    <p>Não foi possível carregar.</p>
    <button type="button" class="btn" data-tentar-novamente>Tentar de novo</button>
  </div>`;
}

function mostrarCarregando() {
  app.innerHTML = htmlCarregando();
}

function mostrarErro(acao) {
  tentarNovamente = acao;
  app.innerHTML = htmlErro();
}

document.addEventListener("click", (evento) => {
  if (evento.target.closest("[data-tentar-novamente]") && tentarNovamente) {
    tentarNovamente();
  }
});

document.addEventListener(
  "error",
  (evento) => {
    const img = evento.target;
    if (img.tagName === "IMG" && img.dataset.id && !img.dataset.falhou) {
      img.dataset.falhou = "1";
      img.src = spriteSimples(img.dataset.id);
    }
  },
  true
);

async function carregarLista() {
  if (estado.lista) return estado.lista;
  const dados = await buscarJSON(`${API}/pokemon?limit=${LIMITE}`);
  estado.lista = dados.results.map((p) => ({ id: idDaUrl(p.url), nome: p.name }));
  return estado.lista;
}

async function carregarIdsDoTipo(tipo) {
  if (estado.idsPorTipo[tipo]) return estado.idsPorTipo[tipo];
  const dados = await buscarJSON(`${API}/type/${tipo}`);
  const ids = new Set(dados.pokemon.map((p) => idDaUrl(p.pokemon.url)));
  estado.idsPorTipo[tipo] = ids;
  return ids;
}

async function carregarDetalhe(id) {
  if (estado.detalhes[id]) return estado.detalhes[id];
  const dados = await buscarJSON(`${API}/pokemon/${id}`);
  estado.detalhes[id] = dados;
  return dados;
}

function htmlCard(pokemon, { remover = false } = {}) {
  const nome = esc(nomeBonito(pokemon.nome));
  return `<article class="card">
    <a class="card-link" href="#/pokemon/${pokemon.id}">
      <img src="${arteOficial(pokemon.id)}" data-id="${pokemon.id}" alt="${nome}" width="160" height="160" loading="lazy">
      <span class="card-num">${numero(pokemon.id)}</span>
      <h3 class="card-nome">${nome}</h3>
    </a>
    ${remover ? `<button type="button" class="remover" data-remover="${pokemon.id}" aria-label="Remover ${nome} dos favoritos">🗑 Remover</button>` : ""}
  </article>`;
}

async function telaListagem() {
  const token = ++tokenNavegacao;
  document.body.dataset.tela = "listagem";
  mostrarCarregando();

  try {
    await carregarLista();
  } catch {
    if (token === tokenNavegacao) mostrarErro(telaListagem);
    return;
  }
  if (token !== tokenNavegacao) return;

  const botoesTipo = Object.entries(TIPOS)
    .map(([chave, t]) =>
      `<button type="button" class="filtro" data-tipo="${chave}" style="--tipo:${t.cor}" aria-pressed="${estado.tipo === chave}">${t.pt}</button>`)
    .join("");

  app.innerHTML = `
    <section class="listagem">
      <form class="busca" role="search">
        <label class="sr-only" for="campo-busca">Buscar Pokémon pelo nome</label>
        <input id="campo-busca" type="search" placeholder="🔍 Buscar pelo nome..." autocomplete="off" value="${esc(estado.busca)}">
      </form>
      <div class="filtros" role="group" aria-label="Filtrar por tipo">
        <button type="button" class="filtro" data-tipo="todos" aria-pressed="${estado.tipo === "todos"}">Todos</button>
        ${botoesTipo}
      </div>
      <p id="contagem" class="contagem" aria-live="polite"></p>
      <div id="grade" class="grade"></div>
    </section>`;

  const campo = document.getElementById("campo-busca");
  campo.addEventListener("input", () => {
    estado.busca = campo.value;
    atualizarGrade();
  });
  campo.closest("form").addEventListener("submit", (e) => e.preventDefault());

  document.querySelector(".filtros").addEventListener("click", (e) => {
    const botao = e.target.closest("[data-tipo]");
    if (!botao) return;
    estado.tipo = botao.dataset.tipo;
    document.querySelectorAll(".filtro").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.tipo === estado.tipo)));
    atualizarGrade();
  });

  atualizarGrade();
}

async function atualizarGrade() {
  const meuToken = ++tokenGrade;
  const grade = document.getElementById("grade");
  const contagem = document.getElementById("contagem");
  if (!grade) return;

  let ids = null;
  if (estado.tipo !== "todos") {
    if (!estado.idsPorTipo[estado.tipo]) {
      contagem.textContent = "";
      grade.innerHTML = htmlCarregando().replace('class="estado"', 'class="estado vazio"');
    }
    try {
      ids = await carregarIdsDoTipo(estado.tipo);
    } catch {
      if (meuToken !== tokenGrade) return;
      tentarNovamente = atualizarGrade;
      contagem.textContent = "";
      grade.innerHTML = htmlErro();
      return;
    }
    if (meuToken !== tokenGrade) return;
  }

  const termo = estado.busca.trim().toLowerCase();
  const filtrados = estado.lista.filter(
    (p) => (!ids || ids.has(p.id)) && (!termo || p.nome.includes(termo))
  );

  contagem.textContent =
    filtrados.length === 1 ? "1 Pokémon encontrado" : `${filtrados.length} Pokémon encontrados`;

  grade.innerHTML = filtrados.length
    ? filtrados.map((p) => htmlCard(p)).join("")
    : `<p class="vazio">Nenhum Pokémon encontrado. Tente outro nome ou tipo.</p>`;
}

async function telaDetalhe(id) {
  const token = ++tokenNavegacao;
  document.body.dataset.tela = "detalhe";

  if (!Number.isInteger(id) || id < 1 || id > LIMITE) {
    app.innerHTML = `<div class="estado">
      <p>Pokémon não encontrado.</p>
      <a class="btn" href="#/">Voltar à listagem</a>
    </div>`;
    return;
  }

  mostrarCarregando();
  let dados;
  try {
    dados = await carregarDetalhe(id);
  } catch {
    if (token === tokenNavegacao) mostrarErro(() => telaDetalhe(id));
    return;
  }
  if (token !== tokenNavegacao) return;

  const nome = esc(nomeBonito(dados.name));
  const tipos = dados.types.map((t) => t.type.name);
  const corPrincipal = (TIPOS[tipos[0]] || {}).cor || "#999999";

  const chipsTipo = tipos
    .map((t) => {
      const info = TIPOS[t] || { pt: nomeBonito(t), cor: "#999999" };
      return `<span class="tipo" style="--tipo:${info.cor}">${esc(info.pt)}</span>`;
    })
    .join("");

  const habilidades = dados.abilities
    .map((a) => `<li>${esc(nomeBonito(a.ability.name))}${a.is_hidden ? " (oculta)" : ""}</li>`)
    .join("");

  const status = dados.stats
    .map((s) => {
      const rotulo = NOMES_STATUS[s.stat.name] || nomeBonito(s.stat.name);
      const largura = Math.min((s.base_stat / 255) * 100, 100);
      return `<li>
        <span>${esc(rotulo)}</span>
        <span class="valor">${s.base_stat}</span>
        <span class="barra" aria-hidden="true"><span style="width:${largura}%"></span></span>
      </li>`;
    })
    .join("");

  app.innerHTML = `
    <section class="detalhe" style="--cor:${corPrincipal}">
      <div class="barra-tela">
        <a class="voltar" href="${estado.ultimaLista}" aria-label="Voltar">←</a>
        <span></span>
        <button type="button" id="botao-favorito" class="coracao"></button>
      </div>
      <div class="detalhe-corpo">
        <div class="detalhe-imagem">
          <img src="${arteOficial(id)}" data-id="${id}" alt="${nome}" width="380" height="380">
        </div>
        <div class="detalhe-info">
          <h2>${nome} <span class="num">${numero(id)}</span></h2>
          <div class="tipos">${chipsTipo}</div>
          <dl class="medidas">
            <div><dt>Altura</dt><dd>${formatar(dados.height / 10)} m</dd></div>
            <div><dt>Peso</dt><dd>${formatar(dados.weight / 10)} kg</dd></div>
          </dl>
          <h3>Habilidades</h3>
          <ul class="habilidades">${habilidades}</ul>
          <h3>Status</h3>
          <ul class="status">${status}</ul>
        </div>
      </div>
    </section>`;

  const botao = document.getElementById("botao-favorito");
  const pintarBotao = () => {
    const fav = ehFavorito(id);
    botao.textContent = fav ? "♥" : "♡";
    botao.setAttribute("aria-pressed", String(fav));
    botao.setAttribute(
      "aria-label",
      fav ? `Remover ${dados.name} dos favoritos` : `Adicionar ${dados.name} aos favoritos`
    );
  };
  pintarBotao();
  botao.addEventListener("click", () => {
    alternarFavorito(id);
    pintarBotao();
  });
}

async function telaFavoritos() {
  const token = ++tokenNavegacao;
  document.body.dataset.tela = "favoritos";
  mostrarCarregando();

  try {
    await carregarLista();
  } catch {
    if (token === tokenNavegacao) mostrarErro(telaFavoritos);
    return;
  }
  if (token !== tokenNavegacao) return;

  desenharFavoritos();
}

function desenharFavoritos() {
  const itens = favoritos
    .map((id) => estado.lista.find((p) => p.id === id))
    .filter(Boolean);

  app.innerHTML = `
    <section class="favoritos">
      <div class="barra-tela">
        <a class="voltar" href="#/" aria-label="Voltar à listagem">←</a>
        <h2>Favoritos</h2>
      </div>
      <div class="grade">
        ${
          itens.length
            ? itens.map((p) => htmlCard(p, { remover: true })).join("")
            : `<div class="vazio">
                 <p>Nenhum favorito ainda.</p>
                 <a class="btn" href="#/">Explorar Pokémon</a>
               </div>`
        }
      </div>
    </section>`;

  app.querySelectorAll("[data-remover]").forEach((botao) =>
    botao.addEventListener("click", () => {
      alternarFavorito(Number(botao.dataset.remover));
      desenharFavoritos();
    })
  );
}

function rotear() {
  const hash = location.hash || "#/";
  const detalhe = hash.match(/^#\/pokemon\/(\d+)$/);

  if (detalhe) {
    telaDetalhe(Number(detalhe[1]));
  } else if (hash === "#/favoritos") {
    estado.ultimaLista = "#/favoritos";
    telaFavoritos();
  } else {
    estado.ultimaLista = "#/";
    telaListagem();
  }
  window.scrollTo(0, 0);
  atualizarBotaoTopo();
}

const botaoTopo = document.getElementById("voltar-topo");

function atualizarBotaoTopo() {
  const mostrar = document.body.dataset.tela === "listagem" && window.scrollY > 400;
  botaoTopo.classList.toggle("visivel", mostrar);
}

botaoTopo.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
window.addEventListener("scroll", atualizarBotaoTopo, { passive: true });

window.addEventListener("hashchange", rotear);
atualizarContador();
rotear();