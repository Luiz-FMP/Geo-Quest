namespace MeuSistema.Models;

public class PontoInteresse
{
    public int Id { get; set; }

    public string GooglePlaceId { get; set; } = string.Empty;

    public string Nome { get; set; } = string.Empty;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public string Endereco { get; set; } = string.Empty;

    public int CategoriaId { get; set; }

    public Categoria Categoria { get; set; } = null!;

    public ICollection<Missao> Missoes { get; set; }
        = new List<Missao>();
}