import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
const location = useLocation();

	const isActive = (path: string) => {
		return location.pathname === path;
	};

	return (
		<nav className="navigation">
			<div className="nav-container">
				<div className="nav-logo">
					<span className="logo-text">My Grid App</span>
				</div>
				<div className="nav-links">
					<div className="menu-items">
						<Link 
							to="/" 
							className={`
								nav-link 
								${isActive('/') ? 'active' : ''}`
							}
						>
							Main Grid
						</Link>
						<Link 
							to="/secondary" 
							className={`
								nav-link 
								${isActive('/secondary') ? 'active' : ''}`
							}
						>
							Secondary Page
						</Link>
					</div>
				</div>
			</div>
		</nav>
	);
};

export default Navigation;
