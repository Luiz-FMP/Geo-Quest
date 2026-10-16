namespace GeoQuest.Api.Models;

public class MissaoConcluida
{
    public int Id { get; set; }

    public int JogadorId { get; set; }

    public string GooglePlaceId { get; set; } = string.Empty;

    public string NomeLocal { get; set; } = string.Empty;

    public int CategoriaId { get; set; }

    public DateTime DataConclusao { get; set; }

    public Jogador? Jogador { get; set; }

    public Categoria? Categoria { get; set; }
}
