namespace GeoQuest.Api.DTOs;

public class GamePoiDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public double Lat { get; set; }
    public double Lng { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Subcategory { get; set; } = string.Empty;
    public string Color { get; set; } = "#C89B5C";
    public bool IsBossSpecial { get; set; }
}
