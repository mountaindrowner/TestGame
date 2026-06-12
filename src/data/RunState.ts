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
  untrueImageDefeated: boolean; // BIO-02 mini-boss (THE UNTRUE IMAGE) beaten
  accuserDefeated: boolean; // BIO-03 boss (THE ACCUSER) beaten
  witnessMark: boolean; // the Court's key — "no longer defined by your failure"
  quietFlame: boolean; // PERMANENT, granted by the Accuser — opens the Sealed Evidence
  graceBurst: boolean; // Grace Burst air-dash unlocked (earned from the Warden)
  souls: number; // currency dropped by foes / urns
  graces: { vigor: number; edge: number; grace: number; gather: number }; // Sanctuary altar levels
  pacts: string[]; // one-time Stranger pacts taken (lifetime-capped)
  embers: { blade: number; life: number; spirit: number }; // RUN-scoped Grace Ember boosts
  embersTaken: string[]; // which placed embers were collected this run (room:tx,ty)
  discovered: string[]; // composed sub-rooms the player has entered (the explored map)
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

  /** Begin a new RUN (death / hub depart / area complete). PERMANENT things
   *  survive — altar graces, pacts, unlocked moves (Grace Burst) — and gathered
   *  souls are banked at the Place of Return. Everything run-scoped (keys, felled
   *  wardens, embers, health) resets: the route is walked again, in grace. */
  reset(startRoomId: string): RunStateData {
    const prev = this.registry.get(KEY) as RunStateData | undefined;
    const d = this.fresh(startRoomId);
    if (prev) {
      d.graces = prev.graces;
      d.pacts = prev.pacts;
      d.graceBurst = prev.graceBurst;
      d.quietFlame = prev.quietFlame; // permanent, like Grace Burst
      d.souls = prev.souls;
      d.discovered = prev.discovered ?? []; // the explored map persists across runs (metroidvania feel)
    }
    this.registry.set(KEY, d);
    return d;
  }

  private fresh(roomId: string): RunStateData {
    return {
      health: PlayerTune.maxHealth,
      maxHealth: PlayerTune.maxHealth,
      hasBrokenMemory: false,
      guardianDefeated: false,
      untrueImageDefeated: false,
      accuserDefeated: false,
      witnessMark: false,
      quietFlame: false,
      graceBurst: false,
      souls: 0,
      graces: { vigor: 0, edge: 0, grace: 0, gather: 0 },
      pacts: [],
      embers: { blade: 0, life: 0, spirit: 0 },
      embersTaken: [],
      discovered: [],
      currentRoomId: roomId,
    };
  }

  /** Mark a composed sub-room as discovered. Returns true if it was newly revealed. */
  discover(id: string): boolean {
    const d = this.data;
    if (!d.discovered) d.discovered = [];
    if (d.discovered.includes(id)) return false;
    d.discovered.push(id);
    return true;
  }
  get discovered(): string[] {
    return this.data.discovered ?? [];
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
  get untrueImageDefeated(): boolean {
    return this.data.untrueImageDefeated;
  }
  set untrueImageDefeated(v: boolean) {
    this.data.untrueImageDefeated = v;
  }
  get accuserDefeated(): boolean {
    return this.data.accuserDefeated;
  }
  set accuserDefeated(v: boolean) {
    this.data.accuserDefeated = v;
  }
  get witnessMark(): boolean {
    return this.data.witnessMark;
  }
  set witnessMark(v: boolean) {
    this.data.witnessMark = v;
  }
  get quietFlame(): boolean {
    return this.data.quietFlame;
  }
  set quietFlame(v: boolean) {
    this.data.quietFlame = v;
  }
  get graceBurst(): boolean {
    return this.data.graceBurst;
  }
  set graceBurst(v: boolean) {
    this.data.graceBurst = v;
  }
  get souls(): number {
    return this.data.souls;
  }
  set souls(v: number) {
    this.data.souls = v;
  }
  get graces(): { vigor: number; edge: number; grace: number; gather: number } {
    return this.data.graces;
  }
  get pacts(): string[] {
    return this.data.pacts;
  }
  get maxHealth(): number {
    return this.data.maxHealth;
  }
  set maxHealth(v: number) {
    this.data.maxHealth = v;
  }
}
