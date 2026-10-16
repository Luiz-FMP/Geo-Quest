namespace GeoQuest.Api.Models;

public class Cidade
{
    public int Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public string Estado { get; set; } = string.Empty;

    public string Pais { get; set; } = string.Empty;

    public ICollection<Boss> Bosses { get; set; }
        = new List<Boss>();
}
