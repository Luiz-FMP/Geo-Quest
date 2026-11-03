const DIRECT_API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5208";
const LOCAL_STORAGE_KEY = "geoquest_player_state_v1";

const DEFAULT_CHARACTERS = [
  {
    id: 1,
    nome: "Explorador #1",
    descricao: "Especialista em trilhas urbanas e reconhecimento de rotas.",
    vantagem: "Equilibrado",
    disponivel: true,
    placeholderKey: "char_1",
  },
  {
    id: 2,
    nome: "Cartógrafo #2",
    descricao: "Focado em mapeamento tático de pontos históricos e culturais.",
    vantagem: "Reconhecimento",
    disponivel: true,
    placeholderKey: "char_2",
  },
  {
    id: 3,
    nome: "Guardião #3",
    descricao: "Preparado para expedições longas e defesa de territórios.",
    vantagem: "Resistência",
    disponivel: true,
    placeholderKey: "char_3",
  },
];

const DEFAULT_EQUIP_SLOTS = [
  { slotKey: "Cabeca", rotulo: "Cabeça", posicaoLayout: "lado", itemEquipado: null },
  { slotKey: "Superior", rotulo: "Superior", posicaoLayout: "lado", itemEquipado: null },
  { slotKey: "Inferior", rotulo: "Inferior", posicaoLayout: "lado", itemEquipado: null },
  { slotKey: "Maos", rotulo: "Mãos", posicaoLayout: "lado", itemEquipado: null },
  { slotKey: "Botas", rotulo: "Botas", posicaoLayout: "lado", itemEquipado: null },
  { slotKey: "Acessorio", rotulo: "Acessório", posicaoLayout: "lado", itemEquipado: null },
  { slotKey: "Arma", rotulo: "Arma", posicaoLayout: "abaixo", itemEquipado: null },
];

function createDebugItemInstance(inventarioId = 1, slotIndice = 0) {
  return {
    inventarioId,
    itemDefinicaoId: 1,
    codigo: "debug_item_01",
    nome: "Item de Debug",
    descricao: "Item temporário de teste para validar movimentação nos slots e descarte na lixeira.",
    categoria: "Equipavel",
    raridade: "Raro",
    equipavel: false,
    slotEquipamentoCompativel: null,
    categoriaAba: "Equipavel",
    slotIndice,
    equipado: false,
    slotEquipado: null,
    quantidade: 1,
    bonusVida: 0,
    bonusEnergia: 0,
    bonusDano: 0,
    bonusDefesa: 0,
    bonusVelocidade: 0,
    placeholderKey: "item_debug",
  };
}

