import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom"; // For additional matchers
import App from "./App";

import { describe, test, expect, vi } from "vitest";
import * as api from "./api";

vi.mock("./api", () => ({
  fetchData: vi.fn().mockResolvedValue([
    { make: "Tesla", model: "Model Y", price: 64950, electric: true },
    { make: "Ford", model: "F-Series", price: 33850, electric: false },
    { make: "Toyota", model: "Corolla", price: 29600, electric: false },
    { make: "Mercedes", model: "EQA", price: 48890, electric: true },
    { make: "Fiat", model: "500", price: 15774, electric: false },
    { make: "Nissan", model: "Juke", price: 20675, electric: false },
  ]),
}));

describe("AG Grid component rendering", () => {
  test("renders the AG Grid container", () => {
    render(<App />);
    // Verify the grid container is rendered
    const gridContainer = screen.getByRole("grid");
    expect(gridContainer).toBeInTheDocument();
  });

	test("renders the correct number of rows", async () => {
		render(<App />);

    // Wait for one known cell to appear so that we know data has loaded
    await screen.findByText("Tesla");

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


describe("Load async data", () => {
  test("displays loading state before data arrives", () => {
    const { container } = render(<App />);
    const loadingElement = container.querySelector('.ag-overlay-loading-center');
    expect(loadingElement).toBeInTheDocument();
  });

  test("renders AG Grid with data after async fetch", async () => {
    render(<App />);

    // Wait for mocked row data to appear
    const firstRowMakeCell = await screen.findByText("Toyota");
    expect(firstRowMakeCell).toBeInTheDocument();

    // The loading text should now be gone
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
});