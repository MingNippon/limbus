export type SinAffinity = 'wrath' | 'lust' | 'sloth' | 'gluttony' | 'gloom' | 'pride' | 'envy';

export type AttackType = 'slash' | 'pierce' | 'blunt';

export type DefenseType = 'guard' | 'evade' | 'counter';

export type StatusEffectType =
  | 'burn'
  | 'bleed'
  | 'tremor'
  | 'rupture'
  | 'sinking'
  | 'poise'
  | 'charge'
  | 'paralyze'
  | 'fragile'
  | 'protection'
  | 'attack_up'
  | 'attack_down';

export type RiskLevel = 'ZAYIN' | 'TETH' | 'HE' | 'WAW' | 'ALEPH';

export interface StatusInstance {
  type: StatusEffectType;
  potency: number;
  count: number;
}

export interface CoinEffect {
  trigger: 'on_hit' | 'heads_hit' | 'tails_hit' | 'on_use' | 'clash_win' | 'clash_lose' | 'on_kill';
  status?: StatusEffectType;
  potency?: number;
  count?: number;
  target?: 'enemy' | 'self' | 'all_allies';
  tremorBurst?: boolean;
  healHp?: number;
  healSp?: number;
  bonusDamagePercent?: number;
  consumeCharge?: number;
  coinPowerBonus?: number;
  description: string;
}

export interface SkillData {
  id: string;
  slot: 1 | 2 | 3; // S1 (x3 in bag), S2 (x2 in bag), S3 (x1 in bag)
  name: string;
  sin: SinAffinity;
  attackType: AttackType;
  basePower: number;
  coinPower: number; // Can be negative for Minus Coin skills (e.g. N Corp Sinclair)
  coins: number;
  offenseLevelOffset: number;
  attackWeight: number; // 1 = single target, 2+ = AOE
  effects: CoinEffect[];
}

export interface DefenseSkillData {
  name: string;
  type: DefenseType;
  sin: SinAffinity;
  basePower: number;
  coinPower: number;
  coins: number;
  effectText: string;
}

export interface IdentityData {
  id: string;
  sinnerId: number; // 1 to 12
  name: string;
  title: string;
  world: string;
  rarity: 1 | 2 | 3; // 0, 00, 000
  hpBase: number;
  speedMin: number;
  speedMax: number;
  defenseLevelOffset: number;
  resistances: {
    slash: number; // 0.5 (Ineff.), 1.0 (Normal), 1.5 (Weak), 2.0 (Fatal)
    pierce: number;
    blunt: number;
  };
  staggerThresholds: number[]; // Percentages of max HP, e.g. [0.65, 0.35, 0.15]
  skills: [SkillData, SkillData, SkillData];
  defenseSkill: DefenseSkillData;
  passiveName: string;
  passiveSin: SinAffinity;
  passiveReqCount: number;
  passiveDesc: string;
  isNegativeCoin?: boolean;
  portraitUrl: string;
  spriteColor: string;
  weaponStyle: 'sword' | 'spear' | 'gauntlet' | 'halberd' | 'katana' | 'dagger' | 'bat' | 'harpoon' | 'axe' | 'claw' | 'rifle';
}

export interface EgoData {
  id: string;
  sinnerId: number;
  name: string;
  abnormalityName: string;
  riskLevel: RiskLevel;
  sin: SinAffinity;
  attackType: AttackType;
  basePower: number;
  coinPower: number;
  coins: number;
  attackWeight: number;
  spCost: number;
  sinCost: Partial<Record<SinAffinity, number>>;
  quote: string;
  corrosionQuote: string;
  effects: CoinEffect[];
  passiveName: string;
  passiveDesc: string;
}

export interface SinnerData {
  id: number; // 1 to 12
  numberStr: string; // "01" to "13" (skipping #10 Dante)
  name: string;
  koreanName: string;
  motto: string;
  color: string;
  portraitUrl: string;
  vnSpriteUrl?: string;
  voiceSfxUrl?: string;
  lobbyLines: string[];
}

export interface EnemySkillData {
  id: string;
  name: string;
  sin: SinAffinity;
  attackType: AttackType;
  basePower: number;
  coinPower: number;
  coins: number;
  attackWeight: number;
  effects: CoinEffect[];
}