function recalculateState(state) {
  const vidaBase = state.atributos?.vidaBase ?? 50;
  const energiaBase = state.atributos?.energiaBase ?? 100;
  const danoBase = state.atributos?.danoBase ?? 10;
  const defesaBase = state.atributos?.defesaBase ?? 0;
  const velocidadeBase = state.atributos?.velocidadeBase ?? 0;

  const equippedItems = (state.equipamentos || [])
    .map((s) => s.itemEquipado)
    .filter(Boolean);
  const activeBuffs = (state.buffs || []).filter((b) => b.ativo);

  const vidaMod =
    equippedItems.reduce((acc, i) => acc + (i.bonusVida || 0), 0) +
    activeBuffs.reduce((acc, b) => acc + (b.bonusVida || 0), 0);
  const energiaMod =
    equippedItems.reduce((acc, i) => acc + (i.bonusEnergia || 0), 0) +
    activeBuffs.reduce((acc, b) => acc + (b.bonusEnergia || 0), 0);
  const danoMod =
    equippedItems.reduce((acc, i) => acc + (i.bonusDano || 0), 0) +
    activeBuffs.reduce((acc, b) => acc + (b.bonusDano || 0), 0);
  const defesaMod =
    equippedItems.reduce((acc, i) => acc + (i.bonusDefesa || 0), 0) +
    activeBuffs.reduce((acc, b) => acc + (b.bonusDefesa || 0), 0);
  const velocidadeMod =
    equippedItems.reduce((acc, i) => acc + (i.bonusVelocidade || 0), 0) +
    activeBuffs.reduce((acc, b) => acc + (b.bonusVelocidade || 0), 0);

  const vidaFinal = Math.max(1, vidaBase + vidaMod);
  const energiaMaximaFinal = Math.max(1, Number((energiaBase + energiaMod).toFixed(2)));
  const danoFinal = Math.max(0, danoBase + danoMod);
  const defesaFinal = Math.max(0, defesaBase + defesaMod);
  const velocidadeFinal = velocidadeBase + velocidadeMod;

  const nivelDePoder = Number(((vidaFinal * (danoFinal + defesaFinal)) / 50).toFixed(2));
  const consumoEnergiaPorKm = Number(
    (10 / Math.pow(2, velocidadeFinal / 100)).toFixed(4),
  );

  const vidaAtual = Math.min(
    vidaFinal,
    Math.max(0, state.atributos?.vidaAtual ?? vidaFinal),
  );
  const energiaAtual = Math.min(
    energiaMaximaFinal,
    Math.max(0, Number((state.atributos?.energiaAtual ?? energiaMaximaFinal).toFixed(2))),
  );

  return {
    ...state,
    atributos: {
      vidaBase,
      vidaModificador: vidaMod,
      vidaFinal,
      vidaAtual,
      energiaBase,
      energiaModificador: energiaMod,
      energiaMaximaFinal,
      energiaAtual,
      danoBase,
      danoModificador: danoMod,
      danoFinal,
      defesaBase,
      defesaModificador: defesaMod,
      defesaFinal,
      velocidadeBase,
      velocidadeModificador: velocidadeMod,
      velocidadeFinal,
      nivelDePoder,
      consumoEnergiaPorKm,
    },
  };
}

function getOrCreateLocalState() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.atributos) {
        return recalculateState(parsed);
      }
    }
  } catch {
    // Continua com criação padrão
  }

  const initial = recalculateState({
    id: 1,
    nome: "Explorador",
    personagemId: 1,
    personagemAtual: DEFAULT_CHARACTERS[0],
    atributos: {
      vidaBase: 50,
      vidaAtual: 50,
      energiaBase: 100,
      energiaAtual: 100,
      danoBase: 10,
      defesaBase: 0,
      velocidadeBase: 0,
    },
    mochila: [createDebugItemInstance(1, 0)],
    equipamentos: DEFAULT_EQUIP_SLOTS,
    buffs: [],
    estatisticas: {
      distanciaPercorridaKm: 0,
      placesVisitados: 0,
      missoesConcluidas: 0,
      itensObtidos: 1,
      itensDescartados: 0,
      personagemUtilizado: DEFAULT_CHARACTERS[0].nome,
      ultimaAtualizacaoUtc: new Date().toISOString(),
    },
    totalSlotsMochila: 50,
  });

  saveLocalState(initial);
  return initial;
}

function saveLocalState(state) {
  try {
    const recalculated = recalculateState(state);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(recalculated));
    return recalculated;
  } catch {
    return state;
  }
}

async function requestApi(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const candidateUrls = import.meta.env.VITE_API_BASE_URL
    ? [`${import.meta.env.VITE_API_BASE_URL}${path}`, path]
    : [path, `${DIRECT_API_BASE}${path}`, `http://localhost:5208${path}`];

  let lastError = null;

  for (const url of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      if (!response.ok) {
        // Caso o proxy do Vite retorne 502/503/504 ou 404 HTML, tenta o próximo candidato
        if (
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504 ||
          (response.status === 404 && !isJson)
        ) {
          lastError = new Error(`Servidor indisponível (${response.status})`);
          continue;
        }

        if (isJson) {
          const errorBody = await response.json().catch(() => null);
          const businessErr = new Error(
            errorBody?.mensagem ||
              errorBody?.message ||
              `Erro na requisição (${response.status})`,
          );
          businessErr.isBusinessError = true;
          throw businessErr;
        }

        lastError = new Error(`Erro na comunicação com o servidor (${response.status})`);
        continue;
      }

      if (isJson) {
        return await response.json();
      }
    } catch (err) {
      if (err?.isBusinessError) {
        throw err;
      }
      lastError = err;
    }
  }

  const unreachableError = lastError || new Error("Servidor backend indisponível.");
  unreachableError.isNetworkFallback = true;
  throw unreachableError;
}

