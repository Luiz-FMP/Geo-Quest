using GeoQuest.Domain.Animation;
using Microsoft.AspNetCore.Mvc;

namespace GeoQuest.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AnimationController : ControllerBase
{
    /// <summary>
    /// Retorna as animações e parâmetros de recorte configurados para o personagem informado.
    /// </summary>
    [HttpGet("characters/{characterName}")]
    public IActionResult GetCharacterAnimation(string characterName)
    {
        var animator = CharacterAnimationFactory.CreateAnimatorFor(characterName);
        var current = animator.CurrentAnimation;

        if (current == null)
        {
            return NotFound(new { message = $"Nenhuma animação encontrada para {characterName}" });
        }

        return Ok(new
        {
            Character = characterName,
            SpriteSheet = $"/sprites/sprite_sheet_{characterName.ToLowerInvariant().Replace("é", "e")}.png",
            AnimationName = current.Name,
            FrameDuration = current.FrameDuration,
            IsLooping = current.IsLooping,
            IsPingPong = current.IsPingPong,
            PlaybackSpeed = current.PlaybackSpeed,
            TotalFrames = current.FrameCount,
            Frames = current.Frames
        });
    }
}

