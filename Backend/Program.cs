using Microsoft.EntityFrameworkCore;
using GeoQuest.Api.Data;
using GeoQuest.Api.Integrations;
using GeoQuest.Api.Services;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Data Source=geoquest.db";

builder.Services.AddDbContext<GeoQuestDbContext>(options =>
    options.UseSqlite(connectionString));

builder.Services.AddHttpClient<IGooglePlacesClient, GooglePlacesClient>();
builder.Services.AddScoped<CombatService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<GeoQuestDbContext>();
    await dbContext.Database.EnsureCreatedAsync();
    await DatabaseInitializer.SeedDataAsync(dbContext);
}

app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

app.Run();
