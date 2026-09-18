namespace MeuSistema.Models;

public class Categoria
{
    public int Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public string TipoMissao { get; set; } = string.Empty;

    public string Descricao { get; set; } = string.Empty;

    public ICollection<PontoInteresse> PontosInteresse { get; set; }
        = new List<PontoInteresse>();
}