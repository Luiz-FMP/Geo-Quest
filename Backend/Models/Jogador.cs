namespace GeoQuest.Api.Models;

public class Jogador
{
    public int Id { get; set; }

    public string Nome { get; set; } = "Explorador";

    public int PersonagemId { get; set; } = 1;

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    // Atributos base persistidos (valores iniciais definidos na especificação)
    public int VidaBase { get; set; } = 50;

    public int VidaAtual { get; set; } = 50;

    public double EnergiaBase { get; set; } = 100.0;

    public double EnergiaAtual { get; set; } = 100.0;

    public int DanoBase { get; set; } = 10;

    public int DefesaBase { get; set; } = 0;

    public int VelocidadeBase { get; set; } = 0;

    public int Moedas { get; set; } = 0;

    // Ponto inicial persistido (Home - Seção 9)
    public double? HomeLatitude { get; set; }

    public double? HomeLongitude { get; set; }

    // Posição atual persistida do jogador
    public double? PosicaoAtualLatitude { get; set; }

    public double? PosicaoAtualLongitude { get; set; }

    // Checkpoint de Vida (Último Health and Wellness visitado - Seção 4)
    public string? CheckpointVidaPlaceId { get; set; }

    public string? CheckpointVidaNome { get; set; }

    public string? CheckpointVidaCategoria { get; set; }

    public string? CheckpointVidaSubcategoria { get; set; }

    public double? CheckpointVidaLatitude { get; set; }

    public double? CheckpointVidaLongitude { get; set; }

    public DateTime? CheckpointVidaDataUtc { get; set; }

    // Checkpoint de Energia (Último Lodging visitado - Seção 4)
    public string? CheckpointEnergiaPlaceId { get; set; }

    public string? CheckpointEnergiaNome { get; set; }

    public string? CheckpointEnergiaCategoria { get; set; }

    public string? CheckpointEnergiaSubcategoria { get; set; }

    public double? CheckpointEnergiaLatitude { get; set; }

    public double? CheckpointEnergiaLongitude { get; set; }

    public DateTime? CheckpointEnergiaDataUtc { get; set; }

    public Personagem? Personagem { get; set; }

    public EstatisticaJogador? Estatisticas { get; set; }

    public ICollection<ItemInventario> ItensInventario { get; set; } = new List<ItemInventario>();

    public ICollection<BuffJogador> Buffs { get; set; } = new List<BuffJogador>();

    public ICollection<MissaoConcluida> MissoesConcluidas { get; set; } = new List<MissaoConcluida>();

    public ICollection<EstadoPermanentePlace> EstadosPlaces { get; set; } = new List<EstadoPermanentePlace>();

    public ICollection<HistoricoVisitaPlace> HistoricoVisitas { get; set; } = new List<HistoricoVisitaPlace>();
}
