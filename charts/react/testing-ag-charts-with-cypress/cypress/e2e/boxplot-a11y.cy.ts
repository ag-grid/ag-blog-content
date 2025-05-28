describe("Accessibility audit for BoxPlot Component", () => {
	beforeEach(() => {
		cy.visit('http://localhost:5173/box-plot');	
		cy.injectAxe();  // Injects axe-core into the page
	});

	it("Should have no critical accessibility violations", () => {
		cy.checkA11y(undefined, {
			includedImpacts: ['critical', 'warning']
		});
	});

	// Optional: Check specific WCAG rules
	it("Should not have color contrast issues", () => {
		cy.checkA11y(undefined, {
			runOnly: {
				type: 'rule',
				values: ['color-contrast'],
			},
		});
	});		
});
  