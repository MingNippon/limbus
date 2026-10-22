import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AbnormalityCheckEvent,
  AttackType,
  CantoStage,
  CoinEffect,
  EgoData,
  EgoGiftData,
  EnemySkillData,
  EnemyTemplate,
  IdentityData,
  SinAffinity,
  SinnerData,
  SkillData,
  StatusEffectType,
  StatusInstance,
} from '../types/game';
import {
  ALL_SINS,
  ATTACK_TYPE_INFO,
  DEFENSE_TYPE_INFO,
  EGO_GIFTS,
  estimateClashOutcome,
  getResistanceLabel,
  RISK_LEVEL_COLOR,
  SIN_INFO,
  STATUS_INFO,
} from '../data/constants';
import { ENEMY_TEMPLATES } from '../data/stagesAndStory';
import {
  OFFICIAL_CHARON_ANNOUNCER,
  OFFICIAL_DANTE_ANNOUNCER,
  OFFICIAL_MILI_LYRICS,
} from '../data/steamOfficialData';
import { soundManager } from '../audio/SoundManager';
import {
  Flame,
  Shield,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
  Zap,
  RotateCcw,
  FastForward,
  Skull,
  Award,
} from 'lucide-react';

interface BattleUnit {
  uid: string;
  isAlly: boolean;
  sinner?: SinnerData;
  identity?: IdentityData;
  enemyTemplate?: EnemyTemplate;
  name: string;
  title: string;
  level: number;
  maxHp: number;
  hp: number;
  shield: number;
  sp: number; // -45 to +45
  hasSanity: boolean;
  speedMin: number;
  speedMax: number;
  currentSpeed: number;
  resistances: { slash: number; pierce: number; blunt: number };
  staggerThresholds: number[]; // Absolute HP values
  isStaggered: boolean;
  staggerLevel: number; // 0, 1 (Stagger), 2 (Stagger+), 3 (Stagger++)
  statuses: StatusInstance[];
  portraitUrl: string;
  vnSpriteUrl?: string;
  accentColor: string;
  // Skill bag for Sinners (indices 0..2 corresponding to S1, S2, S3)
  topSkill: SkillData;
  bottomSkill: SkillData;
  selectedRow: 'top' | 'bottom' | 'defense' | 'ego';
  selectedEgo?: EgoData;
  isOverclocked?: boolean;
  targetEnemySlotUid?: string;
  // Anim states
  animState: 'idle' | 'move_center' | 'attack' | 'hit' | 'stagger' | 'evade';
  currentPose: string; // 'idle' | 'move' | 'dmg' | 'guard' | 's1_1'..'s1_3' | 's2_1'..'s2_3' | 's3_1'..'s3_4'
  strikeComboIdx?: number;
}

const BOSS_SPRITE_FOLDER_MAP: Record<string, string> = {
  ricardo: 'ricardo',
  ahab: 'ahab',
  erlking_heathcliff: 'ahab',
  dongbaek: 'dongbaek',
  golden_apple: 'dongbaek',
  dongrang: 'dongrang',
  shock_centipede: 'dongrang',
  kromer: 'kimsatgat',
  n_corp_inquisitor: 'kimsatgat',
  first_kindred_don: 'real_don',
  syndicate_thug: 'real_don',
  k_corp_guard: 'ricardo',
};

export function getUnitPoseSpriteUrl(unit: BattleUnit): string {
  const pose = unit.isStaggered ? 'dmg' : unit.currentPose || 'idle';
  if (unit.isAlly && unit.sinner) {
    return `/assets/steam/chars/sinner_${unit.sinner.id}/${pose}.webp`;
  }
  if (!unit.isAlly && unit.enemyTemplate) {
    const folder = BOSS_SPRITE_FOLDER_MAP[unit.enemyTemplate.id] || 'ricardo';
    return `/assets/steam/bosses/${folder}/${pose}.webp`;
  }
  return unit.portraitUrl;
}

const ATTACK_POSE_SEQUENCES: Record<number, string[]> = {
  1: ['s1_1', 's1_2', 's1_3', 's2_1'],
  2: ['s2_1', 's2_2', 's2_3', 's3_1'],
  3: ['s3_1', 's3_2', 's3_3', 's3_4'],
};

const CLASH_POSE_POOL = ['s1_1', 's1_2', 's2_1', 's2_2', 's3_1', 's3_2', 's1_3', 's2_3', 's3_3', 's3_4'];


interface EnemySlot {
  slotUid: string;
  enemyUid: string;
  speed: number;
  skill: EnemySkillData;
  targetAllyUid: string;
  clashingAllyUid?: string;
}

interface FloatingTextItem {
  id: string;
  unitUid: string;
  text: string;
  subtext?: string;
  color: string;
  isCrit?: boolean;
}

interface LiveClashState {
  allyName: string;
  enemyName: string;
  allySkillName: string;
  enemySkillName: string;
  allySin: SinAffinity;
  enemySin: SinAffinity;
  allyAttackType: AttackType;
  enemyAttackType: AttackType;
  allyBase: number;
  allyCoin: number;
  allyCoinsRemaining: number;
  allyCoinResults: ('heads' | 'tails' | 'unflipped')[];
  allyTotalPower: number;
  enemyBase: number;
  enemyCoin: number;
  enemyCoinsRemaining: number;
  enemyCoinResults: ('heads' | 'tails' | 'unflipped')[];
  enemyTotalPower: number;
  clashCount: number;
  statusBanner: string;
}

interface EgoCutInState {
  sinner: SinnerData;
  ego: EgoData;
  corroded: boolean;
}

interface BattleScreenProps {
  stage: CantoStage;
  deployedSinners: {
    sinner: SinnerData;
    identity: IdentityData;
    egos: EgoData[];
    level: number;
    uptie: number;
    initialHpPercent?: number;
    initialSp?: number;
  }[];
  activeGiftIds: string[];
  onVictory: (survivingState: { hpPercents: Record<number, number>; spValues: Record<number, number> }) => void;
  onDefeat: () => void;
}

function drawTwoSkills(identity: IdentityData): [SkillData, SkillData] {
  // Bag has 3x S1, 2x S2, 1x S3
  const bag: SkillData[] = [
    identity.skills[0],
    identity.skills[0],
    identity.skills[0],
    identity.skills[1],
    identity.skills[1],
    identity.skills[2],
  ];
  const idx1 = Math.floor(Math.random() * bag.length);
  let idx2 = Math.floor(Math.random() * bag.length);
  if (idx2 === idx1) idx2 = (idx1 + 1) % bag.length;
  return [bag[idx1], bag[idx2]];
}

function addOrMergeStatus(
  list: StatusInstance[],
  type: StatusEffectType,
  potencyDelta: number,
  countDelta: number
): StatusInstance[] {
  const next = [...list];
  const existing = next.find((s) => s.type === type);
  if (existing) {
    existing.potency = Math.min(99, Math.max(1, existing.potency + potencyDelta));
    existing.count = Math.min(99, Math.max(1, existing.count + countDelta));
  } else {
    next.push({
      type,
      potency: Math.max(1, potencyDelta),
      count: Math.max(1, countDelta),
    });
  }
  return next;
}

function getStatusPotency(list: StatusInstance[], type: StatusEffectType): number {
  return list.find((s) => s.type === type)?.potency ?? 0;
}

