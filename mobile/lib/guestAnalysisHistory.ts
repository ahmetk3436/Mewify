import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_ANALYSIS_HISTORY_KEY = 'guest_analysis_history_v1';
const GUEST_ANALYSIS_HISTORY_MAX = 50;
const RETENTION_DAYS = 30;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

export interface GuestAnalysisHistoryItem {
  id: string;
  image_url: string;
  overall_score: number;
  symmetry_score: number;
  jawline_score: number;
  skin_score: number;
  eye_score: number;
  nose_score: number;
  lips_score: number;
  harmony_score: number;
  strengths: string[];
  improvements: string[];
  analyzed_at: string;
  created_at: string;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function isWithinRetention(dateLike: string): boolean {
  const ts = new Date(dateLike).getTime();
  if (!Number.isFinite(ts)) return true;
  return Date.now() - ts <= RETENTION_MS;
}

function sortNewest(a: GuestAnalysisHistoryItem, b: GuestAnalysisHistoryItem): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

export function normalizeGuestAnalysis(raw: any): GuestAnalysisHistoryItem {
  const now = new Date().toISOString();
  return {
    id: asString(raw?.id) || `guest-local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    image_url: asString(raw?.image_url),
    overall_score: asNumber(raw?.overall_score, 0),
    symmetry_score: asNumber(raw?.symmetry_score, 0),
    jawline_score: asNumber(raw?.jawline_score, 0),
    skin_score: asNumber(raw?.skin_score, 0),
    eye_score: asNumber(raw?.eye_score, 0),
    nose_score: asNumber(raw?.nose_score, 0),
    lips_score: asNumber(raw?.lips_score, 0),
    harmony_score: asNumber(raw?.harmony_score, 0),
    strengths: asStringArray(raw?.strengths),
    improvements: asStringArray(raw?.improvements),
    analyzed_at: asString(raw?.analyzed_at, now),
    created_at: asString(raw?.created_at, now),
  };
}

export async function loadGuestAnalyses(): Promise<GuestAnalysisHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_ANALYSIS_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const normalized = parsed.map((item) => normalizeGuestAnalysis(item));
    const retained = normalized
      .filter((item) => isWithinRetention(item.created_at))
      .sort(sortNewest)
      .slice(0, GUEST_ANALYSIS_HISTORY_MAX);

    if (retained.length !== normalized.length) {
      await AsyncStorage.setItem(GUEST_ANALYSIS_HISTORY_KEY, JSON.stringify(retained));
    }

    return retained;
  } catch {
    return [];
  }
}

export async function saveGuestAnalysis(item: GuestAnalysisHistoryItem): Promise<void> {
  const current = await loadGuestAnalyses();
  const normalized = normalizeGuestAnalysis(item);
  const next = [normalized, ...current.filter((entry) => entry.id !== normalized.id)]
    .filter((entry) => isWithinRetention(entry.created_at))
    .sort(sortNewest)
    .slice(0, GUEST_ANALYSIS_HISTORY_MAX);

  await AsyncStorage.setItem(GUEST_ANALYSIS_HISTORY_KEY, JSON.stringify(next));
}

export async function saveGuestAnalyses(items: GuestAnalysisHistoryItem[]): Promise<void> {
  if (!Array.isArray(items) || items.length === 0) return;

  const normalized = items
    .map((item) => normalizeGuestAnalysis(item))
    .filter((item) => isWithinRetention(item.created_at))
    .sort(sortNewest);

  const seen = new Set<string>();
  const deduped: GuestAnalysisHistoryItem[] = [];
  for (const item of normalized) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    deduped.push(item);
    if (deduped.length >= GUEST_ANALYSIS_HISTORY_MAX) break;
  }

  await AsyncStorage.setItem(GUEST_ANALYSIS_HISTORY_KEY, JSON.stringify(deduped));
}

export async function getGuestAnalysisById(id: string): Promise<GuestAnalysisHistoryItem | null> {
  const entries = await loadGuestAnalyses();
  return entries.find((entry) => entry.id === id) || null;
}

export async function clearGuestAnalyses(): Promise<void> {
  await AsyncStorage.removeItem(GUEST_ANALYSIS_HISTORY_KEY);
}
