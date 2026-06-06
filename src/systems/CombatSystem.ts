import Phaser from 'phaser';
import { PlayerTune, Juice } from '../data/Tunables';
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

    enemy.takeDamage(PlayerTune.attackDamage, this.player.x);
    this.sfx.hit();
    this.juice.hitstop(enemy.isAlive() ? Juice.hitstopMs : Juice.hitstopHeavyMs);
    this.juice.shakeHit();
    this.particles.sparks(enemy.x, enemy.y - 8, 9);
  };

  private onContact: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_p, enemyObj) => {
    const enemy = enemyObj as Enemy;
    if (!enemy.isAlive()) return;
    this.player.takeDamage(enemy.contactDamage, enemy.x);
  };
}
