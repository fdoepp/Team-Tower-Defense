import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  BuilderMode,
  LegionId,
  NameLang,
  StrategyId,
} from '../data/types';
import { FIGHTERS } from '../data/fighters';
import { loadNameLang, loadOwned, saveNameLang, saveOwned } from '../lib/storage';
import { suggestOpenerPlacement } from '../lib/placement';

interface AppState {
  nameLang: NameLang;
  setNameLang: (l: NameLang) => void;
  ownedIds: Set<string>;
  toggleOwned: (id: string) => void;
  selectAllOwned: () => void;
  clearOwned: () => void;
  builderMode: BuilderMode;
  setBuilderMode: (m: BuilderMode) => void;
  legionId: LegionId;
  setLegionId: (id: LegionId) => void;
  mastermindPlaystyle: string;
  setMastermindPlaystyle: (s: string) => void;
  pickIds: string[];
  togglePick: (id: string) => void;
  setPicks: (ids: string[]) => void;
  strategies: StrategyId[];
  toggleStrategy: (id: StrategyId) => void;
  focusWorkersUntil: number;
  setFocusWorkersUntil: (n: number) => void;
  focusBreakWaves: number[];
  toggleBreakWave: (n: number) => void;
  focusCounter: string;
  setFocusCounter: (s: string) => void;
  currentWave: number;
  setCurrentWave: (n: number) => void;
  leakPercent: number;
  setLeakPercent: (n: number) => void;
  receivedMythium: number;
  setReceivedMythium: (n: number) => void;
  opponentChips: string[];
  toggleOpponentChip: (name: string) => void;
  sendChips: string[];
  toggleSendChip: (id: string) => void;
  placements: ReturnType<typeof suggestOpenerPlacement>;
  refreshPlacements: () => void;
}

const AppContext = createContext<AppState | null>(null);

const DEFAULT_OWNED = FIGHTERS.filter((f) => f.tier <= 3).map((f) => f.id);

export function AppProvider({ children }: { children: ReactNode }) {
  const [nameLang, setNameLangState] = useState<NameLang>(() => loadNameLang());
  const [ownedIds, setOwnedIds] = useState<Set<string>>(() => {
    const saved = loadOwned();
    return new Set(saved.length ? saved : DEFAULT_OWNED);
  });
  const [builderMode, setBuilderMode] = useState<BuilderMode>('mastermind');
  const [legionId, setLegionId] = useState<LegionId>('element');
  const [mastermindPlaystyle, setMastermindPlaystyle] = useState('Lock In');
  const [pickIds, setPickIds] = useState<string[]>(() =>
    DEFAULT_OWNED.slice(0, 6),
  );
  const [strategies, setStrategies] = useState<StrategyId[]>(['hold', 'worker']);
  const [focusWorkersUntil, setFocusWorkersUntil] = useState(6);
  const [focusBreakWaves, setFocusBreakWaves] = useState<number[]>([8, 10]);
  const [focusCounter, setFocusCounter] = useState('');
  const [currentWave, setCurrentWave] = useState(1);
  const [leakPercent, setLeakPercent] = useState(0);
  const [receivedMythium, setReceivedMythium] = useState(0);
  const [opponentChips, setOpponentChips] = useState<string[]>([]);
  const [sendChips, setSendChips] = useState<string[]>([]);
  const [placements, setPlacements] = useState(() =>
    suggestOpenerPlacement(DEFAULT_OWNED.slice(0, 6)),
  );

  const setNameLang = useCallback((l: NameLang) => {
    setNameLangState(l);
    saveNameLang(l);
  }, []);

  const toggleOwned = useCallback((id: string) => {
    setOwnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveOwned([...next]);
      return next;
    });
  }, []);

  const selectAllOwned = useCallback(() => {
    const all = FIGHTERS.map((f) => f.id);
    setOwnedIds(new Set(all));
    saveOwned(all);
  }, []);

  const clearOwned = useCallback(() => {
    setOwnedIds(new Set());
    saveOwned([]);
  }, []);

  const togglePick = useCallback((id: string) => {
    setPickIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 6) return prev;
      return [...prev, id];
    });
  }, []);

  const setPicks = useCallback((ids: string[]) => {
    setPickIds(ids.slice(0, 6));
  }, []);

  const toggleStrategy = useCallback((id: StrategyId) => {
    setStrategies((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const toggleBreakWave = useCallback((n: number) => {
    setFocusBreakWaves((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort((a, b) => a - b),
    );
  }, []);

  const toggleOpponentChip = useCallback((name: string) => {
    setOpponentChips((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  }, []);

  const toggleSendChip = useCallback((id: string) => {
    setSendChips((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const refreshPlacements = useCallback(() => {
    setPlacements(suggestOpenerPlacement(pickIds));
  }, [pickIds]);

  const value = useMemo(
    () => ({
      nameLang,
      setNameLang,
      ownedIds,
      toggleOwned,
      selectAllOwned,
      clearOwned,
      builderMode,
      setBuilderMode,
      legionId,
      setLegionId,
      mastermindPlaystyle,
      setMastermindPlaystyle,
      pickIds,
      togglePick,
      setPicks,
      strategies,
      toggleStrategy,
      focusWorkersUntil,
      setFocusWorkersUntil,
      focusBreakWaves,
      toggleBreakWave,
      focusCounter,
      setFocusCounter,
      currentWave,
      setCurrentWave,
      leakPercent,
      setLeakPercent,
      receivedMythium,
      setReceivedMythium,
      opponentChips,
      toggleOpponentChip,
      sendChips,
      toggleSendChip,
      placements,
      refreshPlacements,
    }),
    [
      nameLang,
      setNameLang,
      ownedIds,
      toggleOwned,
      selectAllOwned,
      clearOwned,
      builderMode,
      legionId,
      mastermindPlaystyle,
      pickIds,
      togglePick,
      setPicks,
      strategies,
      toggleStrategy,
      focusWorkersUntil,
      focusBreakWaves,
      toggleBreakWave,
      focusCounter,
      currentWave,
      leakPercent,
      receivedMythium,
      opponentChips,
      toggleOpponentChip,
      sendChips,
      toggleSendChip,
      placements,
      refreshPlacements,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp outside provider');
  return ctx;
}
