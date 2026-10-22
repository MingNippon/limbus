import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { EgoData, IdentityData, PlayerSaveState } from '../types/game';
import { IDENTITIES, SINNERS } from '../data/sinnersAndIdentities';
import { EGOS } from '../data/egos';
import { ATTACK_TYPE_INFO, RISK_LEVEL_COLOR, SIN_INFO } from '../data/constants';
import { soundManager } from '../audio/SoundManager';
import {
  Sparkles,
  ShoppingBag,
  Unlock,
  Check,
  FastForward,
  Volume2,
  Eye,
  RotateCcw,
  Award,
  Flame,
  Zap,
  ChevronRight,
} from 'lucide-react';

interface ExtractScreenProps {
  save: PlayerSaveState;
  onUpdateSave: (updater: (prev: PlayerSaveState) => PlayerSaveState) => void;
}

interface PullResultItem {
  index: number;
  kind: 'identity' | 'ego';
  id: string;
  name: string;
  worldOrAbno: string;
  quote: string;
  sinnerName: string;
  sinnerNumber: string;
  sinnerId: number;
  rarityLabel: string;
  tierRank: 1 | 3 | 4; // 1 = 0 ID, 3 = 000 ID, 4 = E.G.O
  isHighTier: boolean;
  isFakeout: boolean;
  isDuplicate: boolean;
  shardsGained: number;
  portraitUrl: string;
  splashUrl: string;
  emblemUrl: string;
  signatureSkillName: string;
  signatureSin: keyof typeof SIN_INFO;
  revealed: boolean;
}

type ExtractionStage =
  | 'idle'
  | 'lever_ready'
  | 'door_blast'
  | 'cinematic_cutin'
  | 'mirror_pods'
  | 'summary';

interface BannerInfo {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  accentColor: string;
  bgUrl: string;
  bannerButtonImg: string;
  posterImg: string;
  featuredSprites: string[];
  featuredSinnerIds: number[];
  highTierRate: number;
}

const SHOWCASE_POSES = [
  'idle',
  'move',
  's1_1',
  's1_2',
  's1_3',
  's2_1',
  's2_2',
  's2_3',
  's3_1',
  's3_2',
  's3_3',
  's3_4',
];

const BANNERS: BannerInfo[] = [
  {
    id: 'walpurgis_don',
    tag: 'TARGET EXTRACTION // LA MANCHALAND & WALPURGIS',
    title: 'LE NOIR BRAND MANAGER DON QUIXOTE & SPICEBUSH',
    subtitle:
      'Rate-Up đặc biệt Nhân Cách 000 Don Quixote, Spicebush Yi Sang, The One Who Shall Grip Sinclair & Captain Ishmael!',
    accentColor: '#facc15',
    bgUrl: '/assets/steam/gacha/poster_100241_en.webp',
    bannerButtonImg: '/assets/steam/gacha/banner_en_10.webp',
    posterImg: '/assets/steam/gacha/poster_100241_en.webp',
    featuredSprites: [
      '/assets/steam/chars/sinner_3/s3_2.webp',
      '/assets/steam/chars/sinner_1/s3_2.webp',
      '/assets/steam/chars/sinner_10/s3_2.webp',
      '/assets/steam/chars/sinner_8/s3_2.webp',
    ],
    featuredSinnerIds: [3, 1, 10, 8],
    highTierRate: 0.25,
  },
  {
    id: 'hongyuan_blade',
    tag: 'SEASON HIGHLIGHT // TARGET EXTRACTION',
    title: 'HONGYUAN & WUTHERING HEIGHTS ASSAULT',
    subtitle:
      'Rate-Up đặc biệt cho Hong Lu, Blade Lineage Mentor Meursault, Chief Butler Outis & Chief Butler Ryōshū!',
    accentColor: '#38bdf8',
    bgUrl: '/assets/steam/gacha/poster_100199_en.webp',
    bannerButtonImg: '/assets/steam/gacha/banner_en_3.webp',
    posterImg: '/assets/steam/gacha/poster_100199_en.webp',
    featuredSprites: [
      '/assets/steam/chars/sinner_6/s3_2.webp',
      '/assets/steam/chars/sinner_5/s3_2.webp',
      '/assets/steam/chars/sinner_11/s3_2.webp',
      '/assets/steam/chars/sinner_4/s3_2.webp',
    ],
    featuredSinnerIds: [6, 5, 11, 4],
    highTierRate: 0.22,
  },
  {
    id: 'ego_target',
    tag: 'E.G.O & 000 TARGET // ABNORMALITY EXTRACTION',
    title: 'NEW TARGET E.G.O & HAUTE COUTURE RODION',
    subtitle:
      'Tăng mạnh tỷ lệ xuất hiện E.G.O cấp HE / WAW / ALEPH cùng Nhân Cách 000 Rodion, Faust, Heathcliff & Gregor!',
    accentColor: '#c084fc',
    bgUrl: '/assets/steam/gacha/poster_100231_en.webp',
    bannerButtonImg: '/assets/steam/gacha/banner_en_12.webp',
    posterImg: '/assets/steam/gacha/poster_100231_en.webp',
    featuredSprites: [
      '/assets/steam/chars/sinner_9/s3_2.webp',
      '/assets/steam/chars/sinner_2/s3_2.webp',
      '/assets/steam/chars/sinner_7/s2_2.webp',
      '/assets/steam/chars/sinner_12/s3_2.webp',
    ],
    featuredSinnerIds: [9, 2, 7, 12],
    highTierRate: 0.24,
  },
  {
    id: 'standard_assured',
    tag: 'ASSURED ★3 // MEPHISTOPHELES ENGINE',
    title: 'SEASON ★3 IDENTITY ASSURED EXTRACTION',
    subtitle:
      'Bao gồm toàn bộ 12 Tội Nhân, tất cả Nhân Cách 000 và E.G.O từ Thế Giới Gương.',
    accentColor: '#ef4444',
    bgUrl: '/assets/steam/gacha/poster_100239_en.webp',
    bannerButtonImg: '/assets/steam/gacha/banner_en_1.webp',
    posterImg: '/assets/steam/gacha/poster_100239_en.webp',
    featuredSprites: [
      '/assets/steam/chars/sinner_9/s2_2.webp',
      '/assets/steam/chars/sinner_12/s2_2.webp',
      '/assets/steam/chars/sinner_7/s3_2.webp',
      '/assets/steam/chars/sinner_2/s2_2.webp',
    ],
    featuredSinnerIds: [9, 12, 7, 2],
    highTierRate: 0.2,
  },
];

const IDENTITY_PULL_QUOTES: Record<number, string> = {
  1: '“In this mirror reflection... my wings have finally bloomed in golden scent.”',
  2: '“Faust already foresaw that you would extract this possibility, Dante.”',
  3: '“FORSOOTH!! Manager Esquire! Witness my righteous lance tear through space itself!”',
  4: '“A.R.T. — Another Ruthless Triumph. Stand back and watch the blood splatter.”',
  5: '“Yield my flesh, to claim their bones. Give the order, Manager.”',
  6: '“Oh my~ What a dazzling outfit! Shall we go test how sharp this blade is?”',
  7: '“Out of the way! Once this visor drops, I graze everything in sight!”',
  8: '“ALL HANDS, MAN THE HARPOONS!! My compass points straight to victory!”',
  9: '“Jackpot~ Leave the heavy hitting and the high stakes to big sis Rodya!”',
  10: '“If I must grip the nail and hammer with my own hands... then let it all burn!”',
  11: '“Executive Manager! My tactical blade has already analyzed all enemy weak points!”',
  12: '“Heh, looks like this old veteran’s arm still has plenty of fight left in it.”',
};

