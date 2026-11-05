using System;
using System.Collections.Generic;

namespace GeoQuest.Domain.Animation
{
    /// <summary>
    /// Fábrica que constrói os animadores com as coordenadas exatas dos sprite sheets
    /// transparentes (500x500) dos personagens do Geo-Quest.
    /// </summary>
    public static class CharacterAnimationFactory
    {
        public static Animator CreateAnimatorFor(string characterName)
        {
            return characterName?.Trim().ToLowerInvariant() switch
            {
                "miguel" => CreateMiguelAnimator(),
                "amélia" or "amelia" => CreateAmeliaAnimator(),
                "benjamin" => CreateBenjaminAnimator(),
                "z" => CreateZAnimator(),
                _ => CreateMiguelAnimator()
            };
        }

        public static Animator CreateMiguelAnimator()
        {
            var animator = new Animator();

            // IDLE: 4 frames na linha 3 com pés alinhados em Y=355
            var idle = new Animation("idle", frameDuration: 0.20f, isLooping: true, isPingPong: true);
            idle.AddFrame(new SpriteFrame(11, 290, 55, 66, anchorX: 0.5f, anchorY: 1.0f));
            idle.AddFrame(new SpriteFrame(65, 291, 48, 65, anchorX: 0.5f, anchorY: 1.0f));
            idle.AddFrame(new SpriteFrame(110, 291, 57, 65, anchorX: 0.5f, anchorY: 1.0f));
            idle.AddFrame(new SpriteFrame(165, 261, 57, 95, anchorX: 0.5f, anchorY: 1.0f));

            animator.AddAnimation(idle);
            return animator;
        }

        public static Animator CreateAmeliaAnimator()
        {
            var animator = new Animator();

            var idle = new Animation("idle", frameDuration: 0.20f, isLooping: true, isPingPong: true);
            idle.AddFrame(new SpriteFrame(10, 270, 56, 86, anchorX: 0.5f, anchorY: 1.0f));
            idle.AddFrame(new SpriteFrame(60, 270, 56, 86, anchorX: 0.5f, anchorY: 1.0f));
            idle.AddFrame(new SpriteFrame(110, 270, 61, 86, anchorX: 0.5f, anchorY: 1.0f));
            idle.AddFrame(new SpriteFrame(165, 260, 65, 96, anchorX: 0.5f, anchorY: 1.0f));

            animator.AddAnimation(idle);
            return animator;
        }

        public static Animator CreateBenjaminAnimator()
        {
            var animator = new Animator();

            var idle = new Animation("idle", frameDuration: 0.20f, isLooping: true, isPingPong: true);
            idle.AddFrame(new SpriteFrame(11, 264, 55, 90, anchorX: 0.5f, anchorY: 1.0f));
            idle.AddFrame(new SpriteFrame(60, 264, 56, 90, anchorX: 0.5f, anchorY: 1.0f));
            idle.AddFrame(new SpriteFrame(110, 264, 61, 90, anchorX: 0.5f, anchorY: 1.0f));
            idle.AddFrame(new SpriteFrame(165, 264, 66, 90, anchorX: 0.5f, anchorY: 1.0f));

            animator.AddAnimation(idle);
            return animator;
        }

        public static Animator CreateZAnimator()
        {
            var animator = new Animator();

            var idle = new Animation("idle", frameDuration: 0.20f, isLooping: true, isPingPong: true);
            idle.AddFrame(new SpriteFrame(10, 267, 56, 85, anchorX: 0.5f, anchorY: 1.0f));
            idle.AddFrame(new SpriteFrame(60, 268, 56, 88, anchorX: 0.5f, anchorY: 1.0f));
            idle.AddFrame(new SpriteFrame(110, 267, 61, 89, anchorX: 0.5f, anchorY: 1.0f));
            idle.AddFrame(new SpriteFrame(165, 268, 66, 84, anchorX: 0.5f, anchorY: 1.0f));

            animator.AddAnimation(idle);
            return animator;
        }
    }
}

