namespace GeoQuest.Api.Models;

public class Personagem
{
    public int Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public string Descricao { get; set; } = string.Empty;

    public int Vida { get; set; }

    public int Ataque { get; set; }

    public int Defesa { get; set; }

    public string Vantagem { get; set; } = string.Empty;

    public ICollection<Jogador> Jogadores { get; set; } = new List<Jogador>();
}
