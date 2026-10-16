namespace GeoQuest.Api.Models;

public class Categoria
{
    public int Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public string TipoMissao { get; set; } = string.Empty;

    public string Descricao { get; set; } = string.Empty;

    public ICollection<MissaoConcluida> MissoesConcluidas { get; set; } = new List<MissaoConcluida>();
}
