using GeoQuest.Api.DTOs;
using GeoQuest.Api.Models;

namespace GeoQuest.Api.Services;

public class PlayerStatsCalculator
{
    public const int TotalSlotsMochila = 50;

    /// <summary>
    /// Calcula atributos finais e derivados:
    /// Atributo base -> modificadores (equipamentos + buffs ativos) -> atributo final
    /// Poder = (Vida * (Dano + Defesa)) / 50
    /// ConsumoEnergiaPorKm = 10 / (2 ^ (Velocidade / 100))
    /// </summary>
    public AtributosDetalhadosDto CalcularAtributos(Jogador jogador)
    {
        var itensEquipados = jogador.ItensInventario
            .Where(i => i.Equipado && i.ItemDefinicao is not null)
            .Select(i => i.ItemDefinicao!)
            .ToList();

        var agora = DateTime.UtcNow;
        var buffsAtivos = jogador.Buffs
            .Where(b => b.Ativo && (b.ExpiraEmUtc is null || b.ExpiraEmUtc > agora))
            .ToList();

        int modVida = itensEquipados.Sum(i => i.BonusVida) + buffsAtivos.Sum(b => b.BonusVida);
        double modEnergia = itensEquipados.Sum(i => i.BonusEnergia) + buffsAtivos.Sum(b => b.BonusEnergia);
        int modDano = itensEquipados.Sum(i => i.BonusDano) + buffsAtivos.Sum(b => b.BonusDano);
        int modDefesa = itensEquipados.Sum(i => i.BonusDefesa) + buffsAtivos.Sum(b => b.BonusDefesa);
        int modVelocidade = itensEquipados.Sum(i => i.BonusVelocidade) + buffsAtivos.Sum(b => b.BonusVelocidade);

        int vidaFinal = Math.Max(1, jogador.VidaBase + modVida);
        double energiaMaxFinal = Math.Max(1.0, Math.Round(jogador.EnergiaBase + modEnergia, 2));
        int danoFinal = Math.Max(0, jogador.DanoBase + modDano);
        int defesaFinal = Math.Max(0, jogador.DefesaBase + modDefesa);
        int velocidadeFinal = jogador.VelocidadeBase + modVelocidade;

        int vidaAtual = Math.Clamp(jogador.VidaAtual, 0, vidaFinal);
        double energiaAtual = Math.Clamp(Math.Round(jogador.EnergiaAtual, 2), 0.0, energiaMaxFinal);

        double nivelDePoder = CalcularNivelDePoder(vidaFinal, danoFinal, defesaFinal);
        double consumoPorKm = CalcularConsumoEnergiaPorKm(velocidadeFinal);

        return new AtributosDetalhadosDto(
            VidaBase: jogador.VidaBase,
            VidaModificador: modVida,
            VidaFinal: vidaFinal,
            VidaAtual: vidaAtual,
            EnergiaBase: jogador.EnergiaBase,
            EnergiaModificador: modEnergia,
            EnergiaMaximaFinal: energiaMaxFinal,
            EnergiaAtual: energiaAtual,
            DanoBase: jogador.DanoBase,
            DanoModificador: modDano,
            DanoFinal: danoFinal,
            DefesaBase: jogador.DefesaBase,
            DefesaModificador: modDefesa,
            DefesaFinal: defesaFinal,
            VelocidadeBase: jogador.VelocidadeBase,
            VelocidadeModificador: modVelocidade,
            VelocidadeFinal: velocidadeFinal,
            NivelDePoder: nivelDePoder,
            ConsumoEnergiaPorKm: consumoPorKm
        );
    }

    public static double CalcularNivelDePoder(int vidaFinal, int danoFinal, int defesaFinal)
    {
        return Math.Round((vidaFinal * (danoFinal + defesaFinal)) / 50.0, 2);
    }

    public static double CalcularConsumoEnergiaPorKm(int velocidadeFinal)
    {
        double divisor = Math.Pow(2.0, velocidadeFinal / 100.0);
        if (divisor <= 0)
        {
            divisor = 1.0;
        }

        return Math.Round(10.0 / divisor, 4);
    }

    public static double CalcularEnergiaConsumida(double distanciaKm, int velocidadeFinal)
    {
        if (distanciaKm <= 0 || double.IsNaN(distanciaKm) || double.IsInfinity(distanciaKm))
        {
            return 0.0;
        }

        double divisor = Math.Pow(2.0, velocidadeFinal / 100.0);
        if (divisor <= 0)
        {
            divisor = 1.0;
        }

        double energia = distanciaKm * (10.0 / divisor);
        return Math.Round(energia, 2);
    }