export async function fetchJogadorAtual() {
  try {
    const serverState = await requestApi("/api/jogadores/atual", { method: "GET" });
    if (serverState) {
      saveLocalState(serverState);
      return serverState;
    }
  } catch {
    // Fallback local sincronizado
  }
  return getOrCreateLocalState();
}

export async function atualizarNomeJogador(nome) {
  const trimmed = (nome || "").trim();
  if (!trimmed) {
    throw new Error("O nome do usuário não pode ser vazio.");
  }

  try {
    const updated = await requestApi("/api/jogadores/atual/nome", {
      method: "PUT",
      body: JSON.stringify({ nome: trimmed }),
    });
    return saveLocalState(updated);
  } catch (err) {
    if (err?.isBusinessError) throw err;
    const local = getOrCreateLocalState();
    local.nome = trimmed;
    local.estatisticas.ultimaAtualizacaoUtc = new Date().toISOString();
    return saveLocalState(local);
  }
}

export async function alterarPersonagemJogador(personagemId) {
  try {
    const updated = await requestApi("/api/jogadores/atual/personagem", {
      method: "PUT",
      body: JSON.stringify({ personagemId }),
    });
    return saveLocalState(updated);
  } catch (err) {
    if (err?.isBusinessError) throw err;
    const local = getOrCreateLocalState();
    const char =
      DEFAULT_CHARACTERS.find((c) => c.id === Number(personagemId)) ||
      DEFAULT_CHARACTERS[0];
    local.personagemId = char.id;
    local.personagemAtual = char;
    local.estatisticas.personagemUtilizado = char.nome;
    local.estatisticas.ultimaAtualizacaoUtc = new Date().toISOString();
    return saveLocalState(local);
  }
}

export async function moverItemInventario(
  inventarioId,
  novoSlotIndice,
  abaDestino = null,
) {
  try {
    const updated = await requestApi("/api/jogadores/atual/inventario/mover", {
      method: "PUT",
      body: JSON.stringify({
        inventarioId,
        novoSlotIndice,
        abaDestino,
      }),
    });
    return saveLocalState(updated);
  } catch (err) {
    if (err?.isBusinessError) throw err;
    const local = getOrCreateLocalState();
    const item = local.mochila.find((i) => i.inventarioId === inventarioId);
    if (!item) {
      throw new Error("Item não encontrado no inventário.", { cause: err });
    }
    const targetTab = abaDestino || item.categoriaAba || item.categoria || "Equipavel";
    const previousSlot = item.slotIndice;
    const itemAtDest = local.mochila.find(
      (i) =>
        i.inventarioId !== inventarioId &&
        (i.categoriaAba || i.categoria) === targetTab &&
        i.slotIndice === novoSlotIndice,
    );
    if (itemAtDest) {
      itemAtDest.slotIndice = previousSlot;
    }
    item.slotIndice = novoSlotIndice;
    item.categoriaAba = targetTab;
    return saveLocalState(local);
  }
}

export async function removerItemInventario(inventarioId) {
  try {
    const updated = await requestApi(
      `/api/jogadores/atual/inventario/${inventarioId}`,
      {
        method: "DELETE",
      },
    );
    return saveLocalState(updated);
  } catch (err) {
    if (err?.isBusinessError) throw err;
    const local = getOrCreateLocalState();
    local.mochila = local.mochila.filter((i) => i.inventarioId !== inventarioId);
    local.estatisticas.itensDescartados =
      (local.estatisticas.itensDescartados || 0) + 1;
    local.estatisticas.ultimaAtualizacaoUtc = new Date().toISOString();
    return saveLocalState(local);
  }
}

