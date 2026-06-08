import Phaser from 'phaser';
import { Juice } from '../data/Tunables';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Sfx } from '../systems/Sfx';
import { JuiceSystem } from '../systems/JuiceSystem';
import { ParticleSystem } from '../systems/ParticleSystem';

/** Centralizes "what happens on a hit" so entities stay dumb: the blade's active
 *  hitbox damaging struggles, and struggles damaging the figure on contact. */
export class CombatSystem {
  constructor(
    private scene: Phaser.Scene,
    private player: Player,
    private enemies: Phaser.GameObjects.Group,
    private sfx: Sfx,
    private juice: JuiceSystem,
    private particles: ParticleSystem,
  ) {
    scene.physics.add.overlap(player.hitbox, enemies, this.onBladeHit, undefined, this);
    scene.physics.add.overlap(player, enemies, this.onContact, undefined, this);
  }

  private onBladeHit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_hb, enemyObj) => {
    const enemy = enemyObj as Enemy;
    if (!this.player.hitbox.live || !enemy.isAlive()) return;
    if (this.player.hitbox.hitSet.has(enemy)) return;
    this.player.hitbox.hitSet.add(enemy);

    // Striking the exposed molten core (during its windup, or from behind) is the
    // high-reward punish: bonus damage, the lunge is interrupted, the core flares.
    const core = enemy.isCoreHit(this.player.x);
    const base = this.player.attackDamage; // current combo hit's damage
    const dmg = core ? base * enemy.coreBonusMult : base;
    enemy.takeDamage(dmg, this.player.x, core);

    this.sfx.hit();
    this.juice.hitstop(core || !enemy.isAlive() ? Juice.hitstopHeavyMs : Juice.hitstopMs);
    if (core) this.juice.shake(Juice.shakeHurt.duration, Juice.shakeHurt.intensity);
    else this.juice.shakeHit();
    if (core) this.particles.debris(enemy.x, enemy.y - 14, 12);
    else this.particles.sparks(enemy.x, enemy.y - 8, 9);
  };

  private onContact: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_p, enemyObj) => {
    const enemy = enemyObj as Enemy;
    // Touch alone is harmless — only a committed attack (lunge/charge/strike) hurts.
    if (!enemy.isAlive() || !enemy.isAttacking()) return;
    this.player.takeDamage(enemy.contactDamage, enemy.x);
  };
}
