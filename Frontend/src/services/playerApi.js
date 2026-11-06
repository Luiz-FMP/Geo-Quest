import { isAllowedTransportationSubcategory } from "../utils/placeCategories.js";

const DIRECT_API_BASE = import.meta.env?.VITE_API_BASE_URL || "http://127.0.0.1:5208";
const LOCAL_STORAGE_KEY = "geoquest_player_state_v1";
const DEBUG_COORDS_STORAGE_KEY = "geoquest_debug_coords_v1";

export function getDebugCoordinatesConfig() {
  try {
    const raw = localStorage.getItem(DEBUG_COORDS_STORAGE_KEY);
    if (!raw) {
      return { enabled: false, latitude: "", longitude: "" };
    }
    const parsed = JSON.parse(raw);
    return {
      enabled: Boolean(parsed?.enabled),
      latitude:
        parsed?.latitude !== undefined && parsed?.latitude !== null && parsed?.latitude !== ""
          ? Number(parsed.latitude)
          : "",
      longitude:
        parsed?.longitude !== undefined && parsed?.longitude !== null && parsed?.longitude !== ""
          ? Number(parsed.longitude)
          : "",
    };
  } catch {
    return { enabled: false, latitude: "", longitude: "" };
  }
}

export function validateDebugCoordinates(latitude, longitude) {
  const latStr = String(latitude ?? "").trim();
  const lngStr = String(longitude ?? "").trim();
  if (!latStr || !lngStr) {
    return {
      valid: false,
      error: "Informe valores numéricos para latitude e longitude.",
    };
  }

  const latNum = Number(latStr);
  const lngNum = Number(lngStr);

  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return {
      valid: false,
      error: "Latitude e longitude devem ser números válidos.",
    };
  }

  if (latNum < -90 || latNum > 90) {
    return {
      valid: false,
      error: "Latitude inválida: informe um valor entre -90 e 90.",
    };
  }

  if (lngNum < -180 || lngNum > 180) {
    return {
      valid: false,
      error: "Longitude inválida: informe um valor entre -180 e 180.",
    };
  }

  return {
    valid: true,
    latitude: Number(latNum.toFixed(6)),
    longitude: Number(lngNum.toFixed(6)),
  };
}

