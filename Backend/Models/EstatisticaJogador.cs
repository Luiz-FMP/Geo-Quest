namespace GeoQuest.Api.Models;

public class EstatisticaJogador
{
    public int Id { get; set; }

    public int JogadorId { get; set; }

    public double DistanciaPercorridaKm { get; set; }

    public int PlacesVisitados { get; set; }

    public int MissoesConcluidas { get; set; }

    public int ItensObtidos { get; set; }

    public int ItensDescartados { get; set; }

    public DateTime UltimaAtualizacaoUtc { get; set; } = DateTime.UtcNow;

    public Jogador? Jogador { get; set; }
}

