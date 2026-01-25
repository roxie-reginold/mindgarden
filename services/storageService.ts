import { get, set } from 'idb-keyval';
import { ThoughtCard } from '../types';

const STORAGE_KEY = 'mindgarden_thoughts_v1';

export const saveThought = async (thought: ThoughtCard): Promise<void> => {
  try {
    const existing = (await getThoughts()) || [];
    const index = existing.findIndex((t) => t.id === thought.id);
    
    let updated: ThoughtCard[];
    if (index !== -1) {
      // Update existing
      updated = [...existing];
      updated[index] = thought;
    } else {
      // Create new
      updated = [thought, ...existing];
    }
    
    await set(STORAGE_KEY, updated);
  } catch (error) {
    console.error('Failed to save thought to garden:', error);
    throw error;
  }
};

export const getThoughts = async (): Promise<ThoughtCard[]> => {
  try {
    const raw = await get<ThoughtCard[]>(STORAGE_KEY);
    return raw || [];
  } catch (error) {
    console.error('Failed to retrieve thoughts:', error);
    return [];
  }
};

export const deleteThought = async (id: string): Promise<void> => {
  try {
    const existing = await getThoughts();
    const updated = existing.filter((t) => t.id !== id);
    await set(STORAGE_KEY, updated);
  } catch (error) {
    console.error('Failed to delete thought:', error);
    throw error;
  }
};