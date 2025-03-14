describe('BoxPlot Component', () => {
  beforeEach(() => {
    // Visit the page where the BoxPlot component is rendered
    cy.visit('http://localhost:5173/box-plot')
  });

  it('should render the BoxPlot chart with correct title and subtitle', () => {
    // Check if the title exists and has correct text
    // Using the aria-label to find the chart and then checking the SVG text elements
    cy.get('.ag-charts-canvas-proxy')
      .find('.ag-charts-proxy-elem svg text')
      .contains('HR Analytics')
      .should('exist');
    
    // Check if the subtitle exists and has correct text
    cy.get('.ag-charts-canvas-proxy')
      .find('.ag-charts-proxy-elem svg text')
      .contains('Salary Distribution by Department')
      .should('exist');
  });

  it('should render the box plot series area', () => {
    // Check that series area exists
    cy.get('.ag-charts-series-area')
      .should('exist');
    
    // Verify we have the chart container
    cy.get('.ag-charts-canvas-container')
      .should('exist');
    
    // Check that the chart is labeled correctly in the aria-label
    cy.get('.ag-charts-canvas-proxy')
      .should('have.attr', 'aria-label')
      .and('include', 'chart');
  });
});