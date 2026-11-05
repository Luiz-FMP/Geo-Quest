/**
 * Obtenção da localização real do jogador via Browser Geolocation API.
 *
 * Um único getCurrentPosition() não é confiável em computadores sem GPS: a primeira leitura
 * costuma vir de IP/Wi-Fi com precisão de vários quilômetros, então duas sessões iniciadas no
 * mesmo lugar podem começar em pontos bem diferentes. Aqui observamos as leituras por alguns
 * segundos (watchPosition) e ficamos com a de melhor precisão. Nunca inventa coordenadas: se
 * nenhuma leitura válida chegar, a Promise é rejeitada.
 */

// Leitura com precisão igual ou melhor que esta encerra a amostragem na hora.
const PRECISAO_BOA_METROS = 50;
// Após a primeira leitura, aguarda este tempo por leituras mais precisas.
const JANELA_AMOSTRAGEM_MS = 6000;
// Tempo máximo total sem nenhuma leitura válida.
const TEMPO_LIMITE_MS = 15000;
// Acima disto a leitura provavelmente é aproximada por IP/rede.
export const PRECISAO_BAIXA_METROS = 1000;

export const ERRO_GEOLOCALIZACAO_INVALIDA = "INVALID_POSITION";

function leituraValida(latitude, longitude) {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * @returns {Promise<{ latitude: number, longitude: number, accuracy: number }>}
 *   Rejeita com `{ code }`: 1 = permissão negada, 2 = indisponível, 3 = tempo esgotado,
 *   ERRO_GEOLOCALIZACAO_INVALIDA = o navegador só devolveu dados inválidos.
 */
export function obterLocalizacaoPrecisa({
  precisaoBoaMetros = PRECISAO_BOA_METROS,
  janelaAmostragemMs = JANELA_AMOSTRAGEM_MS,
  tempoLimiteMs = TEMPO_LIMITE_MS,
} = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ code: 2, message: "Geolocalização não suportada." });
      return;
    }

    let melhor = null;
    let recebeuLeituraInvalida = false;
    let encerrado = false;
    let watchId = null;
    let timerJanela = null;

    const encerrar = (callback, valor) => {
      if (encerrado) return;
      encerrado = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(timerJanela);
      clearTimeout(timerLimite);
      callback(valor);
    };

    const timerLimite = setTimeout(() => {
      if (melhor) {
        encerrar(resolve, melhor);
      } else {
        encerrar(reject, {
          code: recebeuLeituraInvalida ? ERRO_GEOLOCALIZACAO_INVALIDA : 3,
        });
      }
    }, tempoLimiteMs);

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const latitude = position?.coords?.latitude;
        const longitude = position?.coords?.longitude;
        if (!leituraValida(latitude, longitude)) {
          recebeuLeituraInvalida = true;
          return;
        }

        const rawAccuracy = position?.coords?.accuracy;
        const accuracy = Number.isFinite(rawAccuracy) ? rawAccuracy : Infinity;
        if (!melhor || accuracy < melhor.accuracy) {
          melhor = { latitude, longitude, accuracy };
        }

        if (accuracy <= precisaoBoaMetros) {
          encerrar(resolve, melhor);
          return;
        }

        if (!timerJanela) {
          timerJanela = setTimeout(
            () => encerrar(resolve, melhor),
            janelaAmostragemMs,
          );
        }
      },
      (error) => {
        // Uma leitura boa já obtida vale mais que um erro posterior da amostragem.
        if (melhor && error?.code !== 1) {
          encerrar(resolve, melhor);
          return;
        }
        // Timeout isolado do watch: continua aguardando até o tempo limite total.
        if (error?.code === 3) return;
        encerrar(reject, { code: error?.code ?? 2, message: error?.message });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: tempoLimiteMs },
    );
  });
}
