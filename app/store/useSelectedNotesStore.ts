// app/store/useSelectedNotesStore.ts
import { create } from 'zustand';

interface SelectedNotesStore {
  selectedNoteIds: Set<string>;
  toggleNoteSelection: (noteId: string) => void;
  clearSelection: () => void;
  selectAll: (noteIds: string[]) => void;
  getSelectedCount: () => number;
}

export const useSelectedNotesStore = create<SelectedNotesStore>((set, get) => ({
  selectedNoteIds: new Set<string>(),
  
  toggleNoteSelection: (noteId: string) => {
    set((state) => {
      const newSelectedNoteIds = new Set(state.selectedNoteIds);
      if (newSelectedNoteIds.has(noteId)) {
        newSelectedNoteIds.delete(noteId);
      } else {
        newSelectedNoteIds.add(noteId);
      }
      return { selectedNoteIds: newSelectedNoteIds };
    });
  },
  
  clearSelection: () => {
    set({ selectedNoteIds: new Set<string>() });
  },
  
  selectAll: (noteIds: string[]) => {
    set({ selectedNoteIds: new Set(noteIds) });
  },
  
  getSelectedCount: () => {
    return get().selectedNoteIds.size;
  },
}));
