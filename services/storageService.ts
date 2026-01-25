import { get, set } from 'idb-keyval';
import { ThoughtCard } from '../types';
import { getSupabase } from './supabaseClient';

const STORAGE_KEY = 'mindgarden_thoughts_v1';
const USER_ID_KEY = 'mindgarden_user_id';

// Helper to get a stable "Anonymous" User ID for this browser
const getUserId = (): string => {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
};

// --- Supabase Implementation ---

const saveToSupabase = async (thought: ThoughtCard) => {
  const supabase = getSupabase();
  if (!supabase) return;
  const userId = getUserId();
  
  const { error } = await supabase
    .from('thoughts')
    .upsert({
      id: thought.id,
      user_id: userId,
      data: thought,
      created_at: thought.createdAt
    });

  if (error) throw error;
};

const getFromSupabase = async (): Promise<ThoughtCard[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];
  const userId = getUserId();

  const { data, error } = await supabase
    .from('thoughts')
    .select('data')
    .eq('user_id', userId);

  if (error) throw error;
  
  return data.map((row: any) => row.data as ThoughtCard);
};

const deleteFromSupabase = async (id: string) => {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase
    .from('thoughts')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// --- Local Storage Fallback Implementation ---

const saveToLocal = async (thought: ThoughtCard) => {
  const existing = (await getFromLocal()) || [];
  const index = existing.findIndex((t) => t.id === thought.id);
  
  let updated: ThoughtCard[];
  if (index !== -1) {
    updated = [...existing];
    updated[index] = thought;
  } else {
    updated = [thought, ...existing];
  }
  
  await set(STORAGE_KEY, updated);
};

const getFromLocal = async (): Promise<ThoughtCard[]> => {
  const raw = await get<ThoughtCard[]>(STORAGE_KEY);
  return raw || [];
};

const deleteFromLocal = async (id: string) => {
  const existing = await getFromLocal();
  const updated = existing.filter((t) => t.id !== id);
  await set(STORAGE_KEY, updated);
};

// --- Exported Functions (Hybrid) ---

export const saveThought = async (thought: ThoughtCard): Promise<void> => {
  try {
    if (getSupabase()) {
      await saveToSupabase(thought);
    } else {
      await saveToLocal(thought);
    }
  } catch (error) {
    console.error('Failed to save thought:', error);
    throw error;
  }
};

export const getThoughts = async (): Promise<ThoughtCard[]> => {
  try {
    if (getSupabase()) {
      return await getFromSupabase();
    } else {
      return await getFromLocal();
    }
  } catch (error) {
    console.error('Failed to retrieve thoughts:', error);
    console.warn('Falling back to local storage due to error');
    return await getFromLocal();
  }
};

export const deleteThought = async (id: string): Promise<void> => {
  try {
    if (getSupabase()) {
      await deleteFromSupabase(id);
    } else {
      await deleteFromLocal(id);
    }
  } catch (error) {
    console.error('Failed to delete thought:', error);
    throw error;
  }
};