using GeoQuest.Api.DTOs;
using GeoQuest.Api.Models;

namespace GeoQuest.Api.Services;

public static class PlayerStatsCalculator
{
    public const int TotalSlotsMochila = 50;

    public static readonly (string Key, string NomeExibicao, string PlaceholderKey)[] SlotsEquipamentoPadrao =
    [
        ("Cabeca", "Cabeça", "slot_head"),
        ("Superior", "Superior", "slot_chest"),
        ("Inferior", "Inferior", "slot_legs"),
        ("Maos", "Mãos", "slot_hands"),
        ("Botas", "Botas", "slot_boots"),
        ("Acessorio", "Acessório", "slot_accessory"),
        ("Arma", "Arma", "slot_weapon")
    ];

    public static JogadorAtributosDto CalcularAtributos(
        Jogador jogador,
        IEnumerable<ItemInventario> itensInventario,
        IEnumerable<BuffJogador> buffs)
    {
        var agoraUtc = DateTime.UtcNow;
        var itensEquipados = itensInventario
            .Where(i => i.Equipado && i.ItemDefinicao != null)
            .Select(i => i.ItemDefinicao!)
            .ToList();

        var buffsAtivos = buffs
            .Where(b => b.Ativo && (b.ExpiraEmUtc == null || b.ExpiraEmUtc > agoraUtc))
            .ToList();

        int vidaMod = itensEquipados.Sum(i => i.BonusVida) + buffsAtivos.Sum(b => b.BonusVida);
        int energiaMod = itensEquipados.Sum(i => i.BonusEnergia) + buffsAtivos.Sum(b => b.BonusEnergia);
        int danoMod = itensEquipados.Sum(i => i.BonusDano) + buffsAtivos.Sum(b => b.BonusDano);
        int defesaMod = itensEquipados.Sum(i => i.BonusDefesa) + buffsAtivos.Sum(b => b.BonusDefesa);
        int velocidadeMod = itensEquipados.Sum(i => i.BonusVelocidade) + buffsAtivos.Sum(b => b.BonusVelocidade);

        int vidaBase = jogador.VidaBase > 0 ? jogador.VidaBase : 50;
        int energiaBase = jogador.EnergiaBase > 0 ? jogador.EnergiaBase : 100;
        int danoBase = jogador.DanoBase > 0 ? jogador.DanoBase : 10;
        int defesaBase = Math.Max(0, jogador.DefesaBase);
        int velocidadeBase = Math.Max(0, jogador.VelocidadeBase);

        int vidaFinal = Math.Max(1, vidaBase + vidaMod);
        int energiaMaximaFinal = Math.Max(1, energiaBase + energiaMod);
        int danoFinal = Math.Max(1, danoBase + danoMod);
        int defesaFinal = Math.Max(0, defesaBase + defesaMod);
        int velocidadeFinal = Math.Max(0, velocidadeBase + velocidadeMod);

        int vidaAtual = Math.Clamp(jogador.VidaAtual, 0, vidaFinal);
        double energiaAtual = Math.Clamp(Math.Round(jogador.EnergiaAtual, 2), 0, energiaMaximaFinal);

        int nivelDePoder = (int)Math.Round((vidaFinal * (double)(danoFinal + defesaFinal)) / 50.0);
        double consumoPorKm = CalcularConsumoEnergiaPorKm(velocidadeFinal);

        return new JogadorAtributosDto
        {
            VidaBase = vidaBase,
            VidaModificador = vidaMod,
            VidaFinal = vidaFinal,
            VidaAtual = vidaAtual,
            EnergiaBase = energiaBase,
            EnergiaModificador = energiaMod,
            EnergiaMaximaFinal = energiaMaximaFinal,
            EnergiaAtual = energiaAtual,
            DanoBase = danoBase,
            DanoModificador = danoMod,
            DanoFinal = danoFinal,
            DefesaBase = defesaBase,
            DefesaModificador = defesaMod,
            DefesaFinal = defesaFinal,
            VelocidadeBase = velocidadeBase,
            VelocidadeModificador = velocidadeMod,
            VelocidadeFinal = velocidadeFinal,
            NivelDePoder = nivelDePoder,
            ConsumoEnergiaPorKm = Math.Round(consumoPorKm, 2)
        };
    }

    public static double CalcularConsumoEnergiaPorKm(int velocidadeFinal) =>
        10.0 / Math.Pow(2.0, velocidadeFinal / 100.0);

    public static double CalcularEnergiaConsumidaNaRota(double distanciaKm, int velocidadeFinal)
    {
        if (distanciaKm <= 0)
            return 0;
        return Math.Round(distanciaKm * CalcularConsumoEnergiaPorKm(velocidadeFinal), 2);
    }
}
