namespace GeoQuest.Api.Models;

public class EstadoPermanentePlace
{
    public int Id { get; set; }

    public int JogadorId { get; set; }

    public string PlaceId { get; set; } = string.Empty;

    public string Nome { get; set; } = string.Empty;

    public string Categoria { get; set; } = string.Empty;

    public string Subcategoria { get; set; } = string.Empty;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public bool Concluido { get; set; }

    public bool CuraGratuitaUtilizada { get; set; }

    public bool LojaEsgotada { get; set; }

    public string? EstoqueJson { get; set; }

    public DateTime PrimeiraVisitaUtc { get; set; } = DateTime.UtcNow;

    public DateTime UltimaAtualizacaoUtc { get; set; } = DateTime.UtcNow;

    public Jogador? Jogador { get; set; }
}

