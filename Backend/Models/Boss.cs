namespace GeoQuest.Api.Models;

public class Boss
{
    public int Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public int Vida { get; set; }

    public int Ataque { get; set; }

    public int Defesa { get; set; }

    public int CidadeId { get; set; }

    public Cidade? Cidade { get; set; }
}