export function saveDebugCoordinatesConfig({ enabled, latitude, longitude }) {
  const isEnabled = Boolean(enabled);
  const hasAnyCoordInput =
    String(latitude ?? "").trim() !== "" || String(longitude ?? "").trim() !== "";

  if (isEnabled || hasAnyCoordInput) {
    const validation = validateDebugCoordinates(latitude, longitude);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    const config = {
      enabled: isEnabled,
      latitude: validation.latitude,
      longitude: validation.longitude,
    };
    try {
      localStorage.setItem(DEBUG_COORDS_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignora falha de escrita em storage restrito
    }
    return config;
  }

  const disabledConfig = { enabled: false, latitude: "", longitude: "" };
  try {
    localStorage.setItem(DEBUG_COORDS_STORAGE_KEY, JSON.stringify(disabledConfig));
  } catch {
    // Ignora falha de escrita em storage restrito
  }
  return disabledConfig;
}

const DEFAULT_CHARACTERS = [
  {
    id: 1,
    nome: "Miguel",
    descricao: "Forte e resistente, aguenta vários combates.",
    vantagem: "Resistência a dano",
    disponivel: true,
    placeholderKey: "char_1",
  },
  {
    id: 2,
    nome: "Amélia",
    descricao: "Frágil, mas causa muito dano.",
    vantagem: "Ataques únicos que causam muito dano",
    disponivel: true,
    placeholderKey: "char_2",
  },
  {
    id: 3,
    nome: "Benjamin",
    descricao: "Resistente e ágil, consegue disparar vários golpes.",
    vantagem: "Múltiplos ataques",
    disponivel: true,
    placeholderKey: "char_3",
  },
  {
    id: 4,
    nome: "Z",
    descricao: "Controle de área, explosões em área.",
    vantagem: "Dano em área",
    disponivel: true,
    placeholderKey: "char_4",
  },
];

const DEFAULT_ENEMIES = [
  {
    id: 1,
    nome: "Batedor Urbano",
    descricao: "Oponente encontrado durante o deslocamento pelas rotas da cidade.",
    vida: 30,
    ataque: 6,
    defesa: 1,
  },
  {
    id: 2,
    nome: "Desafiante da Arena",
    descricao: "Combatente preparado para disputas em locais de entretenimento e recreação.",
    vida: 40,
    ataque: 8,
    defesa: 2,
  },
  {
    id: 3,
    nome: "Vigia das Ruas",
    descricao: "Inimigo ágil que patrulha trajetos movimentados.",
    vida: 35,
    ataque: 7,
    defesa: 1,
  },
];

const DEFAULT_BOSSES = [
  {
    id: 1,
    nome: "Guardião do Shopping",
    vida: 60,
    ataque: 9,
    defesa: 2,
    cidadeId: 1,
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

const TRACKED_HISTORY_CATEGORIES = new Set([
  "Health and Wellness",
  "Lodging",
  "Entertainment and Recreation",
  "Shopping",
]);

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
  const moedas = Math.max(0, Number(state.moedas ?? state.atributos?.moedas ?? 0) || 0);

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

  const rawVidaAtual =
    state.atributos?.vidaAtual !== undefined && state.atributos?.vidaAtual !== null
      ? Number(state.atributos.vidaAtual)
      : vidaFinal;
  const vidaAtual = Math.min(vidaFinal, Math.max(0, Math.round(rawVidaAtual)));

  const rawEnergiaAtual =
    state.atributos?.energiaAtual !== undefined && state.atributos?.energiaAtual !== null
      ? Number(state.atributos.energiaAtual)
      : energiaMaximaFinal;
  const energiaAtual = Math.min(
    energiaMaximaFinal,
    Math.max(0, Number(rawEnergiaAtual.toFixed(2))),
  );

  return {
    ...state,
    moedas,
    home: state.home || null,
    checkpointVida: state.checkpointVida || null,
    checkpointEnergia: state.checkpointEnergia || null,
    estadosPlaces: Array.isArray(state.estadosPlaces) ? state.estadosPlaces : [],
    historicoVisitas: Array.isArray(state.historicoVisitas) ? state.historicoVisitas : [],
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
      moedas,
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
    moedas: 0,
    personagemAtual: DEFAULT_CHARACTERS[0],
    atributos: {
      vidaBase: 50,
      vidaAtual: 50,
      energiaBase: 100,
      energiaAtual: 100,
      danoBase: 10,
      defesaBase: 0,
      velocidadeBase: 0,
      moedas: 0,
    },
    mochila: [createDebugItemInstance(1, 0)],
    equipamentos: DEFAULT_EQUIP_SLOTS,
    buffs: [],
    home: null,
    checkpointVida: null,
    checkpointEnergia: null,
    estadosPlaces: [],
    historicoVisitas: [],
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

function upsertLocalPlaceVisitAndState(
  local,
  {
    placeId,
    nome,
    categoria,
    subcategoria,
    latitude = 0,
    longitude = 0,
    estadoInteracao = "Visitado",
    marcarConcluido = false,
    marcarCuraGratuita = false,
    salvarCheckpointDescanso = false,
    estoqueJson = undefined,
  },
) {
  if (!placeId || placeId === "home") return;

  if (!Array.isArray(local.estadosPlaces)) {
    local.estadosPlaces = [];
  }
  if (!Array.isArray(local.historicoVisitas)) {
    local.historicoVisitas = [];
  }

  const nowIso = new Date().toISOString();
  let estado = local.estadosPlaces.find((e) => e.placeId === placeId);
  if (!estado) {
    estado = {
      placeId,
      nome: nome || "Local",
      categoria: categoria || "",
      subcategoria: subcategoria || categoria || "",
      latitude,
      longitude,
      concluido: false,
      curaGratuitaUtilizada: false,
      lojaEsgotada: false,
      estadoInteracao: estadoInteracao || "Visitado",
      estoqueJson:
        estoqueJson !== undefined
          ? estoqueJson
          : categoria === "Shopping" && subcategoria !== "shopping_mall"
            ? '{"slots":10,"reabastecimento":false}'
            : null,
      ultimaAtualizacaoUtc: nowIso,
    };
    local.estadosPlaces.push(estado);
  } else {
    if (nome) estado.nome = nome;
    if (categoria) estado.categoria = categoria;
    if (subcategoria) estado.subcategoria = subcategoria;
    if (latitude || longitude) {
      estado.latitude = latitude;
      estado.longitude = longitude;
    }
    if (estadoInteracao) {
      estado.estadoInteracao = estadoInteracao;
    }
    if (estoqueJson !== undefined) {
      estado.estoqueJson = estoqueJson;
    }
    estado.ultimaAtualizacaoUtc = nowIso;
  }

  if (marcarConcluido) {
    estado.concluido = true;
  }
  if (marcarCuraGratuita) {
    estado.curaGratuitaUtilizada = true;
  }

  // Atualização independente de checkpoints:
  // - Health and Wellness: basta visitar o hospital para salvar o Checkpoint de Vida.
  // - Lodging: é necessário usar o local de descanso (Descansar) para salvar o Checkpoint de Energia.
  if (categoria === "Health and Wellness") {
    local.checkpointVida = {
      placeId,
      nome: estado.nome,
      categoria: "Health and Wellness",
      subcategoria: estado.subcategoria,
      latitude: estado.latitude,
      longitude: estado.longitude,
      dataVisitaUtc: nowIso,
    };
  } else if (salvarCheckpointDescanso && categoria === "Lodging") {
    local.checkpointEnergia = {
      placeId,
      nome: estado.nome,
      categoria: "Lodging",
      subcategoria: estado.subcategoria,
      latitude: estado.latitude,
      longitude: estado.longitude,
      dataVisitaUtc: nowIso,
    };
  }

  // Histórico limitado a 10 locais por categoria (Seção 5)
  if (!TRACKED_HISTORY_CATEGORIES.has(categoria)) {
    return;
  }

  const existingIdx = local.historicoVisitas.findIndex(
    (h) => h.placeId === placeId && h.categoria === categoria,
  );
  const record = {
    id: existingIdx >= 0 ? local.historicoVisitas[existingIdx].id : Date.now(),
    placeId,
    nome: estado.nome,
    categoria,
    subcategoria: estado.subcategoria,
    latitude: estado.latitude,
    longitude: estado.longitude,
    dataVisitaUtc: nowIso,
    estadoInteracao,
    concluido: estado.concluido,
    beneficioGratuitoResgatado: estado.curaGratuitaUtilizada,
  };

  if (existingIdx >= 0) {
    local.historicoVisitas.splice(existingIdx, 1);
  }
  local.historicoVisitas.unshift(record);

  const sameCat = local.historicoVisitas.filter((h) => h.categoria === categoria);
  if (sameCat.length > 10) {
    const toRemoveIds = new Set(sameCat.slice(10).map((h) => h.placeId));
    local.historicoVisitas = local.historicoVisitas.filter(
      (h) => h.categoria !== categoria || !toRemoveIds.has(h.placeId),
    );
  }
}

async function requestApi(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const candidateUrls = import.meta.env?.VITE_API_BASE_URL
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
      return saveLocalState(serverState);
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

export async function atualizarVidaJogador(
  vidaAtual,
  energiaAtual = null,
  moedas = null,
) {
  const safeVida = Math.max(0, Math.round(Number(vidaAtual) || 0));
  const payload = { vidaAtual: safeVida };
  if (energiaAtual !== null && energiaAtual !== undefined) {
    payload.energiaAtual = Math.max(0, Number(Number(energiaAtual).toFixed(2)) || 0);
  }
  if (moedas !== null && moedas !== undefined) {
    payload.moedas = Math.max(0, Math.round(Number(moedas) || 0));
  }

  try {
    const updated = await requestApi("/api/jogadores/atual/vida", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return saveLocalState(updated);
  } catch (err) {
    if (err?.isBusinessError) throw err;
    const local = getOrCreateLocalState();
    const maxVida = local.atributos?.vidaFinal ?? 50;
    local.atributos.vidaAtual = Math.min(maxVida, Math.max(0, safeVida));
    if (payload.energiaAtual !== undefined) {
      const maxEnergia = local.atributos?.energiaMaximaFinal ?? 100;
      local.atributos.energiaAtual = Math.min(maxEnergia, Math.max(0, payload.energiaAtual));
    }
    if (payload.moedas !== undefined) {
      local.moedas = payload.moedas;
      local.atributos.moedas = payload.moedas;
    }
    local.estatisticas.ultimaAtualizacaoUtc = new Date().toISOString();
    return saveLocalState(local);
  }
}

export async function definirHomeJogador(
  latitude,
  longitude,
  forcarAtualizacao = true,
) {
  try {
    const updated = await requestApi("/api/jogadores/atual/home", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude, forcarAtualizacao }),
    });
    return saveLocalState(updated);
  } catch (err) {
    if (err?.isBusinessError) throw err;
    const local = getOrCreateLocalState();
    if (!local.home || forcarAtualizacao) {
      local.home = {
        placeId: "home",
        nome: "Home",
        categoria: "Local especial",
        subcategoria: "home",
        latitude: Number(Number(latitude).toFixed(6)),
        longitude: Number(Number(longitude).toFixed(6)),
        dataVisitaUtc: new Date().toISOString(),
      };
      local.posicaoAtualLatitude = local.home.latitude;
      local.posicaoAtualLongitude = local.home.longitude;
    } else if (!local.posicaoAtualLatitude || !local.posicaoAtualLongitude) {
      local.posicaoAtualLatitude = local.home.latitude;
      local.posicaoAtualLongitude = local.home.longitude;
    }
    return saveLocalState(local);
  }
}

export async function registrarVisitaPlaceJogador({
  placeId,
  nome,
  categoria,
  subcategoria,
  latitude = 0,
  longitude = 0,
}) {
  try {
    const updated = await requestApi("/api/jogadores/atual/visitar-place", {
      method: "POST",
      body: JSON.stringify({
        placeId,
        nome,
        categoria,
        subcategoria,
        latitude,
        longitude,
      }),
    });
    return saveLocalState(updated);
  } catch (err) {
    if (err?.isBusinessError) throw err;
    const local = getOrCreateLocalState();
    local.posicaoAtualLatitude = latitude;
    local.posicaoAtualLongitude = longitude;
    upsertLocalPlaceVisitAndState(local, {
      placeId,
      nome,
      categoria,
      subcategoria,
      latitude,
      longitude,
      estadoInteracao: "Visitado",
    });
    return saveLocalState(local);
  }
}

export async function curarEmHospitalJogador({
  placeId,
  nome,
  subcategoria = "hospital",
  latitude = 0,
  longitude = 0,
  tipoCura = "gratuita",
}) {
  try {
    const updated = await requestApi("/api/jogadores/atual/hospital/curar", {
      method: "POST",
      body: JSON.stringify({
        placeId,
        nome,
        subcategoria,
        latitude,
        longitude,
        tipoCura,
      }),
    });
    return saveLocalState(updated);
  } catch (err) {
    if (err?.isBusinessError) throw err;
    const local = getOrCreateLocalState();
    const maxVida = local.atributos?.vidaFinal ?? 50;
    const isGeneralHospital =
      String(subcategoria || "").toLowerCase() === "general_hospital";
    const isPaga = String(tipoCura || "").toLowerCase() === "paga";

    const estadoExistente = (local.estadosPlaces || []).find(
      (e) => e.placeId === placeId,
    );

    if (!isPaga) {
      if (estadoExistente?.curaGratuitaUtilizada) {
        throw new Error("Benefício gratuito já resgatado neste local.", {
          cause: err,
        });
      }
      const pct = isGeneralHospital ? 0.5 : 0.25;
      const healAmount = Math.max(1, Math.round(maxVida * pct));
      local.atributos.vidaAtual = Math.min(
        maxVida,
        (local.atributos.vidaAtual ?? 0) + healAmount,
      );
      upsertLocalPlaceVisitAndState(local, {
        placeId,
        nome,
        categoria: "Health and Wellness",
        subcategoria,
        latitude,
        longitude,
        estadoInteracao: "Cura Gratuita Resgatada",
        marcarCuraGratuita: true,
      });
    } else {
      const moedasAtuais = local.moedas ?? local.atributos?.moedas ?? 0;
      if (moedasAtuais < 50) {
        throw new Error(
          "Você não possui saldo suficiente. São necessárias 50 moedas.",
          { cause: err },
        );
      }
      local.moedas = moedasAtuais - 50;
      local.atributos.moedas = local.moedas;

      if (isGeneralHospital) {
        local.atributos.vidaAtual = maxVida;
      } else {
        const healAmount = Math.max(1, Math.round(maxVida * 0.5));
        local.atributos.vidaAtual = Math.min(
          maxVida,
          (local.atributos.vidaAtual ?? 0) + healAmount,
        );
      }

      upsertLocalPlaceVisitAndState(local, {
        placeId,
        nome,
        categoria: "Health and Wellness",
        subcategoria,
        latitude,
        longitude,
        estadoInteracao: "Cura Paga Realizada",
      });
    }

    local.estatisticas.ultimaAtualizacaoUtc = new Date().toISOString();
    return saveLocalState(local);
  }
}

export async function descansarEmHospedagemJogador({
  placeId,
  nome,
  subcategoria = "hotel",
  latitude = 0,
  longitude = 0,
}) {
  try {
    const updated = await requestApi("/api/jogadores/atual/lodging/descansar", {
      method: "POST",
      body: JSON.stringify({
        placeId,
        nome,
        subcategoria,
        latitude,
        longitude,
      }),
    });
    return saveLocalState(updated);
  } catch (err) {
    if (err?.isBusinessError) throw err;
    const local = getOrCreateLocalState();
    const moedasAtuais = local.moedas ?? local.atributos?.moedas ?? 0;
    if (moedasAtuais < 25) {
      throw new Error(
        "Você não possui saldo suficiente. São necessárias 25 moedas.",
        { cause: err },
      );
    }

    local.moedas = moedasAtuais - 25;
    local.atributos.moedas = local.moedas;
    local.atributos.energiaAtual = local.atributos?.energiaMaximaFinal ?? 100;

    upsertLocalPlaceVisitAndState(local, {
      placeId,
      nome,
      categoria: "Lodging",
      subcategoria,
      latitude,
      longitude,
      estadoInteracao: "Descanso Realizado",
      salvarCheckpointDescanso: true,
    });

    local.estatisticas.ultimaAtualizacaoUtc = new Date().toISOString();
    return saveLocalState(local);
  }
}

export async function descansarEmHomeJogador(latitude = null, longitude = null) {
  try {
    const updated = await requestApi("/api/jogadores/atual/home/descansar", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    });
    return saveLocalState(updated);
  } catch (err) {
    if (err?.isBusinessError) throw err;
    const local = getOrCreateLocalState();
    const maxVida = local.atributos?.vidaFinal ?? 50;
    const vidaMinimaDescanso = Math.round(maxVida * 0.5);
    local.atributos.vidaAtual = Math.min(
      maxVida,
      Math.max(local.atributos.vidaAtual ?? 0, vidaMinimaDescanso),
    );
    if (local.home) {
      local.posicaoAtualLatitude = local.home.latitude;
      local.posicaoAtualLongitude = local.home.longitude;
    }
    local.estatisticas.ultimaAtualizacaoUtc = new Date().toISOString();
    return saveLocalState(local);
  }
}

export async function concluirCombateLocalJogador({
  placeId = null,
  nome = null,
  categoria = null,
  subcategoria = null,
  latitude = 0,
  longitude = 0,
  vitoria = false,
  hpRestante = null,
  vidaRestante = null,
  energiaRestante = null,
  moedasGanhas = 0,
}) {
  const resolvedHpRestante =
    hpRestante !== null && hpRestante !== undefined ? hpRestante : vidaRestante;
  const resolvedMoedasGanhas = Math.max(0, Math.round(Number(moedasGanhas) || 0));

  try {
    const updated = await requestApi("/api/jogadores/atual/combate/concluir-local", {
      method: "POST",
      body: JSON.stringify({
        placeId,
        nome,
        categoria,
        subcategoria,
        latitude,
        longitude,
        vitoria,
        hpRestante: resolvedHpRestante,
        energiaRestante,
        moedasGanhas: resolvedMoedasGanhas,
      }),
    });
    return saveLocalState(updated);
  } catch (err) {
    if (err?.isBusinessError) throw err;
    const local = getOrCreateLocalState();
    const maxVida = local.atributos?.vidaFinal ?? 50;
    const maxEnergia = local.atributos?.energiaMaximaFinal ?? 100;

    if (resolvedHpRestante !== null && resolvedHpRestante !== undefined) {
      local.atributos.vidaAtual = Math.min(
        maxVida,
        Math.max(0, Math.round(Number(resolvedHpRestante))),
      );
    }
    if (energiaRestante !== null && energiaRestante !== undefined) {
      local.atributos.energiaAtual = Math.min(
        maxEnergia,
        Math.max(0, Number(Number(energiaRestante).toFixed(2))),
      );
    }
    if (vitoria && resolvedMoedasGanhas > 0) {
      local.moedas = Math.max(0, (local.moedas ?? 0) + resolvedMoedasGanhas);
      local.atributos.moedas = local.moedas;
    }

    if (placeId && categoria) {
      upsertLocalPlaceVisitAndState(local, {
        placeId,
        nome: nome || "Local de Combate",
        categoria,
        subcategoria: subcategoria || categoria,
        latitude,
        longitude,
        estadoInteracao: vitoria ? "Concluído" : "Tentativa de Combate",
        marcarConcluido: Boolean(vitoria),
      });
    }

    local.estatisticas.ultimaAtualizacaoUtc = new Date().toISOString();
    return saveLocalState(local);
  }
}

export async function retornarParaCheckpointJogador(motivo, destino) {
  try {
    const response = await requestApi("/api/jogadores/atual/retorno-checkpoint", {
      method: "POST",
      body: JSON.stringify({ motivo, destino }),
    });
    if (response?.jogador) {
      saveLocalState(response.jogador);
    }
    return response;
  } catch (err) {
    if (err?.isBusinessError) throw err;
    const local = getOrCreateLocalState();
    const maxVida = local.atributos?.vidaFinal ?? 50;
    const maxEnergia = local.atributos?.energiaMaximaFinal ?? 100;
    const isEsgotamento = String(motivo).toLowerCase() === "esgotamento";
    const usarCheckpoint = String(destino).toLowerCase() === "checkpoint";

    let target = {
      placeId: "home",
      nome: "Home",
      categoria: "Local especial",
      subcategoria: "home",
      latitude: local.home?.latitude ?? -25.4284,
      longitude: local.home?.longitude ?? -49.2733,
    };

    if (isEsgotamento) {
      if (usarCheckpoint && local.checkpointEnergia) {
        target = { ...local.checkpointEnergia };
      }
      const recVida = Math.max(1, Math.round(maxVida * 0.5));
      local.atributos.vidaAtual = Math.min(
        maxVida,
        Math.max(1, (local.atributos.vidaAtual ?? 0) + recVida),
      );
      local.atributos.energiaAtual = 0;
    } else {
      if (usarCheckpoint && local.checkpointVida) {
        target = { ...local.checkpointVida };
        // Ao voltar para o hospital: recupera 50% de vida para hospitais grandes (general_hospital)
        // e 25% de vida para os outros, mantendo a energia igual.
        const isGeneralHospital =
          String(target.subcategoria || "").toLowerCase() ===
          "general_hospital";
        const pct = isGeneralHospital ? 0.5 : 0.25;
        const recVida = Math.max(1, Math.round(maxVida * pct));
        local.atributos.vidaAtual = Math.min(maxVida, recVida);
        // Mantém local.atributos.energiaAtual igual
      } else {
        // Ao morrer e retornar para o Home: recupera 50% da Vida total e 100% de Energia (mesma coisa que descansar no Home)
        const recVida = Math.max(1, Math.round(maxVida * 0.5));
        local.atributos.vidaAtual = Math.min(maxVida, recVida);
        local.atributos.energiaAtual = maxEnergia;
      }
    }

    local.posicaoAtualLatitude = target.latitude;
    local.posicaoAtualLongitude = target.longitude;
    local.estatisticas.ultimaAtualizacaoUtc = new Date().toISOString();

    const saved = saveLocalState(local);
    return {
      placeId: target.placeId,
      destinoPlaceId: target.placeId,
      nomeDestino: target.nome,
      destinoNome: target.nome,
      destinoCategoria: target.categoria,
      destinoSubcategoria: target.subcategoria,
      latitude: target.latitude,
      longitude: target.longitude,
      jogador: saved,
    };
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
  place = null,
  chegouAoDestino = true,
) {
  const safeDistKm = Math.max(0, Number(distanciaKm) || 0);
  const placeId = typeof place === "object" ? place?.id || null : place;
  const nomeLocal = typeof place === "object" ? place?.name || null : null;
  const categoria = typeof place === "object" ? place?.category || null : null;
  const subcategoria =
    typeof place === "object" ? place?.subcategory || null : null;
  const destinoLatitude =
    typeof place === "object" && typeof place?.lat === "number"
      ? place.lat
      : null;
  const destinoLongitude =
    typeof place === "object" && typeof place?.lng === "number"
      ? place.lng
      : null;

  try {
    const response = await requestApi("/api/jogadores/atual/percurso", {
      method: "POST",
      body: JSON.stringify({
        distanciaKm: safeDistKm,
        placeId,
        nomeLocal,
        categoria,
        subcategoria,
        destinoLatitude,
        destinoLongitude,
        chegouAoDestino,
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
    if (chegouAoDestino) {
      local.estatisticas.placesVisitados =
        (local.estatisticas.placesVisitados || 0) + 1;
    }
    local.estatisticas.ultimaAtualizacaoUtc = new Date().toISOString();

    if (chegouAoDestino && placeId && categoria) {
      upsertLocalPlaceVisitAndState(local, {
        placeId,
        nome: nomeLocal || "Local",
        categoria,
        subcategoria: subcategoria || categoria,
        latitude: destinoLatitude || 0,
        longitude: destinoLongitude || 0,
        estadoInteracao: "Visitado",
      });
    }

    const saved = saveLocalState(local);
    return {
      distanciaKm: Number(safeDistKm.toFixed(3)),
      energiaConsumida,
      esgotado: saved.atributos.energiaAtual <= 0,
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

export async function fetchInimigosDisponiveis() {
  try {
    const list = await requestApi("/api/inimigos", { method: "GET" });
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
  } catch {
    // Fallback local
  }
  return DEFAULT_ENEMIES;
}

export async function fetchBossesDisponiveis() {
  try {
    const list = await requestApi("/api/bosses", { method: "GET" });
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
  } catch {
    // Fallback local
  }
  return DEFAULT_BOSSES;
}


const localProcessedExplorations = new Map();
const localProcessedSportsInteractions = new Set();

function selectNaturalExplorationRewardCategory(roll) {
  if (roll < 0.5) return "item";
  if (roll < 0.75) return "moedas";
  return "nada";
}

export function calcularCustoViagemTransporte(distanciaKm) {
  const dist = Number(distanciaKm);
  if (!Number.isFinite(dist) || dist <= 0) return 0;
  // Seção 5.5: distancia_km * 10 convertido em moedas (g), sem modificador de velocidade.
  // Arredondamento: Math.round (meio para cima) com mínimo de 1g para viagens com distância > 0.
  return Math.max(1, Math.round(dist * 10));
}

export async function vasculharNaturalFeatureJogador({
  placeId,
  nome,
  subcategoria = "woods",
  latitude = 0,
  longitude = 0,
  interacaoId = null,
}) {
  const dedupKey =
    placeId && interacaoId ? `${placeId}:${interacaoId}` : null;
  if (dedupKey && localProcessedExplorations.has(dedupKey)) {
    return localProcessedExplorations.get(dedupKey);
  }

  try {
    const response = await requestApi(
      "/api/jogadores/atual/natural-features/vasculhar",
      {
        method: "POST",
        body: JSON.stringify({
          placeId,
          nome,
          subcategoria,
          latitude,
          longitude,
          interacaoId,
        }),
      },
    );
    if (response && !response.resultado && response.tipoResultado) {
      response.resultado = response.tipoResultado;
    }
    if (response?.jogador) {
      response.jogador = saveLocalState(response.jogador);
    }
    if (dedupKey && response) {
      localProcessedExplorations.set(dedupKey, response);
    }
    return response;
  } catch (err) {
    if (err?.isBusinessError) throw err;

    const local = getOrCreateLocalState();
    const tipoResultado = selectNaturalExplorationRewardCategory(Math.random());
    let mensagem =
      "Você procura cuidadosamente pela região, mas não encontra nada de interessante.";
    let moedasGanhas = 0;
    let itemEncontrado = null;

    if (tipoResultado === "item") {
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
      const nextId =
        local.mochila.reduce(
          (max, i) => Math.max(max, i.inventarioId || 0),
          0,
        ) + 1;
      const debugItem = createDebugItemInstance(nextId, freeSlot ?? 0);
      if (freeSlot !== null) {
        local.mochila.push(debugItem);
        local.estatisticas.itensObtidos =
          (local.estatisticas.itensObtidos || 0) + 1;
      }
      itemEncontrado = debugItem;
      mensagem =
        "Você investiga cuidadosamente os arredores e encontra um objeto curioso escondido na natureza!";
    } else if (tipoResultado === "moedas") {
      moedasGanhas = 10;
      local.moedas = Math.max(0, (local.moedas ?? 0) + 10);
      local.atributos.moedas = local.moedas;
      mensagem =
        "Você vê algo brilhando entre as pedras. Ao investigar, encontra 10g!";
    }

    if (latitude || longitude) {
      local.posicaoAtualLatitude = latitude;
      local.posicaoAtualLongitude = longitude;
    }

    upsertLocalPlaceVisitAndState(local, {
      placeId,
      nome: nome || "Local Natural",
      categoria: "Natural Features",
      subcategoria,
      latitude,
      longitude,
      estadoInteracao: `Vasculhado (${tipoResultado})`,
    });

    local.estatisticas.ultimaAtualizacaoUtc = new Date().toISOString();
    const saved = saveLocalState(local);
    const fallbackResponse = {
      tipoResultado,
      resultado: tipoResultado,
      mensagem,
      moedasGanhas,
      itemEncontrado,
      jogador: saved,
    };
    if (dedupKey) {
      localProcessedExplorations.set(dedupKey, fallbackResponse);
    }
    return fallbackResponse;
  }
}

export async function buscarDestinosTransporte({
  lat,
  lng,
  type,
  excludePlaceId = null,
}) {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    type: String(type || "").trim().toLowerCase(),
  });
  if (excludePlaceId) {
    params.set("excludePlaceId", String(excludePlaceId));
  }
  return await requestApi(
    `/api/places/transport-destinations?${params.toString()}`,
    { method: "GET" },
  );
}

export async function viajarTransporteJogador({
  origemPlaceId = null,
  origemNome = null,
  origemSubcategoria = null,
  destinoPlaceId,
  destinoNome,
  subcategoria = null,
  destinoSubcategoria = null,
  origemLatitude = 0,
  origemLongitude = 0,
  destinoLatitude = 0,
  destinoLongitude = 0,
  distanciaKm = null,
}) {
  const rawOriginSub = String(origemSubcategoria || subcategoria || destinoSubcategoria || "")
    .trim()
    .toLowerCase();
  const rawDestSub = String(destinoSubcategoria || subcategoria || origemSubcategoria || "")
    .trim()
    .toLowerCase();
  const normalizedSub = rawDestSub || rawOriginSub;

  try {
    const response = await requestApi(
      "/api/jogadores/atual/transporte/viajar",
      {
        method: "POST",
        body: JSON.stringify({
          origemPlaceId,
          origemNome,
          origemSubcategoria: rawOriginSub || normalizedSub,
          destinoPlaceId,
          destinoNome,
          subcategoria: normalizedSub,
          destinoSubcategoria: rawDestSub || normalizedSub,
          origemLatitude,
          origemLongitude,
          destinoLatitude,
          destinoLongitude,
          distanciaKm,
        }),
      },
    );
    if (response?.jogador) {
      response.jogador = saveLocalState(response.jogador);
    }
    return response;
  } catch (err) {
    if (err?.isBusinessError) throw err;

    const local = getOrCreateLocalState();
    if (!isAllowedTransportationSubcategory(normalizedSub)) {
      throw new Error(
        "Subcategoria de transporte inválida ou não suportada pelas 24 subcategorias oficiais.",
        { cause: err },
      );
    }

    if (rawOriginSub && rawDestSub && rawOriginSub !== rawDestSub) {
      throw new Error(
        `O destino selecionado (${rawDestSub}) não pertence à mesma subcategoria do local de origem (${rawOriginSub}).`,
        { cause: err },
      );
    }

    const safeDistKm = Math.max(0.05, Number(Number(distanciaKm || 0).toFixed(3)));
    const custoMoedas = calcularCustoViagemTransporte(safeDistKm);
    const saldoAtual = local.moedas ?? local.atributos?.moedas ?? 0;

    if (saldoAtual < custoMoedas) {
      throw new Error(
        `Você não possui moedas suficientes para esta viagem. Custo: ${custoMoedas}g (Saldo atual: ${saldoAtual}g).`,
        { cause: err },
      );
    }

    local.moedas = Math.max(0, saldoAtual - custoMoedas);
    local.atributos.moedas = local.moedas;
    local.posicaoAtualLatitude = Number(Number(destinoLatitude).toFixed(6));
    local.posicaoAtualLongitude = Number(Number(destinoLongitude).toFixed(6));

    local.estatisticas.distanciaPercorridaKm = Number(
      ((local.estatisticas.distanciaPercorridaKm || 0) + safeDistKm).toFixed(3),
    );
    local.estatisticas.placesVisitados =
      (local.estatisticas.placesVisitados || 0) + 1;
    local.estatisticas.ultimaAtualizacaoUtc = new Date().toISOString();

    upsertLocalPlaceVisitAndState(local, {
      placeId: destinoPlaceId,
      nome: destinoNome || "Terminal de Transporte",
      categoria: "Transportation",
      subcategoria: normalizedSub,
      latitude: destinoLatitude,
      longitude: destinoLongitude,
      estadoInteracao: `Viagem concluída (-${custoMoedas}g)`,
    });

    const saved = saveLocalState(local);
    return {
      destinoPlaceId,
      destinoNome,
      subcategoria: normalizedSub,
      latitude: local.posicaoAtualLatitude,
      longitude: local.posicaoAtualLongitude,
      distanciaKm: safeDistKm,
      custoMoedas,
      jogador: saved,
    };
  }
}

export async function treinarSportsJogador({
  placeId,
  nome,
  subcategoria = "gym",
  latitude = 0,
  longitude = 0,
  opcaoAtributo = null,
  opcao = null,
  interacaoId = null,
}) {
  const normalizedOption = String(opcaoAtributo || opcao || "")
    .trim()
    .toLowerCase();
  const dedupKey =
    placeId && interacaoId ? `${placeId}:${interacaoId}` : null;

  if (dedupKey && localProcessedSportsInteractions.has(dedupKey)) {
    throw new Error(
      "Você já escolheu uma melhoria de atributo nesta interação com o local.",
    );
  }

  try {
    const response = await requestApi("/api/jogadores/atual/sports/treinar", {
      method: "POST",
      body: JSON.stringify({
        placeId,
        nome,
        subcategoria,
        latitude,
        longitude,
        opcaoAtributo: normalizedOption,
        opcao: normalizedOption,
        interacaoId,
      }),
    });
    if (response?.jogador) {
      response.jogador = saveLocalState(response.jogador);
    }
    if (dedupKey) {
      localProcessedSportsInteractions.add(dedupKey);
    }
    return response;
  } catch (err) {
    if (err?.isBusinessError) throw err;

    const local = getOrCreateLocalState();
    const estadoExistente = (local.estadosPlaces || []).find(
      (e) => e.placeId === placeId,
    );
    if (estadoExistente?.concluido) {
      throw new Error(
        "Você já realizou o aprimoramento permanente disponível neste local esportivo.",
        { cause: err },
      );
    }

    let incrementoAplicado;
    let rotuloMelhoria;
    let mensagem;

    if (normalizedOption === "dano") {
      incrementoAplicado = 1;
      rotuloMelhoria = "+1 Dano";
      local.atributos.danoBase = (local.atributos?.danoBase ?? 10) + 1;
      mensagem = "Treino concluído: +1 de Dano permanente aplicado!";
    } else if (normalizedOption === "vida") {
      incrementoAplicado = 5;
      rotuloMelhoria = "+5 Vida máxima";
      local.atributos.vidaBase = (local.atributos?.vidaBase ?? 50) + 5;
      // Regra 7.2: Não recuperar 5 pontos de vida atuais.
      mensagem = "Treino concluído: +5 de Vida máxima permanente aplicado!";
    } else if (normalizedOption === "energia") {
      incrementoAplicado = 10;
      rotuloMelhoria = "+10 Energia máxima";
      local.atributos.energiaBase = Number(
        ((local.atributos?.energiaBase ?? 100) + 10).toFixed(2),
      );
      // Regra 7.2: Não recuperar 10 pontos de energia atuais.
      mensagem = "Treino concluído: +10 de Energia máxima permanente aplicado!";
    } else if (normalizedOption === "velocidade") {
      incrementoAplicado = 1;
      rotuloMelhoria = "+1 Velocidade";
      local.atributos.velocidadeBase =
        (local.atributos?.velocidadeBase ?? 0) + 1;
      mensagem = "Treino concluído: +1 de Velocidade permanente aplicado!";
    } else {
      throw new Error(
        "Opção de melhoria inválida. Escolha entre 'dano', 'vida', 'energia' ou 'velocidade'.",
        { cause: err },
      );
    }

    if (latitude || longitude) {
      local.posicaoAtualLatitude = latitude;
      local.posicaoAtualLongitude = longitude;
    }

    upsertLocalPlaceVisitAndState(local, {
      placeId,
      nome: nome || "Centro Esportivo",
      categoria: "Sports",
      subcategoria,
      latitude,
      longitude,
      estadoInteracao: `Treino concluído (${rotuloMelhoria})`,
      marcarConcluido: true,
      estoqueJson: JSON.stringify({
        melhoria: normalizedOption,
        incremento: incrementoAplicado,
        rotulo: rotuloMelhoria,
      }),
    });

    local.estatisticas.ultimaAtualizacaoUtc = new Date().toISOString();
    const saved = saveLocalState(local);
    if (dedupKey) {
      localProcessedSportsInteractions.add(dedupKey);
    }
    return {
      opcaoAtributo: normalizedOption,
      mensagem,
      incrementoAplicado,
      jogador: saved,
    };
  }
}
