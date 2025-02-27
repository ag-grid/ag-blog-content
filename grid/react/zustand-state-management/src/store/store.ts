import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface GridState {
  gridState: any;
  setGridState: (state: any) => void;
  resetGridState: () => void;
}

// Create a Zustand store with persistence middleware
const useStore = create<GridState>()(
  persist(
    (set) => ({
      // Initial state for the grid
      gridState: null,
      
      // Action to update the grid state
      setGridState: (state: any) => set({ gridState: state }),
      
      // Action to reset the grid state
      resetGridState: () => set({ gridState: null }),
    }),
    {
      name: 'ag-grid-storage', // unique name for the localStorage key
      storage: createJSONStorage(() => localStorage),
      // Optionally, you can specify which parts of the state to persist
      // partialize: (state) => ({ gridState: state.gridState }),
    }
  )
);

export default useStore;