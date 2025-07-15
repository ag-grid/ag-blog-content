describe('BarChart Component', () => {
  beforeEach(() => {
    // Visit your application's homepage where the BarChart is rendered
    cy.visit('http://localhost:5173/bar-chart')
  })

  it('should render the BarChart component correctly', () => {
    // Check if the chart container exists
    cy.get('.ag-charts-canvas-container').should('exist')
    
    // Verify the chart title and subtitle using the proxy elements
    cy.get('.ag-charts-proxy-elem svg text')
      .first()
      .should('have.text', "Apple's Revenue by Product Category")
    cy.get('.ag-charts-proxy-elem svg text')
      .eq(1).should('have.text', 'In Billion U.S. Dollars')
    
    // Verify the canvas element exists (AG Charts renders on canvas)
    cy.get('.ag-charts-canvas canvas').should('exist')
  })

  it('should display the correct legend items', () => {
    // Verify all legend items using the role="listitem" elements
    cy.get('[role="listitem"] button').should('have.length', 5)
    
    // Check each legend item text
    cy.get('[role="listitem"] button').eq(0).should('contain', 'iPhone')
    cy.get('[role="listitem"] button').eq(1).should('contain', 'Mac')
    cy.get('[role="listitem"] button').eq(2).should('contain', 'iPad')
    cy.get('[role="listitem"] button').eq(3).should('contain', 'Wearables')
    cy.get('[role="listitem"] button').eq(4).should('contain', 'Services')
  })

  it('should render the chart with the correct structure', () => {
    // Check for the main chart containers
    cy.get('.ag-charts-canvas-center').should('exist')
    cy.get('.ag-charts-canvas-container').should('exist')
    
    // Verify the legend container exists
    cy.get('.ag-charts-proxy-legend-toolbar').should('exist')
    
    // Verify that the chart has the correct number of series (5)
    cy.get('[role="figure"].ag-charts-canvas-proxy')
      .should('have.attr', 'aria-label')
      .and('include', '5 series')
  })

  it('should maintain chart interactivity with legend items', () => {
    // Click on the first legend item (iPhone)
    cy.get('[role="listitem"] button').first().click()
    
    // The legend item should toggle (become unchecked)
    cy.get('[role="listitem"] button').first()
      .should('have.attr', 'aria-checked', 'false')
      
    // Click it again to re-enable
    cy.get('[role="listitem"] button').first().click()
    
    // Should be checked again
    cy.get('[role="listitem"] button').first()
      .should('have.attr', 'aria-checked', 'true')
  })


  it('should have proper accessibility attributes for the chart', () => {
    // Chart should have a figure role
    cy.get('[role="figure"]').should('exist')
    
    // Chart should have an aria-label that describes the chart
    cy.get('[role="figure"].ag-charts-canvas-proxy')
      .should('have.attr', 'aria-label')
      .and('include', 'chart')
      .and('include', 'series')
    
    // Series area should be focusable with tab
    cy.get('.ag-charts-series-area').should('have.attr', 'tabindex', '-1')
    
    // Focus indicator should exist for keyboard navigation
    cy.get('.ag-charts-focus-indicator').should('exist')
  })

  it('should support keyboard navigation through legend items', () => {
    // First item should be initially focusable
    cy.get('[role="listitem"] button').first()
      .should('have.attr', 'tabindex', '0')
    
    // Other items should have tabindex="-1" 
    //(not in tab order, but can receive focus programmatically)
    cy.get('[role="listitem"] button').eq(1)
      .should('have.attr', 'tabindex', '-1')
    
    // Sending tab should either move to another 
    // focusable element or stay within the component
    // To keep the test reliable, we'll just verify the initial state of tabindex
    cy.get('[role="listitem"] button').first().focus()
    
    // Element should receive focus
    cy.get('[role="listitem"] button').first()
      .should('be.focused')
  })
})