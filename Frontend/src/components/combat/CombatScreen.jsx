import React, { useState } from "react";
import CombatArena from "./CombatArena";
import CombatHUD from "./CombatHud";

export default function CombatScreen({ personagem, sessaoCombate, onFinishCombat }) {
  const [rondaIndex, setRondaIndex] = useState(0);
  const [inimigos, setInimigos] = useState(sessaoCombate.rondas[0]);
  const [alvoIndex, setAlvoIndex] = useState(0);

  const [hpJogador, setHpJogador] = useState(personagem.vida || 50);
  const [energiaJogador, setEnergiaJogador] = useState(personagem.energia || 100);
  const [defendendo, setDefendendo] = useState(false);
  const [turnoBloqueado, setTurnoBloqueado] = useState(false);

  const [animacaoJogador, setAnimacaoJogador] = useState(false);
  const [danoRecebidoAnim, setDanoRecebidoAnim] = useState(false);

  const [logs, setLogs] = useState([
    `[${sessaoCombate.tipoCombate.toUpperCase()}] Combate iniciado em ${sessaoCombate.nomeLocal}!`,
  ]);

  const adicionarLog = (msg) => setLogs((prev) => [msg, ...prev.slice(0, 5)]);

  const calcularDano = (atk, def) => {
    const base = Math.max(1, atk - Math.floor(def * 0.5));
    const variacao = 0.9 + Math.random() * 0.2;
    return Math.round(base * variacao);
  };

  const executarTurnoInimigos = (inimigosVivos, escudoAtivo) => {
    setTimeout(() => {
      let danoTotalRecebido = 0;

      inimigosVivos.forEach((ini) => {
        let dano = calcularDano(ini.ataque, personagem.defesa);
        if (escudoAtivo) dano = Math.max(1, Math.floor(dano * 0.5));
        danoTotalRecebido += dano;
        adicionarLog(`🔻 ${ini.nome} atacou causando ${dano} de dano!`);
      });

      setDanoRecebidoAnim(true);
      setTimeout(() => setDanoRecebidoAnim(false), 300);

      setHpJogador((hpAtual) => {
        const novoHp = Math.max(0, hpAtual - danoTotalRecebido);
        if (novoHp === 0) {
          adicionarLog(`💀 ${personagem.nome} caiu em combate...`);
          setTimeout(() => onFinishCombat({ vitoria: false, hpRestante: 0 }), 1200);
        }
        return novoHp;
      });

      setDefendendo(false);
      setTurnoBloqueado(false);
    }, 750);
  };

  const verificarEstadoInimigos = (listaAtualizada, escudoAtivo = false) => {
    const vivos = listaAtualizada.filter((i) => i.vidaAtual > 0);
    if (vivos.length === 0) {
      const proximaRonda = rondaIndex + 1;
      if (proximaRonda < sessaoCombate.rondas.length) {
        adicionarLog(
          `⚡ Ronda ${rondaIndex + 1} concluída! Prepare-se para a Ronda ${proximaRonda + 1}!`
        );
        setTimeout(() => {
          setRondaIndex(proximaRonda);
          setInimigos(sessaoCombate.rondas[proximaRonda]);
          setAlvoIndex(0);
          setTurnoBloqueado(false);
        }, 1200);
      } else {
        adicionarLog(`🏆 Vitória! Todos os inimigos foram derrotados!`);
        setTimeout(
          () => onFinishCombat({ vitoria: true, hpRestante: hpJogador, energiaRestante: energiaJogador }),
          1200
        );
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

        <div style={{ fontSize: 12, color: "#9CAEA0" }}>
          Clique num inimigo à direita para mudar o alvo
        </div>
      </div>

      {/* ARENA VISUAL (METADE SUPERIOR) */}
      <CombatArena
        personagem={personagem}
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
        hpJogador={hpJogador}
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
    </div>
  );
}