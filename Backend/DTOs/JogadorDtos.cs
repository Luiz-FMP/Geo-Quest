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

public record PontoMapaDto(
    string PlaceId,
    string Nome,
    string Categoria,
    string Subcategoria,
    double Latitude,
    double Longitude,
    DateTime? DataVisitaUtc = null
);

public record EstadoPermanentePlaceDto(
    string PlaceId,
    string Nome,
    string Categoria,
    string Subcategoria,
    double Latitude,
    double Longitude,
    bool Concluido,
    bool CuraGratuitaUtilizada,
    bool LojaEsgotada,
    string? EstoqueJson,
    DateTime UltimaAtualizacaoUtc
);

public record HistoricoVisitaPlaceDto(
    int Id,
    string PlaceId,
    string Nome,
    string Categoria,
    string Subcategoria,
    double Latitude,
    double Longitude,
    DateTime DataVisitaUtc,
    string EstadoInteracao,
    bool Concluido,
    bool BeneficioGratuitoResgatado
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
    int TotalSlotsMochila,
    PontoMapaDto? Home = null,
    PontoMapaDto? CheckpointVida = null,
    PontoMapaDto? CheckpointEnergia = null,
    double? PosicaoAtualLatitude = null,
    double? PosicaoAtualLongitude = null,
    IReadOnlyList<EstadoPermanentePlaceDto>? EstadosPlaces = null,
    IReadOnlyList<HistoricoVisitaPlaceDto>? HistoricoVisitas = null
);

public record AtualizarNomeJogadorRequest(string Nome);

public record AlterarPersonagemRequest(int PersonagemId);

public record AtualizarVidaJogadorRequest(int VidaAtual, double? EnergiaAtual = null, int? Moedas = null);

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
    string? NomeLocal = null,
    string? Categoria = null,
    string? Subcategoria = null,
    double? DestinoLatitude = null,
    double? DestinoLongitude = null,
    bool ChegouAoDestino = true
);

public record DefinirHomeRequest(
    double Latitude,
    double Longitude,
    bool ForcarAtualizacao = false
);

public record RegistrarVisitaPlaceRequest(
    string PlaceId,
    string Nome,
    string Categoria,
    string? Subcategoria = null,
    double Latitude = 0,
    double Longitude = 0
);

public record CurarHospitalRequest(
    string PlaceId,
    string Nome,
    string? Subcategoria = null,
    double Latitude = 0,
    double Longitude = 0,
    string TipoCura = "gratuita"
);

public record DescansarLodgingRequest(
    string PlaceId,
    string Nome,
    string? Subcategoria = null,
    double Latitude = 0,
    double Longitude = 0
);

public record DescansarHomeRequest(
    double? Latitude = null,
    double? Longitude = null
);

public record ConcluirCombatePlaceRequest(
    string? PlaceId = null,
    string? Nome = null,
    string? Categoria = null,
    string? Subcategoria = null,
    double Latitude = 0,
    double Longitude = 0,
    bool Vitoria = true,
    int? HpRestante = null,
    double? EnergiaRestante = null,
    int MoedasGanhas = 0
);

public record RetornarCheckpointRequest(
    string Motivo,
    string Destino
);

public record VasculharNaturalFeatureRequest(
    string PlaceId,
    string Nome,
    string? Subcategoria = null,
    double Latitude = 0,
    double Longitude = 0,
    string? InteracaoId = null
);

public record VasculharNaturalFeatureResponse(
    string TipoResultado,
    string Resultado,
    string Mensagem,
    int MoedasGanhas,
    ItemInventarioDto? ItemEncontrado,
    JogadorEstadoDto Jogador
);

public record ViajarTransporteRequest(
    string? OrigemPlaceId = null,
    string? OrigemNome = null,
    string? OrigemSubcategoria = null,
    string DestinoPlaceId = "",
    string DestinoNome = "",
    string? Subcategoria = null,
    string? DestinoSubcategoria = null,
    double OrigemLatitude = 0,
    double OrigemLongitude = 0,
    double DestinoLatitude = 0,
    double DestinoLongitude = 0,
    double? DistanciaKm = null
);

public record ViajarTransporteResponse(
    string DestinoPlaceId,
    string DestinoNome,
    string Subcategoria,
    double Latitude,
    double Longitude,
    double DistanciaKm,
    int CustoMoedas,
    JogadorEstadoDto Jogador
);

public record TreinarSportsRequest(
    string PlaceId,
    string Nome,
    string? Subcategoria = null,
    double Latitude = 0,
    double Longitude = 0,
    string? OpcaoAtributo = null,
    string? Opcao = null,
    string? InteracaoId = null
);

public record TreinarSportsResponse(
    string OpcaoAtributo,
    string Mensagem,
    int IncrementoAplicado,
    JogadorEstadoDto Jogador
);

public record SortearAtributoServicesRequest(
    string PlaceId,
    string Nome,
    string? Subcategoria = null,
    double Latitude = 0,
    double Longitude = 0
);

public record SortearAtributoServicesResponse(
    string PlaceId,
    string Atributo,
    string RotuloAtributo,
    int BonusValor,
    int DuracaoSegundos,
    int CustoMoedas,
    JogadorEstadoDto Jogador
);

public record ComprarBuffServicesRequest(
    string PlaceId,
    string Nome,
    string? Subcategoria = null,
    double Latitude = 0,
    double Longitude = 0
);

public record ComprarBuffServicesResponse(
    string PlaceId,
    string Atributo,
    string RotuloAtributo,
    int BonusValor,
    int DuracaoSegundos,
    int CustoMoedas,
    string Mensagem,
    BuffJogadorDto BuffAplicado,
    JogadorEstadoDto Jogador
);

public record ReceberBuffCultureRequest(
    string PlaceId,
    string Nome,
    string? Subcategoria = null,
    double Latitude = 0,
    double Longitude = 0,
    string? InteracaoId = null
);

public record ReceberBuffCultureResponse(
    string PlaceId,
    bool RecebeuBuff,
    string TipoResultado,
    string NomeBuff,
    string DescricaoBuff,
    int BonusValor,
    int DuracaoSegundos,
    string Mensagem,
    BuffJogadorDto? BuffAplicado,
    JogadorEstadoDto Jogador
);
