namespace GeoQuest.Api.Models;

public class Boss
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public int Vida { get; set; }
    public int Energia { get; set; }
    public int Ataque { get; set; }
    public int Defesa { get; set; }
    public int Velocidade { get; set; }
    public int RecompensaXP { get; set; }
    public string TipoPlace { get; set; } = string.Empty;
    public string Tier { get; set; } = "Boss";
}

public class BuffJogador
{
    public int Id { get; set; }
    public int JogadorId { get; set; }
    public Jogador? Jogador { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string PlaceholderKey { get; set; } = "buff_default";
    public int BonusVida { get; set; }
    public int BonusEnergia { get; set; }
    public int BonusDano { get; set; }
    public int BonusDefesa { get; set; }
    public int BonusVelocidade { get; set; }
    public bool Ativo { get; set; } = true;
    public DateTime? ExpiraEmUtc { get; set; }
}

public class Categoria
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public ICollection<MissaoConcluida> MissoesConcluidas { get; set; } = new List<MissaoConcluida>();
}

public class Cidade
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string Pais { get; set; } = string.Empty;
    public ICollection<Jogador> Jogadores { get; set; } = new List<Jogador>();
    public ICollection<MissaoConcluida> MissoesConcluidas { get; set; } = new List<MissaoConcluida>();
}

public class EstadoPermanentePlace
{
    public int Id { get; set; }
    public int JogadorId { get; set; }
    public Jogador? Jogador { get; set; }
    public string PlaceId { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string Subcategoria { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public bool Concluido { get; set; }
    public bool BeneficioGratuitoResgatado { get; set; }
    public string? AtributoBuffFixo { get; set; }
    public DateTime AtualizadoEmUtc { get; set; } = DateTime.UtcNow;
}

public class EstatisticaJogador
{
    public int Id { get; set; }
    public int JogadorId { get; set; }
    public Jogador? Jogador { get; set; }
    public double DistanciaPercorridaKm { get; set; }
    public int PlacesVisitados { get; set; }
    public int MissoesConcluidasCount { get; set; }
    public int ItensObtidos { get; set; }
    public int ItensDescartados { get; set; }
    public DateTime UltimaAtualizacaoUtc { get; set; } = DateTime.UtcNow;
}

public class HistoricoVisitaPlace
{
    public int Id { get; set; }
    public int JogadorId { get; set; }
    public Jogador? Jogador { get; set; }
    public string PlaceId { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string Subcategoria { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string EstadoInteracao { get; set; } = "Visitado";
    public bool Concluido { get; set; }
    public bool BeneficioGratuitoResgatado { get; set; }
    public DateTime VisitadoEmUtc { get; set; } = DateTime.UtcNow;
}

public class Inimigo
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public int Vida { get; set; }
    public int Energia { get; set; }
    public int Ataque { get; set; }
    public int Defesa { get; set; }
    public int Velocidade { get; set; }
    public int RecompensaXP { get; set; }
    public string CategoriaPlace { get; set; } = string.Empty;
    public string Tier { get; set; } = "Normal";
}

public class ItemDefinicao
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string Categoria { get; set; } = "Equipavel";
    public string Raridade { get; set; } = "Comum";
    public string? SlotEquipamentoCompativel { get; set; }
    public string PlaceholderKey { get; set; } = "item_default";
    public int BonusVida { get; set; }
    public int BonusEnergia { get; set; }
    public int BonusDano { get; set; }
    public int BonusDefesa { get; set; }
    public int BonusVelocidade { get; set; }
    public int ValorCompra { get; set; }
    public ICollection<ItemInventario> ItensInventario { get; set; } = new List<ItemInventario>();
}

public class ItemInventario
{
    public int Id { get; set; }
    public int JogadorId { get; set; }
    public Jogador? Jogador { get; set; }
    public int ItemDefinicaoId { get; set; }
    public ItemDefinicao? ItemDefinicao { get; set; }
    public int Quantidade { get; set; } = 1;
    public int SlotIndice { get; set; }
    public string CategoriaAba { get; set; } = "Equipavel";
    public bool Equipado { get; set; }
    public string? SlotEquipado { get; set; }
    public DateTime ObtidoEmUtc { get; set; } = DateTime.UtcNow;
}

public class Jogador
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public int Nivel { get; set; } = 1;
    public int XP { get; set; }
    public int Moedas { get; set; }
    public int VidaBase { get; set; } = 50;
    public int VidaAtual { get; set; } = 50;
    public int EnergiaBase { get; set; } = 100;
    public double EnergiaAtual { get; set; } = 100;
    public int DanoBase { get; set; } = 10;
    public int DefesaBase { get; set; }
    public int VelocidadeBase { get; set; }
    public double? HomeLatitude { get; set; }
    public double? HomeLongitude { get; set; }
    public string? CheckpointVidaPlaceId { get; set; }
    public string? CheckpointVidaNome { get; set; }
    public string? CheckpointVidaSubcategoria { get; set; }
    public double? CheckpointVidaLatitude { get; set; }
    public double? CheckpointVidaLongitude { get; set; }
    public string? CheckpointEnergiaPlaceId { get; set; }
    public string? CheckpointEnergiaNome { get; set; }
    public string? CheckpointEnergiaSubcategoria { get; set; }
    public double? CheckpointEnergiaLatitude { get; set; }
    public double? CheckpointEnergiaLongitude { get; set; }
    public int CidadeId { get; set; }
    public Cidade? Cidade { get; set; }
    public int PersonagemId { get; set; } = 1;
    public Personagem? Personagem { get; set; }
    public EstatisticaJogador? Estatistica { get; set; }
    public ICollection<MissaoConcluida> MissoesConcluidas { get; set; } = new List<MissaoConcluida>();
    public ICollection<ItemInventario> Inventario { get; set; } = new List<ItemInventario>();
    public ICollection<BuffJogador> Buffs { get; set; } = new List<BuffJogador>();
    public ICollection<HistoricoVisitaPlace> HistoricoVisitas { get; set; } = new List<HistoricoVisitaPlace>();
    public ICollection<EstadoPermanentePlace> EstadosPermanentesPlaces { get; set; } = new List<EstadoPermanentePlace>();
}

public class MissaoConcluida
{
    public int Id { get; set; }
    public string GooglePlaceId { get; set; } = string.Empty;
    public string NomeLocal { get; set; } = string.Empty;
    public DateTime DataConclusao { get; set; } = DateTime.UtcNow;
    public int JogadorId { get; set; }
    public Jogador? Jogador { get; set; }
    public int CidadeId { get; set; }
    public Cidade? Cidade { get; set; }
    public int CategoriaId { get; set; }
    public Categoria? Categoria { get; set; }
}

public class Personagem
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string Vantagem { get; set; } = string.Empty;
    public string PlaceholderKey { get; set; } = "char_1";
    public bool Disponivel { get; set; } = true;
    public int VidaBase { get; set; }
    public int EnergiaBase { get; set; }
    public int AtaqueBase { get; set; }
    public int DefesaBase { get; set; }
    public int VelocidadeBase { get; set; }
    public ICollection<Jogador> Jogadores { get; set; } = new List<Jogador>();
}