    public JogadorEstadoDto MapearEstadoJogador(Jogador jogador, int missoesConcluidasTabela = 0)
    {
        var atributos = CalcularAtributos(jogador);

        var personagem = jogador.Personagem ?? new Personagem
        {
            Id = jogador.PersonagemId,
            Nome = $"Explorador #{jogador.PersonagemId}",
            Descricao = "Explorador urbano",
            Vantagem = "Equilíbrio",
            Disponivel = true,
            PlaceholderKey = $"char_{jogador.PersonagemId}"
        };

        var personagemDto = new PersonagemResumoDto(
            Id: personagem.Id,
            Nome: personagem.Nome,
            Descricao: personagem.Descricao,
            Vantagem: personagem.Vantagem,
            Disponivel: personagem.Disponivel,
            PlaceholderKey: string.IsNullOrWhiteSpace(personagem.PlaceholderKey)
                ? $"char_{personagem.Id}"
                : personagem.PlaceholderKey
        );

        var todosItensDto = jogador.ItensInventario
            .Where(i => i.ItemDefinicao is not null)
            .Select(MapearItemInventario)
            .ToList();

        var mochila = todosItensDto
            .Where(i => !i.Equipado && i.SlotIndice is >= 0 and < TotalSlotsMochila)
            .OrderBy(i => i.SlotIndice)
            .ToList();

        var equipamentos = SlotsEquipamento.Todos.Select(slotKey =>
        {
            var itemEquipado = todosItensDto.FirstOrDefault(
                i => i.Equipado && string.Equals(i.SlotEquipado, slotKey, StringComparison.OrdinalIgnoreCase)
            );

            var posicaoLayout = slotKey == SlotsEquipamento.Arma ? "abaixo" : "lado";

            return new SlotEquipamentoDto(
                SlotKey: slotKey,
                Rotulo: SlotsEquipamento.ObterRotulo(slotKey),
                PosicaoLayout: posicaoLayout,
                ItemEquipado: itemEquipado
            );
        }).ToList();

        var agora = DateTime.UtcNow;
        var buffs = jogador.Buffs
            .Where(b => b.Ativo && (b.ExpiraEmUtc is null || b.ExpiraEmUtc > agora))
            .Select(b => new BuffJogadorDto(
                Id: b.Id,
                Codigo: b.Codigo,
                Nome: b.Nome,
                Descricao: b.Descricao,
                BonusVida: b.BonusVida,
                BonusEnergia: b.BonusEnergia,
                BonusDano: b.BonusDano,
                BonusDefesa: b.BonusDefesa,
                BonusVelocidade: b.BonusVelocidade,
                DuracaoSegundos: b.DuracaoSegundos,
                CondicaoDuracao: b.CondicaoDuracao,
                ExpiraEmUtc: b.ExpiraEmUtc,
                Ativo: b.Ativo,
                PlaceholderKey: b.PlaceholderKey
            ))
            .ToList();

        var statsEntity = jogador.Estatisticas;
        int totalMissoes = Math.Max(statsEntity?.MissoesConcluidas ?? 0, missoesConcluidasTabela);

        var estatisticasDto = new EstatisticasJogadorDto(
            DistanciaPercorridaKm: Math.Round(statsEntity?.DistanciaPercorridaKm ?? 0.0, 2),
            PlacesVisitados: statsEntity?.PlacesVisitados ?? 0,
            MissoesConcluidas: totalMissoes,
            ItensObtidos: statsEntity?.ItensObtidos ?? todosItensDto.Count,
            ItensDescartados: statsEntity?.ItensDescartados ?? 0,
            PersonagemUtilizado: personagemDto.Nome,
            UltimaAtualizacaoUtc: statsEntity?.UltimaAtualizacaoUtc ?? DateTime.UtcNow
        );

        return new JogadorEstadoDto(
            Id: jogador.Id,
            Nome: jogador.Nome,
            PersonagemId: jogador.PersonagemId,
            PersonagemAtual: personagemDto,
            Atributos: atributos,
            Mochila: mochila,
            Equipamentos: equipamentos,
            Buffs: buffs,
            Estatisticas: estatisticasDto,
            TotalSlotsMochila: TotalSlotsMochila
        );
    }

    public static ItemInventarioDto MapearItemInventario(ItemInventario item)
    {
        var def = item.ItemDefinicao!;
        return new ItemInventarioDto(
            InventarioId: item.Id,
            ItemDefinicaoId: def.Id,
            Codigo: def.Codigo,
            Nome: def.Nome,
            Descricao: def.Descricao,
            Categoria: def.Categoria,
            Raridade: def.Raridade,
            Equipavel: def.Equipavel,
            SlotEquipamentoCompativel: def.SlotEquipamentoCompativel,
            CategoriaAba: string.IsNullOrWhiteSpace(item.CategoriaAba) ? def.Categoria : item.CategoriaAba,
            SlotIndice: item.SlotIndice,
            Equipado: item.Equipado,
            SlotEquipado: item.SlotEquipado,
            Quantidade: item.Quantidade,
            BonusVida: def.BonusVida,
            BonusEnergia: def.BonusEnergia,
            BonusDano: def.BonusDano,
            BonusDefesa: def.BonusDefesa,
            BonusVelocidade: def.BonusVelocidade,
            PlaceholderKey: def.PlaceholderKey
        );
    }
}

