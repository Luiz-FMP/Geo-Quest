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
        var buffsAtivos = ObterBuffsAtivosUnicosPorAtributo(jogador, agora);

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
        int moedas = Math.Max(0, jogador.Moedas);

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
            ConsumoEnergiaPorKm: consumoPorKm,
            Moedas: moedas
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
                ? $"char_{jogador.PersonagemId}"
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
        var buffs = ObterBuffsAtivosUnicosPorAtributo(jogador, agora)
            .Select(MapearBuffJogador)
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

        PontoMapaDto? homeDto = null;
        if (jogador.HomeLatitude.HasValue && jogador.HomeLongitude.HasValue)
        {
            homeDto = new PontoMapaDto(
                PlaceId: "home",
                Nome: "Home",
                Categoria: "Local especial",
                Subcategoria: "home",
                Latitude: jogador.HomeLatitude.Value,
                Longitude: jogador.HomeLongitude.Value,
                DataVisitaUtc: jogador.DataCriacao
            );
        }

        PontoMapaDto? checkpointVidaDto = null;
        if (!string.IsNullOrWhiteSpace(jogador.CheckpointVidaPlaceId) &&
            jogador.CheckpointVidaLatitude.HasValue &&
            jogador.CheckpointVidaLongitude.HasValue)
        {
            checkpointVidaDto = new PontoMapaDto(
                PlaceId: jogador.CheckpointVidaPlaceId,
                Nome: string.IsNullOrWhiteSpace(jogador.CheckpointVidaNome) ? "Hospital" : jogador.CheckpointVidaNome,
                Categoria: jogador.CheckpointVidaCategoria ?? PlaceCategoryMapper.CategoryHealthAndWellness,
                Subcategoria: jogador.CheckpointVidaSubcategoria ?? "hospital",
                Latitude: jogador.CheckpointVidaLatitude.Value,
                Longitude: jogador.CheckpointVidaLongitude.Value,
                DataVisitaUtc: jogador.CheckpointVidaDataUtc
            );
        }

        PontoMapaDto? checkpointEnergiaDto = null;
        if (!string.IsNullOrWhiteSpace(jogador.CheckpointEnergiaPlaceId) &&
            jogador.CheckpointEnergiaLatitude.HasValue &&
            jogador.CheckpointEnergiaLongitude.HasValue)
        {
            checkpointEnergiaDto = new PontoMapaDto(
                PlaceId: jogador.CheckpointEnergiaPlaceId,
                Nome: string.IsNullOrWhiteSpace(jogador.CheckpointEnergiaNome) ? "Hospedagem" : jogador.CheckpointEnergiaNome,
                Categoria: jogador.CheckpointEnergiaCategoria ?? PlaceCategoryMapper.CategoryLodging,
                Subcategoria: jogador.CheckpointEnergiaSubcategoria ?? "lodging",
                Latitude: jogador.CheckpointEnergiaLatitude.Value,
                Longitude: jogador.CheckpointEnergiaLongitude.Value,
                DataVisitaUtc: jogador.CheckpointEnergiaDataUtc
            );
        }

        var estadosPlacesDto = (jogador.EstadosPlaces ?? Array.Empty<EstadoPermanentePlace>())
            .OrderByDescending(e => e.UltimaAtualizacaoUtc)
            .Select(e => new EstadoPermanentePlaceDto(
                PlaceId: e.PlaceId,
                Nome: e.Nome,
                Categoria: e.Categoria,
                Subcategoria: e.Subcategoria,
                Latitude: e.Latitude,
                Longitude: e.Longitude,
                Concluido: e.Concluido,
                CuraGratuitaUtilizada: e.CuraGratuitaUtilizada,
                LojaEsgotada: e.LojaEsgotada,
                EstoqueJson: e.EstoqueJson,
                UltimaAtualizacaoUtc: e.UltimaAtualizacaoUtc
            ))
            .ToList();

        var historicoDto = (jogador.HistoricoVisitas ?? Array.Empty<HistoricoVisitaPlace>())
            .OrderByDescending(h => h.DataVisitaUtc)
            .Select(h => new HistoricoVisitaPlaceDto(
                Id: h.Id,
                PlaceId: h.PlaceId,
                Nome: h.Nome,
                Categoria: h.Categoria,
                Subcategoria: h.Subcategoria,
                Latitude: h.Latitude,
                Longitude: h.Longitude,
                DataVisitaUtc: h.DataVisitaUtc,
                EstadoInteracao: h.EstadoInteracao,
                Concluido: h.Concluido,
                BeneficioGratuitoResgatado: h.BeneficioGratuitoResgatado
            ))
            .ToList();

        return new JogadorEstadoDto(
            Id: jogador.Id,
            Nome: jogador.Nome,
            PersonagemId: jogador.PersonagemId,
            Moedas: Math.Max(0, jogador.Moedas),
            PersonagemAtual: personagemDto,
            Atributos: atributos,
            Mochila: mochila,
            Equipamentos: equipamentos,
            Buffs: buffs,
            Estatisticas: estatisticasDto,
            TotalSlotsMochila: TotalSlotsMochila,
            Home: homeDto,
            CheckpointVida: checkpointVidaDto,
            CheckpointEnergia: checkpointEnergiaDto,
            PosicaoAtualLatitude: jogador.PosicaoAtualLatitude,
            PosicaoAtualLongitude: jogador.PosicaoAtualLongitude,
            EstadosPlaces: estadosPlacesDto,
            HistoricoVisitas: historicoDto
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

    public static BuffJogadorDto MapearBuffJogador(BuffJogador b)
    {
        return new BuffJogadorDto(
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
            // O SQLite devolve DateTime com Kind=Unspecified; sem marcar como UTC o JSON sai sem "Z"
            // e o navegador interpreta o horário como local (ex.: +3h em UTC-3).
            ExpiraEmUtc: b.ExpiraEmUtc.HasValue
                ? DateTime.SpecifyKind(b.ExpiraEmUtc.Value, DateTimeKind.Utc)
                : null,
            Ativo: b.Ativo,
            PlaceholderKey: b.PlaceholderKey
        );
    }

    public static string IdentificarAtributoBuff(BuffJogador b)
    {
        if (b.BonusVida != 0) return "vida";
        if (b.BonusEnergia != 0) return "energia";
        if (b.BonusDano != 0) return "dano";
        if (b.BonusDefesa != 0) return "defesa";
        if (b.BonusVelocidade != 0) return "velocidade";

        string key = (b.PlaceholderKey ?? b.Codigo ?? string.Empty).ToLowerInvariant();
        if (key.Contains("vida")) return "vida";
        if (key.Contains("energia")) return "energia";
        if (key.Contains("dano")) return "dano";
        if (key.Contains("defesa")) return "defesa";
        if (key.Contains("velocidade")) return "velocidade";
        return "outro";
    }

    /// <summary>
    /// Retorna os buffs ativos e não expirados, garantindo no máximo 1 buff por atributo
    /// (preservando a ordem de aquisição).
    /// </summary>
    public static List<BuffJogador> ObterBuffsAtivosUnicosPorAtributo(Jogador jogador, DateTime agora)
    {
        var validos = (jogador.Buffs ?? Array.Empty<BuffJogador>())
            .Where(b => b.Ativo && (b.ExpiraEmUtc is null || b.ExpiraEmUtc > agora))
            .OrderBy(b => b.CriadoEmUtc)
            .ThenBy(b => b.Id)
            .ToList();

        var porAtributo = new Dictionary<string, BuffJogador>(StringComparer.OrdinalIgnoreCase);
        foreach (var buff in validos)
        {
            string attr = IdentificarAtributoBuff(buff);
            porAtributo[attr] = buff;
        }

        return porAtributo.Values
            .OrderBy(b => b.CriadoEmUtc)
            .ThenBy(b => b.Id)
            .ToList();
    }

    /// <summary>
    /// Seção 4: Probabilidades de sorteio de atributo em Services (10 min = 600s, custo 50g):
    /// - Vida (+15): 25% [0.00, 0.25)
    /// - Energia (+20): 25% [0.25, 0.50)
    /// - Dano (+4): 15% [0.50, 0.65)
    /// - Defesa (+4): 15% [0.65, 0.80)
    /// - Velocidade (+4): 20% [0.80, 1.00)
    /// </summary>
    public static string SortearAtributoServices(double roll)
    {
        if (roll < 0.25) return "vida";
        if (roll < 0.50) return "energia";
        if (roll < 0.65) return "dano";
        if (roll < 0.80) return "defesa";
        return "velocidade";
    }

    /// <summary>
    /// Seção 5: Probabilidades de sorteio em Culture (5 min = 300s, gratuito):
    /// - Vida (+20): 20% [0.00, 0.20)
    /// - Energia (+40): 20% [0.20, 0.40)
    /// - Dano (+6): 15% [0.40, 0.55)
    /// - Defesa (+6): 15% [0.55, 0.70)
    /// - Velocidade (+6): 20% [0.70, 0.90)
    /// - Nenhum Aprimoramento: 10% [0.90, 1.00)
    /// </summary>
    public static string SortearResultadoCulture(double roll)
    {
        if (roll < 0.20) return "vida";
        if (roll < 0.40) return "energia";
        if (roll < 0.55) return "dano";
        if (roll < 0.70) return "defesa";
        if (roll < 0.90) return "velocidade";
        return "nada";
    }

    public static bool EhAtributoBuffValido(string? atributo)
    {
        if (string.IsNullOrWhiteSpace(atributo)) return false;
        string norm = atributo.Trim().ToLowerInvariant();
        return norm is "vida" or "energia" or "dano" or "defesa" or "velocidade";
    }

    public static (
        string Atributo,
        string RotuloAtributo,
        int BonusValor,
        int DuracaoSegundos,
        string NomeBuff,
        string DescricaoBuff,
        string PlaceholderKey
    ) ObterEspecificacaoBuff(string atributo, string origem)
    {
        string normAttr = (atributo ?? string.Empty).Trim().ToLowerInvariant();
        bool isCulture = string.Equals(origem, "culture", StringComparison.OrdinalIgnoreCase);
        int duracaoSegundos = isCulture ? 300 : 600;
        int minutos = duracaoSegundos / 60;

        return normAttr switch
        {
            "vida" => (
                "vida",
                "Vida",
                isCulture ? 20 : 15,
                duracaoSegundos,
                "Aprimoramento em Vida",
                $"+{(isCulture ? 20 : 15)} de Vida ({minutos} min)",
                "buff_vida"
            ),
            "energia" => (
                "energia",
                "Energia",
                isCulture ? 40 : 20,
                duracaoSegundos,
                "Aprimoramento em Energia",
                $"+{(isCulture ? 40 : 20)} de Energia ({minutos} min)",
                "buff_energia"
            ),
            "dano" => (
                "dano",
                "Dano",
                isCulture ? 6 : 4,
                duracaoSegundos,
                "Aprimoramento em Dano",
                $"+{(isCulture ? 6 : 4)} de Dano ({minutos} min)",
                "buff_dano"
            ),
            "defesa" => (
                "defesa",
                "Defesa",
                isCulture ? 6 : 4,
                duracaoSegundos,
                "Aprimoramento em Defesa",
                $"+{(isCulture ? 6 : 4)} de Defesa ({minutos} min)",
                "buff_defesa"
            ),
            _ => (
                "velocidade",
                "Velocidade",
                isCulture ? 6 : 4,
                duracaoSegundos,
                "Aprimoramento em Velocidade",
                $"+{(isCulture ? 6 : 4)} de Velocidade ({minutos} min)",
                "buff_velocidade"
            ),
        };
    }
}
