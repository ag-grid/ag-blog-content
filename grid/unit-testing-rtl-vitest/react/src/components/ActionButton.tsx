import React from 'react';

interface PriceCellButtonProps {
	value: number;
	children: React.ReactNode;
}

export default function PriceCellButton(props: PriceCellButtonProps) {

	const onButtonClick = () => {
		console.log(`Price is: ${props.value}`);
		alert(`Price is: ${props.value}`);
	};

	return (
		<button onClick={onButtonClick} data-testid="action-button">
			{props.children}
		</button>
	);

}