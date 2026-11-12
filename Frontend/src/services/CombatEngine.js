const DIRECT_API_BASE = import.meta.env?.VITE_API_BASE_URL || "http://127.0.0.1:5208";

export const COMBAT_TYPES = {
  RANDOM: "Emboscada",
  ARENA: "Arena",
  BOSS: "Boss",
};

export const RANDOM_ENCOUNTER_CONFIG = {
  chancePerKm: 0.25,
  maxProbability: 0.5,
  minDistanceKm: 0.03,
};

export function calcularOrdemIniciativa(personagem, inimigosRonda = []) {
  const participantes = [];

  if (personagem) {
    participantes.push({
      tipo: "jogador",
      id: "jogador",
      nome: personagem.nome || "Jogador",
      velocidade: Number(personagem.velocidade ?? 0),
      ordemOriginal: 0,
      inimigoRef: null,
    });
  }

  (Array.isArray(inimigosRonda) ? inimigosRonda : []).forEach((ini, idx) => {
    if (!ini || (typeof ini.vidaAtual === "number" && ini.vidaAtual <= 0)) {
      return;
    }
    participantes.push({
      tipo: "inimigo",
      id: String(ini.idInstancia || `ini_${idx}`),
      nome: ini.nome || `Inimigo #${idx + 1}`,
      velocidade: Number(ini.velocidade ?? 0),
      ordemOriginal: idx + 1,
      inimigoRef: ini,
    });
  });

  participantes.sort((a, b) => {
    if (b.velocidade !== a.velocidade) {
      return b.velocidade - a.velocidade;
    }
    if (a.tipo !== b.tipo) {
      return a.tipo === "jogador" ? -1 : 1;
    }
    if (a.ordemOriginal !== b.ordemOriginal) {
      return a.ordemOriginal - b.ordemOriginal;
    }
    return a.id.localeCompare(b.id);
  });

  return participantes;
}

export function calculateRandomEncounterProbability(
  distanceKm,
  config = RANDOM_ENCOUNTER_CONFIG,
) {
  const safeDist = Math.max(0, Number(distanceKm) || 0);
  if (safeDist < config.minDistanceKm) {
    return 0;
  }
  const rawChance = safeDist * config.chancePerKm;
  return Number(Math.min(config.maxProbability, Math.max(0, rawChance)).toFixed(4));
}

export function planRouteRandomEncounter(
  distanceKm,
  totalSteps,
  randomFn = Math.random,
) {
  const probability = calculateRandomEncounterProbability(distanceKm);
  if (probability <= 0 || totalSteps < 4) {
    return {
      willTrigger: false,
      probability,
      triggerStep: null,
      distanceKm: Number((Number(distanceKm) || 0).toFixed(3)),
    };
  }

  const roll = randomFn();
  const willTrigger = roll < probability;

  if (!willTrigger) {
    return {
      willTrigger: false,
      probability,
      roll: Number(roll.toFixed(4)),
      triggerStep: null,
      distanceKm: Number((Number(distanceKm) || 0).toFixed(3)),
    };
  }

  const minStep = Math.max(1, Math.floor(totalSteps * 0.3));
  const maxStep = Math.max(minStep + 1, Math.floor(totalSteps * 0.75));
  const triggerStep =
    minStep + Math.floor(randomFn() * (maxStep - minStep + 1));

  return {
    willTrigger: true,
    probability,
    roll: Number(roll.toFixed(4)),
    triggerStep: Math.min(totalSteps - 1, triggerStep),
    distanceKm: Number((Number(distanceKm) || 0).toFixed(3)),
  };
}

function buildFallbackCombatSession({
  tipoCombate = COMBAT_TYPES.RANDOM,
  nomeLocal = "Local Desconhecido",
  placeId = null,
}) {
  const basePool = [
    { nome: "Saqueador de Beco", vida: 32, ataque: 8, defesa: 2, velocidade: 11, tipo: "Bandido" },
    { nome: "Drone Vigia Rebelde", vida: 26, ataque: 10, defesa: 1, velocidade: 15, tipo: "Autómato" },
    { nome: "Cão de Guarda Mutante", vida: 38, ataque: 9, defesa: 3, velocidade: 13, tipo: "Fera" },
    { nome: "Mercenário da Sombra", vida: 45, ataque: 11, defesa: 4, velocidade: 10, tipo: "Mercenário" },
  ];

  const pickRandomEnemy = (suffix = "") => {
    const template = basePool[Math.floor(Math.random() * basePool.length)];
    return {
      idInstancia: `${Math.random().toString(36).slice(2, 10)}`,
      nome: `${template.nome}${suffix}`,
      vidaMaxima: template.vida,
      vidaAtual: template.vida,
      ataque: template.ataque,
      defesa: template.defesa,
      velocidade: template.velocidade,
      isBoss: false,
      tipo: template.tipo,
    };
  };

  if (tipoCombate === COMBAT_TYPES.RANDOM) {
    const qtd = Math.random() < 0.5 ? 1 : 2;
    const ronda = [];
    for (let i = 0; i < qtd; i++) {
      ronda.push(pickRandomEnemy(qtd > 1 ? ` #${i + 1}` : ""));
    }
    return {
      tipoCombate,
      nomeLocal,
      placeId,
      permiteFuga: true,
      rondas: [ronda],
    };
  }

  if (tipoCombate === COMBAT_TYPES.ARENA) {
    const rondas = [];
    for (let r = 1; r <= 3; r++) {
      const qtd = r === 1 ? 1 : 2;
      const inimigosRonda = [];
      for (let i = 0; i < qtd; i++) {
        const baseIni = pickRandomEnemy(` (Ronda ${r})`);
        inimigosRonda.push({
          ...baseIni,
          vidaMaxima: baseIni.vidaMaxima + r * 5,
          vidaAtual: baseIni.vidaAtual + r * 5,
          ataque: baseIni.ataque + r,
        });
      }
      rondas.push(inimigosRonda);
    }
    return {
      tipoCombate,
      nomeLocal,
      placeId,
      permiteFuga: false,
      rondas,
    };
  }

  const capanga = pickRandomEnemy(" (Guarda)");
  const boss = {
    idInstancia: `${Math.random().toString(36).slice(2, 10)}`,
    nome: `Titã de ${nomeLocal}`,
    vidaMaxima: 130,
    vidaAtual: 130,
    ataque: 16,
    defesa: 6,
    velocidade: 9,
    isBoss: true,
    tipo: "Boss Urbano",
  };

  return {
    tipoCombate: COMBAT_TYPES.BOSS,
    nomeLocal,
    placeId,
    permiteFuga: false,
    rondas: [[capanga, boss]],
  };
}

export async function iniciarSessaoCombate({
  jogadorId = 1,
  tipoCombate = COMBAT_TYPES.RANDOM,
  nomeLocal = "Local Desconhecido",
  placeId = null,
  cidadeId = null,
}) {
  const payload = {
    jogadorId,
    tipoCombate,
    nomeLocal,
    placeId,
    cidadeId,
  };

  const candidateUrls = import.meta.env?.VITE_API_BASE_URL
    ? [`${import.meta.env.VITE_API_BASE_URL}/api/combate/iniciar`, "/api/combate/iniciar"]
    : [
        "/api/combate/iniciar",
        `${DIRECT_API_BASE}/api/combate/iniciar`,
        "http://localhost:5208/api/combate/iniciar",
      ];

  for (const url of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.rondas) && data.rondas.length > 0) {
          return { ...data, placeId: data.placeId || placeId };
        }
      }
    } catch { void 0; }
  }

  return buildFallbackCombatSession({ tipoCombate, nomeLocal, placeId });
}
