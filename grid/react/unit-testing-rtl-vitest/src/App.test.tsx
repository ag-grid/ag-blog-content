import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom"; // For additional matchers
import App from "./App";

describe("AG Grid component rendering", () => {
  test("renders the AG Grid container", () => {
    render(<App />);
    // Verify the grid container is rendered
    const gridContainer = screen.getByRole("grid");
    expect(gridContainer).toBeInTheDocument();
  });

	test("renders the correct number of rows", async () => {
		render(<App />);

		// Wait for rows to render
		const rows = await screen.findAllByRole("row");
		// Header row + 6 data rows = 7 rows in total
		expect(rows).toHaveLength(7);
	});

	test("renders the correct column headers", async () => {
		const { container } = render(<App />);
 
		// Find all header text elements using querySelector
		const headerTexts =
			Array.from(container.getElementsByClassName('ag-header-cell-text')) as HTMLElement[];
		const expectedHeaders = ["Make", "Model", "Price", "Electric"];
 
		headerTexts.forEach((header, index) => {
			expect(header.innerHTML).toBe(expectedHeaders[index]);
		});
	});

	test("renders the correct row data", async () => {
		render(<App />);
	 
		// Check if the specific row data is rendered
		const makeCell = await screen.findByText("Tesla");
		const modelCell = await screen.findByText("Model Y");
 
		// Verify row data is displayed
		expect(makeCell).toBeInTheDocument();
		expect(modelCell).toBeInTheDocument();
 });
});