export const ExtractScreen: React.FC<ExtractScreenProps> = ({ save, onUpdateSave }) => {
  const [subTab, setSubTab] = useState<'extract' | 'dispensary'>('extract');
  const [selectedBannerIdx, setSelectedBannerIdx] = useState(0);
  const [idealityCount, setIdealityCount] = useState<number>(20);
  const [poseTick, setPoseTick] = useState(0);

  // Multi-Stage Extraction State
  const [stage, setStage] = useState<ExtractionStage>('idle');
  const [pullResults, setPullResults] = useState<PullResultItem[]>([]);
  const [leverProgress, setLeverProgress] = useState(0); // 0 to 100
  const [isDraggingLever, setIsDraggingLever] = useState(false);
  const [cutInIndex, setCutInIndex] = useState<number | null>(null);
  const [fakeoutIndex, setFakeoutIndex] = useState<number | null>(null);
  const [inspectedResult, setInspectedResult] = useState<PullResultItem | null>(null);

  const chargeIntervalRef = useRef<number | null>(null);
  const activeBanner = BANNERS[selectedBannerIdx];

  // Live combat pose cycler so characters in Gacha / Cut-In / Inspect animate through their real slash poses!
  useEffect(() => {
    const timer = window.setInterval(() => {
      setPoseTick((t) => (t + 1) % SHOWCASE_POSES.length);
    }, 620);
    return () => window.clearInterval(timer);
  }, []);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (chargeIntervalRef.current) window.clearInterval(chargeIntervalRef.current);
    };
  }, []);

  // Highest rarity in current pull batch (controls lightning & engine core color!)
  const highestTierInBatch: 1 | 3 | 4 = pullResults.reduce<1 | 3 | 4>(
    (max, item) => (item.tierRank > max ? item.tierRank : max),
    1
  );

  // Step 1: Prepare Pull Batch & Enter Lever Chamber
  const initiateExtraction = (count: 1 | 10) => {
    const cost = count === 1 ? 130 : 1300;
    if (save.lunacy < cost) {
      alert(
        'Không đủ Lunacy! Bạn có thể vượt ải Story/Mirror Dungeon hoặc bấm nút "Dante’s Notes -> Claim Manager Supply" ở góc trên bên phải để nhận ngay +2,600 Lunacy!'
      );
      return;
    }

    soundManager.playSfx('gacha_chain');
    const generatedResults: PullResultItem[] = [];
    let hasHighTier = false;

    onUpdateSave((prev) => {
      const nextUnlockedIds = new Set(prev.unlockedIdentityIds);
      const nextUnlockedEgos = new Set(prev.unlockedEgoIds);
      const nextShards = { ...prev.egoshards };
      const nextEquippedIds = { ...prev.equippedIdentityBySinner };
      const nextEquippedEgos = { ...prev.equippedEgosBySinner };

      for (let i = 0; i < count; i++) {
        const roll = Math.random();
        const forceHighTier = count === 10 && i === count - 1 && !hasHighTier;

        if (roll < activeBanner.highTierRate || forceHighTier) {
          hasHighTier = true;
          const isFakeout = Math.random() < 0.28;

          if (Math.random() < 0.36) {
            // Pull High-Tier E.G.O
            const gachaEgos = EGOS.filter((e) => e.riskLevel !== 'ZAYIN');
            const ego: EgoData = gachaEgos[Math.floor(Math.random() * gachaEgos.length)];
            const sinner = SINNERS.find((s) => s.id === ego.sinnerId)!;
            const isDup = nextUnlockedEgos.has(ego.id);
            const shards = isDup ? 50 : 0;
            nextUnlockedEgos.add(ego.id);
            if (shards > 0) nextShards[sinner.id] = (nextShards[sinner.id] || 0) + shards;
            nextEquippedEgos[sinner.id] = {
              ...(nextEquippedEgos[sinner.id] || {}),
              [ego.riskLevel]: ego.id,
            };

            generatedResults.push({
              index: i,
              kind: 'ego',
              id: ego.id,
              name: ego.name,
              worldOrAbno: `Abnormality: ${ego.abnormalityName}`,
              quote: `“${ego.quote}”`,
              sinnerName: sinner.name,
              sinnerNumber: sinner.numberStr,
              sinnerId: sinner.id,
              rarityLabel: ego.riskLevel,
              tierRank: 4,
              isHighTier: true,
              isFakeout,
              isDuplicate: isDup,
              shardsGained: shards,
              portraitUrl: sinner.vnSpriteUrl || sinner.portraitUrl,
              splashUrl: `/assets/sprites/sinner_${sinner.id}_art.webp`,
              emblemUrl: `/assets/sinners/emblem_${sinner.id}.webp`,
              signatureSkillName: `${ego.name} (${ego.basePower}+${ego.coinPower})`,
              signatureSin: ego.sin,
              revealed: false,
            });
          } else {
            // Pull 000 Identity (bias toward featured banner Sinners)
            const all000 = IDENTITIES.filter((id) => id.rarity === 3);
            const featured000 = all000.filter((id) =>
              activeBanner.featuredSinnerIds.includes(id.sinnerId)
            );
            const pool000 =
              featured000.length > 0 && Math.random() < 0.65 ? featured000 : all000;
            const picked: IdentityData = pool000[Math.floor(Math.random() * pool000.length)];
            const sinner = SINNERS.find((s) => s.id === picked.sinnerId)!;
            const isDup = nextUnlockedIds.has(picked.id);
            const shards = isDup ? 50 : 0;
            nextUnlockedIds.add(picked.id);
            if (!isDup) {
              nextEquippedIds[sinner.id] = picked.id;
            }
            if (shards > 0) nextShards[sinner.id] = (nextShards[sinner.id] || 0) + shards;

            const s3 = picked.skills[2];
            generatedResults.push({
              index: i,
              kind: 'identity',
              id: picked.id,
              name: picked.name,
              worldOrAbno: picked.world,
              quote: IDENTITY_PULL_QUOTES[sinner.id] || `“${sinner.motto}”`,
              sinnerName: sinner.name,
              sinnerNumber: sinner.numberStr,
              sinnerId: sinner.id,
              rarityLabel: '000',
              tierRank: 3,
              isHighTier: true,
              isFakeout,
              isDuplicate: isDup,
              shardsGained: shards,
              portraitUrl: picked.portraitUrl,
              splashUrl: `/assets/sprites/sinner_${sinner.id}_art.webp`,
              emblemUrl: `/assets/sinners/emblem_${sinner.id}.webp`,
              signatureSkillName: `${s3.name} (${s3.basePower}${
                s3.coinPower >= 0 ? `+${s3.coinPower}` : s3.coinPower
              } ×${s3.coins})`,
              signatureSin: s3.sin,
              revealed: false,
            });
          }
        } else {
          // Standard 0 Identity Pull
          const baseIds = IDENTITIES.filter((id) => id.rarity === 1);
          const picked: IdentityData = baseIds[Math.floor(Math.random() * baseIds.length)];
          const sinner = SINNERS.find((s) => s.id === picked.sinnerId)!;
          const isDup = nextUnlockedIds.has(picked.id);
          const shards = isDup ? 15 : 0;
          nextUnlockedIds.add(picked.id);
          if (shards > 0) nextShards[sinner.id] = (nextShards[sinner.id] || 0) + shards;
          const s3 = picked.skills[2];

          generatedResults.push({
            index: i,
            kind: 'identity',
            id: picked.id,
            name: picked.name,
            worldOrAbno: picked.world,
            quote: `“${sinner.motto}”`,
            sinnerName: sinner.name,
            sinnerNumber: sinner.numberStr,
            sinnerId: sinner.id,
            rarityLabel: '0',
            tierRank: 1,
            isHighTier: false,
            isFakeout: false,
            isDuplicate: isDup,
            shardsGained: shards,
            portraitUrl: picked.portraitUrl,
            splashUrl: `/assets/sprites/sinner_${sinner.id}_art.webp`,
            emblemUrl: `/assets/sinners/emblem_${sinner.id}.webp`,
            signatureSkillName: s3.name,
            signatureSin: s3.sin,
            revealed: false,
          });
        }
      }

      return {
        ...prev,
        lunacy: prev.lunacy - cost,
        unlockedIdentityIds: Array.from(nextUnlockedIds),
        unlockedEgoIds: Array.from(nextUnlockedEgos),
        egoshards: nextShards,
        equippedIdentityBySinner: nextEquippedIds,
        equippedEgosBySinner: nextEquippedEgos,
      };
    });

    setIdealityCount((prev) => prev + count);
    setPullResults(generatedResults);
    setLeverProgress(0);
    setCutInIndex(null);
    setFakeoutIndex(null);
    setStage('lever_ready');
  };

  // Trigger Door Blast when Lever reaches 100%
  const triggerDoorBlastSequence = () => {
    if (chargeIntervalRef.current) {
      window.clearInterval(chargeIntervalRef.current);
      chargeIntervalRef.current = null;
    }
    setIsDraggingLever(false);
    setLeverProgress(100);
    soundManager.playSfx('gacha_door_slam');
    setStage('door_blast');

    setTimeout(() => {
      setStage('mirror_pods');
      // Play staggered metallic clinks as pods drop
      pullResults.forEach((_, idx) => {
        setTimeout(() => {
          soundManager.playSfx('gacha_mirror_drop');
        }, idx * 75);
      });
    }, 950);
  };

  // Start holding/charging the lever
  const handleStartChargeLever = () => {
    if (stage !== 'lever_ready') return;
    setIsDraggingLever(true);
    soundManager.playSfx('gacha_lever_charge');

    if (chargeIntervalRef.current) window.clearInterval(chargeIntervalRef.current);
    chargeIntervalRef.current = window.setInterval(() => {
      setLeverProgress((prev) => {
        const next = prev + 7;
        if (next >= 100) {
          triggerDoorBlastSequence();
          return 100;
        }
        return next;
      });
    }, 45);
  };

  const handleStopChargeLever = () => {
    if (leverProgress >= 85) {
      triggerDoorBlastSequence();
      return;
    }
    setIsDraggingLever(false);
    if (chargeIntervalRef.current) {
      window.clearInterval(chargeIntervalRef.current);
      chargeIntervalRef.current = null;
    }
  };

  // Reveal a single Mirror Pod (with Fake-out & Cinematic Cut-in for 000 / E.G.O!)
  const handleRevealPod = (index: number) => {
    const item = pullResults[index];
    if (!item || item.revealed) return;

    if (item.isHighTier) {
      if (item.isFakeout) {
        soundManager.playSfx('gacha_fakeout');
        setFakeoutIndex(index);
        setTimeout(() => {
          setFakeoutIndex(null);
          openHighTierCutIn(index);
        }, 700);
      } else {
        openHighTierCutIn(index);
      }
    } else {
      soundManager.playSfx('coin_heads');
      setPullResults((prev) =>
        prev.map((r, idx) => (idx === index ? { ...r, revealed: true } : r))
      );
    }
  };

  const openHighTierCutIn = (index: number) => {
    const item = pullResults[index];
    if (!item) return;
    soundManager.playSfx('gacha_glass_shatter');
    soundManager.playEgoVoice(item.sinnerId);
    setCutInIndex(index);
    setStage('cinematic_cutin');
    confetti({
      particleCount: 85,
      spread: 80,
      origin: { y: 0.55 },
      colors: item.tierRank === 4 ? ['#c084fc', '#ef4444', '#facc15'] : ['#facc15', '#fbbf24', '#dc2626'],
    });
  };

  const handleCloseCutIn = () => {
    if (cutInIndex === null) return;
    soundManager.playSfx('gacha_000');
    const revealedIdx = cutInIndex;
    setCutInIndex(null);
    setPullResults((prev) =>
      prev.map((r, idx) => (idx === revealedIdx ? { ...r, revealed: true } : r))
    );
    setStage('mirror_pods');
  };

  // Reveal Next Unrevealed Pod automatically
  const handleRevealNext = () => {
    const nextIdx = pullResults.findIndex((r) => !r.revealed);
    if (nextIdx === -1) {
      setStage('summary');
      return;
    }
    handleRevealPod(nextIdx);
  };

  // Reveal All Immediately
  const handleRevealAll = () => {
    soundManager.playSfx('gacha_glass_shatter');
    const firstUnrevealedHigh = pullResults.findIndex((r) => !r.revealed && r.isHighTier);
    setPullResults((prev) => prev.map((r) => ({ ...r, revealed: true })));

    if (firstUnrevealedHigh !== -1) {
      const highItem = pullResults[firstUnrevealedHigh];
      soundManager.playEgoVoice(highItem.sinnerId);
      confetti({
        particleCount: 110,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#facc15', '#dc2626', '#a855f7'],
      });
    }
  };

  const allRevealed = pullResults.length > 0 && pullResults.every((r) => r.revealed);

  // Dispensary Craft Handlers
  const handleDispensaryCraftIdentity = (identity: IdentityData) => {
    const shards = save.egoshards[identity.sinnerId] || 0;
    const canUseIdeality = idealityCount >= 50;
    if (!canUseIdeality && shards < 100 && save.thread < 100) {
      alert('Cần 100 Egoshards của Sinner này, 100 Thread, hoặc 50 Ideality để chế tạo!');
      return;
    }
    soundManager.playSfx('gacha_000');
    soundManager.playEgoVoice(identity.sinnerId);
    if (canUseIdeality) {
      setIdealityCount((p) => Math.max(0, p - 50));
    }
    onUpdateSave((prev) => {
      const nextShards = { ...prev.egoshards };
      let nextThread = prev.thread;
      if (!canUseIdeality) {
        if ((nextShards[identity.sinnerId] || 0) >= 100) {
          nextShards[identity.sinnerId] -= 100;
        } else {
          nextThread -= 100;
        }
      }
      return {
        ...prev,
        thread: nextThread,
        egoshards: nextShards,
        unlockedIdentityIds: Array.from(new Set([...prev.unlockedIdentityIds, identity.id])),
        equippedIdentityBySinner: {
          ...prev.equippedIdentityBySinner,
          [identity.sinnerId]: identity.id,
        },
      };
    });
  };

  const handleDispensaryCraftEgo = (ego: EgoData) => {
    const shards = save.egoshards[ego.sinnerId] || 0;
    const canUseIdeality = idealityCount >= 50;
    if (!canUseIdeality && shards < 100 && save.thread < 100) {
      alert('Cần 100 Egoshards của Sinner này, 100 Thread, hoặc 50 Ideality để chế tạo E.G.O!');
      return;
    }
    soundManager.playSfx('ego_activate');
    soundManager.playEgoVoice(ego.sinnerId);
    if (canUseIdeality) {
      setIdealityCount((p) => Math.max(0, p - 50));
    }
    onUpdateSave((prev) => {
      const nextShards = { ...prev.egoshards };
      let nextThread = prev.thread;
      if (!canUseIdeality) {
        if ((nextShards[ego.sinnerId] || 0) >= 100) {
          nextShards[ego.sinnerId] -= 100;
        } else {
          nextThread -= 100;
        }
      }
      return {
        ...prev,
        thread: nextThread,
        egoshards: nextShards,
        unlockedEgoIds: Array.from(new Set([...prev.unlockedEgoIds, ego.id])),
        equippedEgosBySinner: {
          ...prev.equippedEgosBySinner,
          [ego.sinnerId]: {
            ...(prev.equippedEgosBySinner[ego.sinnerId] || {}),
            [ego.riskLevel]: ego.id,
          },
        },
      };
    });
  };

  return (
    <div className="w-full h-full flex flex-col p-5 overflow-hidden relative">
      {/* Top Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playSfx('ui_click');
              setSubTab('extract');
            }}
            className={`px-5 py-2.5 rounded-lg font-display font-bold text-sm tracking-wider border flex items-center gap-2 cursor-pointer transition ${
              subTab === 'extract'
                ? 'bg-red-900 border-amber-400 text-amber-200 shadow-lg'
                : 'bg-stone-900/90 border-stone-700 text-stone-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            MEPHISTOPHELES EXTRACTION (GACHA)
          </button>
          <button
            onClick={() => {
              soundManager.playSfx('ui_click');
              setSubTab('dispensary');
            }}
            className={`px-5 py-2.5 rounded-lg font-display font-bold text-sm tracking-wider border flex items-center gap-2 cursor-pointer transition ${
              subTab === 'dispensary'
                ? 'bg-amber-600 border-amber-200 text-black shadow-lg'
                : 'bg-stone-900/90 border-stone-700 text-stone-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            DISPENSARY (CRAFT 000 ID & E.G.O)
          </button>
        </div>

        {/* Yi Sang Ideality Pity Counter & Collection Progress */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => {
              soundManager.playSfx('ui_click');
              setSubTab('dispensary');
            }}
            className={`px-3.5 py-1.5 rounded-lg border flex items-center gap-2 cursor-pointer transition ${
              idealityCount >= 50
                ? 'bg-amber-500/25 border-amber-300 text-amber-200 animate-pulse'
                : 'bg-black/80 border-amber-500/40 text-stone-300'
            }`}
            title="At 50 Ideality, exchange for any 000 Identity or E.G.O for free in the Dispensary!"
          >
            <img src="/assets/sinners/emblem_1.webp" alt="" className="w-5 h-5 object-contain" />
            <span className="text-xs font-mono-num">
              Yi Sang Ideality: <strong className="text-amber-300">{idealityCount} / 50</strong>
            </span>
            {idealityCount >= 50 && (
              <span className="px-1.5 py-0.2 rounded bg-amber-400 text-black text-[10px] font-extrabold">
                SPARK READY!
              </span>
            )}
          </div>

          <div className="text-xs text-stone-300 bg-black/75 px-3.5 py-1.5 rounded-lg border border-stone-700 font-mono-num">
            IDs: <strong className="text-amber-300">{save.unlockedIdentityIds.length}/{IDENTITIES.length}</strong> •
            E.G.O: <strong className="text-purple-300">{save.unlockedEgoIds.length}/{EGOS.length}</strong>
          </div>
        </div>
      </div>

      {subTab === 'extract' ? (
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* LEFT: OFFICIAL STEAM BANNER SELECTOR RAIL */}
          <div className="w-80 flex flex-col gap-2.5 shrink-0 overflow-y-auto pr-1">
            <div className="text-[11px] font-bold uppercase tracking-widest text-amber-400/90 px-1 flex items-center justify-between">
              <span>OFFICIAL TARGET BANNERS</span>
              <span className="text-[9px] text-stone-400 font-mono-num">STEAM EXTRACT</span>
            </div>
            {BANNERS.map((b, idx) => {
              const active = idx === selectedBannerIdx;
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    soundManager.playSfx('ui_click');
                    setSelectedBannerIdx(idx);
                  }}
                  className={`rounded-xl border-2 text-left transition relative overflow-hidden cursor-pointer group ${
                    active
                      ? 'border-amber-300 ring-2 ring-amber-400/70 scale-[1.02] shadow-[0_0_25px_rgba(250,204,21,0.45)]'
                      : 'border-stone-800 opacity-75 hover:opacity-100 hover:border-amber-500/50'
                  }`}
                >
                  <img
                    src={b.bannerButtonImg}
                    alt={b.title}
                    className="w-full h-24 object-cover bg-black group-hover:scale-105 transition duration-300"
                  />
                  <div className="px-2.5 py-1 bg-black/90 border-t border-amber-500/30 flex items-center justify-between">
                    <span className="font-display font-bold text-[10px] text-amber-100 truncate">
                      {b.title}
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono-num font-extrabold shrink-0 ml-2">
                      {Math.round(b.highTierRate * 100)}% 000
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Rate & Guarantee Info Box */}
            <div className="mt-auto limbus-panel p-3 rounded-xl text-[11px] text-stone-300 space-y-1">
              <div className="font-display font-bold text-xs text-amber-300 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                EXTRACTION GUARANTEES
              </div>
              <p>• Quay <strong>10×</strong> luôn đảm bảo ít nhất <strong>1 Nhân Cách 000 hoặc E.G.O</strong>!</p>
              <p>• Nhân Cách 000 / E.G.O mới sẽ <strong>tự động trang bị</strong> ngay lập tức.</p>
              <img
                src="/assets/steam/gacha/gacha_caution.webp"
                alt=""
                className="w-full h-auto object-contain opacity-85 pt-1"
              />
            </div>
          </div>

          {/* RIGHT: OFFICIAL STEAM GACHA TV MONITOR & LIVE ACTION COMBO SHOWCASE */}
          <div className="flex-1 limbus-crimson-panel rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden border-2 border-amber-400/70">
            {/* Official Steam Gacha Monitor Frame */}
            <img
              src="/assets/steam/gacha/gacha_base_large.webp"
              alt=""
              className="absolute inset-0 w-full h-full object-fill pointer-events-none opacity-65 z-0"
            />
            <div
              className="absolute inset-0 bg-cover bg-center opacity-35 transition-all duration-700 pointer-events-none"
              style={{ backgroundImage: `url('${activeBanner.posterImg}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/40 pointer-events-none" />

            {/* Top Official 1240x500 Steam Target Extraction Poster Banner */}
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-4 bg-black/75 p-3 rounded-xl border border-amber-400/50 shadow-2xl">
              <img
                src={activeBanner.posterImg}
                alt={activeBanner.title}
                className="h-36 w-auto rounded-lg border border-amber-400/70 object-cover shadow-[0_0_30px_rgba(0,0,0,0.95)] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span
                  className="px-2.5 py-0.5 rounded font-bebas text-sm tracking-widest text-black shadow inline-block"
                  style={{ backgroundColor: activeBanner.accentColor }}
                >
                  {activeBanner.tag}
                </span>
                <h2 className="font-display text-2xl font-black text-amber-100 mt-1.5 truncate">
                  {activeBanner.title}
                </h2>
                <p className="text-xs text-stone-200 mt-1 leading-relaxed">
                  {activeBanner.subtitle}
                </p>
                <div className="text-[10px] text-amber-300/90 font-mono-num mt-1.5">
                  ★ LIVE COMBAT SPRITE PREVIEW: Nhân vật bên dưới tự động biểu diễn chuỗi đòn chém S1 → S2 → S3 từ bản Steam!
                </div>
              </div>
            </div>

            {/* Center Featured 000 Identity Cards with LIVE MULTI-POSE COMBAT ANIMATION */}
            <div className="relative z-10 grid grid-cols-4 gap-3.5 my-auto py-2">
              {activeBanner.featuredSprites.map((fallbackSpriteUrl, idx) => {
                const sId = activeBanner.featuredSinnerIds[idx];
                const sObj = SINNERS.find((s) => s.id === sId)!;
                const id3 = IDENTITIES.find((i) => i.sinnerId === sId && i.rarity === 3);
                const owned = id3 && save.unlockedIdentityIds.includes(id3.id);
                const currentPoseName = SHOWCASE_POSES[(poseTick + idx * 3) % SHOWCASE_POSES.length];
                const livePoseUrl = `/assets/steam/chars/sinner_${sId}/${currentPoseName}.webp`;
                const isAttackingPose = currentPoseName.startsWith('s');

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      soundManager.playSfx('hit_slash');
                      soundManager.playEgoVoice(sId);
                    }}
                    className="relative group rounded-2xl bg-gradient-to-b from-amber-950/60 via-stone-950/90 to-black border-2 border-amber-400/70 p-2.5 flex flex-col items-center justify-between h-52 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.9)] hover:scale-105 transition duration-300 cursor-pointer"
                    title="Click to hear Sinner voice & slash SFX!"
                  >
                    <div className="absolute inset-0 holo-card-sheen pointer-events-none opacity-55" />
                    <div className="w-full flex items-center justify-between z-10">
                      <img
                        src="/assets/steam/gacha/MainUI_Gacha_4_Illust_Rank_3.webp"
                        alt="000"
                        className="h-5 w-auto object-contain"
                      />
                      <span className="px-1.5 py-0.5 rounded bg-black/80 border border-amber-400/50 font-mono-num text-[9px] font-bold text-amber-300">
                        {currentPoseName.toUpperCase()}
                      </span>
                      {owned && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-900/90 border border-emerald-400 text-[9px] font-bold text-emerald-200">
                          OWNED
                        </span>
                      )}
                    </div>

                    <div className="relative flex-1 flex items-center justify-center w-full">
                      <img
                        src={livePoseUrl}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = fallbackSpriteUrl;
                        }}
                        alt={sObj.name}
                        className={`max-h-28 w-auto object-contain z-10 drop-shadow-[0_6px_15px_rgba(0,0,0,0.95)] transition-transform duration-200 ${
                          isAttackingPose ? 'scale-110' : ''
                        }`}
                      />
                      {isAttackingPose && (
                        <img
                          src={`/assets/steam/vfx/slash_${((poseTick + idx) % 12) + 1}.webp`}
                          alt=""
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-75 scale-125"
                        />
                      )}
                    </div>

                    <div className="w-full text-center z-10 bg-black/85 py-1 px-2 rounded border border-amber-500/30">
                      <div className="font-display font-bold text-xs text-amber-200 truncate">
                        {id3?.name || sObj.name}
                      </div>
                      <div className="text-[10px] text-stone-400">Sinner #{sObj.numberStr} — {sObj.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Extraction Trigger Buttons */}
            <div className="relative z-10 flex items-center justify-center gap-6 pt-1">
              <button
                onClick={() => initiateExtraction(1)}
                className="px-8 py-3.5 rounded-xl bg-stone-950/95 hover:bg-stone-900 border-2 border-amber-400/80 text-left transition hover:scale-105 cursor-pointer shadow-xl flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="font-bebas text-2xl text-amber-200 tracking-wider leading-none">
                    1× EXTRACT
                  </div>
                  <div className="text-xs font-mono-num text-rose-300 font-bold mt-1">
                    130 Lunacy
                  </div>
                </div>
              </button>

              <button
                onClick={() => initiateExtraction(10)}
                className="px-10 py-3.5 rounded-xl bg-gradient-to-r from-red-800 via-amber-500 to-yellow-400 hover:brightness-110 border-2 border-white text-left transition hover:scale-105 cursor-pointer shadow-[0_0_45px_rgba(250,204,21,0.65)] flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-black/80 border-2 border-amber-300 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <div className="font-bebas text-3xl text-black tracking-wider leading-none">
                    10× EXTRACT (GUARANTEED 000 / E.G.O!)
                  </div>
                  <div className="text-xs font-mono-num text-black font-extrabold mt-1">
                    1,300 Lunacy • +10 Ideality
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* DISPENSARY TAB */
        <div className="flex-1 limbus-panel rounded-2xl p-5 overflow-y-auto space-y-6">
          <div>
            <h3 className="font-display text-lg font-bold text-amber-300 mb-3">
              000 IDENTITIES DISPENSARY (Cost: 100 Sinner Shards, 100 Thread, OR 50 Ideality)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {IDENTITIES.filter((i) => i.rarity === 3).map((idItem) => {
                const unlocked = save.unlockedIdentityIds.includes(idItem.id);
                const sinner = SINNERS.find((s) => s.id === idItem.sinnerId)!;
                const shards = save.egoshards[sinner.id] || 0;

                return (
                  <div
                    key={idItem.id}
                    className="p-3.5 rounded-xl bg-black/70 border border-amber-500/30 flex items-center gap-3.5"
                  >
                    <img
                      src={idItem.portraitUrl}
                      alt={idItem.name}
                      className="w-16 h-20 object-contain bg-stone-950 rounded-lg border border-stone-800 p-1 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-amber-400 font-bold uppercase">{sinner.name}</div>
                      <div className="font-display font-bold text-sm text-white truncate">{idItem.name}</div>
                      <div className="text-[11px] text-purple-300 font-mono-num mt-1">
                        Shards: {shards} | Thread: {save.thread}
                      </div>
                      <div className="mt-2">
                        {unlocked ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                            <Check className="w-3.5 h-3.5" /> Owned
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDispensaryCraftIdentity(idItem)}
                            className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            {idealityCount >= 50 ? 'CLAIM FREE (50 IDEALITY)' : 'DISPENSE (100)'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-display text-lg font-bold text-purple-300 mb-3">
              E.G.O DISPENSARY (Cost: 100 Sinner Shards, 100 Thread, OR 50 Ideality)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {EGOS.filter((e) => e.riskLevel !== 'ZAYIN').map((ego) => {
                const unlocked = save.unlockedEgoIds.includes(ego.id);
                const sinner = SINNERS.find((s) => s.id === ego.sinnerId)!;
                const riskStyle = RISK_LEVEL_COLOR[ego.riskLevel];

                return (
                  <div
                    key={ego.id}
                    className="p-3.5 rounded-xl bg-black/70 border border-purple-500/30 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="px-1.5 py-0.2 rounded text-[10px] font-extrabold border"
                          style={{
                            color: riskStyle.text,
                            backgroundColor: riskStyle.bg,
                            borderColor: riskStyle.border,
                          }}
                        >
                          {ego.riskLevel}
                        </span>
                        <img src={SIN_INFO[ego.sin].icon} alt="" className="w-4 h-4" />
                        <span className="font-display font-bold text-sm text-white">{ego.name}</span>
                      </div>
                      <div className="text-xs text-amber-300 mt-0.5">
                        {sinner.name} • {ego.abnormalityName}
                      </div>
                      <p className="text-[11px] italic text-stone-400 mt-1 line-clamp-1">“{ego.quote}”</p>
                    </div>

                    {unlocked ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 shrink-0">
                        <Check className="w-4 h-4" /> Owned
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDispensaryCraftEgo(ego)}
                        className="px-3 py-1.5 rounded bg-purple-500 hover:bg-purple-400 text-black font-extrabold text-xs shrink-0 cursor-pointer"
                      >
                        {idealityCount >= 50 ? 'SPARK FREE' : 'DISPENSE'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================================
          STAGE 1 & 2: INTERACTIVE MEPHISTOPHELES ENGINE CHAIN-PULL & DOOR BLAST OVERLAY
         ================================================================================= */}
      {(stage === 'lever_ready' || stage === 'door_blast') && (
        <div
          onMouseUp={handleStopChargeLever}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between py-10 px-6 overflow-hidden select-none"
        >
          {/* Dynamic Core Aura */}
          <div
            className="absolute inset-0 transition-all duration-300 pointer-events-none"
            style={{
              background:
                highestTierInBatch === 4
                  ? `radial-gradient(circle at center, rgba(168,85,247,${0.25 + leverProgress / 160}) 0%, rgba(220,38,38,0.2) 45%, #050406 80%)`
                  : highestTierInBatch === 3
                  ? `radial-gradient(circle at center, rgba(250,204,21,${0.25 + leverProgress / 160}) 0%, rgba(185,28,28,0.2) 45%, #050406 80%)`
                  : `radial-gradient(circle at center, rgba(220,38,38,${0.2 + leverProgress / 200}) 0%, #050406 75%)`,
            }}
          />

          {/* Top Skip Button */}
          <div className="relative z-20 w-full max-w-5xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded bg-red-950 border border-amber-400/60 font-bebas text-lg tracking-widest text-amber-300">
                MEPHISTOPHELES EXTRACTION ENGINE // CORRIDOR RESONANCE
              </span>
            </div>
            <button
              onClick={() => {
                if (chargeIntervalRef.current) window.clearInterval(chargeIntervalRef.current);
                handleRevealAll();
                setStage('summary');
              }}
              className="px-4 py-1.5 rounded bg-stone-900 hover:bg-red-900 border border-amber-400/60 text-xs font-bold text-amber-200 flex items-center gap-1.5 cursor-pointer"
            >
              <FastForward className="w-4 h-4" />
              SKIP TO SUMMARY
            </button>
          </div>

          {/* Center Engine Gate & Chain Lever */}
          {stage === 'door_blast' ? (
            <div className="relative z-20 my-auto flex flex-col items-center justify-center animate-heavy-shake">
              <div className="relative flex items-center justify-center">
                <img
                  src="/assets/steam/gacha/Fx_T_UI_MD8_DoorFlare.webp"
                  alt=""
                  className="w-96 h-96 object-contain animate-ping absolute pointer-events-none"
                />
                <img
                  src="/assets/steam/gacha/mirror_dungeon_door_image_0.webp"
                  alt="Mephistopheles Open Gate"
                  className="w-[460px] h-auto object-contain drop-shadow-[0_0_60px_#facc15]"
                />
              </div>
              <div className="font-bebas text-6xl tracking-[0.25em] text-white drop-shadow-[0_0_40px_#facc15] mt-4">
                SHATTERING THE MIRROR WORLD!!
              </div>
            </div>
          ) : (
            <div className="relative z-20 flex flex-col items-center my-auto">
              {/* Official Steam Mephistopheles Iron Chains Across Screen */}
              <img
                src="/assets/steam/gacha/gacharesult_chain.webp"
                alt=""
                className={`w-[720px] max-w-[90vw] h-auto object-contain mb-3 opacity-90 ${
                  isDraggingLever ? 'animate-chain-vibrate' : ''
                }`}
              />

              {/* Official Mephistopheles Chamber Door & Spinning Clockwork Core */}
              <div className="relative flex items-center justify-center">
                <img
                  src="/assets/steam/gacha/mirror_dungeon_door_image_close.webp"
                  alt="Mephistopheles Chamber Door"
                  className="w-[420px] h-auto object-contain rounded-2xl border-2 border-amber-500/60 shadow-[0_0_90px_rgba(220,38,38,0.75)]"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={`w-36 h-36 rounded-full flex flex-col items-center justify-center border-2 backdrop-blur-xs transition-all ${
                      highestTierInBatch === 4
                        ? 'bg-purple-950/85 border-purple-300 shadow-[0_0_50px_#c084fc]'
                        : highestTierInBatch === 3
                        ? 'bg-amber-950/85 border-amber-300 shadow-[0_0_50px_#facc15]'
                        : 'bg-red-950/85 border-red-400'
                    }`}
                  >
                    <Zap
                      className={`w-10 h-10 ${
                        highestTierInBatch === 4
                          ? 'text-purple-300'
                          : highestTierInBatch === 3
                          ? 'text-amber-300'
                          : 'text-red-300'
                      } ${isDraggingLever ? 'animate-bounce' : ''}`}
                    />
                    <span className="font-bebas text-4xl text-white mt-0.5">{leverProgress}%</span>
                  </div>
                </div>
              </div>

              {/* Iron Chain & Pull Handle */}
              <div
                className={`flex flex-col items-center mt-2 ${
                  isDraggingLever ? 'animate-chain-vibrate' : ''
                }`}
              >
                <div className="w-3 h-10 bg-gradient-to-b from-amber-500 via-stone-500 to-amber-700 border-x border-amber-300" />
                <button
                  onMouseDown={handleStartChargeLever}
                  onTouchStart={handleStartChargeLever}
                  onClick={triggerDoorBlastSequence}
                  className="px-10 py-3.5 rounded-2xl bg-gradient-to-b from-red-700 via-red-900 to-black border-2 border-amber-300 shadow-[0_0_40px_rgba(250,204,21,0.75)] hover:scale-105 active:translate-y-4 transition cursor-pointer flex flex-col items-center"
                >
                  <span className="font-bebas text-3xl tracking-[0.18em] text-amber-200">
                    HOLD OR CLICK TO PULL CHAIN!!
                  </span>
                  <span className="text-xs text-stone-300">
                    Kéo cần gạt động cơ Mephistopheles để mở cổng Thế Giới Gương
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="relative z-20 text-xs font-mono-num text-amber-300/80 uppercase tracking-widest">
            {highestTierInBatch === 4
              ? '⚡ ABNORMALITY E.G.O SIGNAL DETECTED IN CHAMBER ⚡'
              : highestTierInBatch === 3
              ? '★ GOLDEN 000 IDENTITY SIGNAL DETECTED IN CHAMBER ★'
              : 'STANDARD MIRROR RESONANCE READY'}
          </div>
        </div>
      )}

      {/* =================================================================================
          STAGE 3: 10 CHAINED MIRROR PODS INTERACTIVE REVEAL STAGE
         ================================================================================= */}
      {stage === 'mirror_pods' && (
        <div className="fixed inset-0 z-50 bg-[#070609]/95 backdrop-blur-md flex flex-col justify-between p-6 overflow-hidden select-none">
          {/* Top Controls Bar */}
          <div className="flex items-center justify-between border-b border-amber-500/40 pb-3">
            <div>
              <h3 className="font-display text-2xl font-black text-amber-200 tracking-wider">
                MIRROR WORLD EXTRACTION PODS ({pullResults.filter((r) => r.revealed).length}/
                {pullResults.length} REVEALED)
              </h3>
              <p className="text-xs text-stone-400">
                Bấm vào từng Khối Gương Xiềng Xích để đập vỡ gương và triệu hồi Tội Nhân!
              </p>
            </div>

            <div className="flex items-center gap-3">
              {!allRevealed ? (
                <>
                  <button
                    onClick={handleRevealNext}
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                    REVEAL NEXT
                  </button>
                  <button
                    onClick={handleRevealAll}
                    className="px-5 py-2 rounded-lg bg-red-800 hover:bg-red-700 border border-amber-300 text-amber-100 font-extrabold text-xs tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <FastForward className="w-4 h-4" />
                    SHATTER ALL MIRRORS
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    soundManager.playSfx('ui_click');
                    setStage('summary');
                  }}
                  className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bebas text-2xl tracking-widest cursor-pointer shadow-[0_0_25px_#facc15]"
                >
                  PROCEED TO EXTRACTION SUMMARY →
                </button>
              )}
            </div>
          </div>

          {/* Center Grid of Chained Mirror Pods */}
          <div
            className={`my-auto grid ${
              pullResults.length === 1
                ? 'grid-cols-1 max-w-xs mx-auto'
                : 'grid-cols-2 sm:grid-cols-5 max-w-6xl mx-auto'
            } gap-4 w-full`}
          >
            {pullResults.map((item, idx) => {
              const isBeingFakeout = fakeoutIndex === idx;
              // If fakeout is active and not yet revealed, disguise as tier 1 until clicked!
              const displayedTier = !item.revealed && item.isFakeout && !isBeingFakeout ? 1 : item.tierRank;

              if (!item.revealed) {
                return (
                  <div
                    key={idx}
                    onClick={() => handleRevealPod(idx)}
                    style={{ animationDelay: `${idx * 65}ms` }}
                    className={`animate-mirror-drop h-64 rounded-2xl border-2 relative overflow-hidden cursor-pointer flex flex-col items-center justify-between p-4 transition hover:scale-105 group ${
                      isBeingFakeout
                        ? 'animate-heavy-shake bg-gradient-to-b from-amber-400 via-red-600 to-purple-900 border-white shadow-[0_0_60px_#facc15]'
                        : displayedTier === 4
                        ? 'bg-gradient-to-b from-purple-950 via-red-950 to-black border-purple-400 shadow-[0_0_35px_rgba(192,132,252,0.7)]'
                        : displayedTier === 3
                        ? 'bg-gradient-to-b from-amber-900/80 via-red-950 to-black border-amber-300 shadow-[0_0_35px_rgba(250,204,21,0.65)]'
                        : 'bg-gradient-to-b from-stone-900 via-stone-950 to-black border-red-800/70 hover:border-amber-400/70'
                    }`}
                  >
                    {/* Glowing Pillar Beam for 000 / EGO */}
                    {displayedTier >= 3 && (
                      <div
                        className="absolute inset-y-0 w-10 animate-beam-pulse pointer-events-none blur-md"
                        style={{
                          background:
                            displayedTier === 4
                              ? 'linear-gradient(to bottom, transparent, #c084fc, transparent)'
                              : 'linear-gradient(to bottom, transparent, #facc15, transparent)',
                        }}
                      />
                    )}

                    {/* Diagonal Iron Chains Overlay */}
                    <div className="w-full flex items-center justify-between z-10">
                      <span className="font-mono-num text-[10px] font-bold text-stone-400">
                        POD #{idx + 1}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          displayedTier === 4
                            ? 'bg-purple-400 text-black'
                            : displayedTier === 3
                            ? 'bg-amber-400 text-black'
                            : 'bg-stone-800 text-stone-300'
                        }`}
                      >
                        {displayedTier === 4 ? 'E.G.O SIGNAL' : displayedTier === 3 ? '000 GOLD' : 'MIRROR'}
                      </span>
                    </div>

                    {/* Sinner Silhouette / Emblem */}
                    <div className="relative z-10 w-24 h-24 rounded-full bg-black/80 border-2 border-amber-400/60 flex items-center justify-center group-hover:scale-110 transition">
                      <img
                        src={item.emblemUrl}
                        alt=""
                        className="w-16 h-16 object-contain opacity-85"
                      />
                    </div>

                    <div className="z-10 text-center">
                      <div className="font-bebas text-lg tracking-widest text-amber-200 group-hover:text-white">
                        {isBeingFakeout ? '⚡ RARITY UPGRADE!! ⚡' : 'CLICK TO SHATTER'}
                      </div>
                      <div className="text-[10px] text-stone-400">Sinner #{item.sinnerNumber}</div>
                    </div>
                  </div>
                );
              }

              // REVEALED CARD IN POD GRID
              return (
                <div
                  key={idx}
                  onClick={() => setInspectedResult(item)}
                  className={`animate-card-reveal h-64 rounded-2xl border-2 relative overflow-hidden cursor-pointer flex flex-col items-center justify-between p-3 transition hover:scale-105 ${
                    item.tierRank === 4
                      ? 'bg-gradient-to-b from-purple-900/75 via-red-950/80 to-black border-purple-300 shadow-[0_0_35px_rgba(192,132,252,0.65)]'
                      : item.tierRank === 3
                      ? 'bg-gradient-to-b from-amber-800/70 via-red-950/75 to-black border-amber-300 shadow-[0_0_35px_rgba(250,204,21,0.6)]'
                      : 'bg-stone-950 border-stone-700'
                  }`}
                >
                  {item.isHighTier && (
                    <div className="absolute inset-0 holo-card-sheen pointer-events-none" />
                  )}

                  <div className="w-full flex items-center justify-between z-10">
                    <img
                      src={
                        item.kind === 'ego'
                          ? item.rarityLabel === 'ALEPH'
                            ? '/assets/steam/gacha/MainUI_Gacha_4_Illust_E5_ALEPH.webp'
                            : item.rarityLabel === 'WAW'
                            ? '/assets/steam/gacha/MainUI_Gacha_4_Illust_E4_WAW.webp'
                            : item.rarityLabel === 'HE'
                            ? '/assets/steam/gacha/MainUI_Gacha_4_Illust_E3_HE.webp'
                            : item.rarityLabel === 'TETH'
                            ? '/assets/steam/gacha/MainUI_Gacha_4_Illust_E2_TETH.webp'
                            : '/assets/steam/gacha/MainUI_Gacha_4_Illust_E1_ZAYIN.webp'
                          : item.tierRank === 3
                          ? '/assets/steam/gacha/MainUI_Gacha_4_Illust_Rank_3.webp'
                          : item.rarityLabel === '00'
                          ? '/assets/steam/gacha/MainUI_Gacha_4_Illust_Rank_2.webp'
                          : '/assets/steam/gacha/MainUI_Gacha_4_Illust_Rank_1.webp'
                      }
                      alt={item.rarityLabel}
                      className="h-7 w-auto object-contain drop-shadow"
                    />

                    {item.isDuplicate ? (
                      <span className="px-1.5 py-0.5 rounded bg-purple-950/90 border border-purple-400 text-[9px] font-mono-num text-purple-200">
                        +{item.shardsGained} Shards
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-900 border border-emerald-300 text-[9px] font-extrabold text-emerald-200">
                        NEW!
                      </span>
                    )}
                  </div>

                  <div className="h-32 flex items-center justify-center z-10 my-1">
                    <img
                      src={item.portraitUrl}
                      alt={item.name}
                      className="max-h-32 w-auto object-contain drop-shadow-[0_6px_15px_rgba(0,0,0,0.95)]"
                    />
                  </div>

                  <div className="w-full text-center z-10 bg-black/80 p-1.5 rounded-lg border border-amber-500/30">
                    <div className="font-display font-bold text-xs text-white truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-amber-300 truncate">
                      #{item.sinnerNumber} {item.sinnerName}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center text-xs text-stone-400">
            Tip: Click any revealed card to inspect its voice quote & signature skill!
          </div>
        </div>
      )}

      {/* =================================================================================
          STAGE 4: FULL-SCREEN 000 / E.G.O MIRROR SHATTER CUT-IN PRESENTATION
         ================================================================================= */}
      {stage === 'cinematic_cutin' && cutInIndex !== null && pullResults[cutInIndex] && (
        <div
          onClick={handleCloseCutIn}
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-xl flex flex-col justify-between p-8 overflow-hidden cursor-pointer select-none"
        >
          {(() => {
            const item = pullResults[cutInIndex];
            const sinMeta = SIN_INFO[item.signatureSin];
            return (
              <>
                {/* Background Official Steam EGO Ticket & Splash Art Silhouette */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none"
                  style={{ backgroundImage: `url('/assets/steam/ui/UserinfoTicket_EGO_Bg_24.webp')` }}
                />
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-25 scale-110 blur-xs pointer-events-none"
                  style={{ backgroundImage: `url('${item.splashUrl}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black pointer-events-none" />

                {/* Top Official Steam Rarity / EGO Emblem Header */}
                <div className="relative z-20 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        item.kind === 'ego'
                          ? item.rarityLabel === 'ALEPH'
                            ? '/assets/steam/gacha/MainUI_Gacha_4_Illust_E5_ALEPH.webp'
                            : item.rarityLabel === 'WAW'
                            ? '/assets/steam/gacha/MainUI_Gacha_4_Illust_E4_WAW.webp'
                            : item.rarityLabel === 'HE'
                            ? '/assets/steam/gacha/MainUI_Gacha_4_Illust_E3_HE.webp'
                            : '/assets/steam/gacha/MainUI_Gacha_4_Illust_E2_TETH.webp'
                          : '/assets/steam/gacha/MainUI_Gacha_4_Illust_Rank_3.webp'
                      }
                      alt={item.rarityLabel}
                      className="h-14 w-auto object-contain drop-shadow-[0_0_20px_#facc15]"
                    />
                    <div>
                      <div className="font-bebas text-2xl tracking-widest text-amber-300">
                        {item.kind === 'ego'
                          ? `E.G.O MANIFESTATION // ${item.rarityLabel}`
                          : `000 IDENTITY EXTRACTION`}
                      </div>
                      <span className="text-sm font-display font-bold text-amber-100">
                        {item.worldOrAbno}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="hover:scale-105 transition cursor-pointer flex items-center gap-2"
                  >
                    <img
                      src="/assets/steam/gacha/MainUI_Gacha_4_Illust_Skip.webp"
                      alt="Skip"
                      className="h-10 w-auto object-contain"
                    />
                  </button>
                </div>

                {/* Center Character Splash + Battle Sprite & Voice Quote Banner */}
                <div className="relative z-20 my-auto flex flex-col lg:flex-row items-center justify-center gap-10 max-w-6xl mx-auto w-full">
                  {/* Character Art & Live Multi-Pose Combat Sprite Showcase */}
                  <div className="relative flex items-end justify-center">
                    <img
                      src="/assets/steam/gacha/MainUI_Gacha_4_Card_EgoRing_Left.webp"
                      alt=""
                      className="h-80 w-auto object-contain -mr-10 opacity-80 pointer-events-none"
                    />
                    <img
                      src={item.splashUrl}
                      alt={item.sinnerName}
                      className="max-h-[410px] w-auto rounded-2xl border-2 border-amber-400/70 shadow-[0_0_60px_rgba(250,204,21,0.5)] object-cover"
                    />
                    {/* Live Multi-Pose Combat Action Sprite + Real Weapon Slash VFX */}
                    <div className="relative -ml-14 mb-2 flex flex-col items-center">
                      {poseTick > 0 && (
                        <img
                          src={`/assets/steam/vfx/slash_${(poseTick % 12) + 1}.webp`}
                          alt=""
                          className="absolute inset-0 w-60 h-60 object-contain pointer-events-none z-20 animate-ping"
                          style={{ animationDuration: '550ms' }}
                        />
                      )}
                      <img
                        key={poseTick}
                        src={`/assets/steam/chars/sinner_${item.sinnerId}/${SHOWCASE_POSES[poseTick]}.webp`}
                        alt={item.name}
                        className="h-56 w-auto object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.98)] transition-transform duration-150 scale-105"
                      />
                      <span className="px-2.5 py-0.5 rounded bg-black/90 border border-amber-400/70 text-[10px] font-mono-num font-bold text-amber-300 uppercase tracking-widest shadow-lg">
                        COMBAT POSE: {SHOWCASE_POSES[poseTick].toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Right Details & Slanted Quote */}
                  <div className="max-w-xl space-y-4">
                    <div className="flex items-center gap-3">
                      <img src={item.emblemUrl} alt="" className="w-14 h-14 object-contain" />
                      <div>
                        <div className="font-bebas text-2xl text-amber-400 tracking-widest">
                          SINNER #{item.sinnerNumber} — {item.sinnerName}
                        </div>
                        <h2 className="font-display text-4xl font-black text-white leading-tight">
                          {item.name}
                        </h2>
                      </div>
                    </div>

                    {/* Iconic Quote Box */}
                    <div className="p-5 rounded-xl bg-gradient-to-r from-red-950/90 via-stone-900/95 to-black border-l-4 border-l-amber-400 border border-amber-500/40 shadow-2xl">
                      <p className="text-lg italic text-amber-100 font-serif leading-relaxed">
                        {item.quote}
                      </p>
                    </div>

                    {/* Signature Skill Preview */}
                    <div className="flex items-center gap-3 bg-black/80 p-3.5 rounded-xl border border-stone-700">
                      <img src={sinMeta.icon} alt="" className="w-8 h-8 object-contain" />
                      <div>
                        <div className="text-[10px] text-amber-300 uppercase font-bold">
                          Signature Skill / E.G.O
                        </div>
                        <div className="font-display font-bold text-sm text-white">
                          {item.signatureSkillName}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.playEgoVoice(item.sinnerId);
                        }}
                        className="ml-auto px-3 py-1.5 rounded bg-amber-500/20 border border-amber-400 text-xs font-bold text-amber-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        Replay Voice
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="relative z-20 text-center font-bebas text-xl tracking-[0.2em] text-amber-300 animate-pulse">
                  {item.isDuplicate
                    ? `DUPLICATE CONVERTED TO +${item.shardsGained} ${item.sinnerName.toUpperCase()} EGOSHARDS`
                    : `NEW ${item.kind.toUpperCase()} UNLOCKED & AUTOMATICALLY EQUIPPED!`}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* =================================================================================
          STAGE 5: FINAL EXTRACTION SUMMARY MODAL (WITH PULL AGAIN & INSPECT)
         ================================================================================= */}
      {stage === 'summary' && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 select-none">
          <div className="limbus-panel max-w-6xl w-full rounded-2xl p-6 border-2 border-amber-400 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/30 pb-3 mb-4">
              <div>
                <h3 className="font-display text-2xl font-black text-amber-300">
                  MEPHISTOPHELES EXTRACTION SUMMARY
                </h3>
                <p className="text-xs text-stone-400">
                  Total Shards Earned This Batch:{' '}
                  <strong className="text-purple-300">
                    +{pullResults.reduce((s, r) => s + r.shardsGained, 0)} Egoshards
                  </strong>{' '}
                  • Current Lunacy: <strong className="text-rose-300">{save.lunacy.toLocaleString()}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => initiateExtraction(1)}
                  className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-amber-400/70 text-xs font-bold text-amber-200 cursor-pointer"
                >
                  PULL 1× AGAIN (130)
                </button>
                <button
                  onClick={() => initiateExtraction(10)}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-red-800 to-amber-500 hover:brightness-110 text-black font-extrabold text-xs cursor-pointer shadow-lg"
                >
                  PULL 10× AGAIN (1,300)
                </button>
                <button
                  onClick={() => {
                    soundManager.playSfx('ui_click');
                    setStage('idle');
                  }}
                  className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs cursor-pointer"
                >
                  CONFIRM & CLOSE
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 overflow-y-auto p-1">
              {pullResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    soundManager.playEgoVoice(item.sinnerId);
                    setCutInIndex(idx);
                    setStage('cinematic_cutin');
                  }}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center text-center relative overflow-hidden cursor-pointer hover:scale-105 transition ${
                    item.tierRank === 4
                      ? 'bg-gradient-to-b from-purple-900/70 via-red-950/70 to-black border-purple-300 shadow-[0_0_25px_rgba(192,132,252,0.5)]'
                      : item.tierRank === 3
                      ? 'bg-gradient-to-b from-amber-900/65 via-red-950/65 to-black border-amber-300 shadow-[0_0_25px_rgba(250,204,21,0.5)]'
                      : 'bg-stone-950 border-stone-800'
                  }`}
                >
                  {item.isHighTier && (
                    <div className="absolute inset-0 holo-card-sheen pointer-events-none" />
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold mb-1 z-10 ${
                      item.tierRank === 4
                        ? 'bg-purple-300 text-black'
                        : item.tierRank === 3
                        ? 'bg-amber-400 text-black'
                        : 'bg-stone-800 text-stone-300'
                    }`}
                  >
                    {item.kind === 'ego' ? `E.G.O [${item.rarityLabel}]` : `ID [${item.rarityLabel}]`}
                  </span>

                  <div className="h-28 flex items-center justify-center my-1 z-10 relative">
                    <img
                      src={
                        item.isHighTier
                          ? `/assets/steam/chars/sinner_${item.sinnerId}/${SHOWCASE_POSES[(poseTick + idx) % SHOWCASE_POSES.length]}.webp`
                          : item.portraitUrl
                      }
                      alt={item.name}
                      className="max-h-28 w-auto object-contain"
                    />
                  </div>

                  <div className="font-display font-bold text-xs text-white line-clamp-1 mt-1 z-10">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-amber-300 z-10">{item.sinnerName}</div>

                  {item.isDuplicate ? (
                    <div className="mt-1 text-[10px] font-mono-num text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded z-10">
                      +{item.shardsGained} Shards
                    </div>
                  ) : (
                    <div className="mt-1 text-[10px] font-extrabold text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded z-10">
                      NEW! (EQUIPPED)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inspect Individual Card Modal */}
      {inspectedResult && (
        <div
          onClick={() => setInspectedResult(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="limbus-crimson-panel max-w-lg w-full rounded-2xl p-6 border-2 border-amber-400 text-center"
          >
            <img
              src={inspectedResult.portraitUrl}
              alt={inspectedResult.name}
              className="h-44 mx-auto object-contain mb-3"
            />
            <div className="font-bebas text-xl text-amber-300">
              SINNER #{inspectedResult.sinnerNumber} — {inspectedResult.sinnerName}
            </div>
            <h4 className="font-display text-2xl font-black text-white">{inspectedResult.name}</h4>
            <p className="text-sm italic text-amber-100 mt-2">{inspectedResult.quote}</p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={() => soundManager.playEgoVoice(inspectedResult.sinnerId)}
                className="px-4 py-2 rounded bg-amber-500 text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                Play Voice
              </button>
              <button
                onClick={() => setInspectedResult(null)}
                className="px-4 py-2 rounded bg-stone-800 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