function rollCoinHeads(sp: number): boolean {
  const prob = Math.min(0.95, Math.max(0.05, 0.5 + sp / 100));
  return Math.random() < prob;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  stage,
  deployedSinners,
  activeGiftIds,
  onVictory,
  onDefeat,
}) => {
  const activeGifts: EgoGiftData[] = useMemo(
    () => EGO_GIFTS.filter((g) => activeGiftIds.includes(g.id)),
    [activeGiftIds]
  );

  // Initialize Allies & Enemies
  const [allies, setAllies] = useState<BattleUnit[]>(() =>
    deployedSinners.map(({ sinner, identity, level, uptie, initialHpPercent, initialSp }) => {
      const maxHp = Math.round(identity.hpBase + level * 2.8 + uptie * 12);
      const startHp = initialHpPercent !== undefined ? Math.max(1, Math.round(maxHp * initialHpPercent)) : maxHp;
      const [topSkill, bottomSkill] = drawTwoSkills(identity);
      const speed =
        identity.speedMin + Math.floor(Math.random() * (identity.speedMax - identity.speedMin + 1));

      let initStatuses: StatusInstance[] = [];
      activeGifts.forEach((g) => {
        if (g.combatEffect.startBattleStatusOnAllies) {
          const st = g.combatEffect.startBattleStatusOnAllies;
          initStatuses = addOrMergeStatus(initStatuses, st.type, st.potency, st.count);
        }
      });

      return {
        uid: `ally_${sinner.id}`,
        isAlly: true,
        sinner,
        identity,
        name: identity.name,
        title: sinner.name,
        level,
        maxHp,
        hp: startHp,
        shield: 0,
        sp: initialSp ?? 0,
        hasSanity: true,
        speedMin: identity.speedMin,
        speedMax: identity.speedMax,
        currentSpeed: speed,
        resistances: { ...identity.resistances },
        staggerThresholds: identity.staggerThresholds.map((pct) => Math.round(maxHp * pct)),
        isStaggered: false,
        staggerLevel: 0,
        statuses: initStatuses,
        portraitUrl: identity.portraitUrl,
        vnSpriteUrl: sinner.vnSpriteUrl || sinner.portraitUrl,
        accentColor: sinner.color,
        topSkill,
        bottomSkill,
        selectedRow: 'top',
        animState: 'idle',
        currentPose: 'idle',
      };
    })
  );

  const [enemies, setEnemies] = useState<BattleUnit[]>(() =>
    stage.enemies.map((templateId, idx) => {
      const tpl = ENEMY_TEMPLATES[templateId] || ENEMY_TEMPLATES.syndicate_thug;
      const speed = tpl.speedMin + Math.floor(Math.random() * (tpl.speedMax - tpl.speedMin + 1));
      let initStatuses: StatusInstance[] = [];
      activeGifts.forEach((g) => {
        if (g.combatEffect.startBattleStatusOnEnemies) {
          const st = g.combatEffect.startBattleStatusOnEnemies;
          initStatuses = addOrMergeStatus(initStatuses, st.type, st.potency, st.count);
        }
      });

      return {
        uid: `enemy_${idx}_${tpl.id}`,
        isAlly: false,
        enemyTemplate: tpl,
        name: tpl.name,
        title: tpl.title,
        level: stage.recommendedLevel,
        maxHp: tpl.maxHp,
        hp: tpl.maxHp,
        shield: 0,
        sp: 0,
        hasSanity: tpl.hasSanity,
        speedMin: tpl.speedMin,
        speedMax: tpl.speedMax,
        currentSpeed: speed,
        resistances: { ...tpl.resistances },
        staggerThresholds: tpl.staggerThresholds.map((pct) => Math.round(tpl.maxHp * pct)),
        isStaggered: false,
        staggerLevel: 0,
        statuses: initStatuses,
        portraitUrl: tpl.portraitUrl,
        accentColor: tpl.accentColor,
        topSkill: {} as SkillData,
        bottomSkill: {} as SkillData,
        selectedRow: 'top',
        animState: 'idle',
        currentPose: 'idle',
      };
    })
  );

  const [turnNumber, setTurnNumber] = useState(1);
  const [phase, setPhase] = useState<'planning' | 'executing' | 'abnormality_check' | 'victory' | 'defeat'>('planning');
  const [sinResources, setSinResources] = useState<Record<SinAffinity, number>>(() => {
    const base: Record<SinAffinity, number> = {
      wrath: 2,
      lust: 2,
      sloth: 2,
      gluttony: 2,
      gloom: 2,
      pride: 2,
      envy: 2,
    };
    activeGifts.forEach((g) => {
      if (g.combatEffect.freeStartingSin) {
        base[g.combatEffect.freeStartingSin] += 2;
      }
    });
    return base;
  });

  const [enemySlots, setEnemySlots] = useState<EnemySlot[]>([]);
  const [selectedAllyUid, setSelectedAllyUid] = useState<string | null>(null);
  const [egoModalAllyUid, setEgoModalAllyUid] = useState<string | null>(null);
  const [liveClash, setLiveClash] = useState<LiveClashState | null>(null);
  const [egoCutIn, setEgoCutIn] = useState<EgoCutInState | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const [screenShake, setScreenShake] = useState<'none' | 'light' | 'heavy'>('none');
  const [slashVfxTargetUid, setSlashVfxTargetUid] = useState<{
    uid: string;
    type: AttackType;
    color: string;
    slashImgUrl: string;
    rotationDeg: number;
    coinIdx: number;
    poseLabel?: string;
  } | null>(null);
  const [combatLog, setCombatLog] = useState<string[]>([
    `[TURN 1] Mephistopheles Combat System Engaged — ${stage.title} (${stage.stageCode})`,
  ]);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2>(1);
  const [abnormalityEventTriggered, setAbnormalityEventTriggered] = useState(false);
  const [lyricIdx, setLyricIdx] = useState(0);
  const [announcerIdx, setAnnouncerIdx] = useState(0);
  const [announcerSpeaker, setAnnouncerSpeaker] = useState<'Dante' | 'Charon'>('Dante');

  const activeBgmMeta = soundManager.getActiveTrackMeta();
  const activeLyrics =
    (activeBgmMeta && OFFICIAL_MILI_LYRICS[activeBgmMeta.key]) ||
    OFFICIAL_MILI_LYRICS[stage.bgmKey] ||
    [];

  useEffect(() => {
    if (activeLyrics.length === 0) return;
    const timer = setInterval(() => {
      setLyricIdx((prev) => (prev + 1) % activeLyrics.length);
    }, 3400);
    return () => clearInterval(timer);
  }, [activeLyrics.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncerSpeaker((s) => (s === 'Dante' ? 'Charon' : 'Dante'));
      setAnnouncerIdx((i) => i + 1);
    }, 8500);
    return () => clearInterval(timer);
  }, [turnNumber, phase]);
  const [activeAbnoEvent, setActiveAbnoEvent] = useState<{
    bossUid: string;
    event: AbnormalityCheckEvent;
    result?: { success: boolean; roll: number; text: string };
  } | null>(null);

  const speedMultRef = useRef(speedMultiplier);
  speedMultRef.current = speedMultiplier;

  useEffect(() => {
    soundManager.playBgm(stage.bgmKey);
  }, [stage.bgmKey]);

  // Generate Enemy Slots at start of each planning phase
  const generateEnemySlotsForTurn = (currentAllies: BattleUnit[], currentEnemies: BattleUnit[]) => {
    const aliveAllies = currentAllies.filter((a) => a.hp > 0);
    const aliveEnemies = currentEnemies.filter((e) => e.hp > 0);
    if (aliveAllies.length === 0 || aliveEnemies.length === 0) return;

    const slots: EnemySlot[] = [];
    aliveEnemies.forEach((enemy) => {
      if (enemy.isStaggered) return; // Staggered enemies have no action slots this turn!
      const tpl = enemy.enemyTemplate!;
      const slotCount = tpl.slotsPerTurn || 1;
      for (let i = 0; i < slotCount; i++) {
        const skill = tpl.skills[Math.floor(Math.random() * tpl.skills.length)];
        const targetAlly = aliveAllies[(i + Math.floor(Math.random() * aliveAllies.length)) % aliveAllies.length];
        const slotSpeed =
          tpl.speedMin + Math.floor(Math.random() * (tpl.speedMax - tpl.speedMin + 1));
        slots.push({
          slotUid: `${enemy.uid}_slot_${i}`,
          enemyUid: enemy.uid,
          speed: slotSpeed,
          skill,
          targetAllyUid: targetAlly.uid,
        });
      }
    });

    // Auto-assign initial ally targets to enemy slots
    const updatedAllies = currentAllies.map((ally, idx) => {
      if (ally.hp <= 0 || slots.length === 0) return ally;
      // Prefer targeting a slot that is aiming at this ally, otherwise round-robin
      const slotAimingAtMe = slots.find((s) => s.targetAllyUid === ally.uid && !s.clashingAllyUid);
      const chosenSlot = slotAimingAtMe || slots[idx % slots.length];
      if (chosenSlot && !chosenSlot.clashingAllyUid) {
        chosenSlot.clashingAllyUid = ally.uid;
      }
      return {
        ...ally,
        targetEnemySlotUid: chosenSlot?.slotUid,
      };
    });

    setEnemySlots(slots);
    setAllies(updatedAllies);
    if (updatedAllies.length > 0 && !selectedAllyUid) {
      setSelectedAllyUid(updatedAllies[0].uid);
    }
  };

  useEffect(() => {
    generateEnemySlotsForTurn(allies, enemies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushFloatingText = (unitUid: string, text: string, color: string, subtext?: string, isCrit?: boolean) => {
    const id = `${Date.now()}_${Math.random()}`;
    setFloatingTexts((prev) => [...prev, { id, unitUid, text, subtext, color, isCrit }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 1050);
  };

  const triggerShake = (intensity: 'light' | 'heavy') => {
    setScreenShake(intensity);
    setTimeout(() => setScreenShake('none'), intensity === 'heavy' ? 480 : 320);
  };

  // Preview a Sinner's multi-pose slash combo directly on the battlefield when selecting a skill!
  const previewTimerRef = useRef<number | null>(null);
  const triggerSkillPosePreview = (allyUid: string, slot: 1 | 2 | 3, sin: SinAffinity, attackType: AttackType) => {
    if (phase !== 'planning') return;
    if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
    const seq = ATTACK_POSE_SEQUENCES[slot] || ATTACK_POSE_SEQUENCES[1];
    const sinColor = SIN_INFO[sin].color;

    // Frame 1: Dash / Windup Pose
    setAllies((prev) =>
      prev.map((a) => (a.uid === allyUid ? { ...a, currentPose: seq[0], strikeComboIdx: 1 } : a))
    );
    soundManager.playSfx('hit_slash');
    setSlashVfxTargetUid({
      uid: allyUid,
      type: attackType,
      color: sinColor,
      slashImgUrl: `/assets/steam/vfx/slash_${((slot * 3) % 12) + 1}.webp`,
      rotationDeg: -18,
      coinIdx: 1,
      poseLabel: `SKILL ${slot} • POSE 1`,
    });

    // Frame 2: Second Strike Pose
    window.setTimeout(() => {
      setAllies((prev) =>
        prev.map((a) => (a.uid === allyUid ? { ...a, currentPose: seq[1], strikeComboIdx: 2 } : a))
      );
      setSlashVfxTargetUid({
        uid: allyUid,
        type: attackType,
        color: sinColor,
        slashImgUrl: `/assets/steam/vfx/slash_${((slot * 3 + 1) % 12) + 1}.webp`,
        rotationDeg: 24,
        coinIdx: 2,
        poseLabel: `SKILL ${slot} • POSE 2`,
      });
    }, 220);

    // Frame 3: Finisher Strike Pose
    window.setTimeout(() => {
      setAllies((prev) =>
        prev.map((a) => (a.uid === allyUid ? { ...a, currentPose: seq[2], strikeComboIdx: 3 } : a))
      );
      setSlashVfxTargetUid({
        uid: allyUid,
        type: attackType,
        color: sinColor,
        slashImgUrl: `/assets/steam/vfx/slash_${((slot * 3 + 2) % 12) + 1}.webp`,
        rotationDeg: -8,
        coinIdx: 3,
        poseLabel: `SKILL ${slot} • FINISHER`,
      });
    }, 450);

    // Return to Idle
    previewTimerRef.current = window.setTimeout(() => {
      setSlashVfxTargetUid(null);
      setAllies((prev) =>
        prev.map((a) => (a.uid === allyUid ? { ...a, currentPose: 'idle', strikeComboIdx: undefined } : a))
      );
    }, 760);
  };

  // Get active skill for an ally
  const getActiveAllySkill = (ally: BattleUnit): {
    name: string;
    slot: 1 | 2 | 3;
    sin: SinAffinity;
    attackType: AttackType;
    basePower: number;
    coinPower: number;
    coins: number;
    attackWeight: number;
    effects: CoinEffect[];
    isDefense: boolean;
    isEgo: boolean;
  } => {
    if (ally.selectedRow === 'ego' && ally.selectedEgo) {
      return {
        name: ally.selectedEgo.name,
        slot: 3,
        sin: ally.selectedEgo.sin,
        attackType: ally.selectedEgo.attackType,
        basePower: ally.selectedEgo.basePower,
        coinPower: ally.selectedEgo.coinPower,
        coins: ally.selectedEgo.coins,
        attackWeight: ally.selectedEgo.attackWeight,
        effects: ally.selectedEgo.effects,
        isDefense: false,
        isEgo: true,
      };
    }
    if (ally.selectedRow === 'defense' && ally.identity) {
      const def = ally.identity.defenseSkill;
      return {
        name: def.name,
        slot: 1,
        sin: def.sin,
        attackType: 'blunt',
        basePower: def.basePower,
        coinPower: def.coinPower,
        coins: def.coins,
        attackWeight: 1,
        effects: [],
        isDefense: true,
        isEgo: false,
      };
    }
    const sk = ally.selectedRow === 'bottom' ? ally.bottomSkill : ally.topSkill;
    return {
      name: sk.name,
      slot: sk.slot,
      sin: sk.sin,
      attackType: sk.attackType,
      basePower: sk.basePower,
      coinPower: sk.coinPower,
      coins: sk.coins,
      attackWeight: sk.attackWeight,
      effects: sk.effects,
      isDefense: false,
      isEgo: false,
    };
  };

  // Calculate Sin Resonance & Absolute Resonance across deployed allies
  const resonanceInfo = useMemo(() => {
    const aliveAllies = allies.filter((a) => a.hp > 0 && !a.isStaggered);
    const chainSins = aliveAllies.map((a) => getActiveAllySkill(a).sin);
    const counts: Record<SinAffinity, number> = {
      wrath: 0,
      lust: 0,
      sloth: 0,
      gluttony: 0,
      gloom: 0,
      pride: 0,
      envy: 0,
    };
    chainSins.forEach((s) => {
      counts[s] = (counts[s] || 0) + 1;
    });

    // Check max consecutive sin for Absolute Resonance
    let absResSin: SinAffinity | null = null;
    let runSin: SinAffinity | null = null;
    let runLen = 0;
    for (const s of chainSins) {
      if (s === runSin) {
        runLen++;
        if (runLen >= 3) absResSin = s;
      } else {
        runSin = s;
        runLen = 1;
      }
    }

    const resonantSins = ALL_SINS.filter((s) => counts[s] >= 2);
    return { counts, resonantSins, absResSin, chainSins };
  }, [allies]);

  // Gift Clash Power Bonus
  const giftClashBonus = useMemo(
    () => activeGifts.reduce((sum, g) => sum + (g.combatEffect.bonusClashPower || 0), 0),
    [activeGifts]
  );

  // Auto-Chain: WIN RATE
  const handleAutoWinRate = () => {
    soundManager.playSfx('ruina_snap');
    const updatedSlots = [...enemySlots];
    const updatedAllies = allies.map((ally, idx) => {
      if (ally.hp <= 0 || ally.isStaggered) return ally;
      const targetSlot =
        updatedSlots.find((s) => s.slotUid === ally.targetEnemySlotUid) ||
        updatedSlots[idx % Math.max(1, updatedSlots.length)];

      if (!targetSlot) return ally;
      const enemy = enemies.find((e) => e.uid === targetSlot.enemyUid);
      const enemySp = enemy?.sp ?? 0;

      const topOut = estimateClashOutcome(
        ally.topSkill.basePower,
        ally.topSkill.coinPower,
        ally.topSkill.coins,
        ally.sp,
        targetSlot.skill.basePower,
        targetSlot.skill.coinPower,
        targetSlot.skill.coins,
        enemySp,
        giftClashBonus
      );
      const botOut = estimateClashOutcome(
        ally.bottomSkill.basePower,
        ally.bottomSkill.coinPower,
        ally.bottomSkill.coins,
        ally.sp,
        targetSlot.skill.basePower,
        targetSlot.skill.coinPower,
        targetSlot.skill.coins,
        enemySp,
        giftClashBonus
      );

      const bestRow: 'top' | 'bottom' = botOut.expectedSinner > topOut.expectedSinner ? 'bottom' : 'top';
      return {
        ...ally,
        selectedRow: bestRow,
        selectedEgo: undefined,
        targetEnemySlotUid: targetSlot.slotUid,
      };
    });
    setAllies(updatedAllies);
  };

  // Auto-Chain: DAMAGE
  const handleAutoDamage = () => {
    soundManager.playSfx('ruina_snap');
    const updatedSlots = [...enemySlots];
    const updatedAllies = allies.map((ally, idx) => {
      if (ally.hp <= 0 || ally.isStaggered) return ally;
      const targetSlot =
        updatedSlots.find((s) => s.slotUid === ally.targetEnemySlotUid) ||
        updatedSlots[idx % Math.max(1, updatedSlots.length)];
      if (!targetSlot) return ally;
      const enemy = enemies.find((e) => e.uid === targetSlot.enemyUid);
      const res = enemy?.resistances ?? { slash: 1, pierce: 1, blunt: 1 };

      const calcExpectedDmg = (sk: SkillData) => {
        const headsProb = Math.min(0.95, Math.max(0.05, 0.5 + ally.sp / 100));
        let sum = 0;
        for (let c = 1; c <= sk.coins; c++) {
          sum += Math.max(1, sk.basePower + c * headsProb * sk.coinPower);
        }
        return sum * (res[sk.attackType] || 1);
      };

      const bestRow: 'top' | 'bottom' =
        calcExpectedDmg(ally.bottomSkill) >= calcExpectedDmg(ally.topSkill) ? 'bottom' : 'top';
      return {
        ...ally,
        selectedRow: bestRow,
        selectedEgo: undefined,
        targetEnemySlotUid: targetSlot.slotUid,
      };
    });
    setAllies(updatedAllies);
  };

  // Select Enemy Slot as target for currently selected Ally
  const handleSelectEnemySlot = (slotUid: string) => {
    if (phase !== 'planning' || !selectedAllyUid) return;
    soundManager.playSfx('ui_click');

    setAllies((prev) =>
      prev.map((a) => (a.uid === selectedAllyUid ? { ...a, targetEnemySlotUid: slotUid } : a))
    );
    setEnemySlots((prev) =>
      prev.map((s) => {
        if (s.slotUid === slotUid) {
          return { ...s, clashingAllyUid: selectedAllyUid };
        }
        if (s.clashingAllyUid === selectedAllyUid) {
          return { ...s, clashingAllyUid: undefined };
        }
        return s;
      })
    );
  };

  // Equip E.G.O for this turn
  const handleSelectEgoSkill = (allyUid: string, ego: EgoData, overclock = false) => {
    soundManager.playSfx('ego_activate');
    setAllies((prev) =>
      prev.map((a) =>
        a.uid === allyUid
          ? {
              ...a,
              selectedRow: 'ego',
              selectedEgo: ego,
              isOverclocked: overclock,
            }
          : a
      )
    );
    setEgoModalAllyUid(null);
  };

  const canAffordEgo = (ego: EgoData): boolean => {
    return Object.entries(ego.sinCost).every(([sin, cost]) => (sinResources[sin as SinAffinity] || 0) >= (cost || 0));
  };

  const waitMs = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, Math.max(40, Math.round(ms / speedMultRef.current))));

  // ==================== EXECUTE COMBAT TURN ====================
  const executeCombatTurn = async () => {
    if (phase !== 'planning') return;
    soundManager.playSfx('dante_tick');
    setPhase('executing');

    let workingAllies = [...allies];
    let workingEnemies = [...enemies];
    const workingResources = { ...sinResources };

    // 1. Gain Sin Resources & Pay E.G.O Costs
    workingAllies.forEach((ally) => {
      if (ally.hp <= 0 || ally.isStaggered) return;
      const sk = getActiveAllySkill(ally);
      if (sk.isEgo && ally.selectedEgo) {
        Object.entries(ally.selectedEgo.sinCost).forEach(([sin, cost]) => {
          workingResources[sin as SinAffinity] = Math.max(0, (workingResources[sin as SinAffinity] || 0) - (cost || 0));
        });
        const spLoss = ally.isOverclocked ? Math.round(ally.selectedEgo.spCost * 1.5) : ally.selectedEgo.spCost;
        ally.sp = Math.max(-45, ally.sp - spLoss);
      } else if (!sk.isDefense) {
        workingResources[sk.sin] = (workingResources[sk.sin] || 0) + 1;
      }
    });
    setSinResources({ ...workingResources });

    // Sort active allies by speed descending
    const turnOrderAllies = [...workingAllies]
      .filter((a) => a.hp > 0 && !a.isStaggered)
      .sort((a, b) => b.currentSpeed - a.currentSpeed);

    const resolvedEnemySlotUids = new Set<string>();

    for (const orderedAlly of turnOrderAllies) {
      const allyIdx = workingAllies.findIndex((a) => a.uid === orderedAlly.uid);
      const ally = workingAllies[allyIdx];
      if (!ally || ally.hp <= 0 || ally.isStaggered) continue;

      const activeSk = getActiveAllySkill(ally);

      // Find target enemy & slot
      let targetSlot = enemySlots.find((s) => s.slotUid === ally.targetEnemySlotUid);
      let enemy = workingEnemies.find((e) => e.uid === targetSlot?.enemyUid && e.hp > 0);
      if (!enemy) {
        enemy = workingEnemies.find((e) => e.hp > 0);
        if (!enemy) break;
        targetSlot = enemySlots.find((s) => s.enemyUid === enemy!.uid && !resolvedEnemySlotUids.has(s.slotUid));
      }

      // E.G.O Cut-In Presentation!
      if (activeSk.isEgo && ally.selectedEgo && ally.sinner) {
        const corroded = ally.sp <= -30 || Boolean(ally.isOverclocked);
        setEgoCutIn({ sinner: ally.sinner, ego: ally.selectedEgo, corroded });
        soundManager.playSfx('ego_activate');
        soundManager.playEgoVoice(ally.sinner.id);
        await waitMs(1950);
        setEgoCutIn(null);
      }

      // If Defense Skill selected
      if (activeSk.isDefense && ally.identity) {
        const def = ally.identity.defenseSkill;
        const heads = rollCoinHeads(ally.sp);
        const shieldGain = def.basePower + (heads ? def.coinPower : 0);
        ally.currentPose = 'guard';
        if (def.type === 'guard') {
          ally.shield += shieldGain;
          pushFloatingText(ally.uid, `SHIELD +${shieldGain}`, '#60a5fa', def.name);
          soundManager.playSfx('clash_clang');
        } else if (def.type === 'evade') {
          ally.sp = Math.min(45, ally.sp + 5);
          pushFloatingText(ally.uid, `EVADE READY (${shieldGain})`, '#38bdf8', def.name);
          soundManager.playSfx('coin_heads');
        }
        setAllies([...workingAllies]);
        await waitMs(450);
        if (def.type !== 'counter') continue;
      }

      // Apply On-Use effects (e.g. N Corp Sinclair SP loss, W Corp Charge gain, Fluid Sac party heal)
      let bonusCoinPowerFromSkill = 0;
      for (const eff of activeSk.effects) {
        if (eff.trigger === 'on_use') {
          if (eff.healSp) {
            if (eff.target === 'all_allies') {
              workingAllies.forEach((a) => {
                if (a.hp > 0) {
                  a.sp = Math.min(45, Math.max(-45, a.sp + eff.healSp!));
                  pushFloatingText(a.uid, `+${eff.healSp} SP`, '#38bdf8');
                }
              });
            } else {
              ally.sp = Math.min(45, Math.max(-45, ally.sp + eff.healSp));
              pushFloatingText(
                ally.uid,
                `${eff.healSp > 0 ? '+' : ''}${eff.healSp} SP`,
                eff.healSp > 0 ? '#38bdf8' : '#ef4444'
              );
            }
          }
          if (eff.healHp && eff.target === 'all_allies') {
            soundManager.playSfx('heal');
            workingAllies.forEach((a) => {
              if (a.hp > 0) {
                a.hp = Math.min(a.maxHp, a.hp + eff.healHp!);
                pushFloatingText(a.uid, `+${eff.healHp} HP`, '#4ade80');
              }
            });
          }
          if (eff.status) {
            if (eff.target === 'all_allies') {
              workingAllies.forEach((a) => {
                if (a.hp > 0) {
                  a.statuses = addOrMergeStatus(a.statuses, eff.status!, eff.potency || 1, eff.count || 1);
                }
              });
            } else if (eff.target === 'self') {
              ally.statuses = addOrMergeStatus(ally.statuses, eff.status, eff.potency || 1, eff.count || 1);
            }
          }
          if (eff.consumeCharge && eff.coinPowerBonus) {
            const chg = ally.statuses.find((s) => s.type === 'charge');
            if (chg && chg.count >= eff.consumeCharge) {
              chg.count -= eff.consumeCharge;
              bonusCoinPowerFromSkill += eff.coinPowerBonus;
              pushFloatingText(ally.uid, `RIP SPACE CHARGED! +${eff.coinPowerBonus} COIN PWR`, '#38bdf8', undefined, true);
            }
          }
        }
      }

      // Check Sin Resonance & Gift Bonuses
      const resCount = resonanceInfo.counts[activeSk.sin] || 0;
      const isAbsRes = resonanceInfo.absResSin === activeSk.sin;
      const resonancePowerBonus = isAbsRes ? 3 : resCount >= 3 ? 2 : resCount === 2 ? 1 : 0;
      const giftCoinBonus = activeGifts.some((g) => g.combatEffect.bonusCoinPowerSin === activeSk.sin) ? 1 : 0;
      const allyAtkUp = getStatusPotency(ally.statuses, 'attack_up') - getStatusPotency(ally.statuses, 'attack_down');

      const effectiveAllyBase = Math.max(1, activeSk.basePower + resonancePowerBonus + giftClashBonus + allyAtkUp);
      const effectiveAllyCoin =
        activeSk.coinPower + (activeSk.coinPower >= 0 ? bonusCoinPowerFromSkill + giftCoinBonus : -bonusCoinPowerFromSkill);

      // Move units toward center with real 'move' action sprite!
      ally.animState = 'move_center';
      ally.currentPose = 'move';
      enemy.animState = 'move_center';
      enemy.currentPose = 'move';
      setAllies([...workingAllies]);
      setEnemies([...workingEnemies]);
      await waitMs(260);

      // Determine if this is a CLASH or ONE-SIDED ATTACK
      const canClash =
        targetSlot &&
        !resolvedEnemySlotUids.has(targetSlot.slotUid) &&
        !enemy.isStaggered;

      let allyWonClash = true;
      let allyRemainingCoins = activeSk.coins;
      let enemyRemainingCoins = targetSlot?.skill.coins ?? 1;

      if (canClash && targetSlot) {
        resolvedEnemySlotUids.add(targetSlot.slotUid);
        const eSkill = targetSlot.skill;
        const enemyAtkUp =
          getStatusPotency(enemy.statuses, 'attack_up') - getStatusPotency(enemy.statuses, 'attack_down');
        const effectiveEnemyBase = Math.max(1, eSkill.basePower + enemyAtkUp);

        let clashRound = 0;
        while (allyRemainingCoins > 0 && enemyRemainingCoins > 0 && clashRound < 12) {
          clashRound++;
          soundManager.playSfx('coin_spin');

          // Switch both units to dynamic clash strike poses for this Clash Round!
          ally.currentPose = CLASH_POSE_POOL[(clashRound - 1) % CLASH_POSE_POOL.length];
          enemy.currentPose = CLASH_POSE_POOL[(clashRound + 2) % CLASH_POSE_POOL.length];
          ally.strikeComboIdx = clashRound;
          enemy.strikeComboIdx = clashRound;
          setAllies([...workingAllies]);
          setEnemies([...workingEnemies]);

          const allyRolls: ('heads' | 'tails')[] = [];
          let allyPower = effectiveAllyBase;
          for (let c = 0; c < allyRemainingCoins; c++) {
            const isHeads = rollCoinHeads(ally.sp);
            allyRolls.push(isHeads ? 'heads' : 'tails');
            if (isHeads) allyPower += effectiveAllyCoin;
          }
          allyPower = Math.max(0, allyPower);

          const enemyRolls: ('heads' | 'tails')[] = [];
          let enemyPower = effectiveEnemyBase;
          for (let c = 0; c < enemyRemainingCoins; c++) {
            const isHeads = rollCoinHeads(enemy.sp);
            enemyRolls.push(isHeads ? 'heads' : 'tails');
            if (isHeads) enemyPower += eSkill.coinPower;
          }
          enemyPower = Math.max(0, enemyPower);

          setLiveClash({
            allyName: ally.title,
            enemyName: enemy.name,
            allySkillName: activeSk.name,
            enemySkillName: eSkill.name,
            allySin: activeSk.sin,
            enemySin: eSkill.sin,
            allyAttackType: activeSk.attackType,
            enemyAttackType: eSkill.attackType,
            allyBase: effectiveAllyBase,
            allyCoin: effectiveAllyCoin,
            allyCoinsRemaining: allyRemainingCoins,
            allyCoinResults: allyRolls,
            allyTotalPower: allyPower,
            enemyBase: effectiveEnemyBase,
            enemyCoin: eSkill.coinPower,
            enemyCoinsRemaining: enemyRemainingCoins,
            enemyCoinResults: enemyRolls,
            enemyTotalPower: enemyPower,
            clashCount: clashRound,
            statusBanner:
              allyPower > enemyPower
                ? `${ally.title} WINS CLASH ROUND (${allyPower} vs ${enemyPower})!`
                : enemyPower > allyPower
                ? `${enemy.name} WINS CLASH ROUND (${enemyPower} vs ${allyPower})!`
                : `DRAW (${allyPower} vs ${enemyPower}) — CLASH AGAIN!`,
          });

          await waitMs(380);

          if (allyPower > enemyPower) {
            enemyRemainingCoins--;
            enemy.currentPose = 'dmg';
            setSlashVfxTargetUid({
              uid: enemy.uid,
              type: activeSk.attackType,
              color: SIN_INFO[activeSk.sin].color,
              slashImgUrl: `/assets/steam/vfx/slash_${((clashRound - 1) % 12) + 1}.webp`,
              rotationDeg: (clashRound % 2 === 0 ? 1 : -1) * (15 + (clashRound * 11) % 30),
              coinIdx: clashRound,
              poseLabel: `CLASH PARRY #${clashRound}`,
            });
            soundManager.playSfx(enemyRemainingCoins === 0 ? 'clash_win' : 'clash_clang');
            triggerShake('light');
          } else if (enemyPower > allyPower) {
            allyRemainingCoins--;
            ally.currentPose = 'dmg';
            setSlashVfxTargetUid({
              uid: ally.uid,
              type: eSkill.attackType,
              color: SIN_INFO[eSkill.sin].color,
              slashImgUrl: `/assets/steam/vfx/slash_${((clashRound + 3) % 12) + 1}.webp`,
              rotationDeg: (clashRound % 2 === 0 ? -1 : 1) * 22,
              coinIdx: clashRound,
              poseLabel: `COIN BROKEN!`,
            });
            soundManager.playSfx(allyRemainingCoins === 0 ? 'coin_break' : 'clash_clang');
            triggerShake('light');
          } else {
            soundManager.playSfx('clash_clang');
          }

          setAllies([...workingAllies]);
          setEnemies([...workingEnemies]);
          await waitMs(310);
          setSlashVfxTargetUid(null);
        }

        setLiveClash(null);

        if (allyRemainingCoins > 0) {
          allyWonClash = true;
          const spGain = Math.min(25, 10 + clashRound * 2);
          if (!ally.identity?.isNegativeCoin) {
            ally.sp = Math.min(45, ally.sp + spGain);
            pushFloatingText(ally.uid, `CLASH WIN! +${spGain} SP`, '#4ade80');
          } else {
            pushFloatingText(ally.uid, `CLASH WIN!`, '#facc15');
          }
          if (enemy.hasSanity) {
            enemy.sp = Math.max(-45, enemy.sp - 10);
          }
          // Apply clash_win effects
          activeSk.effects
            .filter((ef) => ef.trigger === 'clash_win')
            .forEach((ef) => {
              if (ef.status) {
                if (ef.target === 'self') {
                  ally.statuses = addOrMergeStatus(ally.statuses, ef.status, ef.potency || 1, ef.count || 1);
                } else {
                  enemy!.statuses = addOrMergeStatus(enemy!.statuses, ef.status, ef.potency || 1, ef.count || 1);
                }
              }
            });
        } else {
          allyWonClash = false;
          ally.sp = Math.max(-45, ally.sp - 10);
          pushFloatingText(ally.uid, `CLASH LOSE!`, '#ef4444');
        }
      }

      // 3. EXECUTE WINNING ATTACK COINS (EACH COIN = DIFFERENT CHARACTER ACTION POSE + SLASH VFX!)
      if (allyWonClash) {
        ally.animState = 'attack';
        const poseSeq = ATTACK_POSE_SEQUENCES[activeSk.slot] || ATTACK_POSE_SEQUENCES[1];

        // Determine targets (AOE support via attackWeight!)
        const aliveEnemiesList = workingEnemies.filter((e) => e.hp > 0);
        const primaryEnemy = enemy;
        const targets: BattleUnit[] = [primaryEnemy];
        if (activeSk.attackWeight > 1) {
          aliveEnemiesList.forEach((other) => {
            if (other.uid !== primaryEnemy.uid && targets.length < activeSk.attackWeight) {
              targets.push(other);
            }
          });
        }

        let runningRollPower = effectiveAllyBase;
        for (let c = 0; c < allyRemainingCoins; c++) {
          if (targets.every((t) => t.hp <= 0)) break;

          // Switch character sprite to a distinct attack pose for this specific Coin Strike!
          const strikePose = poseSeq[c % poseSeq.length];
          ally.currentPose = strikePose;
          ally.strikeComboIdx = c + 1;

          // Bleed trigger on attacker when flipping offensive coin
          const allyBleed = ally.statuses.find((s) => s.type === 'bleed');
          if (allyBleed && allyBleed.count > 0) {
            ally.hp = Math.max(1, ally.hp - allyBleed.potency);
            allyBleed.count--;
            pushFloatingText(ally.uid, `-${allyBleed.potency} BLEED`, '#dc2626');
          }

          const isHeads = rollCoinHeads(ally.sp);
          soundManager.playSfx(isHeads ? 'coin_heads' : 'coin_tails');
          if (isHeads) runningRollPower += effectiveAllyCoin;
          const coinValue = Math.max(1, runningRollPower);

          // Poise Crit Check
          const poiseStatus = ally.statuses.find((s) => s.type === 'poise');
          const critChance = (poiseStatus?.potency || 0) * 0.05;
          const isCrit = Math.random() < critChance;
          if (isCrit && poiseStatus) {
            poiseStatus.count = Math.max(0, poiseStatus.count - 1);
          }

          const vfxIndex = (((ally.sinner?.id || 1) + activeSk.slot * 2 + c * 3) % 12) + 1;
          const slashAngles = [-22, 28, -8, 42];
          const rotationDeg = slashAngles[c % slashAngles.length];

          // Hit each target in Attack Weight
          for (const tgt of targets) {
            if (tgt.hp <= 0) continue;
            tgt.animState = 'hit';
            tgt.currentPose = 'dmg';

            const resMult = tgt.isStaggered ? 2.0 : tgt.resistances[activeSk.attackType] || 1.0;
            const fragileBonus = getStatusPotency(tgt.statuses, 'fragile') * 0.1;
            const protReduction = getStatusPotency(tgt.statuses, 'protection') * 0.1;
            const critMult = isCrit ? 1.25 : 1.0;
            const uptieBonus = 1 + (deployedSinners.find((d) => d.sinner.id === ally.sinner?.id)?.uptie || 1) * 0.08;

            let bonusEffectPct = 0;
            activeSk.effects.forEach((ef) => {
              if (ef.bonusDamagePercent && (ef.trigger === 'on_hit' || (ef.trigger === 'heads_hit' && isHeads))) {
                bonusEffectPct += ef.bonusDamagePercent / 100;
              }
            });

            // Sinking Deluge / Rupture bonus damage
            const ruptureStatus = tgt.statuses.find((s) => s.type === 'rupture');
            const ruptureBonusDmg = ruptureStatus && ruptureStatus.count > 0 ? ruptureStatus.potency : 0;
            if (ruptureStatus && ruptureStatus.count > 0) {
              ruptureStatus.count--;
            }

            const sinkingStatus = tgt.statuses.find((s) => s.type === 'sinking');
            let sinkingBonusDmg = 0;
            if (sinkingStatus && sinkingStatus.count > 0) {
              if (tgt.hasSanity) {
                tgt.sp = Math.max(-45, tgt.sp - sinkingStatus.potency);
              } else {
                sinkingBonusDmg = sinkingStatus.potency;
              }
              sinkingStatus.count--;
            }

            const rawDmg =
              coinValue *
                resMult *
                critMult *
                uptieBonus *
                Math.max(0.3, 1 + fragileBonus - protReduction + bonusEffectPct) +
              ruptureBonusDmg +
              sinkingBonusDmg;

            const finalDmg = Math.max(1, Math.round(rawDmg));
            const prevHp = tgt.hp;
            tgt.hp = Math.max(0, tgt.hp - finalDmg);

            // Play Attack Hit SFX & Real Steam Weapon Slash VFX!
            soundManager.playSfx(
              isCrit
                ? 'hit_crit'
                : activeSk.attackType === 'slash'
                ? 'hit_slash'
                : activeSk.attackType === 'pierce'
                ? 'hit_pierce'
                : 'hit_blunt'
            );
            setSlashVfxTargetUid({
              uid: tgt.uid,
              type: activeSk.attackType,
              color: SIN_INFO[activeSk.sin].color,
              slashImgUrl: `/assets/steam/vfx/slash_${vfxIndex}.webp`,
              rotationDeg,
              coinIdx: c + 1,
              poseLabel: `COIN #${c + 1} (${isHeads ? 'HEADS' : 'TAILS'}) • ${activeSk.name}`,
            });
            triggerShake(isCrit || finalDmg >= 35 ? 'heavy' : 'light');

            const dmgSubtext = isCrit
              ? `CRITICAL!! (COIN #${c + 1})`
              : resMult >= 2.0
              ? `FATAL! (COIN #${c + 1})`
              : resMult >= 1.5
              ? `WEAK (COIN #${c + 1})`
              : `COIN #${c + 1}`;
            pushFloatingText(
              tgt.uid,
              `-${finalDmg}`,
              isCrit ? '#facc15' : resMult >= 1.5 ? '#ef4444' : '#f8fafc',
              dmgSubtext,
              isCrit
            );

            // Apply On-Hit Coin Effects & Gift Statuses
            activeSk.effects.forEach((ef) => {
              const triggered =
                ef.trigger === 'on_hit' ||
                (ef.trigger === 'heads_hit' && isHeads) ||
                (ef.trigger === 'tails_hit' && !isHeads);
              if (!triggered) return;

              if (ef.status) {
                tgt.statuses = addOrMergeStatus(tgt.statuses, ef.status, ef.potency || 1, ef.count || 1);
              }
              if (ef.healHp) {
                ally.hp = Math.min(ally.maxHp, ally.hp + ef.healHp);
                pushFloatingText(ally.uid, `+${ef.healHp} HP`, '#4ade80');
              }
              if (ef.tremorBurst) {
                const trm = tgt.statuses.find((s) => s.type === 'tremor');
                const burstVal = (trm?.potency || 6) * 2;
                soundManager.playSfx('tremor_burst');
                tgt.staggerThresholds = tgt.staggerThresholds.map((th) => th + burstVal);
                pushFloatingText(tgt.uid, `TREMOR BURST! (+${burstVal})`, '#eab308', undefined, true);
              }
            });

            activeGifts.forEach((g) => {
              if (g.combatEffect.bonusStatusOnHit) {
                const st = g.combatEffect.bonusStatusOnHit;
                tgt.statuses = addOrMergeStatus(tgt.statuses, st.type, st.potency, st.count);
              }
            });

            // Check Stagger Threshold Crossing!
            const crossedThreshold = tgt.staggerThresholds.some((th) => prevHp > th && tgt.hp <= th);
            if (crossedThreshold && tgt.hp > 0 && !tgt.isStaggered) {
              tgt.isStaggered = true;
              tgt.staggerLevel = Math.min(3, tgt.staggerLevel + 1);
              tgt.animState = 'stagger';
              tgt.currentPose = 'dmg';
              soundManager.playSfx('stagger');
              triggerShake('heavy');
              pushFloatingText(tgt.uid, 'STAGGERED!!', '#facc15', 'ALL RES -> FATAL ×2.0', true);
              setCombatLog((prev) => [
                `⚡ [STAGGER!] ${tgt.name} shattered past Stagger threshold!`,
                ...prev.slice(0, 24),
              ]);
            }

            // On Kill check
            if (tgt.hp <= 0 && prevHp > 0) {
              soundManager.playSfx('stagger');
              pushFloatingText(tgt.uid, 'DEFEATED!!', '#ef4444', undefined, true);
              ally.sp = Math.min(45, ally.sp + 12);
              activeSk.effects
                .filter((ef) => ef.trigger === 'on_kill')
                .forEach((ef) => {
                  if (ef.healSp) {
                    workingAllies.forEach((a) => {
                      if (a.hp > 0) a.sp = Math.min(45, a.sp + ef.healSp!);
                    });
                  }
                  if (ef.status && ef.target === 'all_allies') {
                    workingAllies.forEach((a) => {
                      if (a.hp > 0) {
                        a.statuses = addOrMergeStatus(a.statuses, ef.status!, ef.potency || 1, ef.count || 1);
                      }
                    });
                  }
                });
            }
          }

          setAllies([...workingAllies]);
          setEnemies([...workingEnemies]);
          await waitMs(370);
          setSlashVfxTargetUid(null);
        }
      } else if (targetSlot) {
        // Enemy won the Clash! Enemy executes remaining coins on Ally with multi-pose animations!
        const eSkill = targetSlot.skill;
        enemy.animState = 'attack';
        let runningEnemyPower = eSkill.basePower;
        for (let c = 0; c < enemyRemainingCoins; c++) {
          if (ally.hp <= 0) break;
          enemy.currentPose = CLASH_POSE_POOL[c % CLASH_POSE_POOL.length];
          enemy.strikeComboIdx = c + 1;
          ally.animState = 'hit';
          ally.currentPose = 'dmg';

          const isHeads = rollCoinHeads(enemy.sp);
          soundManager.playSfx(isHeads ? 'coin_heads' : 'coin_tails');
          if (isHeads) runningEnemyPower += eSkill.coinPower;
          const coinVal = Math.max(1, runningEnemyPower);
          const resMult = ally.isStaggered ? 2.0 : ally.resistances[eSkill.attackType] || 1.0;
          const protReduction = getStatusPotency(ally.statuses, 'protection') * 0.1;

          let rawDmg = Math.max(1, Math.round(coinVal * resMult * Math.max(0.3, 1 - protReduction)));
          if (ally.shield > 0) {
            const absorbed = Math.min(ally.shield, rawDmg);
            ally.shield -= absorbed;
            rawDmg -= absorbed;
          }
          const prevHp = ally.hp;
          ally.hp = Math.max(0, ally.hp - rawDmg);
          soundManager.playSfx(
            eSkill.attackType === 'slash'
              ? 'hit_slash'
              : eSkill.attackType === 'pierce'
              ? 'hit_pierce'
              : 'hit_blunt'
          );
          setSlashVfxTargetUid({
            uid: ally.uid,
            type: eSkill.attackType,
            color: SIN_INFO[eSkill.sin].color,
            slashImgUrl: `/assets/steam/vfx/slash_${((c * 2 + 1) % 12) + 1}.webp`,
            rotationDeg: c % 2 === 0 ? -24 : 26,
            coinIdx: c + 1,
            poseLabel: `${eSkill.name} • COIN #${c + 1}`,
          });
          triggerShake('light');
          pushFloatingText(ally.uid, `-${rawDmg}`, '#ef4444', `COIN #${c + 1}`);

          const crossed = ally.staggerThresholds.some((th) => prevHp > th && ally.hp <= th);
          if (crossed && ally.hp > 0 && !ally.isStaggered) {
            ally.isStaggered = true;
            ally.currentPose = 'dmg';
            soundManager.playSfx('stagger');
            pushFloatingText(ally.uid, 'STAGGER!!', '#facc15', undefined, true);
          }

          setAllies([...workingAllies]);
          setEnemies([...workingEnemies]);
          await waitMs(350);
          setSlashVfxTargetUid(null);
        }
      }

      // Reset unit positions & poses
      ally.animState = 'idle';
      ally.currentPose = ally.isStaggered ? 'dmg' : 'idle';
      ally.strikeComboIdx = undefined;
      if (enemy) {
        enemy.animState = enemy.isStaggered ? 'stagger' : 'idle';
        enemy.currentPose = enemy.isStaggered ? 'dmg' : 'idle';
        enemy.strikeComboIdx = undefined;
      }
      setAllies([...workingAllies]);
      setEnemies([...workingEnemies]);
      await waitMs(180);
    }

    // 4. Execute any Unopposed Enemy Slots that were not clashed
    for (const slot of enemySlots) {
      if (resolvedEnemySlotUids.has(slot.slotUid)) continue;
      const enemy = workingEnemies.find((e) => e.uid === slot.enemyUid && e.hp > 0 && !e.isStaggered);
      if (!enemy) continue;
      const targetAlly =
        workingAllies.find((a) => a.uid === slot.targetAllyUid && a.hp > 0) ||
        workingAllies.find((a) => a.hp > 0);
      if (!targetAlly) break;

      enemy.animState = 'attack';
      setEnemies([...workingEnemies]);

      let rollPwr = slot.skill.basePower;
      for (let c = 0; c < slot.skill.coins; c++) {
        if (targetAlly.hp <= 0) break;
        enemy.currentPose = CLASH_POSE_POOL[(c + 4) % CLASH_POSE_POOL.length];
        enemy.strikeComboIdx = c + 1;
        targetAlly.animState = 'hit';
        targetAlly.currentPose = 'dmg';

        const isHeads = rollCoinHeads(enemy.sp);
        if (isHeads) rollPwr += slot.skill.coinPower;
        const resMult = targetAlly.isStaggered ? 2.0 : targetAlly.resistances[slot.skill.attackType] || 1.0;
        const protRed = getStatusPotency(targetAlly.statuses, 'protection') * 0.1;
        let dmg = Math.max(1, Math.round(Math.max(1, rollPwr) * resMult * Math.max(0.3, 1 - protRed)));
        if (targetAlly.shield > 0) {
          const abs = Math.min(targetAlly.shield, dmg);
          targetAlly.shield -= abs;
          dmg -= abs;
        }
        const prevHp = targetAlly.hp;
        targetAlly.hp = Math.max(0, targetAlly.hp - dmg);
        soundManager.playSfx('hit_blunt');
        setSlashVfxTargetUid({
          uid: targetAlly.uid,
          type: slot.skill.attackType,
          color: SIN_INFO[slot.skill.sin].color,
          slashImgUrl: `/assets/steam/vfx/slash_${((c * 3 + 2) % 12) + 1}.webp`,
          rotationDeg: c % 2 === 0 ? 18 : -22,
          coinIdx: c + 1,
          poseLabel: `UNOPPOSED • COIN #${c + 1}`,
        });
        pushFloatingText(targetAlly.uid, `-${dmg}`, '#ef4444', `UNOPPOSED #${c + 1}`);
        const crossed = targetAlly.staggerThresholds.some((th) => prevHp > th && targetAlly.hp <= th);
        if (crossed && targetAlly.hp > 0 && !targetAlly.isStaggered) {
          targetAlly.isStaggered = true;
          targetAlly.currentPose = 'dmg';
          soundManager.playSfx('stagger');
          pushFloatingText(targetAlly.uid, 'STAGGER!!', '#facc15', undefined, true);
        }
        setAllies([...workingAllies]);
        setEnemies([...workingEnemies]);
        await waitMs(330);
        setSlashVfxTargetUid(null);
      }
      enemy.animState = 'idle';
      enemy.currentPose = enemy.isStaggered ? 'dmg' : 'idle';
      enemy.strikeComboIdx = undefined;
      targetAlly.animState = 'idle';
      targetAlly.currentPose = targetAlly.isStaggered ? 'dmg' : 'idle';
      setAllies([...workingAllies]);
      setEnemies([...workingEnemies]);
    }

    // 5. End-of-Turn Burn Damage & Status Decay & Skill Bag Cycling
    const applyEndOfTurn = (unit: BattleUnit) => {
      if (unit.hp <= 0) return;
      const burn = unit.statuses.find((s) => s.type === 'burn');
      if (burn && burn.count > 0) {
        unit.hp = Math.max(1, unit.hp - burn.potency);
        pushFloatingText(unit.uid, `-${burn.potency} BURN`, '#ef4444');
        burn.count--;
      }
      // Clear 1-turn statuses & zero-count statuses
      unit.statuses = unit.statuses.filter(
        (s) =>
          s.count > 0 &&
          s.type !== 'fragile' &&
          s.type !== 'protection' &&
          s.type !== 'attack_up' &&
          s.type !== 'attack_down' &&
          s.type !== 'paralyze'
      );
      unit.shield = 0;
      if (unit.isStaggered) {
        unit.isStaggered = false;
        unit.staggerLevel = 0;
        unit.animState = 'idle';
      }
      if (unit.isAlly && unit.identity) {
        const [newTop, newBot] = drawTwoSkills(unit.identity);
        unit.topSkill = newTop;
        unit.bottomSkill = newBot;
        unit.selectedRow = 'top';
        unit.selectedEgo = undefined;
        unit.isOverclocked = false;
        unit.currentSpeed =
          unit.speedMin + Math.floor(Math.random() * (unit.speedMax - unit.speedMin + 1));
      }
    };

    workingAllies.forEach(applyEndOfTurn);
    workingEnemies.forEach(applyEndOfTurn);

    setAllies([...workingAllies]);
    setEnemies([...workingEnemies]);

    // Check Victory / Defeat
    if (workingEnemies.every((e) => e.hp <= 0)) {
      soundManager.playSfx('gacha_000');
      soundManager.playBgm('victory');
      setPhase('victory');
      return;
    }
    if (workingAllies.every((a) => a.hp <= 0)) {
      soundManager.playSfx('ruina_death');
      setPhase('defeat');
      return;
    }

    // Check if Boss Abnormality Event should trigger!
    const bossWithEvent = workingEnemies.find(
      (e) => e.hp > 0 && e.enemyTemplate?.abnormalityEvent && e.hp <= e.maxHp * 0.72
    );
    if (bossWithEvent && !abnormalityEventTriggered && bossWithEvent.enemyTemplate?.abnormalityEvent) {
      setAbnormalityEventTriggered(true);
      setActiveAbnoEvent({
        bossUid: bossWithEvent.uid,
        event: bossWithEvent.enemyTemplate.abnormalityEvent,
      });
      soundManager.playSfx('ego_activate');
      setPhase('abnormality_check');
      return;
    }

    // Advance to next turn
    const nextTurn = turnNumber + 1;
    setTurnNumber(nextTurn);
    setCombatLog((prev) => [`[TURN ${nextTurn}] Speed dice rolled. Chain skills on the Dashboard.`, ...prev.slice(0, 24)]);
    generateEnemySlotsForTurn(workingAllies, workingEnemies);
    setPhase('planning');
  };

  // Handle Abnormality Skill Check Choice
  const handlePerformAbnoCheck = (ally: BattleUnit) => {
    if (!activeAbnoEvent || activeAbnoEvent.result) return;
    soundManager.playSfx('coin_spin');

    const ev = activeAbnoEvent.event;
    const hasSin = ally.identity?.skills.some((s) => s.sin === ev.recommendedSin) ? 4 : 0;
    const heads1 = rollCoinHeads(ally.sp);
    const heads2 = rollCoinHeads(ally.sp);
    const totalRoll = 8 + hasSin + (heads1 ? 4 : 0) + (heads2 ? 4 : 0);
    const success = totalRoll >= ev.difficulty;

    soundManager.playSfx(success ? 'clash_win' : 'stagger');

    let updatedAllies = [...allies];
    let updatedEnemies = [...enemies];

    if (success) {
      updatedAllies = updatedAllies.map((a) => {
        if (a.hp <= 0) return a;
        let nextStatuses = [...a.statuses];
        if (ev.onSuccessReward.buffAllAllies) {
          const b = ev.onSuccessReward.buffAllAllies;
          nextStatuses = addOrMergeStatus(nextStatuses, b.type, b.potency, b.count);
        }
        return {
          ...a,
          sp: Math.min(45, a.sp + (ev.onSuccessReward.spAllAllies || 20)),
          statuses: nextStatuses,
        };
      });
      if (ev.onSuccessReward.staggerBoss) {
        updatedEnemies = updatedEnemies.map((e) =>
          e.uid === activeAbnoEvent.bossUid ? { ...e, isStaggered: true, staggerLevel: 2 } : e
        );
      }
    } else {
      updatedAllies = updatedAllies.map((a) =>
        a.uid === ally.uid
          ? {
              ...a,
              hp: Math.max(1, a.hp - (ev.onFailurePenalty.hpDamageReader || 20)),
              sp: Math.max(-45, a.sp - (ev.onFailurePenalty.spDamageReader || 15)),
            }
          : a
      );
    }

    setAllies(updatedAllies);
    setEnemies(updatedEnemies);
    setActiveAbnoEvent({
      ...activeAbnoEvent,
      result: {
        success,
        roll: totalRoll,
        text: success ? ev.successText : ev.failureText,
      },
    });
  };

  const closeAbnoEventAndContinue = () => {
    soundManager.playSfx('ui_click');
    setActiveAbnoEvent(null);
    const nextTurn = turnNumber + 1;
    setTurnNumber(nextTurn);
    generateEnemySlotsForTurn(allies, enemies);
    setPhase('planning');
  };

  // Currently selected Ally & Target Slot for Top Clash Preview Banner
  const selectedAlly = allies.find((a) => a.uid === selectedAllyUid) || allies.find((a) => a.hp > 0);
  const previewTargetSlot =
    enemySlots.find((s) => s.slotUid === selectedAlly?.targetEnemySlotUid) || enemySlots[0];
  const previewEnemy = enemies.find((e) => e.uid === previewTargetSlot?.enemyUid);
  const previewAllySkill = selectedAlly ? getActiveAllySkill(selectedAlly) : null;
  const previewClash =
    selectedAlly && previewAllySkill && previewTargetSlot && previewEnemy
      ? estimateClashOutcome(
          previewAllySkill.basePower,
          previewAllySkill.coinPower,
          previewAllySkill.coins,
          selectedAlly.sp,
          previewTargetSlot.skill.basePower,
          previewTargetSlot.skill.coinPower,
          previewTargetSlot.skill.coins,
          previewEnemy.sp,
          giftClashBonus
        )
      : null;

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none ${
        screenShake === 'heavy'
          ? 'animate-heavy-shake'
          : screenShake === 'light'
          ? 'animate-screen-shake'
          : ''
      }`}
    >
      {/* Background Stage */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `url('${stage.backgroundUrl}')`,
          filter: phase === 'executing' ? 'brightness(0.68) contrast(1.18)' : 'brightness(0.75) contrast(1.1)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070609] via-transparent to-[#070609]/90 pointer-events-none" />

      {/* ==================== TOP BAR & CLASH PREVIEW BANNER ==================== */}
      <div className="relative z-20 flex items-start justify-between px-4 pt-2 gap-3">
        {/* Left: Stage & Turn Indicator */}
        <div className="limbus-panel px-3.5 py-2 rounded flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-red-950/90 border border-amber-500/60 flex flex-col items-center justify-center">
            <span className="text-[9px] text-amber-300/80 uppercase tracking-widest">TURN</span>
            <span className="font-bebas text-2xl leading-none text-amber-400">{turnNumber}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-900/80 text-amber-200 border border-red-500/40 rounded">
                {stage.stageCode}
              </span>
              <span className="font-display text-sm font-bold text-amber-100">{stage.title}</span>
            </div>
            <p className="text-[11px] text-stone-400">{stage.subtitle}</p>
          </div>
          <button
            onClick={() => {
              soundManager.playSfx('ui_click');
              setSpeedMultiplier((prev) => (prev === 1 ? 2 : 1));
            }}
            className={`ml-2 px-2.5 py-1 rounded text-xs font-bold border flex items-center gap-1 cursor-pointer transition ${
              speedMultiplier === 2
                ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                : 'bg-stone-900/80 border-stone-700 text-stone-400 hover:text-stone-200'
            }`}
            title="Toggle 1x / 2x Combat Speed"
          >
            <FastForward className="w-3.5 h-3.5" />
            {speedMultiplier}x
          </button>

          <button
            onClick={() => {
              soundManager.playSfx('ui_click');
              soundManager.nextJukeboxTrack();
            }}
            className="px-2.5 py-1 rounded text-xs font-bold border bg-purple-950/80 hover:bg-purple-900 border-purple-400/60 text-purple-200 flex items-center gap-1 cursor-pointer transition"
            title="Đổi nhạc nền (Mili / Limbus OST Jukebox)"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            Đổi Nhạc
          </button>
        </div>

        {/* Center: CLASH PREVIEW OR LIVE CLASH BANNER */}
        {liveClash ? (
          <div className="limbus-crimson-panel px-6 py-2.5 rounded-md min-w-[540px] max-w-[680px] border-2 border-amber-400 shadow-2xl animate-pulse">
            <div className="flex items-center justify-between gap-4">
              {/* Ally Clash Side */}
              <div className="flex-1 text-left">
                <div className="text-[10px] text-amber-300 font-bold uppercase">{liveClash.allyName}</div>
                <div className="font-display text-sm font-bold text-white truncate">{liveClash.allySkillName}</div>
                <div className="flex items-center gap-1 mt-1">
                  {liveClash.allyCoinResults.map((res, idx) => (
                    <img
                      key={idx}
                      src={res === 'heads' ? '/assets/steam/ui/SuperCoin.webp' : '/assets/steam/ui/BattleUI_NewCoin_0.webp'}
                      alt="coin"
                      className={`w-6 h-6 animate-coin-flip object-contain ${
                        res === 'heads' ? 'brightness-125 drop-shadow-[0_0_8px_#facc15]' : 'brightness-50 grayscale'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Center Clash Power Numbers */}
              <div className="flex items-center gap-4 px-3">
                <div className="font-bebas text-5xl text-amber-300 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]">
                  {liveClash.allyTotalPower}
                </div>
                <div className="flex flex-col items-center">
                  <Swords className="w-7 h-7 text-red-400 animate-bounce" />
                  <span className="text-[10px] font-mono-num text-amber-200">CLASH #{liveClash.clashCount}</span>
                </div>
                <div className="font-bebas text-5xl text-red-400 drop-shadow-[0_0_12px_rgba(248,113,113,0.8)]">
                  {liveClash.enemyTotalPower}
                </div>
              </div>

              {/* Enemy Clash Side */}
              <div className="flex-1 text-right">
                <div className="text-[10px] text-red-300 font-bold uppercase">{liveClash.enemyName}</div>
                <div className="font-display text-sm font-bold text-white truncate">{liveClash.enemySkillName}</div>
                <div className="flex items-center justify-end gap-1 mt-1">
                  {liveClash.enemyCoinResults.map((res, idx) => (
                    <img
                      key={idx}
                      src={res === 'heads' ? '/assets/steam/ui/SuperCoin.webp' : '/assets/steam/ui/BattleUI_NewCoin_0.webp'}
                      alt="coin"
                      className={`w-6 h-6 animate-coin-flip object-contain ${
                        res === 'heads' ? 'brightness-125 drop-shadow-[0_0_8px_#ef4444]' : 'brightness-50 grayscale'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="text-center text-[11px] font-bold text-amber-200 mt-1 border-t border-red-500/30 pt-1">
              {liveClash.statusBanner}
            </div>
          </div>
        ) : (
          selectedAlly &&
          previewAllySkill &&
          previewTargetSlot &&
          previewEnemy &&
          previewClash && (
            <div className="limbus-panel px-5 py-2 rounded-md min-w-[520px] max-w-[660px]">
              <div className="flex items-center justify-between gap-4">
                {/* Left: Sinner Skill Preview */}
                <div className="flex items-center gap-2.5 flex-1">
                  <img src={SIN_INFO[previewAllySkill.sin].icon} alt="" className="w-8 h-8 object-contain" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-amber-100">{previewAllySkill.name}</span>
                      <img
                        src={ATTACK_TYPE_INFO[previewAllySkill.attackType].icon}
                        alt=""
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="font-mono-num text-xs text-amber-300 font-bold">
                        Base {previewAllySkill.basePower}{' '}
                        {previewAllySkill.coinPower >= 0
                          ? `+${previewAllySkill.coinPower}`
                          : previewAllySkill.coinPower}
                      </span>
                      <div className="flex items-center gap-0.5 ml-1">
                        {Array.from({ length: previewAllySkill.coins }).map((_, idx) => (
                          <img key={idx} src="/assets/steam/ui/BattleUI_NewCoin_0.webp" alt="coin" className="w-3.5 h-3.5" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center: Clash Verdict */}
                <div className="flex flex-col items-center px-3 border-x border-amber-500/20">
                  <span
                    className="font-bebas text-lg tracking-wider px-2.5 py-0.5 rounded border"
                    style={{
                      color: previewClash.color,
                      borderColor: previewClash.color,
                      backgroundColor: 'rgba(10, 8, 12, 0.85)',
                    }}
                  >
                    {previewClash.viLabel}
                  </span>
                  <span className="text-[10px] font-mono-num text-stone-400 mt-0.5">
                    Est. {previewClash.expectedSinner} vs {previewClash.expectedEnemy}
                  </span>
                </div>

                {/* Right: Enemy Skill Preview */}
                <div className="flex items-center justify-end gap-2.5 flex-1 text-right">
                  <div>
                    <div className="flex items-center justify-end gap-1.5">
                      <img
                        src={ATTACK_TYPE_INFO[previewTargetSlot.skill.attackType].icon}
                        alt=""
                        className="w-4 h-4 object-contain"
                      />
                      <span className="text-xs font-bold text-red-200">{previewTargetSlot.skill.name}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <div className="flex items-center gap-0.5 mr-1">
                        {Array.from({ length: previewTargetSlot.skill.coins }).map((_, idx) => (
                          <img key={idx} src="/assets/steam/ui/BattleUI_NewCoin_0.webp" alt="coin" className="w-3.5 h-3.5" />
                        ))}
                      </div>
                      <span className="font-mono-num text-xs text-red-300 font-bold">
                        Base {previewTargetSlot.skill.basePower} +{previewTargetSlot.skill.coinPower}
                      </span>
                    </div>
                  </div>
                  <img src={SIN_INFO[previewTargetSlot.skill.sin].icon} alt="" className="w-8 h-8 object-contain" />
                </div>
              </div>
              {/* Resistance Effectiveness Sub-bar */}
              <div className="flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-800/80 mt-1 pt-1">
                <span>
                  SP: <strong className="text-cyan-300">{selectedAlly.sp}</strong> (Heads:{' '}
                  {Math.min(95, Math.max(5, 50 + selectedAlly.sp))}%)
                </span>
                <span
                  className="font-bold"
                  style={{
                    color: getResistanceLabel(
                      previewEnemy.isStaggered
                        ? 2.0
                        : previewEnemy.resistances[previewAllySkill.attackType]
                    ).color,
                  }}
                >
                  Target Res ({previewAllySkill.attackType.toUpperCase()}):{' '}
                  {
                    getResistanceLabel(
                      previewEnemy.isStaggered
                        ? 2.0
                        : previewEnemy.resistances[previewAllySkill.attackType]
                    ).label
                  }
                </span>
              </div>
            </div>
          )
        )}

        {/* Right: E.G.O Gifts & Sin Resource Stockpile */}
        <div className="limbus-panel px-3 py-2 rounded flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            {ALL_SINS.map((sin) => (
              <div
                key={sin}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 border"
                style={{ borderColor: SIN_INFO[sin].borderHex }}
                title={SIN_INFO[sin].viName}
              >
                <img src={SIN_INFO[sin].icon} alt={sin} className="w-4 h-4 object-contain" />
                <span className="font-mono-num text-xs font-bold text-white">{sinResources[sin] || 0}</span>
              </div>
            ))}
          </div>
          {activeGifts.length > 0 && (
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-[10px] text-amber-300/80 uppercase font-bold">E.G.O Gifts:</span>
              {activeGifts.map((g) => (
                <img
                  key={g.id}
                  src={g.iconUrl}
                  alt={g.name}
                  title={`${g.name}: ${g.description}`}
                  className="w-5 h-5 rounded border border-amber-500/50 bg-black/80 object-contain"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==================== CENTER 2.5D BATTLEFIELD ARENA ==================== */}
      <div className="relative z-10 flex-1 flex items-center justify-between px-10 py-2">
        {/* Official Steam Dante & Charon Battle Announcer + Mili Boss Lyrics Overlay */}
        <div className="absolute top-1 inset-x-6 flex items-center justify-between pointer-events-none z-20">
          {/* Left: Official Steam Dante Battle Announcer */}
          <div className="flex items-center gap-2.5 bg-black/80 border border-amber-500/50 rounded-xl px-3 py-1.5 max-w-md shadow-xl">
            <img
              src="/assets/steam/ui/dante_announcer.webp"
              alt="Dante Announcer"
              className="w-10 h-10 rounded-lg object-cover border border-amber-400 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
                {announcerSpeaker === 'Dante'
                  ? 'DANTE // EXECUTIVE MANAGER ANNOUNCER'
                  : 'CHARON // MEPHISTOPHELES DRIVER'}
              </div>
              <div className="text-[11px] text-stone-200 italic truncate">
                “
                {announcerSpeaker === 'Dante'
                  ? OFFICIAL_DANTE_ANNOUNCER[announcerIdx % OFFICIAL_DANTE_ANNOUNCER.length]?.text
                  : OFFICIAL_CHARON_ANNOUNCER[announcerIdx % OFFICIAL_CHARON_ANNOUNCER.length]?.text}
                ”
              </div>
            </div>
          </div>

          {/* Right: Synchronized Official Mili Boss Song Lyrics */}
          {activeLyrics.length > 0 && (
            <div className="px-5 py-1.5 rounded-full bg-gradient-to-r from-red-950/90 via-black/90 to-purple-950/90 border border-amber-400/70 shadow-[0_0_25px_rgba(250,204,21,0.45)] flex items-center gap-2">
              <span className="text-[10px] font-mono-num font-bold text-amber-300 uppercase tracking-widest">
                ♪ {activeBgmMeta?.title || 'Mili Boss Theme'}:
              </span>
              <span className="font-display italic text-sm font-bold text-amber-100 tracking-wide drop-shadow">
                “{activeLyrics[lyricIdx % activeLyrics.length]}”
              </span>
            </div>
          )}
        </div>

        {/* LEFT: DEPLOYED SINNERS FORMATION */}
        <div className="grid grid-cols-3 gap-x-6 gap-y-4 w-[46%]">
          {allies.map((ally) => {
            const isSelected = ally.uid === selectedAlly?.uid;
            const activeSk = getActiveAllySkill(ally);
            const floats = floatingTexts.filter((f) => f.unitUid === ally.uid);
            const hasSlashVfx = slashVfxTargetUid?.uid === ally.uid;
            const dynamicPoseOffset =
              ally.animState === 'attack'
                ? ally.strikeComboIdx === 1
                  ? 'translate-x-24 -translate-y-2 scale-115 z-30'
                  : ally.strikeComboIdx === 2
                  ? 'translate-x-32 translate-y-1 scale-120 z-30'
                  : 'translate-x-36 -translate-y-3 scale-125 z-30'
                : ally.animState === 'move_center'
                ? 'translate-x-20 scale-110 z-30'
                : ally.animState === 'hit'
                ? '-translate-x-5 brightness-150'
                : '';

            return (
              <div
                key={ally.uid}
                onClick={() => {
                  soundManager.playSfx('ui_click');
                  setSelectedAllyUid(ally.uid);
                  triggerSkillPosePreview(ally.uid, activeSk.slot, activeSk.sin, activeSk.attackType);
                }}
                className={`relative flex flex-col items-center cursor-pointer transition-all duration-200 ${
                  ally.hp <= 0 ? 'opacity-30 grayscale pointer-events-none' : dynamicPoseOffset
                }`}
              >
                {/* Floating Damage / Buff Numbers */}
                <div className="absolute -top-10 inset-x-0 flex flex-col items-center pointer-events-none z-40">
                  {floats.map((f) => (
                    <div key={f.id} className="animate-float-damage text-center">
                      <div
                        className={`font-bebas ${
                          f.isCrit ? 'text-4xl' : 'text-3xl'
                        } drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]`}
                        style={{ color: f.color }}
                      >
                        {f.text}
                      </div>
                      {f.subtext && (
                        <div className="text-[10px] font-bold bg-black/85 px-1.5 py-0.5 rounded text-amber-300 border border-amber-500/40">
                          {f.subtext}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Overhead Speed & Queued Skill Pill */}
                <div className="flex items-center gap-1.5 mb-1 bg-black/85 px-2 py-0.5 rounded-full border border-amber-500/40 shadow">
                  <div className="flex items-center gap-0.5 text-amber-300 font-mono-num text-xs font-bold">
                    <img src="/assets/icons/stats/speed.webp" alt="" className="w-3.5 h-3.5" />
                    {ally.currentSpeed}
                  </div>
                  <span className="text-stone-600">|</span>
                  <img src={SIN_INFO[activeSk.sin].icon} alt="" className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold text-stone-200 max-w-[85px] truncate">{activeSk.name}</span>
                </div>

                {/* Character Battle Multi-Pose Sprite Frame */}
                <div
                  className={`relative w-32 h-36 flex items-center justify-center rounded-lg transition-all ${
                    isSelected
                      ? 'ring-2 ring-amber-400 bg-amber-500/10 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <img
                    key={`${ally.uid}_${ally.currentPose}`}
                    src={getUnitPoseSpriteUrl(ally)}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = ally.portraitUrl;
                    }}
                    alt={ally.name}
                    className={`max-h-36 w-auto object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.95)] transition-transform duration-150 ${
                      ally.isStaggered
                        ? 'sepia brightness-75 -rotate-6'
                        : ally.currentPose !== 'idle'
                        ? 'scale-110 drop-shadow-[0_0_18px_rgba(250,204,21,0.55)]'
                        : ''
                    }`}
                  />

                  {/* Active Combat Pose Badge when attacking/moving */}
                  {ally.currentPose !== 'idle' && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-red-950/95 border border-amber-300 text-[9px] font-mono-num font-extrabold text-amber-200 whitespace-nowrap shadow-lg z-30">
                      {ally.strikeComboIdx ? `STRIKE #${ally.strikeComboIdx} (${ally.currentPose.toUpperCase()})` : ally.currentPose.toUpperCase()}
                    </div>
                  )}

                  {/* Staggered Banner */}
                  {ally.isStaggered && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-amber-500/95 text-black font-bebas text-center text-sm tracking-widest py-0.5 rotate-[-8deg] shadow-lg">
                      STAGGERED!
                    </div>
                  )}

                  {/* Real Extracted Steam Weapon Slash VFX Overlay */}
                  {hasSlashVfx && slashVfxTargetUid && (
                    <div className="absolute -inset-6 pointer-events-none flex flex-col items-center justify-center z-40">
                      <img
                        src={slashVfxTargetUid.slashImgUrl}
                        alt="slash vfx"
                        style={{
                          transform: `rotate(${slashVfxTargetUid.rotationDeg}deg) scale(1.25)`,
                          filter: `drop-shadow(0 0 14px ${slashVfxTargetUid.color}) brightness(1.35)`,
                        }}
                        className="w-44 h-44 object-contain animate-ping"
                      />
                      {slashVfxTargetUid.poseLabel && (
                        <span className="px-2 py-0.5 rounded bg-black/90 border border-amber-400 text-[9px] font-mono-num font-bold text-amber-300 shadow-lg -mt-4">
                          {slashVfxTargetUid.poseLabel}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Sanity (SP) Orb */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono-num text-[11px] font-extrabold shadow-lg ${
                      ally.sp >= 0
                        ? 'bg-sky-950 border-sky-400 text-sky-200'
                        : 'bg-red-950 border-red-500 text-red-200 animate-pulse'
                    }`}
                    title={`Sanity (SP): ${ally.sp}`}
                  >
                    {ally.sp}
                  </div>
                </div>

                {/* HP Bar with Yellow Stagger Threshold Lines */}
                <div className="w-32 mt-1.5">
                  <div className="relative h-3 bg-stone-950 rounded overflow-hidden border border-stone-700">
                    <div
                      className="h-full bg-gradient-to-r from-red-700 to-emerald-500 transition-all duration-300"
                      style={{ width: `${Math.max(0, Math.min(100, (ally.hp / ally.maxHp) * 100))}%` }}
                    />
                    {/* Stagger Threshold Markers */}
                    {ally.staggerThresholds.map((th, idx) => {
                      const pct = Math.max(0, Math.min(100, (th / ally.maxHp) * 100));
                      return (
                        <div
                          key={idx}
                          className="absolute top-0 bottom-0 w-0.5 bg-amber-300 shadow-[0_0_4px_#facc15]"
                          style={{ left: `${pct}%` }}
                          title={`Stagger Threshold: ${th} HP`}
                        />
                      );
                    })}
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono-num font-bold text-white drop-shadow">
                      {ally.hp}/{ally.maxHp} {ally.shield > 0 ? `(+${ally.shield})` : ''}
                    </div>
                  </div>
                  <div className="text-center text-[11px] font-bold text-amber-100 truncate mt-0.5">
                    {ally.title}
                  </div>
                </div>

                {/* Status Effect Icons Row */}
                {ally.statuses.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1 mt-0.5 max-w-[130px]">
                    {ally.statuses.map((st) => (
                      <div
                        key={st.type}
                        className="flex items-center gap-0.5 bg-black/85 px-1 py-0.2 rounded border border-stone-700 text-[9px] font-mono-num"
                        title={`${STATUS_INFO[st.type].viName}: Potency ${st.potency}, Count ${st.count}`}
                      >
                        <img src={STATUS_INFO[st.type].icon} alt={st.type} className="w-3 h-3 object-contain" />
                        <span className="text-amber-300 font-bold">{st.potency}</span>
                        <span className="text-stone-400">×{st.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CENTER CLASH EMBLEM / VS INDICATOR */}
        <div className="flex flex-col items-center justify-center pointer-events-none px-2">
          <div className="w-14 h-14 rounded-full bg-red-950/80 border-2 border-amber-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(185,28,28,0.6)]">
            <Swords className="w-7 h-7 text-amber-400" />
          </div>
          {resonanceInfo.absResSin && (
            <div
              className="mt-2 px-3 py-0.5 rounded-full text-[10px] font-extrabold tracking-widest uppercase border animate-pulse"
              style={{
                backgroundColor: SIN_INFO[resonanceInfo.absResSin].bgHex,
                borderColor: SIN_INFO[resonanceInfo.absResSin].borderHex,
                color: SIN_INFO[resonanceInfo.absResSin].textHex,
              }}
            >
              ABS. {SIN_INFO[resonanceInfo.absResSin].name} RESONANCE!
            </div>
          )}
        </div>

        {/* RIGHT: ENEMIES & ABNORMALITY PARTS */}
        <div className="flex items-center justify-end gap-8 w-[46%]">
          {enemies.map((enemy) => {
            const mySlots = enemySlots.filter((s) => s.enemyUid === enemy.uid);
            const floats = floatingTexts.filter((f) => f.unitUid === enemy.uid);
            const hasSlashVfx = slashVfxTargetUid?.uid === enemy.uid;
            const isBoss = enemy.enemyTemplate?.isBoss;
            const enemyDynamicOffset =
              enemy.animState === 'attack'
                ? enemy.strikeComboIdx === 1
                  ? '-translate-x-24 -translate-y-2 scale-115 z-30'
                  : '-translate-x-32 translate-y-1 scale-120 z-30'
                : enemy.animState === 'move_center'
                ? '-translate-x-20 scale-105 z-30'
                : enemy.animState === 'hit'
                ? 'translate-x-5 brightness-150'
                : '';

            return (
              <div
                key={enemy.uid}
                className={`relative flex flex-col items-center transition-all duration-200 ${
                  enemy.hp <= 0 ? 'opacity-25 grayscale pointer-events-none scale-90' : enemyDynamicOffset
                }`}
              >
                {/* Floating Damage Numbers */}
                <div className="absolute -top-12 inset-x-0 flex flex-col items-center pointer-events-none z-40">
                  {floats.map((f) => (
                    <div key={f.id} className="animate-float-damage text-center">
                      <div
                        className={`font-bebas ${
                          f.isCrit ? 'text-5xl' : 'text-4xl'
                        } drop-shadow-[0_2px_10px_rgba(0,0,0,0.98)]`}
                        style={{ color: f.color }}
                      >
                        {f.text}
                      </div>
                      {f.subtext && (
                        <div className="text-[10px] font-bold bg-black/90 px-2 py-0.5 rounded text-amber-300 border border-amber-500/50">
                          {f.subtext}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Overhead Action Slots (Clickable to Aim & Clash!) */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                  {mySlots.map((slot) => {
                    const isTargetedBySelected = selectedAlly?.targetEnemySlotUid === slot.slotUid;
                    const clashingAlly = allies.find((a) => a.targetEnemySlotUid === slot.slotUid && a.hp > 0);
                    return (
                      <button
                        key={slot.slotUid}
                        onClick={() => handleSelectEnemySlot(slot.slotUid)}
                        className={`px-2.5 py-1 rounded flex items-center gap-1.5 border transition cursor-pointer ${
                          isTargetedBySelected
                            ? 'bg-red-900/90 border-amber-300 ring-2 ring-amber-400 scale-105'
                            : clashingAlly
                            ? 'bg-stone-900/90 border-amber-500/60'
                            : 'bg-black/80 border-red-500/50 hover:border-amber-400'
                        }`}
                        title={`Click to target this slot with ${selectedAlly?.title || 'Sinner'}!`}
                      >
                        <span className="font-mono-num text-xs font-bold text-amber-300">{slot.speed}</span>
                        <img src={SIN_INFO[slot.skill.sin].icon} alt="" className="w-4 h-4" />
                        <img src={ATTACK_TYPE_INFO[slot.skill.attackType].icon} alt="" className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold text-stone-100 max-w-[95px] truncate">
                          {slot.skill.name}
                        </span>
                        {clashingAlly && (
                          <span className="px-1 py-0.2 bg-amber-500/20 border border-amber-400/50 rounded text-[9px] text-amber-200 font-bold">
                            vs {clashingAlly.title}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Enemy / Boss Multi-Pose Action Sprite Frame */}
                <div
                  onClick={() => {
                    if (mySlots[0]) handleSelectEnemySlot(mySlots[0].slotUid);
                  }}
                  className={`relative flex items-center justify-center rounded-xl border-2 cursor-pointer transition ${
                    isBoss ? 'w-52 h-56' : 'w-36 h-40'
                  } ${
                    enemy.isStaggered
                      ? 'border-amber-400 bg-amber-950/30'
                      : 'border-red-600/70 bg-gradient-to-b from-red-950/40 to-black/80 shadow-[0_0_30px_rgba(220,38,38,0.35)]'
                  }`}
                >
                  <img
                    key={`${enemy.uid}_${enemy.currentPose}`}
                    src={getUnitPoseSpriteUrl(enemy)}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = enemy.portraitUrl;
                    }}
                    alt={enemy.name}
                    className="max-h-full max-w-full object-contain p-1 -scale-x-100 drop-shadow-[0_10px_18px_rgba(0,0,0,0.95)] transition-transform duration-150"
                  />

                  {enemy.currentPose !== 'idle' && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-red-950/95 border border-red-400 text-[9px] font-mono-num font-extrabold text-amber-200 whitespace-nowrap z-30">
                      {enemy.strikeComboIdx ? `BOSS STRIKE #${enemy.strikeComboIdx} (${enemy.currentPose.toUpperCase()})` : enemy.currentPose.toUpperCase()}
                    </div>
                  )}

                  {enemy.enemyTemplate?.riskLevel && (
                    <div
                      className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold border"
                      style={{
                        color: RISK_LEVEL_COLOR[enemy.enemyTemplate.riskLevel].text,
                        backgroundColor: RISK_LEVEL_COLOR[enemy.enemyTemplate.riskLevel].bg,
                        borderColor: RISK_LEVEL_COLOR[enemy.enemyTemplate.riskLevel].border,
                      }}
                    >
                      {enemy.enemyTemplate.riskLevel}
                    </div>
                  )}

                  {enemy.isStaggered && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-amber-500 text-black font-bebas text-center text-xl tracking-widest py-1 -rotate-6 shadow-xl z-30">
                      STAGGERED!! (FATAL ×2.0)
                    </div>
                  )}

                  {/* Real Extracted Steam Weapon Slash VFX on Enemy */}
                  {hasSlashVfx && slashVfxTargetUid && (
                    <div className="absolute -inset-8 pointer-events-none flex flex-col items-center justify-center z-40">
                      <img
                        src={slashVfxTargetUid.slashImgUrl}
                        alt="slash vfx"
                        style={{
                          transform: `rotate(${slashVfxTargetUid.rotationDeg}deg) scale(1.35)`,
                          filter: `drop-shadow(0 0 18px ${slashVfxTargetUid.color}) brightness(1.4)`,
                        }}
                        className="w-56 h-56 object-contain animate-ping"
                      />
                      {slashVfxTargetUid.poseLabel && (
                        <span className="px-2.5 py-0.5 rounded bg-black/95 border border-amber-400 text-[10px] font-mono-num font-extrabold text-amber-300 shadow-xl -mt-6">
                          {slashVfxTargetUid.poseLabel}
                        </span>
                      )}
                    </div>
                  )}

                  {enemy.hasSanity && (
                    <div className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full bg-red-950 border-2 border-red-400 flex items-center justify-center font-mono-num text-xs font-bold text-red-200">
                      {enemy.sp}
                    </div>
                  )}
                </div>

                {/* Enemy HP Bar */}
                <div className={`${isBoss ? 'w-56' : 'w-36'} mt-2`}>
                  <div className="relative h-4 bg-stone-950 rounded overflow-hidden border border-red-500/60">
                    <div
                      className="h-full bg-gradient-to-r from-red-900 via-red-600 to-amber-500 transition-all duration-300"
                      style={{ width: `${Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100))}%` }}
                    />
                    {enemy.staggerThresholds.map((th, idx) => {
                      const pct = Math.max(0, Math.min(100, (th / enemy.maxHp) * 100));
                      return (
                        <div
                          key={idx}
                          className="absolute top-0 bottom-0 w-0.5 bg-amber-300 shadow-[0_0_4px_#facc15]"
                          style={{ left: `${pct}%` }}
                        />
                      );
                    })}
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono-num font-extrabold text-white drop-shadow">
                      {enemy.hp} / {enemy.maxHp}
                    </div>
                  </div>
                  <div className="text-center font-display text-xs font-bold text-red-200 mt-0.5 truncate">
                    {enemy.name}
                  </div>
                </div>

                {/* Enemy Status Effects */}
                {enemy.statuses.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1 mt-1 max-w-[210px]">
                    {enemy.statuses.map((st) => (
                      <div
                        key={st.type}
                        className="flex items-center gap-0.5 bg-black/90 px-1.5 py-0.5 rounded border border-red-900/80 text-[10px] font-mono-num"
                        title={`${STATUS_INFO[st.type].viName}: Potency ${st.potency}, Count ${st.count}`}
                      >
                        <img src={STATUS_INFO[st.type].icon} alt={st.type} className="w-3.5 h-3.5 object-contain" />
                        <span className="text-amber-300 font-bold">{st.potency}</span>
                        <span className="text-stone-400">×{st.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================== BOTTOM LIMBUS SKILL DASHBOARD HUD ==================== */}
      <div className="relative z-20 px-4 pb-3 pt-1">
        <div className="limbus-panel rounded-xl p-3 flex items-center justify-between gap-4">
          {/* Left: Auto-Chain Controls (Win Rate / Damage) + Combat Log Snippet */}
          <div className="flex flex-col gap-2 min-w-[165px]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80">
              COMBAT ORDERS
            </div>
            <button
              disabled={phase !== 'planning'}
              onClick={handleAutoWinRate}
              className="px-3 py-2 rounded bg-gradient-to-r from-amber-700/80 to-yellow-600/80 hover:from-amber-600 hover:to-yellow-500 border border-amber-300 text-xs font-extrabold tracking-wider text-black flex items-center justify-center gap-1.5 shadow cursor-pointer disabled:opacity-40"
            >
              <Award className="w-4 h-4" />
              WIN RATE
            </button>
            <button
              disabled={phase !== 'planning'}
              onClick={handleAutoDamage}
              className="px-3 py-2 rounded bg-gradient-to-r from-red-900/90 to-red-700/90 hover:from-red-800 hover:to-red-600 border border-red-400 text-xs font-extrabold tracking-wider text-amber-100 flex items-center justify-center gap-1.5 shadow cursor-pointer disabled:opacity-40"
            >
              <Flame className="w-4 h-4 text-amber-300" />
              DAMAGE
            </button>
            <div className="text-[10px] text-stone-400 truncate max-w-[165px]" title={combatLog[0]}>
              {combatLog[0]}
            </div>
          </div>

          {/* Center: 6 Sinner Skill Columns (Top Skill, Bottom Skill, Defense, E.G.O) */}
          <div className="flex-1 flex items-center justify-center gap-2.5 overflow-x-auto py-1">
            {allies.map((ally, idx) => {
              const deployedEntry = deployedSinners.find((d) => d.sinner.id === ally.sinner?.id);
              const equippedEgos = deployedEntry?.egos || [];
              const activeSk = getActiveAllySkill(ally);

              const renderSkillButton = (sk: SkillData, row: 'top' | 'bottom') => {
                const isChosen = ally.selectedRow === row;
                const sinMeta = SIN_INFO[sk.sin];
                return (
                  <button
                    type="button"
                    disabled={phase !== 'planning' || ally.hp <= 0 || ally.isStaggered}
                    onClick={() => {
                      soundManager.playSfx('ui_click');
                      setSelectedAllyUid(ally.uid);
                      setAllies((prev) =>
                        prev.map((a) =>
                          a.uid === ally.uid ? { ...a, selectedRow: row, selectedEgo: undefined } : a
                        )
                      );
                      triggerSkillPosePreview(ally.uid, sk.slot, sk.sin, sk.attackType);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-md border text-left transition relative overflow-hidden cursor-pointer ${
                      isChosen
                        ? 'ring-2 ring-amber-300 scale-[1.03] shadow-lg'
                        : 'opacity-65 hover:opacity-95'
                    }`}
                    style={{
                      backgroundColor: sinMeta.bgHex,
                      borderColor: isChosen ? '#fde047' : sinMeta.borderHex,
                    }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <img src={sinMeta.icon} alt={sk.sin} className="w-4 h-4 shrink-0" />
                        <span className="text-[11px] font-bold text-white truncate">{sk.name}</span>
                      </div>
                      <img src={ATTACK_TYPE_INFO[sk.attackType].icon} alt="" className="w-3.5 h-3.5 shrink-0" />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] font-mono-num text-amber-200 font-bold">
                        S{sk.slot} • {sk.basePower}
                        {sk.coinPower >= 0 ? `+${sk.coinPower}` : sk.coinPower}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: sk.coins }).map((_, cIdx) => (
                          <img key={cIdx} src="/assets/steam/ui/BattleUI_NewCoin_0.webp" alt="c" className="w-3 h-3" />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              };

              return (
                <div
                  key={ally.uid}
                  className={`flex flex-col items-center w-40 shrink-0 p-1.5 rounded-lg border transition ${
                    ally.uid === selectedAlly?.uid
                      ? 'bg-amber-950/25 border-amber-400/70'
                      : 'bg-black/50 border-stone-800'
                  }`}
                >
                  {/* Top Skill in Column */}
                  {renderSkillButton(ally.topSkill, 'top')}

                  {/* Chain Connector Bar */}
                  <div
                    className="w-1.5 h-2 my-0.5 rounded-full"
                    style={{ backgroundColor: SIN_INFO[activeSk.sin].color }}
                  />

                  {/* Bottom Skill in Column */}
                  {renderSkillButton(ally.bottomSkill, 'bottom')}

                  {/* Bottom Portrait + Defense & E.G.O Action Row */}
                  <div className="w-full flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-stone-800">
                    {/* Sinner Mini Portrait */}
                    <div
                      onClick={() => setSelectedAllyUid(ally.uid)}
                      className="flex items-center gap-1.5 cursor-pointer min-w-0"
                    >
                      <img
                        src={ally.sinner?.portraitUrl}
                        alt={ally.title}
                        className="w-7 h-7 rounded-full object-cover border border-amber-500/60"
                      />
                      <span className="text-[10px] font-bold text-stone-300 truncate">#{idx + 1}</span>
                    </div>

                    {/* Defense Toggle Button */}
                    <button
                      type="button"
                      disabled={phase !== 'planning' || ally.hp <= 0 || ally.isStaggered}
                      onClick={() => {
                        soundManager.playSfx('ui_click');
                        setSelectedAllyUid(ally.uid);
                        setAllies((prev) =>
                          prev.map((a) =>
                            a.uid === ally.uid
                              ? {
                                  ...a,
                                  selectedRow: a.selectedRow === 'defense' ? 'top' : 'defense',
                                  selectedEgo: undefined,
                                }
                              : a
                          )
                        );
                      }}
                      className={`px-1.5 py-1 rounded border text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                        ally.selectedRow === 'defense'
                          ? 'bg-sky-900 border-sky-300 text-white'
                          : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-white'
                      }`}
                      title={`Defense Skill: ${ally.identity?.defenseSkill.name}`}
                    >
                      <Shield className="w-3 h-3" />
                      DEF
                    </button>

                    {/* E.G.O Selector Button */}
                    <button
                      type="button"
                      disabled={phase !== 'planning' || ally.hp <= 0 || ally.isStaggered}
                      onClick={() => {
                        soundManager.playSfx('ui_click');
                        setSelectedAllyUid(ally.uid);
                        setEgoModalAllyUid(egoModalAllyUid === ally.uid ? null : ally.uid);
                      }}
                      className={`px-1.5 py-1 rounded border text-[10px] font-extrabold flex items-center gap-0.5 cursor-pointer ${
                        ally.selectedRow === 'ego'
                          ? 'bg-red-800 border-amber-300 text-amber-200 animate-pulse'
                          : 'bg-amber-950/60 border-amber-600/60 text-amber-300 hover:bg-amber-900/60'
                      }`}
                      title={`Manifest E.G.O (${equippedEgos.length} available)`}
                    >
                      <Sparkles className="w-3 h-3" />
                      E.G.O
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Giant Spinning Gear START! Combat Button */}
          <div className="flex flex-col items-center justify-center pl-2">
            <button
              disabled={phase !== 'planning'}
              onClick={executeCombatTurn}
              className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-700 via-red-900 to-black border-4 border-amber-400 shadow-[0_0_30px_rgba(220,38,38,0.8)] hover:scale-105 active:scale-95 transition flex flex-col items-center justify-center cursor-pointer disabled:opacity-40 group"
            >
              <div className="absolute inset-1 rounded-full border border-dashed border-amber-300/60 animate-gear-slow pointer-events-none" />
              <Swords className="w-7 h-7 text-amber-300 group-hover:rotate-12 transition" />
              <span className="font-bebas text-2xl tracking-widest text-amber-100 leading-none mt-0.5">
                START!
              </span>
              <span className="text-[9px] text-amber-300/80 uppercase">CHAIN</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================== E.G.O AWAKENING / OVERCLOCK POPUP MODAL ==================== */}
      {egoModalAllyUid && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEgoModalAllyUid(null)}
        >
          <div
            className="limbus-crimson-panel rounded-xl max-w-xl w-full p-5 border-2 border-amber-500"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const ally = allies.find((a) => a.uid === egoModalAllyUid);
              const entry = deployedSinners.find((d) => d.sinner.id === ally?.sinner?.id);
              const egos = entry?.egos || [];
              if (!ally) return null;

              return (
                <>
                  <div className="flex items-center justify-between border-b border-red-500/40 pb-3 mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={ally.sinner?.portraitUrl}
                        alt=""
                        className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover"
                      />
                      <div>
                        <h3 className="font-display text-lg font-bold text-amber-200">
                          MANIFEST E.G.O — {ally.title}
                        </h3>
                        <p className="text-xs text-stone-300">
                          Current Sanity (SP): <strong className="text-cyan-300">{ally.sp}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEgoModalAllyUid(null)}
                      className="px-3 py-1 rounded bg-stone-900 border border-stone-700 text-xs text-stone-300 cursor-pointer"
                    >
                      ESC
                    </button>
                  </div>

                  <div className="space-y-3">
                    {egos.map((ego) => {
                      const affordable = canAffordEgo(ego);
                      const riskStyle = RISK_LEVEL_COLOR[ego.riskLevel];
                      return (
                        <div
                          key={ego.id}
                          className="limbus-panel p-3.5 rounded-lg flex items-center justify-between gap-4"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-extrabold border"
                                style={{
                                  color: riskStyle.text,
                                  backgroundColor: riskStyle.bg,
                                  borderColor: riskStyle.border,
                                }}
                              >
                                {ego.riskLevel}
                              </span>
                              <img src={SIN_INFO[ego.sin].icon} alt="" className="w-5 h-5" />
                              <span className="font-display font-bold text-base text-amber-100">
                                {ego.name}
                              </span>
                              <span className="text-xs text-stone-400">({ego.abnormalityName})</span>
                            </div>
                            <p className="text-xs italic text-amber-200/80 mt-1">“{ego.quote}”</p>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                              <span className="font-mono-num text-amber-300 font-bold">
                                Power: {ego.basePower} +{ego.coinPower} (AOE Weight {ego.attackWeight})
                              </span>
                              <span className="text-sky-300 font-mono-num">SP Cost: -{ego.spCost}</span>
                              <div className="flex items-center gap-1.5">
                                {Object.entries(ego.sinCost).map(([s, c]) => (
                                  <span
                                    key={s}
                                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/70 border text-[11px] font-mono-num ${
                                      (sinResources[s as SinAffinity] || 0) >= (c || 0)
                                        ? 'border-emerald-500/60 text-emerald-300'
                                        : 'border-red-500 text-red-400'
                                    }`}
                                  >
                                    <img src={SIN_INFO[s as SinAffinity].icon} alt="" className="w-3.5 h-3.5" />
                                    {sinResources[s as SinAffinity] || 0}/{c}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-[11px] text-stone-300 mt-1">
                              {ego.effects.map((e) => e.description).join(' • ')}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              disabled={!affordable}
                              onClick={() => handleSelectEgoSkill(ally.uid, ego, false)}
                              className="px-4 py-2 rounded bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-extrabold text-xs tracking-wider cursor-pointer disabled:opacity-30"
                            >
                              AWAKEN
                            </button>
                            <button
                              disabled={!affordable}
                              onClick={() => handleSelectEgoSkill(ally.uid, ego, true)}
                              className="px-3 py-1.5 rounded bg-red-950 border border-red-500 text-red-200 font-bold text-[10px] tracking-wider hover:bg-red-900 cursor-pointer disabled:opacity-30"
                              title="Overclock E.G.O (Corrosion Quote & Power)"
                            >
                              OVERCLOCK
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ==================== FULL-SCREEN E.G.O CUT-IN ANIMATION OVERLAY ==================== */}
      {egoCutIn && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/85 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-35"
            style={{ backgroundImage: `url('/assets/steam/ui/UserinfoTicket_EGO_Bg_24.webp')` }}
          />
          <div className="w-full py-10 hazard-stripes border-y-4 border-amber-400 flex items-center justify-center relative animate-ego-cutin shadow-[0_0_80px_rgba(220,38,38,0.9)]">
            <img
              src="/assets/steam/ui/BattleUI_DanteAbility_06_0.webp"
              alt=""
              className="absolute left-8 top-4 h-16 w-auto object-contain opacity-85"
            />
            <img
              src={egoCutIn.sinner.vnSpriteUrl || egoCutIn.sinner.portraitUrl}
              alt={egoCutIn.sinner.name}
              className="h-80 w-auto object-contain drop-shadow-[0_0_30px_rgba(250,204,21,0.8)] relative z-10"
            />
            <div className="max-w-xl ml-8 text-left bg-black/90 p-6 rounded-xl border-2 border-amber-400 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={
                    egoCutIn.ego.riskLevel === 'ALEPH'
                      ? '/assets/steam/gacha/MainUI_Gacha_4_Illust_E5_ALEPH.webp'
                      : egoCutIn.ego.riskLevel === 'WAW'
                      ? '/assets/steam/gacha/MainUI_Gacha_4_Illust_E4_WAW.webp'
                      : egoCutIn.ego.riskLevel === 'HE'
                      ? '/assets/steam/gacha/MainUI_Gacha_4_Illust_E3_HE.webp'
                      : egoCutIn.ego.riskLevel === 'TETH'
                      ? '/assets/steam/gacha/MainUI_Gacha_4_Illust_E2_TETH.webp'
                      : '/assets/steam/gacha/MainUI_Gacha_4_Illust_E1_ZAYIN.webp'
                  }
                  alt={egoCutIn.ego.riskLevel}
                  className="h-8 w-auto object-contain"
                />
                <span className="px-2.5 py-0.5 bg-red-700 text-amber-200 font-bebas text-lg tracking-widest rounded">
                  {egoCutIn.corroded ? 'E.G.O CORROSION' : 'E.G.O AWAKENING'}
                </span>
                <img src={SIN_INFO[egoCutIn.ego.sin].icon} alt="" className="w-7 h-7" />
              </div>
              <h2 className="font-display text-4xl font-black text-amber-300 tracking-wide">
                {egoCutIn.ego.name}
              </h2>
              <p className="text-lg italic text-white mt-3 font-serif">
                “{egoCutIn.corroded ? egoCutIn.ego.corrosionQuote : egoCutIn.ego.quote}”
              </p>
              <div className="text-xs text-amber-400/80 mt-2 uppercase tracking-widest">
                SINNER #{egoCutIn.sinner.numberStr} — {egoCutIn.sinner.name}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ABNORMALITY MID-BATTLE SKILL CHECK EVENT MODAL ==================== */}
      {phase === 'abnormality_check' && activeAbnoEvent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="limbus-crimson-panel max-w-2xl w-full rounded-xl p-6 border-2 border-amber-400 shadow-2xl">
            <div className="hazard-stripes-gold px-4 py-1.5 rounded mb-4 flex items-center justify-between">
              <span className="font-bebas text-xl tracking-widest text-black bg-amber-300 px-2 rounded">
                ABNORMALITY CHOICE EVENT
              </span>
              <span className="text-xs font-bold text-amber-200 bg-black/80 px-2 py-0.5 rounded">
                Recommended Sin: {SIN_INFO[activeAbnoEvent.event.recommendedSin].viName} (Target{' '}
                {activeAbnoEvent.event.difficulty}+)
              </span>
            </div>

            <h3 className="font-display text-2xl font-bold text-amber-200 mb-2">
              {activeAbnoEvent.event.title}
            </h3>
            <p className="text-sm text-stone-200 leading-relaxed bg-black/60 p-4 rounded border border-stone-800 mb-5">
              {activeAbnoEvent.event.description}
            </p>

            {!activeAbnoEvent.result ? (
              <>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                  Select a Sinner to Perform the Check:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {allies
                    .filter((a) => a.hp > 0)
                    .map((ally) => {
                      const hasMatchingSin = ally.identity?.skills.some(
                        (s) => s.sin === activeAbnoEvent.event.recommendedSin
                      );
                      return (
                        <button
                          key={ally.uid}
                          onClick={() => handlePerformAbnoCheck(ally)}
                          className={`p-3 rounded-lg border text-left transition flex items-center gap-2.5 cursor-pointer ${
                            hasMatchingSin
                              ? 'bg-amber-950/60 border-amber-400 hover:bg-amber-900/70'
                              : 'bg-stone-900/80 border-stone-700 hover:border-amber-500/50'
                          }`}
                        >
                          <img
                            src={ally.sinner?.portraitUrl}
                            alt=""
                            className="w-11 h-11 rounded-full object-cover border border-amber-400"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-white truncate">{ally.title}</div>
                            <div className="text-[10px] text-cyan-300">SP: {ally.sp}</div>
                            <div
                              className={`text-[10px] font-bold ${
                                hasMatchingSin ? 'text-emerald-400' : 'text-stone-400'
                              }`}
                            >
                              {hasMatchingSin ? '★ High Advantage (+4)' : 'Normal Advantage'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </>
            ) : (
              <div className="bg-black/80 p-4 rounded-lg border border-amber-400/60 text-center">
                <div
                  className={`font-bebas text-4xl tracking-widest ${
                    activeAbnoEvent.result.success ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {activeAbnoEvent.result.success ? 'CHECK PASSED!!' : 'CHECK FAILED!'} (Rolled{' '}
                  {activeAbnoEvent.result.roll} vs {activeAbnoEvent.event.difficulty})
                </div>
                <p className="text-sm text-stone-200 mt-2">{activeAbnoEvent.result.text}</p>
                <button
                  onClick={closeAbnoEventAndContinue}
                  className="mt-4 px-6 py-2 rounded bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm cursor-pointer"
                >
                  RESUME COMBAT
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== VICTORY / DEFEAT RESULT OVERLAY ==================== */}
      {(phase === 'victory' || phase === 'defeat') && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="limbus-panel max-w-lg w-full rounded-xl p-7 border-2 border-amber-400 text-center shadow-2xl">
            <div className="font-bebas text-6xl tracking-widest mb-2 text-amber-300">
              {phase === 'victory' ? 'COMBAT VICTORY' : 'DEFEAT — CLOCK REWIND'}
            </div>
            <p className="text-sm text-stone-300 mb-5">
              {phase === 'victory'
                ? `Mephistopheles harvested the Enkephalin & rewards from ${stage.title}!`
                : 'Dante’s Golden Clock rewinds time to revive the Sinners...'}
            </p>

            {phase === 'victory' && (
              <div className="grid grid-cols-4 gap-2 mb-6 bg-black/60 p-3.5 rounded-lg border border-amber-500/30">
                <div>
                  <div className="text-[10px] text-rose-300 uppercase">Lunacy</div>
                  <div className="font-mono-num text-lg font-bold text-rose-400">+{stage.rewards.lunacy}</div>
                </div>
                <div>
                  <div className="text-[10px] text-amber-300 uppercase">EXP Tickets</div>
                  <div className="font-mono-num text-lg font-bold text-amber-400">+{stage.rewards.expTickets}</div>
                </div>
                <div>
                  <div className="text-[10px] text-sky-300 uppercase">Thread</div>
                  <div className="font-mono-num text-lg font-bold text-sky-400">+{stage.rewards.thread}</div>
                </div>
                <div>
                  <div className="text-[10px] text-purple-300 uppercase">Egoshards</div>
                  <div className="font-mono-num text-lg font-bold text-purple-400">+{stage.rewards.shards}</div>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                soundManager.playSfx('ui_click');
                if (phase === 'victory') {
                  const hpPercents: Record<number, number> = {};
                  const spValues: Record<number, number> = {};
                  allies.forEach((a) => {
                    if (a.sinner) {
                      hpPercents[a.sinner.id] = Math.max(0.15, a.hp / a.maxHp);
                      spValues[a.sinner.id] = a.sp;
                    }
                  });
                  onVictory({ hpPercents, spValues });
                } else {
                  onDefeat();
                }
              }}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white font-display font-bold text-base tracking-wider border border-amber-300 shadow-lg cursor-pointer"
            >
              {phase === 'victory' ? 'COLLECT REWARDS & CONTINUE' : 'RETURN TO MEPHISTOPHELES'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
