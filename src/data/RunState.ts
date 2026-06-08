import Phaser from 'phaser';
import { PlayerTune } from './Tunables';

/** Per-run state that must SURVIVE room transitions. GameScene is rebuilt on each
 *  transition (scene.restart), so this cannot live on the scene — it lives in the
 *  global Phaser registry (shared across scenes, persists across scene.restart).
 *  RunState is a typed wrapper over that registry slot. */
export interface RunStateData {
  health: number;
  maxHealth: number;
  hasBrokenMemory: boolean; // the key found in a branch
  guardianDefeated: boolean; // the gate guardian beaten
  graceBurst: boolean; // Grace Burst air-dash unlocked (earned from the Warden)
  currentRoomId: string;
  entryDoorId?: string; // which door we entered the current room from
}

const KEY = 'run';

export class RunState {
  constructor(private registry: Phaser.Data.DataManager) {}

  /** Return the live run, creating a fresh one (full health, no key) if none exists. */
  ensure(startRoomId: string): RunStateData {
    let d = this.registry.get(KEY) as RunStateData | undefined;
    if (!d) {
      d = this.fresh(startRoomId);
      this.registry.set(KEY, d);
    }
    return d;
  }

  /** Begin a brand-new run (called on first boot and on "restart run"). */
  reset(startRoomId: string): RunStateData {
    const d = this.fresh(startRoomId);
    this.registry.set(KEY, d);
    return d;
  }

  private fresh(roomId: string): RunStateData {
    return {
      health: PlayerTune.maxHealth,
      maxHealth: PlayerTune.maxHealth,
      hasBrokenMemory: false,
      guardianDefeated: false,
      graceBurst: false,
      currentRoomId: roomId,
    };
  }

  // The stored object is held by reference, so in-place mutation persists across
  // scene.restart. Accessors keep call sites readable and the key encapsulated.
  get data(): RunStateData {
    return this.registry.get(KEY) as RunStateData;
  }
  get health(): number {
    return this.data.health;
  }
  set health(v: number) {
    this.data.health = v;
  }
  get hasBrokenMemory(): boolean {
    return this.data.hasBrokenMemory;
  }
  set hasBrokenMemory(v: boolean) {
    this.data.hasBrokenMemory = v;
  }
  get guardianDefeated(): boolean {
    return this.data.guardianDefeated;
  }
  set guardianDefeated(v: boolean) {
    this.data.guardianDefeated = v;
  }
  get graceBurst(): boolean {
    return this.data.graceBurst;
  }
  set graceBurst(v: boolean) {
    this.data.graceBurst = v;
  }
}
