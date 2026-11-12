const PRECISAO_BOA_METROS = 50;

const JANELA_AMOSTRAGEM_MS = 6000;

const TEMPO_LIMITE_MS = 15000;

export const PRECISAO_BAIXA_METROS = 1000;

export const ERRO_GEOLOCALIZACAO_INVALIDA = "INVALID_POSITION";

export function haversineDistanceKm(a, b) {
  if (!a || !b) return 0;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng *
      sinLng;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

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

        if (melhor && error?.code !== 1) {
          encerrar(resolve, melhor);
          return;
        }

        if (error?.code === 3) return;
        encerrar(reject, { code: error?.code ?? 2, message: error?.message });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: tempoLimiteMs },
    );
  });
}
