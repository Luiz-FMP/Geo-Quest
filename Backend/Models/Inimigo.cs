namespace GeoQuest.Api.Models;

public class Inimigo
{
    public int Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public string Descricao { get; set; } = string.Empty;

    public int Vida { get; set; }

    public int Ataque { get; set; }

    public int Defesa { get; set; }
}