export async function gerarItemDebugInventario() {
  try {
    const updated = await requestApi("/api/jogadores/atual/inventario/debug-item", {
      method: "POST",
    });
    return saveLocalState(updated);
  } catch (err) {
    if (err?.isBusinessError) throw err;
    const local = getOrCreateLocalState();
    const occupied = new Set(
      local.mochila
        .filter((i) => (i.categoriaAba || i.categoria) === "Equipavel")
        .map((i) => i.slotIndice),
    );
    let freeSlot = null;
    for (let s = 0; s < 50; s++) {
      if (!occupied.has(s)) {
        freeSlot = s;
        break;
      }
    }
    if (freeSlot === null) {
      throw new Error("A mochila está cheia (50/50 slots ocupados).", {
        cause: err,
      });
    }
    const nextId =
      local.mochila.reduce((max, i) => Math.max(max, i.inventarioId || 0), 0) + 1;
    local.mochila.push(createDebugItemInstance(nextId, freeSlot));
    local.estatisticas.itensObtidos = (local.estatisticas.itensObtidos || 0) + 1;
    local.estatisticas.ultimaAtualizacaoUtc = new Date().toISOString();
    return saveLocalState(local);
  }
}

export async function equiparItemJogador(inventarioId, slotEquipamento) {
  try {
    const updated = await requestApi("/api/jogadores/atual/equipamentos/equipar", {
      method: "POST",
      body: JSON.stringify({ inventarioId, slotEquipamento }),
    });
    return saveLocalState(updated);
  } catch (err) {
    if (err?.isBusinessError) throw err;
    const local = getOrCreateLocalState();
    const item = local.mochila.find((i) => i.inventarioId === inventarioId);
    if (!item || !item.equipavel) {
      throw new Error(
        `O item '${item?.nome || "Item de Debug"}' não é um equipamento vestível.`,
        { cause: err },
      );
    }
    return saveLocalState(local);
  }
}

export async function desequiparItemJogador(
  slotEquipamento,
  slotMochilaDestino = null,
) {
  try {
    const updated = await requestApi(
      "/api/jogadores/atual/equipamentos/desequipar",
      {
        method: "POST",
        body: JSON.stringify({ slotEquipamento, slotMochilaDestino }),
      },
    );
    return saveLocalState(updated);
  } catch (err) {
    if (err?.isBusinessError) throw err;
    return getOrCreateLocalState();
  }
}

export async function registrarPercursoJogador(
  distanciaKm,
  placeId = null,
  nomeLocal = null,
) {
  const safeDistKm = Math.max(0, Number(distanciaKm) || 0);

  try {
    const response = await requestApi("/api/jogadores/atual/percurso", {
      method: "POST",
      body: JSON.stringify({
        distanciaKm: safeDistKm,
        placeId,
        nomeLocal,
      }),
    });
    if (response?.jogador) {
      saveLocalState(response.jogador);
    }
    return response;
  } catch (err) {
    if (err?.isBusinessError) throw err;
    const local = getOrCreateLocalState();
    const velocidade = local.atributos?.velocidadeFinal ?? 0;
    const divisor = Math.pow(2, velocidade / 100) || 1;
    const energiaConsumida = Number((safeDistKm * (10 / divisor)).toFixed(2));

    local.atributos.energiaAtual = Math.max(
      0,
      Number(((local.atributos.energiaAtual ?? 100) - energiaConsumida).toFixed(2)),
    );
    local.estatisticas.distanciaPercorridaKm = Number(
      ((local.estatisticas.distanciaPercorridaKm || 0) + safeDistKm).toFixed(3),
    );
    local.estatisticas.placesVisitados =
      (local.estatisticas.placesVisitados || 0) + 1;
    local.estatisticas.ultimaAtualizacaoUtc = new Date().toISOString();

    const saved = saveLocalState(local);
    return {
      distanciaKm: Number(safeDistKm.toFixed(3)),
      energiaConsumida,
      jogador: saved,
    };
  }
}

export async function fetchPersonagensDisponiveis() {
  try {
    return await requestApi("/api/personagens", { method: "GET" });
  } catch {
    return DEFAULT_CHARACTERS;
  }
}
