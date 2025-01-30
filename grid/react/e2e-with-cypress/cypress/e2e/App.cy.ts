describe('AG Grid Rendering', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173/');
  });

  it('should render the AG Grid component', () => {
    cy.get('.ag-root-wrapper').should('be.visible');

    // Verify column headers
    cy.get('.ag-header-cell-text').eq(0).should('have.text', 'Make');
    cy.get('.ag-header-cell-text').eq(1).should('have.text', 'Model');

    // Wait for grid to load and verify first row data
    cy.get('.ag-cell').should('have.length.greaterThan', 0);
    cy.get('.ag-cell').eq(0).should('have.text', 'Tesla');
  });

  it("should display the loading overlay and then show the data", () => {
    // 1. Check that the AG Grid loading overlay is visible
    cy.get(".ag-overlay-loading-center").should("be.visible");
  
    // 2. Wait for the first cell to contain "Tesla" (data is loaded)
    cy.get(".ag-cell").first().should("have.text", "Tesla");
  
    // 3. Ensure the loading overlay disappears after data loads
    cy.get(".ag-overlay-loading-center").should("not.exist");
  });
});


describe('AG Grid sorting', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173/');
  });

  it('sorts "Price" column ascending and then descending', () => {
    // 1. Locate the "Price" column header and click
    cy.contains(".ag-header-cell-text", "Price").click();

    // 2. Verify the first row in the grid is now 'Fiat'
    cy.get('.ag-row[row-index="0"] [col-id="make"]')
      .should("have.text", "Fiat");

    // 3. Click again to sort in descending order
    cy.contains(".ag-header-cell-text", "Price").click();

    // 4. Verify the first row in the grid is now 'Tesla'
    cy.get('.ag-row[row-index="0"] [col-id="make"]')
      .should("have.text", "Tesla");
  });

});


describe("AG Grid Editable Cell", () => {
  beforeEach(() => {
    cy.visit("http://localhost:5173/");
  });

  it('should allow editing of cells and update the data', () => {
    // 1. Locate the editable cell for "Price" in the first row
    const priceCellSelector = '.ag-row[row-index="0"] [col-id="price"]';

    // 2. Double-click the cell to activate edit mode
    cy.get(priceCellSelector).dblclick();

    // 3. Wait for the input field to appear
    cy.get(`${priceCellSelector} input`)
      .should("be.visible")
      .as("priceInputField");

    // 4. Enter a new value into the input field and simulate pressing Enter
    const newPrice = "70000";
    cy.get("@priceInputField")
      .clear()
      .type(`${newPrice}{enter}`);

    // 5. Verify the cell displays the updated value
    cy.get(priceCellSelector).should("have.text", newPrice);
  });
});


describe('AG Grid Make Column Filter', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173/');
  });

  it('should filter data by "Make" using the column filter menu', () => {
    // 1. Wait for the AG Grid root element to be visible
    cy.get('.ag-root').should('be.visible');

    // 2. Locate and click the filter menu icon for the "Make" column
    cy.get('.ag-header-cell[col-id="make"] .ag-header-icon')
      .should('be.visible')
      .click();

    // 3. Fill in the filter input with "Tesla"
    cy.get('.ag-filter-body input[placeholder="Filter..."]').type('Tesla');

    // 4. Verify only one row is visible
    cy.get('.ag-center-cols-viewport .ag-row').should('have.length', 1);

    // 5. Check that the "Make" cell in the first (and only) row contains "Tesla"
    cy.get('.ag-center-cols-viewport .ag-row')
      .first()
      .find('.ag-cell[col-id="make"]')
      .should('have.text', 'Tesla');
  });
});

