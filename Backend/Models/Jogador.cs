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

    public Personagem? Personagem { get; set; }

    public EstatisticaJogador? Estatisticas { get; set; }

    public ICollection<ItemInventario> ItensInventario { get; set; } = new List<ItemInventario>();

    public ICollection<BuffJogador> Buffs { get; set; } = new List<BuffJogador>();

    public ICollection<MissaoConcluida> MissoesConcluidas { get; set; } = new List<MissaoConcluida>();
}
