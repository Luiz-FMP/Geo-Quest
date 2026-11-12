namespace GeoQuest.Api.DTOs;

public class JogadorEstadoDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public int Nivel { get; set; }
    public int XP { get; set; }
    public int Moedas { get; set; }
    public int PersonagemId { get; set; }
    public PersonagemResumoDto PersonagemAtual { get; set; } = new();
    public JogadorAtributosDto Atributos { get; set; } = new();
    public List<SlotEquipamentoDto> Equipamentos { get; set; } = new();
    public List<ItemMochilaDto> Mochila { get; set; } = new();
    public List<BuffAtivoDto> Buffs { get; set; } = new();
    public EstatisticasJogadorDto Estatisticas { get; set; } = new();
    public LocalCheckpointDto? Home { get; set; }
    public LocalCheckpointDto? CheckpointVida { get; set; }
    public LocalCheckpointDto? CheckpointEnergia { get; set; }
    public List<EstadoPermanentePlaceDto> LocaisConcluidos { get; set; } = new();
    public List<HistoricoVisitaPlaceDto> HistoricoVisitas { get; set; } = new();
}

public class LocalCheckpointDto
{
    public string PlaceId { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string Subcategoria { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class EstadoPermanentePlaceDto
{
    public string PlaceId { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string Subcategoria { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public bool Concluido { get; set; }
    public bool BeneficioGratuitoResgatado { get; set; }
    public string? AtributoBuffFixo { get; set; }
    public DateTime AtualizadoEmUtc { get; set; }
}

public class HistoricoVisitaPlaceDto
{
    public string PlaceId { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string Subcategoria { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string EstadoInteracao { get; set; } = "Visitado";
    public bool Concluido { get; set; }
    public bool BeneficioGratuitoResgatado { get; set; }
    public DateTime VisitadoEmUtc { get; set; }
}

public class PersonagemResumoDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string Vantagem { get; set; } = string.Empty;
    public string PlaceholderKey { get; set; } = "char_1";
    public bool Disponivel { get; set; } = true;
}

public class JogadorAtributosDto
{
    public int VidaBase { get; set; }
    public int VidaModificador { get; set; }
    public int VidaFinal { get; set; }
    public int VidaAtual { get; set; }
    public int EnergiaBase { get; set; }
    public int EnergiaModificador { get; set; }
    public int EnergiaMaximaFinal { get; set; }
    public double EnergiaAtual { get; set; }
    public int DanoBase { get; set; }
    public int DanoModificador { get; set; }
    public int DanoFinal { get; set; }
    public int DefesaBase { get; set; }
    public int DefesaModificador { get; set; }
    public int DefesaFinal { get; set; }
    public int VelocidadeBase { get; set; }
    public int VelocidadeModificador { get; set; }
    public int VelocidadeFinal { get; set; }
    public int NivelDePoder { get; set; }
    public double ConsumoEnergiaPorKm { get; set; }
}

public class SlotEquipamentoDto
{
    public string SlotKey { get; set; } = string.Empty;
    public string NomeExibicao { get; set; } = string.Empty;
    public string PlaceholderKey { get; set; } = string.Empty;
    public ItemMochilaDto? ItemEquipado { get; set; }
}

public class ItemMochilaDto
{
    public int InventarioId { get; set; }
    public int ItemDefinicaoId { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string Categoria { get; set; } = "Equipavel";
    public string CategoriaAba { get; set; } = "Equipavel";
    public string Raridade { get; set; } = "Comum";
    public string? SlotEquipamentoCompativel { get; set; }
    public string PlaceholderKey { get; set; } = "item_default";
    public int Quantidade { get; set; } = 1;
    public int SlotIndice { get; set; }
    public bool Equipado { get; set; }
    public string? SlotEquipado { get; set; }
    public int BonusVida { get; set; }
    public int BonusEnergia { get; set; }
    public int BonusDano { get; set; }
    public int BonusDefesa { get; set; }
    public int BonusVelocidade { get; set; }
}

public class BuffAtivoDto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string PlaceholderKey { get; set; } = "buff_default";
    public int BonusVida { get; set; }
    public int BonusEnergia { get; set; }
    public int BonusDano { get; set; }
    public int BonusDefesa { get; set; }
    public int BonusVelocidade { get; set; }
    public DateTime? ExpiraEmUtc { get; set; }
}

public class EstatisticasJogadorDto
{
    public double DistanciaPercorridaKm { get; set; }
    public int PlacesVisitados { get; set; }
    public int MissoesConcluidas { get; set; }
    public int ItensObtidos { get; set; }
    public int ItensDescartados { get; set; }
    public string PersonagemUtilizado { get; set; } = string.Empty;
}

public class AtualizarNomeJogadorRequest
{
    public string Nome { get; set; } = string.Empty;
}

public class AlterarPersonagemJogadorRequest
{
    public int PersonagemId { get; set; }
}

public class MoverItemMochilaRequest
{
    public int NovoSlotIndice { get; set; }
    public string? CategoriaAba { get; set; }
}

public class EquiparItemRequest
{
    public int InventarioId { get; set; }
    public string SlotKey { get; set; } = string.Empty;
}

public class DesequiparItemRequest
{
    public string SlotKey { get; set; } = string.Empty;
    public int? SlotMochilaDestino { get; set; }
}

public class RegistrarPercursoRequest
{
    public double DistanciaKm { get; set; }
    public bool VisitouPlace { get; set; }
    public string? PlaceId { get; set; }
    public string? NomePlace { get; set; }
    public string? CategoriaPlace { get; set; }
    public string? SubcategoriaPlace { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

public class AtualizarVidaJogadorRequest
{
    public int VidaAtual { get; set; }
    public double? EnergiaAtual { get; set; }
    public int? Moedas { get; set; }
}

public class DefinirHomeRequest
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class VisitarPlaceRequest
{
    public string PlaceId { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string Subcategoria { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class CurarHospitalRequest
{
    public string PlaceId { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Subcategoria { get; set; } = "hospital";
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string OpcaoCura { get; set; } = "free";
}

public class DescansarHospedagemRequest
{
    public string PlaceId { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Subcategoria { get; set; } = "hotel";
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string OpcaoDescanso { get; set; } = "full";
}

public class VasculharNaturalFeatureRequest
{
    public string PlaceId { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Subcategoria { get; set; } = "natural_feature";
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class VasculharNaturalFeatureResponse
{
    public string PlaceId { get; set; } = string.Empty;
    public string NomePlace { get; set; } = string.Empty;
    public int MoedasEncontradas { get; set; }
    public ItemMochilaDto? ItemEncontrado { get; set; }
    public bool MochilaCheia { get; set; }
    public string Mensagem { get; set; } = string.Empty;
    public JogadorEstadoDto Jogador { get; set; } = new();
}

public class ViajarTransporteRequest
{
    public string OrigemPlaceId { get; set; } = string.Empty;
    public string OrigemNome { get; set; } = string.Empty;
    public string DestinoPlaceId { get; set; } = string.Empty;
    public string DestinoNome { get; set; } = string.Empty;
    public string SubcategoriaTransporte { get; set; } = string.Empty;
    public double OrigemLatitude { get; set; }
    public double OrigemLongitude { get; set; }
    public double DestinoLatitude { get; set; }
    public double DestinoLongitude { get; set; }
    public double? DistanciaKm { get; set; }
}

public class ViajarTransporteResponse
{
    public string DestinoPlaceId { get; set; } = string.Empty;
    public string DestinoNome { get; set; } = string.Empty;
    public string SubcategoriaTransporte { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double DistanciaKm { get; set; }
    public int CustoMoedas { get; set; }
    public JogadorEstadoDto Jogador { get; set; } = new();
}

public class TreinarSportsRequest
{
    public string PlaceId { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Subcategoria { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class TreinarSportsResponse
{
    public string PlaceId { get; set; } = string.Empty;
    public string NomePlace { get; set; } = string.Empty;
    public string Subcategoria { get; set; } = string.Empty;
    public string AtributoMelhorado { get; set; } = string.Empty;
    public int BonusAplicado { get; set; } = 1;
    public int CustoEnergia { get; set; } = 30;
    public string Mensagem { get; set; } = string.Empty;
    public JogadorEstadoDto Jogador { get; set; } = new();
}

public class SortearAtributoServicesRequest
{
    public string PlaceId { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Subcategoria { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class SortearAtributoServicesResponse
{
    public string PlaceId { get; set; } = string.Empty;
    public string AtributoBuffFixo { get; set; } = string.Empty;
    public JogadorEstadoDto Jogador { get; set; } = new();
}

public class ComprarBuffServicesRequest
{
    public string PlaceId { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Subcategoria { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int Tier { get; set; } = 1;
    public string? AtributoSugerido { get; set; }
}

public class ComprarBuffServicesResponse
{
    public string PlaceId { get; set; } = string.Empty;
    public string NomePlace { get; set; } = string.Empty;
    public string AtributoBuff { get; set; } = string.Empty;
    public int Tier { get; set; }
    public int BonusAplicado { get; set; }
    public int CustoMoedas { get; set; }
    public int DuracaoMinutos { get; set; } = 10;
    public string Mensagem { get; set; } = string.Empty;
    public JogadorEstadoDto Jogador { get; set; } = new();
}

public class ReceberAprimoramentoCultureRequest
{
    public string PlaceId { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Subcategoria { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? AtributoDesejado { get; set; }
}

public class ReceberAprimoramentoCultureResponse
{
    public string PlaceId { get; set; } = string.Empty;
    public string NomePlace { get; set; } = string.Empty;
    public string AtributoBuff { get; set; } = string.Empty;
    public int BonusAplicado { get; set; }
    public int DuracaoMinutos { get; set; } = 15;
    public string Mensagem { get; set; } = string.Empty;
    public JogadorEstadoDto Jogador { get; set; } = new();
}

public class ConcluirCombatePlaceRequest
{
    public string? PlaceId { get; set; }
    public string? Nome { get; set; }
    public string? Categoria { get; set; }
    public string? Subcategoria { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string TipoCombate { get; set; } = "arena";
    public bool Vitoria { get; set; }
    public int VidaRestante { get; set; }
    public double? EnergiaRestante { get; set; }
    public int MoedasGanhas { get; set; }
}

public class RetornoCheckpointRequest
{
    public string Motivo { get; set; } = "morte";
    public string Destino { get; set; } = "home";
}

public class RetornoCheckpointResponse
{
    public string Motivo { get; set; } = string.Empty;
    public string DestinoEscolhido { get; set; } = string.Empty;
    public string DestinoNome { get; set; } = string.Empty;
    public string DestinoPlaceId { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public JogadorEstadoDto Jogador { get; set; } = new();
}
