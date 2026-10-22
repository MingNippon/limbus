import React, { useState } from 'react';
import {
  CantoStage,
  EgoGiftData,
  MirrorNode,
  MirrorRunState,
  PlayerSaveState,
} from '../types/game';
import { EGO_GIFTS, SIN_INFO } from '../data/constants';
import { soundManager } from '../audio/SoundManager';
import {
  Compass,
  Swords,
  Skull,
  HelpCircle,
  ShoppingBag,
  Sparkles,
  HeartPulse,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

interface MirrorDungeonScreenProps {
  save: PlayerSaveState;
  onUpdateSave: (updater: (prev: PlayerSaveState) => PlayerSaveState) => void;
  onStartMirrorBattle: (stage: CantoStage, nodeId: string) => void;
}

function generateFloorNodes(floor: number): MirrorNode[] {
  const bossPool =
    floor === 1
      ? ['boss_golden_apple', 'boss_kromer']
      : floor === 2
      ? ['boss_dongbaek', 'boss_ricardo', 'boss_ahab']
      : ['boss_erlking', 'boss_don_first_kindred'];
  const pickedBoss = bossPool[Math.floor(Math.random() * bossPool.length)];

  return [
    {
      id: `f${floor}_n1`,
      floor,
      column: 1,
      row: 1,
      type: 'battle',
      title: `Sector ${floor}-A: Syndicate Ambush`,
      subtitle: 'Standard Combat (+80 Cost)',
      enemies: ['syndicate_thug', 'syndicate_thug'],
      completed: false,
      nextNodeIds: [`f${floor}_n2a`, `f${floor}_n2b`],
    },
    {
      id: `f${floor}_n2a`,
      floor,
      column: 2,
      row: 0,
      type: 'abnormality_event',
      title: `Sector ${floor}-B1: Fathom Encounter`,
      subtitle: 'Abnormality Event (Free E.G.O Gift!)',
      completed: false,
      nextNodeIds: [`f${floor}_n3`],
    },
    {
      id: `f${floor}_n2b`,
      floor,
      column: 2,
      row: 2,
      type: 'elite',
      title: `Sector ${floor}-B2: Elite Suppression`,
      subtitle: 'Hard Combat (+140 Cost & Random E.G.O Gift)',
      enemies: ['n_corp_inquisitor', 'syndicate_thug', 'n_corp_inquisitor'],
      completed: false,
      nextNodeIds: [`f${floor}_n3`],
    },
    {
      id: `f${floor}_n3`,
      floor,
      column: 3,
      row: 1,
      type: 'rest_shop',
      title: `Sector ${floor}-C: Vending Machine & Rest Stop`,
      subtitle: 'Heal Sinners & Buy E.G.O Gifts with Cost',
      completed: false,
      nextNodeIds: [`f${floor}_boss`],
    },
    {
      id: `f${floor}_boss`,
      floor,
      column: 4,
      row: 1,
      type: 'boss',
      title: `Floor ${floor} Boss: ${
        pickedBoss === 'boss_golden_apple'
          ? 'Golden Apple'
          : pickedBoss === 'boss_kromer'
          ? 'Kromer the Dreamer'
          : pickedBoss === 'boss_dongbaek'
          ? 'Spicebush Dongbaek'
          : pickedBoss === 'boss_ricardo'
          ? 'Big Brother Ricardo'
          : pickedBoss === 'boss_ahab'
          ? 'Captain Ahab'
          : pickedBoss === 'boss_don_first_kindred'
          ? 'Don Quixote (First Kindred)'
          : 'Erlking Heathcliff'
      }`,
      subtitle: 'Floor Guardian Suppression',
      enemies: [pickedBoss],
      completed: false,
      nextNodeIds: [],
    },
  ];
}

export const MirrorDungeonScreen: React.FC<MirrorDungeonScreenProps> = ({
  save,
  onUpdateSave,
  onStartMirrorBattle,
}) => {
  const [selectedStarterGiftId, setSelectedStarterGiftId] = useState<string>(EGO_GIFTS[0].id);
  const [activeEventModal, setActiveEventModal] = useState<MirrorNode | null>(null);
  const [activeShopModal, setActiveShopModal] = useState<MirrorNode | null>(null);

  const run = save.mirrorRun;

  const handleStartNewRun = () => {
    soundManager.playSfx('ego_activate');
    const nodes = generateFloorNodes(1);
    const newRun: MirrorRunState = {
      active: true,
      floor: 1,
      maxFloors: 3,
      costCurrency: 150,
      starlightEarned: 25,
      collectedGiftIds: [selectedStarterGiftId],
      currentNodeId: null,
      completedNodeIds: [],
      nodes,
      sinnerHpPercents: {},
      sinnerSpValues: {},
    };
    onUpdateSave((prev) => ({ ...prev, mirrorRun: newRun }));
  };

  const isNodeReachable = (node: MirrorNode): boolean => {
    if (!run || node.completed) return false;
    if (!run.currentNodeId) {
      return node.column === 1;
    }
    const currNode = run.nodes.find((n) => n.id === run.currentNodeId);
    if (!currNode) return node.column === 1;
    return currNode.nextNodeIds.includes(node.id);
  };

  const markNodeCompleted = (nodeId: string, extraCost = 0, newGiftId?: string) => {
    onUpdateSave((prev) => {
      if (!prev.mirrorRun) return prev;
      const r = prev.mirrorRun;
      const updatedNodes = r.nodes.map((n) => (n.id === nodeId ? { ...n, completed: true } : n));
      const nextGifts = newGiftId
        ? Array.from(new Set([...r.collectedGiftIds, newGiftId]))
        : r.collectedGiftIds;

      const nodeObj = r.nodes.find((n) => n.id === nodeId);
      // If floor boss completed
      if (nodeObj?.type === 'boss') {
        if (r.floor < r.maxFloors) {
          const nextFloor = r.floor + 1;
          return {
            ...prev,
            lunacy: prev.lunacy + 250,
            starlight: prev.starlight + 30,
            mirrorRun: {
              ...r,
              floor: nextFloor,
              costCurrency: r.costCurrency + 150 + extraCost,
              starlightEarned: r.starlightEarned + 35,
              collectedGiftIds: nextGifts,
              currentNodeId: null,
              completedNodeIds: [],
              nodes: generateFloorNodes(nextFloor),
            },
          };
        } else {
          // Completed entire Mirror Dungeon Run!
          alert(
            'CHÚC MỪNG! Bạn đã chinh phục hoàn toàn Mirror of the Wuthering (Tầng 3)! Nhận +800 Lunacy, +60 Thread & +100 Starlight!'
          );
          return {
            ...prev,
            lunacy: prev.lunacy + 800,
            thread: prev.thread + 60,
            starlight: prev.starlight + 100,
            mirrorRun: null,
          };
        }
      }

      return {
        ...prev,
        mirrorRun: {
          ...r,
          costCurrency: r.costCurrency + extraCost,
          collectedGiftIds: nextGifts,
          currentNodeId: nodeId,
          completedNodeIds: [...r.completedNodeIds, nodeId],
          nodes: updatedNodes,
        },
      };
    });
  };

  const handleSelectNode = (node: MirrorNode) => {
    if (!isNodeReachable(node)) return;
    soundManager.playSfx('ui_click');

    if (node.type === 'battle' || node.type === 'elite' || node.type === 'boss') {
      const primaryEnemy = node.enemies?.[0];
      const bossBgm =
        primaryEnemy === 'boss_kromer'
          ? 'boss_kromer'
          : primaryEnemy === 'boss_dongbaek'
          ? 'boss_dongbaek'
          : primaryEnemy === 'boss_ricardo'
          ? 'battle_middle'
          : primaryEnemy === 'boss_ahab'
          ? 'boss_ahab'
          : primaryEnemy === 'boss_don_first_kindred'
          ? 'boss_hero'
          : 'boss_violet';

      const stageObj: CantoStage = {
        id: `mirror_${node.id}`,
        cantoNumber: run?.floor || 1,
        stageCode: `MD-F${run?.floor || 1}`,
        title: node.title,
        subtitle: node.subtitle,
        recommendedLevel: (run?.floor || 1) * 12,
        focusedEncounter: true,
        backgroundUrl:
          node.type === 'boss'
            ? '/assets/backgrounds/fathom_abnormality_arena.jpg'
            : '/assets/backgrounds/city_backstreets_arena.jpg',
        bgmKey: node.type === 'boss' ? bossBgm : 'battle',
        enemies: node.enemies || ['syndicate_thug'],
        preCutscene: [],
        postCutscene: [],
        rewards: {
          lunacy: node.type === 'boss' ? 300 : 80,
          expTickets: node.type === 'boss' ? 6 : 2,
          thread: node.type === 'boss' ? 25 : 8,
          shards: node.type === 'boss' ? 15 : 5,
        },
      };
      onStartMirrorBattle(stageObj, node.id);
    } else if (node.type === 'abnormality_event') {
      setActiveEventModal(node);
    } else if (node.type === 'rest_shop') {
      setActiveShopModal(node);
    }
  };

  if (!run || !run.active) {
    // START NEW MIRROR DUNGEON RUN SCREEN
    return (
      <div className="w-full h-full p-6 flex flex-col justify-between limbus-panel rounded-2xl relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none"
          style={{ backgroundImage: `url('/assets/backgrounds/fathom_abnormality_arena.jpg')` }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <Compass className="w-7 h-7 text-amber-400" />
              <div>
                <h2 className="font-display text-2xl font-black text-amber-200">
                  MIRROR DUNGEON — MIRROR OF THE WUTHERING
                </h2>
                <p className="text-xs text-stone-300">
                  Roguelike Corridor Exploration • Collect E.G.O Gifts • Conquer 3 Floors of Abnormalities
                </p>
              </div>
            </div>
            <div className="px-4 py-1.5 rounded bg-purple-950/80 border border-purple-400 text-xs font-mono-num text-purple-200">
              Starlight: <strong>{save.starlight}</strong> ★
            </div>
          </div>

          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-amber-300 mb-3">
            CHOOSE YOUR STARTING E.G.O GIFT:
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-h-[360px] overflow-y-auto pr-1">
            {EGO_GIFTS.map((gift) => {
              const selected = selectedStarterGiftId === gift.id;
              return (
                <div
                  key={gift.id}
                  onClick={() => {
                    soundManager.playSfx('ui_click');
                    setSelectedStarterGiftId(gift.id);
                  }}
                  className={`p-3.5 rounded-xl border flex flex-col items-center text-center cursor-pointer transition ${
                    selected
                      ? 'bg-amber-950/50 border-amber-300 ring-2 ring-amber-400 scale-[1.02]'
                      : 'bg-black/75 border-stone-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[10px] font-mono-num font-bold text-amber-400">
                      TIER {['I', 'II', 'III', 'IV'][gift.tier - 1]}
                    </span>
                    <img src={SIN_INFO[gift.sin].icon} alt="" className="w-4 h-4" />
                  </div>
                  <img
                    src={gift.iconUrl}
                    alt={gift.name}
                    className="w-14 h-14 object-contain my-1.5 drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]"
                  />
                  <div className="font-display font-bold text-xs text-white">{gift.name}</div>
                  <p className="text-[10px] text-stone-400 mt-1 line-clamp-3 leading-snug">
                    {gift.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-amber-500/30">
          <div className="text-xs text-stone-300">
            Selected Gift:{' '}
            <strong className="text-amber-300">
              {EGO_GIFTS.find((g) => g.id === selectedStarterGiftId)?.name}
            </strong>
          </div>
          <button
            onClick={handleStartNewRun}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-700 via-amber-600 to-yellow-500 hover:brightness-110 text-black font-bebas text-2xl tracking-widest shadow-[0_0_30px_rgba(245,158,11,0.5)] cursor-pointer"
          >
            ENTER THE MIRROR DUNGEON
          </button>
        </div>
      </div>
    );
  }

  // ACTIVE MIRROR DUNGEON MAP VIEW
  const collectedGifts: EgoGiftData[] = EGO_GIFTS.filter((g) => run.collectedGiftIds.includes(g.id));

  return (
    <div className="w-full h-full p-5 flex flex-col justify-between limbus-panel rounded-2xl relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none"
        style={{ backgroundImage: `url('/assets/backgrounds/fathom_abnormality_arena.jpg')` }}
      />

      {/* Top Run Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/30 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-amber-500 text-black font-bebas text-lg tracking-wider">
              FLOOR {run.floor} / {run.maxFloors}
            </span>
            <h2 className="font-display text-xl font-bold text-amber-200">
              MIRROR OF THE WUTHERING — SECTOR MAP
            </h2>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Select a glowing node in the next column to advance your expedition
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-3.5 py-1.5 rounded bg-black/80 border border-amber-500/50 text-xs font-mono-num">
            Cost Currency: <strong className="text-amber-300">{run.costCurrency}</strong> 🪙
          </div>
          <button
            onClick={() => {
              if (window.confirm('Từ bỏ lượt chạy Mirror Dungeon hiện tại?')) {
                onUpdateSave((prev) => ({ ...prev, mirrorRun: null }));
              }
            }}
            className="px-3 py-1.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-xs text-red-200 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Forfeit Run
          </button>
        </div>
      </div>

      {/* Center Node Graph */}
      <div className="relative z-10 flex-1 flex items-center justify-around px-6 py-4">
        {[1, 2, 3, 4].map((col) => {
          const colNodes = run.nodes.filter((n) => n.column === col);
          return (
            <div key={col} className="flex flex-col items-center justify-center gap-8">
              {colNodes.map((node) => {
                const reachable = isNodeReachable(node);
                const done = node.completed;
                const IconComp =
                  node.type === 'boss'
                    ? Skull
                    : node.type === 'elite'
                    ? Swords
                    : node.type === 'abnormality_event'
                    ? HelpCircle
                    : node.type === 'rest_shop'
                    ? ShoppingBag
                    : Swords;

                return (
                  <button
                    key={node.id}
                    disabled={!reachable && !done}
                    onClick={() => handleSelectNode(node)}
                    className={`w-52 p-4 rounded-xl border-2 text-left transition relative cursor-pointer ${
                      done
                        ? 'bg-emerald-950/50 border-emerald-500/60 opacity-75'
                        : reachable
                        ? 'bg-gradient-to-br from-red-950/90 to-stone-900 border-amber-400 ring-2 ring-amber-300/60 hover:scale-105 shadow-[0_0_25px_rgba(251,191,36,0.4)]'
                        : 'bg-black/60 border-stone-800 opacity-45 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold uppercase text-amber-300">
                        {node.type.replace('_', ' ')}
                      </span>
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <IconComp
                          className={`w-5 h-5 ${
                            node.type === 'boss' ? 'text-red-400' : 'text-amber-300'
                          }`}
                        />
                      )}
                    </div>
                    <div className="font-display font-bold text-sm text-white leading-tight">
                      {node.title}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1">{node.subtitle}</div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom Collected E.G.O Gifts Bar */}
      <div className="relative z-10 pt-3 border-t border-amber-500/30 flex items-center gap-3 overflow-x-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-300 shrink-0 flex items-center gap-1">
          <Sparkles className="w-4 h-4" />
          ACTIVE E.G.O GIFTS ({collectedGifts.length}):
        </span>
        {collectedGifts.map((gift) => (
          <div
            key={gift.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/80 border border-amber-500/40 shrink-0"
            title={gift.description}
          >
            <img src={gift.iconUrl} alt={gift.name} className="w-6 h-6 object-contain" />
            <div>
              <div className="text-xs font-bold text-amber-200">{gift.name}</div>
              <div className="text-[10px] text-stone-400 max-w-[200px] truncate">{gift.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Abnormality Event Modal */}
      {activeEventModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="limbus-crimson-panel max-w-xl w-full rounded-2xl p-6 border-2 border-amber-400">
            <span className="px-2.5 py-0.5 rounded bg-amber-400 text-black font-bebas text-lg">
              MIRROR ABNORMALITY ENCOUNTER
            </span>
            <h3 className="font-display text-2xl font-bold text-amber-200 mt-2">
              The Whispering Golden Bough Shrine
            </h3>
            <p className="text-sm text-stone-200 leading-relaxed mt-2 bg-black/60 p-4 rounded border border-stone-800">
              Giữa hành lang gương vô tận, một bức tượng Abnormality cổ xưa đang ôm chặt chiếc hộp di vật E.G.O Gift.
              Nó đưa ra hai lựa chọn cho đoàn Sinner của bạn:
            </p>

            <div className="space-y-3 mt-5">
              <button
                onClick={() => {
                  soundManager.playSfx('gacha_000');
                  const unowned = EGO_GIFTS.filter((g) => !run.collectedGiftIds.includes(g.id));
                  const rewardGift =
                    unowned.length > 0
                      ? unowned[Math.floor(Math.random() * unowned.length)]
                      : EGO_GIFTS[0];
                  markNodeCompleted(activeEventModal.id, 100, rewardGift.id);
                  setActiveEventModal(null);
                }}
                className="w-full p-3.5 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-400 text-left cursor-pointer"
              >
                <div className="font-bold text-sm text-amber-200">
                  [Lựa chọn 1] Chạm vào nhánh Golden Bough và tiếp nhận Tạo Tác E.G.O Gift
                </div>
                <div className="text-xs text-emerald-300 mt-0.5">
                  Phần thưởng: Nhận 1 E.G.O Gift ngẫu nhiên + 100 Cost
                </div>
              </button>

              <button
                onClick={() => {
                  soundManager.playSfx('heal');
                  onUpdateSave((prev) => {
                    if (!prev.mirrorRun) return prev;
                    return {
                      ...prev,
                      mirrorRun: {
                        ...prev.mirrorRun,
                        sinnerHpPercents: {},
                      },
                    };
                  });
                  markNodeCompleted(activeEventModal.id, 180);
                  setActiveEventModal(null);
                }}
                className="w-full p-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-600 text-left cursor-pointer"
              >
                <div className="font-bold text-sm text-sky-200">
                  [Lựa chọn 2] Thu hoạch tinh thể Enkephalin quanh tượng đài
                </div>
                <div className="text-xs text-sky-300 mt-0.5">
                  Phần thưởng: Hồi đầy 100% HP toàn đội + Nhận 180 Cost
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rest Stop & Vending Machine Shop Modal */}
      {activeShopModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="limbus-panel max-w-2xl w-full rounded-2xl p-6 border-2 border-amber-400">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-amber-200">
                  REST STOP & E.G.O GIFT VENDING MACHINE
                </h3>
                <p className="text-xs text-stone-400">
                  Spend your Cost Currency ({run.costCurrency} 🪙) before facing the Floor Boss!
                </p>
              </div>
              <div className="px-3 py-1 rounded bg-amber-500/20 border border-amber-400 font-mono-num text-sm font-bold text-amber-300">
                {run.costCurrency} Cost 🪙
              </div>
            </div>

            <div className="space-y-4">
              {/* Heal Party Option */}
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HeartPulse className="w-6 h-6 text-emerald-400" />
                  <div>
                    <div className="font-bold text-sm text-white">Full Squad Restoration</div>
                    <div className="text-xs text-stone-300">
                      Heal 100% HP and restore +30 SP for all deployed Sinners
                    </div>
                  </div>
                </div>
                <button
                  disabled={run.costCurrency < 80}
                  onClick={() => {
                    soundManager.playSfx('heal');
                    onUpdateSave((prev) => {
                      if (!prev.mirrorRun) return prev;
                      return {
                        ...prev,
                        mirrorRun: {
                          ...prev.mirrorRun,
                          costCurrency: prev.mirrorRun.costCurrency - 80,
                          sinnerHpPercents: {},
                        },
                      };
                    });
                  }}
                  className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs cursor-pointer disabled:opacity-40"
                >
                  HEAL (80 Cost)
                </button>
              </div>

              {/* Shop E.G.O Gifts */}
              <div className="text-xs font-bold uppercase text-amber-300">
                Available E.G.O Gifts in Vending Machine:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto">
                {EGO_GIFTS.filter((g) => !run.collectedGiftIds.includes(g.id))
                  .slice(0, 4)
                  .map((gift) => (
                    <div
                      key={gift.id}
                      className="p-3 rounded-xl bg-black/70 border border-stone-700 flex items-center gap-3"
                    >
                      <img src={gift.iconUrl} alt={gift.name} className="w-11 h-11 object-contain" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-amber-200 truncate">{gift.name}</div>
                        <div className="text-[10px] text-stone-400 line-clamp-2">{gift.description}</div>
                        <button
                          disabled={run.costCurrency < gift.cost}
                          onClick={() => {
                            soundManager.playSfx('gacha_000');
                            onUpdateSave((prev) => {
                              if (!prev.mirrorRun) return prev;
                              return {
                                ...prev,
                                mirrorRun: {
                                  ...prev.mirrorRun,
                                  costCurrency: prev.mirrorRun.costCurrency - gift.cost,
                                  collectedGiftIds: [...prev.mirrorRun.collectedGiftIds, gift.id],
                                },
                              };
                            });
                          }}
                          className="mt-1.5 px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[10px] cursor-pointer disabled:opacity-40"
                        >
                          BUY ({gift.cost} Cost)
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => {
                  soundManager.playSfx('ui_click');
                  markNodeCompleted(activeShopModal.id, 0);
                  setActiveShopModal(null);
                }}
                className="px-6 py-2.5 rounded-lg bg-red-800 hover:bg-red-700 border border-amber-300 text-amber-100 font-bold text-xs cursor-pointer"
              >
                LEAVE REST STOP & PROCEED TO BOSS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
