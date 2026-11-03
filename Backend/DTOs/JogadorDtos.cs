namespace GeoQuest.Api.DTOs;

public record AtributosDetalhadosDto(
    int VidaBase,
    int VidaModificador,
    int VidaFinal,
    int VidaAtual,
    double EnergiaBase,
    double EnergiaModificador,
    double EnergiaMaximaFinal,
    double EnergiaAtual,
    int DanoBase,
    int DanoModificador,
    int DanoFinal,
    int DefesaBase,
    int DefesaModificador,
    int DefesaFinal,
    int VelocidadeBase,
    int VelocidadeModificador,
    int VelocidadeFinal,
    double NivelDePoder,
    double ConsumoEnergiaPorKm,
    int Moedas
);

public record PersonagemResumoDto(
    int Id,
    string Nome,
    string Descricao,
    string Vantagem,
    bool Disponivel,
    string PlaceholderKey
);

public record ItemInventarioDto(
    int InventarioId,
    int ItemDefinicaoId,
    string Codigo,
    string Nome,
    string Descricao,
    string Categoria,
    string Raridade,
    bool Equipavel,
    string? SlotEquipamentoCompativel,
    string CategoriaAba,
    int? SlotIndice,
    bool Equipado,
    string? SlotEquipado,
    int Quantidade,
    int BonusVida,
    double BonusEnergia,
    int BonusDano,
    int BonusDefesa,
    int BonusVelocidade,
    string PlaceholderKey
);

public record SlotEquipamentoDto(
    string SlotKey,
    string Rotulo,
    string PosicaoLayout,
    ItemInventarioDto? ItemEquipado
);

public record BuffJogadorDto(
    int Id,
    string Codigo,
    string Nome,
    string Descricao,
    int BonusVida,
    double BonusEnergia,
    int BonusDano,
    int BonusDefesa,
    int BonusVelocidade,
    int? DuracaoSegundos,
    string CondicaoDuracao,
    DateTime? ExpiraEmUtc,
    bool Ativo,
    string PlaceholderKey
);

public record EstatisticasJogadorDto(
    double DistanciaPercorridaKm,
    int PlacesVisitados,
    int MissoesConcluidas,
    int ItensObtidos,
    int ItensDescartados,
    string PersonagemUtilizado,
    DateTime UltimaAtualizacaoUtc
);

public record JogadorEstadoDto(
    int Id,
    string Nome,
    int PersonagemId,
    int Moedas,
    PersonagemResumoDto PersonagemAtual,
    AtributosDetalhadosDto Atributos,
    IReadOnlyList<ItemInventarioDto> Mochila,
    IReadOnlyList<SlotEquipamentoDto> Equipamentos,
    IReadOnlyList<BuffJogadorDto> Buffs,
    EstatisticasJogadorDto Estatisticas,
    int TotalSlotsMochila
);

public record AtualizarNomeJogadorRequest(string Nome);

public record AlterarPersonagemRequest(int PersonagemId);

public record AtualizarVidaJogadorRequest(int VidaAtual, double? EnergiaAtual = null);

public record MoverItemInventarioRequest(
    int InventarioId,
    int NovoSlotIndice,
    string? AbaDestino = null
);

public record EquiparItemRequest(
    int InventarioId,
    string SlotEquipamento
);

public record DesequiparItemRequest(
    string SlotEquipamento,
    int? SlotMochilaDestino = null
);

public record RegistrarPercursoRequest(
    double DistanciaKm,
    string? PlaceId = null,
    string? NomeLocal = null
);
