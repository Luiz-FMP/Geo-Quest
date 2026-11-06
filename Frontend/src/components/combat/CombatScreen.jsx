import { useEffect, useMemo, useRef, useState } from "react";
import { calcularOrdemIniciativa } from "../../services/CombatEngine";
import CombatArena from "./CombatArena";
import CombatHUD from "./CombatHud";
import CombatRewardModal from "./CombatReward";

function obterInimigosMaisRapidosQueJogador(personagem, listaInimigos) {
  const ordem = calcularOrdemIniciativa(personagem, listaInimigos);
  const idxJogador = ordem.findIndex((p) => p.tipo === "jogador");
  if (idxJogador <= 0) return [];
  return ordem
    .slice(0, idxJogador)
    .filter((p) => p.tipo === "inimigo" && p.inimigoRef)
    .map((p) => p.inimigoRef);
}

function ordenarInimigosPorIniciativa(personagem, listaInimigos) {
  return calcularOrdemIniciativa(personagem, listaInimigos)
    .filter((p) => p.tipo === "inimigo" && p.inimigoRef)
    .map((p) => p.inimigoRef);
}

function formatarResumoIniciativa(ordem) {
  return ordem.map((p) => `${p.nome} (VEL ${p.velocidade})`).join(" → ");
}

export default function CombatScreen({
  personagem,
  buffs = [],
  onBuffExpired = null,
  sessaoCombate,
  onFinishCombat,
}) {
  const primeiraRonda = useMemo(
    () => sessaoCombate?.rondas?.[0] || [],
    [sessaoCombate],
  );
  const ordemInicial = useMemo(
    () => calcularOrdemIniciativa(personagem, primeiraRonda),
    [personagem, primeiraRonda],
  );
  const inimigosIniciaisMaisRapidos = useMemo(
    () => obterInimigosMaisRapidosQueJogador(personagem, primeiraRonda),
    [personagem, primeiraRonda],
  );

  const [rondaIndex, setRondaIndex] = useState(0);
  const [inimigos, setInimigos] = useState(primeiraRonda);
  const [alvoIndex, setAlvoIndex] = useState(0);

  const initialHp =
    typeof personagem.vidaAtual === "number" && personagem.vidaAtual > 0
      ? personagem.vidaAtual
      : personagem.vida || 50;
  const initialEnergia =
    typeof personagem.energiaAtual === "number" && personagem.energiaAtual >= 0
      ? personagem.energiaAtual
      : personagem.energia || 100;

  const [hpJogador, setHpJogador] = useState(initialHp);
  const [energiaJogador, setEnergiaJogador] = useState(initialEnergia);
  const [defendendo, setDefendendo] = useState(false);
  const [turnoBloqueado, setTurnoBloqueado] = useState(
    () => inimigosIniciaisMaisRapidos.length > 0,
  );

  const [animacaoJogador, setAnimacaoJogador] = useState(false);
  const [danoRecebidoAnim, setDanoRecebidoAnim] = useState(false);

  // Estados para as recompensas e histórico de inimigos derrotados
  const [inimigosDerrotadosHistorico, setInimigosDerrotadosHistorico] = useState([]);
  const [resultadoRecompensa, setResultadoRecompensa] = useState(null);

  const [logs, setLogs] = useState(() => [
    `⚡ Iniciativa (Ronda 1): ${formatarResumoIniciativa(ordemInicial)}`,
    `[${sessaoCombate.tipoCombate.toUpperCase()}] Combate iniciado em ${sessaoCombate.nomeLocal}!`,
  ]);

  const ordemIniciativaAtual = useMemo(
    () => calcularOrdemIniciativa(personagem, inimigos),
    [personagem, inimigos],
  );

  const adicionarLog = (msg) => setLogs((prev) => [msg, ...prev.slice(0, 5)]);

  const calcularDano = (atk, def) => {
    const base = Math.max(1, atk - Math.floor(def * 0.5));
    const variacao = 0.9 + Math.random() * 0.2;
    return Math.round(base * variacao);
  };

  // Função que calcula as moedas e define o item aleatório ao vencer
  const processarFimDeCombate = (vitoria) => {
    if (!vitoria) {
      setResultadoRecompensa({ vitoria: false });
      return;
    }

    let totalMoedas = 0;
    inimigosDerrotadosHistorico.forEach((ini) => {
      // Suporta tanto 'Tier' (maiúsculo do C#) quanto 'tier' (minúsculo)
      const tierInimigo = (ini.Tier || ini.tier || "Comum").toLowerCase();

      if (tierInimigo === "boss") {
        totalMoedas += Math.floor(Math.random() * 21) + 60; // 60 a 80 moedas
      } else if (tierInimigo === "miniboss" || tierInimigo === "elite") {
        totalMoedas += Math.floor(Math.random() * 11) + 20; // 20 a 30 moedas
      } else {
        const baseNormal = 5;
        const bonusArena = sessaoCombate.tipoCombate === "Arena" ? 3 : 0;
        totalMoedas += baseNormal + bonusArena;
      }
    });

    if (totalMoedas === 0) {
      totalMoedas = sessaoCombate.tipoCombate === "Boss" ? 70 : sessaoCombate.tipoCombate === "Arena" ? 25 : 10;
    }

    // Certeza de item se for Arena (3 rondas), senão 40% de chance
    const ganhaItemCerteza = sessaoCombate.tipoCombate === "Arena";
    const ganhouItem = ganhaItemCerteza || Math.random() <= 0.40;
    
    const itensPool = ["Poção Menor", "Cristal de Mana", "Fragmento Antigo", "Erva Medicinal"];
    const itemNome = ganhouItem ? itensPool[Math.floor(Math.random() * itensPool.length)] : null;

    setResultadoRecompensa({
      vitoria: true,
      moedasGanhas: totalMoedas,
      ganhouItem,
      itemNome,
      hpRestante: hpJogador,
      energiaRestante: energiaJogador,
    });
  };

  const executarTurnoInimigos = (inimigosParaAgir, escudoAtivo) => {
    setTimeout(() => {
      const inimigosOrdenados = ordenarInimigosPorIniciativa(
        personagem,
        inimigosParaAgir,
      );
      if (inimigosOrdenados.length === 0) {
        setTurnoBloqueado(false);
        return;
      }

      let danoTotalRecebido = 0;

      inimigosOrdenados.forEach((ini) => {
        let dano = calcularDano(ini.ataque, personagem.defesa);
        if (escudoAtivo) dano = Math.max(1, Math.floor(dano * 0.5));
        danoTotalRecebido += dano;
        adicionarLog(
          `🔻 ${ini.nome} (VEL ${ini.velocidade}) atacou causando ${dano} de dano!`,
        );
      });

      setDanoRecebidoAnim(true);
      setTimeout(() => setDanoRecebidoAnim(false), 300);

      setHpJogador((hpAtual) => {
        const novoHp = Math.max(0, hpAtual - danoTotalRecebido);
        if (novoHp === 0) {
          adicionarLog(`💀 ${personagem.nome} caiu em combate...`);
          setTimeout(() => processarFimDeCombate(false), 1200);
        }
        return novoHp;
      });

      setDefendendo(false);
      setTurnoBloqueado(false);
    }, 750);
  };

  // No início do combate (Ronda 1), se houver inimigos com maior Velocidade que o jogador, eles agem primeiro
  const aberturaRondaZeroExecutadaRef = useRef(false);
  useEffect(() => {
    if (aberturaRondaZeroExecutadaRef.current) return;
    aberturaRondaZeroExecutadaRef.current = true;
    if (inimigosIniciaisMaisRapidos.length > 0) {
      executarTurnoInimigos(inimigosIniciaisMaisRapidos, false);
    }
  });

  const verificarEstadoInimigos = (listaAtualizada, escudoAtivo = false) => {
    const vivos = listaAtualizada.filter((i) => i.vidaAtual > 0);
    const mortosNestaRodada = listaAtualizada.filter((i) => i.vidaAtual === 0);
    
    setInimigosDerrotadosHistorico((prev) => [...prev, ...mortosNestaRodada]);

    if (vivos.length === 0) {
      // 🛑 Trava o turno imediatamente para evitar dano atrasado do inimigo
      setTurnoBloqueado(true);

      const proximaRonda = rondaIndex + 1;
      if (proximaRonda < sessaoCombate.rondas.length) {
        adicionarLog(
          `⚡ Ronda ${rondaIndex + 1} concluída! Prepare-se para a Ronda ${proximaRonda + 1}!`
        );
        setTimeout(() => {
          const inimigosProxRonda = sessaoCombate.rondas[proximaRonda] || [];
          const novaOrdem = calcularOrdemIniciativa(personagem, inimigosProxRonda);
          const maisRapidosProxRonda = obterInimigosMaisRapidosQueJogador(
            personagem,
            inimigosProxRonda,
          );

          setRondaIndex(proximaRonda);
          setInimigos(inimigosProxRonda);
          setAlvoIndex(0);
          adicionarLog(
            `⚡ Iniciativa (Ronda ${proximaRonda + 1}): ${formatarResumoIniciativa(novaOrdem)}`,
          );

          if (maisRapidosProxRonda.length > 0) {
            setTurnoBloqueado(true);
            executarTurnoInimigos(maisRapidosProxRonda, false);
          } else {
            setTurnoBloqueado(false);
          }
        }, 1200);
      } else {
        adicionarLog(`🏆 Vitória! Todos os inimigos foram derrotados!`);
        setTimeout(() => processarFimDeCombate(true), 900);
      }
    } else {
      setInimigos(vivos);
      setAlvoIndex((prev) => (prev >= vivos.length ? 0 : prev));
      executarTurnoInimigos(vivos, escudoAtivo);
    }
  };

  const handleAtacar = () => {
    if (turnoBloqueado) return;
    setTurnoBloqueado(true);
    setAnimacaoJogador(true);
    setTimeout(() => setAnimacaoJogador(false), 250);

    const alvo = inimigos[alvoIndex] || inimigos[0];
    const dano = calcularDano(personagem.ataque, alvo.defesa);

    adicionarLog(`⚔️ ${personagem.nome} atacou ${alvo.nome} causando ${dano} de dano!`);

    const atualizados = inimigos.map((ini, idx) =>
      idx === alvoIndex ? { ...ini, vidaAtual: Math.max(0, ini.vidaAtual - dano) } : ini
    );

    verificarEstadoInimigos(atualizados, false);
  };

  const handleHabilidade = () => {
    if (turnoBloqueado || energiaJogador < 20) return;
    setTurnoBloqueado(true);
    setEnergiaJogador((e) => e - 20);
    setAnimacaoJogador(true);
    setTimeout(() => setAnimacaoJogador(false), 250);

    const isArea =
      personagem.nome === "Z" || (personagem.vantagem || "").toLowerCase().includes("área");

    if (isArea) {
      adicionarLog(`💥 ${personagem.nome} lançou Explosão em Área em todos os inimigos!`);
      const atualizados = inimigos.map((ini) => {
        const dano = calcularDano(Math.round(personagem.ataque * 1.15), ini.defesa);
        return { ...ini, vidaAtual: Math.max(0, ini.vidaAtual - dano) };
      });
      verificarEstadoInimigos(atualizados, false);
    } else {
      const alvo = inimigos[alvoIndex] || inimigos[0];
      const dano = calcularDano(Math.round(personagem.ataque * 1.75), alvo.defesa);
      adicionarLog(`✨ ${personagem.nome} usou Golpe Crítico em ${alvo.nome} (${dano} de dano)!`);
      const atualizados = inimigos.map((ini, idx) =>
        idx === alvoIndex ? { ...ini, vidaAtual: Math.max(0, ini.vidaAtual - dano) } : ini
      );
      verificarEstadoInimigos(atualizados, false);
    }
  };

  const handleDefender = () => {
    if (turnoBloqueado) return;
    setTurnoBloqueado(true);
    setDefendendo(true);
    setEnergiaJogador((e) => Math.min(personagem.energia || 100, e + 15));
    adicionarLog(`🛡️ ${personagem.nome} defendeu (+15 PE e -50% de dano neste turno)!`);
    executarTurnoInimigos(inimigos, true);
  };

  const handleFugir = () => {
    if (turnoBloqueado || !sessaoCombate.permiteFuga) return;
    setTurnoBloqueado(true);

    const velMediaInimigos =
      inimigos.reduce((acc, i) => acc + i.velocidade, 0) / inimigos.length;

    const chanceFuga = Math.max(
      0.15,
      Math.min(0.9, 0.55 + (personagem.velocidade - velMediaInimigos) * 0.03)
    );

    if (Math.random() <= chanceFuga) {
      adicionarLog(`🏃 Fuga bem-sucedida! Escapou da emboscada.`);
      setTimeout(
        () => onFinishCombat({ fugiu: true, hpRestante: hpJogador, energiaRestante: energiaJogador }),
        900
      );
    } else {
      adicionarLog(`❌ Falha ao fugir! Os inimigos bloquearam a saída e atacaram!`);
      executarTurnoInimigos(inimigos, false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0D130F",
        color: "#EDE6D3",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* CABEÇALHO DA BATALHA */}
      <div
        style={{
          padding: "14px 28px",
          background: "#161E18",
          borderBottom: "1px solid #C89B5C",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <span style={{ color: "#C89B5C", fontSize: 11, textTransform: "uppercase" }}>
            MODO: {sessaoCombate.tipoCombate} • LOCAL: {sessaoCombate.nomeLocal}
          </span>
          <h2 style={{ margin: "4px 0 0 0", fontSize: 18 }}>
            Ronda {rondaIndex + 1} de {sessaoCombate.rondas.length}
          </h2>
        </div>

        <div style={{ fontSize: 12, color: "#9CAEA0", textAlign: "right" }}>
          <div data-testid="combat-initiative-order" style={{ color: "#C89B5C", fontSize: 11, marginBottom: 2 }}>
            Iniciativa: {formatarResumoIniciativa(ordemIniciativaAtual)}
          </div>
          <div>Clique num inimigo à direita para mudar o alvo</div>
        </div>
      </div>

      {/* ARENA VISUAL (METADE SUPERIOR) */}
      <CombatArena
        personagem={personagem}
        buffs={buffs}
        onBuffExpired={onBuffExpired}
        hpJogador={hpJogador}
        energiaJogador={energiaJogador}
        defendendo={defendendo}
        animacaoJogador={animacaoJogador}
        danoRecebidoAnim={danoRecebidoAnim}
        inimigos={inimigos}
        alvoIndex={alvoIndex}
        onSelectAlvo={setAlvoIndex}
      />

      {/* PAINEL DE CONTROLOS E LOGS (METADE INFERIOR) */}
      <CombatHUD
        personagem={personagem}
        energiaJogador={energiaJogador}
        alvoAtual={inimigos[alvoIndex] || inimigos[0]}
        turnoBloqueado={turnoBloqueado}
        permiteFuga={sessaoCombate.permiteFuga}
        logs={logs}
        onAtacar={handleAtacar}
        onHabilidade={handleHabilidade}
        onDefender={handleDefender}
        onFugir={handleFugir}
      />

      {/* MODAL DE RECOMPENSAS AO FINALIZAR O COMBATE */}
      <CombatRewardModal
        recompensa={resultadoRecompensa}
        onClaim={() => {
          onFinishCombat(resultadoRecompensa);
        }}
      />
    </div>
  );
}