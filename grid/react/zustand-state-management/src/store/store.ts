import { create } from 'zustand';

interface GridState {
    gridState: any;
    setGridState: (state: any) => void;
}

const useStore = create<GridState>((set) => ({
    // Initial state for the grid
    gridState: null,
    
    // Action to update the grid state
    setGridState: (state: any) => set({ gridState: state }),
    
    // Action to reset the grid state
    resetGridState: () => set({ gridState: null }),
  }));

export default useStore;