export interface AbnormalityCheckEvent {
  title: string;
  description: string;
  recommendedSin: SinAffinity;
  difficulty: number;
  successText: string;
  failureText: string;
  onSuccessReward: {
    spAllAllies?: number;
    staggerBoss?: boolean;
    sinResources?: Partial<Record<SinAffinity, number>>;
    buffAllAllies?: { type: StatusEffectType; potency: number; count: number };
  };
  onFailurePenalty: {
    hpDamageReader?: number;
    spDamageReader?: number;
    bossBuff?: { type: StatusEffectType; potency: number; count: number };
  };
}

export interface EnemyTemplate {
  id: string;
  name: string;
  title: string;
  isAbnormality: boolean;
  isBoss: boolean;
  riskLevel?: RiskLevel;
  maxHp: number;
  speedMin: number;
  speedMax: number;
  slotsPerTurn: number;
  hasSanity: boolean;
  resistances: {
    slash: number;
    pierce: number;
    blunt: number;
  };
  staggerThresholds: number[];
  skills: EnemySkillData[];
  passiveName: string;
  passiveDesc: string;
  portraitUrl: string;
  accentColor: string;
  scale?: number;
  abnormalityEvent?: AbnormalityCheckEvent;
}

export interface StoryCutsceneLine {
  speaker: string;
  title?: string;
  text: string;
  portraitUrl?: string;
  side?: 'left' | 'right' | 'center';
  sfx?: string;
  bgEffect?: 'shake' | 'red_flash' | 'clock_tick';
}

export interface CantoStage {
  id: string;
  cantoNumber: number;
  stageCode: string; // e.g., "1-4", "3-22", "4-48", "5-30", "6-44"
  title: string;
  subtitle: string;
  recommendedLevel: number;
  focusedEncounter: boolean;
  backgroundUrl: string;
  bgmKey:
    | 'title'
    | 'lobby'
    | 'team'
    | 'extract'
    | 'story'
    | 'battle'
    | 'battle_middle'
    | 'boss_kromer'
    | 'boss_dongbaek'
    | 'boss_ahab'
    | 'boss_violet'
    | 'boss_hero'
    | 'victory';
  enemies: string[]; // EnemyTemplate IDs
  preCutscene: StoryCutsceneLine[];
  postCutscene: StoryCutsceneLine[];
  rewards: {
    lunacy: number;
    expTickets: number;
    thread: number;
    shards: number;
  };
}

export interface EgoGiftData {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  sin: SinAffinity;
  keyword: StatusEffectType | 'general';
  iconUrl: string;
  description: string;
  cost: number;
  combatEffect: {
    bonusClashPower?: number;
    bonusCoinPowerSin?: SinAffinity;
    startBattleStatusOnEnemies?: { type: StatusEffectType; potency: number; count: number };
    startBattleStatusOnAllies?: { type: StatusEffectType; potency: number; count: number };
    bonusStatusOnHit?: { type: StatusEffectType; potency: number; count: number };
    healOnKillPercent?: number;
    freeStartingSin?: SinAffinity;
  };
}

export type MirrorNodeType = 'battle' | 'elite' | 'abnormality_event' | 'rest_shop' | 'boss';

export interface MirrorNode {
  id: string;
  floor: number;
  column: number;
  row: number;
  type: MirrorNodeType;
  title: string;
  subtitle: string;
  enemies?: string[];
  completed: boolean;
  nextNodeIds: string[];
}

export interface MirrorRunState {
  active: boolean;
  floor: number;
  maxFloors: number;
  costCurrency: number;
  starlightEarned: number;
  collectedGiftIds: string[];
  currentNodeId: string | null;
  completedNodeIds: string[];
  nodes: MirrorNode[];
  sinnerHpPercents: Record<number, number>; // Persist HP across floor nodes
  sinnerSpValues: Record<number, number>;   // Persist SP across floor nodes
}

export interface PlayerSaveState {
  managerLevel: number;
  lunacy: number;
  enkephalin: number;
  maxEnkephalin: number;
  enkephalinModules: number;
  thread: number;
  expTickets: number;
  egoshards: Record<number, number>; // Sinner ID -> Shards count
  unlockedIdentityIds: string[];
  unlockedEgoIds: string[];
  equippedIdentityBySinner: Record<number, string>;
  equippedEgosBySinner: Record<number, Partial<Record<RiskLevel, string>>>;
  identityLevels: Record<string, number>;
  identityUpties: Record<string, 1 | 2 | 3 | 4>;
  deployedSinnerIds: number[]; // Up to 6 Sinners deployed in active squad
  lobbySinnerId: number;
  clearedStageIds: string[];
  starlight: number;
  mirrorRun: MirrorRunState | null;
  bgmMuted: boolean;
  sfxMuted: boolean;
}
