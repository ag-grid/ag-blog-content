export type IDataType = { make: string; model: string; price: number; electric: boolean; }

export async function fetchData(): Promise<IDataType[]> {
  // Mock a 1-second delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Return the data
  return [
    { make: "Tesla", model: "Model Y", price: 64950, electric: true },
    { make: "Ford", model: "F-Series", price: 33850, electric: false },
    { make: "Toyota", model: "Corolla", price: 29600, electric: false },
    { make: "Mercedes", model: "EQA", price: 48890, electric: true },
    { make: "Fiat", model: "500", price: 15774, electric: false },
    { make: "Nissan", model: "Juke", price: 20675, electric: false },
  ];
}