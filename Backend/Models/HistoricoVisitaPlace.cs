namespace GeoQuest.Api.Models;

public class HistoricoVisitaPlace
{
    public int Id { get; set; }

    public int JogadorId { get; set; }

    public string PlaceId { get; set; } = string.Empty;

    public string Nome { get; set; } = string.Empty;

    public string Categoria { get; set; } = string.Empty;

    public string Subcategoria { get; set; } = string.Empty;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public DateTime DataVisitaUtc { get; set; } = DateTime.UtcNow;

    public string EstadoInteracao { get; set; } = "Visitado";

    public bool Concluido { get; set; }

    public bool BeneficioGratuitoResgatado { get; set; }

    public Jogador? Jogador { get; set; }
}

