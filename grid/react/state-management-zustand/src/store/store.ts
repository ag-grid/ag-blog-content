import { create } from 'zustand';

export type ICar = {
    make: string;
    model: string;
    price: number;
    electric: boolean;
};
  
interface CarStore {
    rowData: ICar[];
    loading: boolean;
    fetchRowData: () => void;
    addRow: (newCar: ICar) => void;
    removeRow: (car: ICar) => void;
    updateRow: (car: ICar) => void;
    saveState: (columnState: any) => void;
    savedColumnState?: any;
}
  
const useStore = create<CarStore>((set) => ({
    // Start with an empty array (or you could prepopulate if needed)
    rowData: [],
    loading: false,
    // Function to simulate an API call that fetches the row data
    fetchRowData: () => {
        // Set loading to true before starting the "API call"
        set({ loading: true });
        // Simulate an API delay of 2 seconds
        setTimeout(() => {
            const data: ICar[] = [
                { make: "Tesla", model: "Model Y", price: 64950, electric: true },
                { make: "Ford", model: "F-Series", price: 33850, electric: false },
                { make: "Toyota", model: "Corolla", price: 29600, electric: false },
                { make: "Mercedes", model: "EQA", price: 48890, electric: true },
                { make: "Fiat", model: "500", price: 15774, electric: false },
                { make: "Nissan", model: "Juke", price: 20675, electric: false },
            ];
            // Update the state with the fetched data
            set({ rowData: data, loading: false });
        }, 2000);
    },

    addRow: (newCar: ICar) => {
        set((state) => ({
          rowData: [...state.rowData, newCar],
        }));
    },

    removeRow: (car: ICar) => {
        set((state) => ({
          rowData: state.rowData.filter((c) => c !== car),
        }));
    },

    updateRow: (car: ICar) => {
        set((state) => ({
          rowData: state.rowData.map((c) => (c === car ? car : c)),
        }));
    },

    saveState: (columnState) => {
        // For example, store it in localStorage or just keep it in memory
        console.log("Saving column state to store:", columnState);
        set({ savedColumnState: columnState }); // if you want to store it in state
        // localStorage.setItem('columnState', JSON.stringify(columnState)); // or localStorage
    },
}));
  
export default useStore;
