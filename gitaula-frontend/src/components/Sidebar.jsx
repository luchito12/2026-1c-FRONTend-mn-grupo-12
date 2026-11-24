import { NavLink } from 'react-router-dom';
export function Sidebar() { return <nav className="sidebar" aria-label="Principal"><NavLink to="/" end>Inicio</NavLink><NavLink to="/comisiones">Mis comisiones</NavLink><NavLink to="/comisiones/nueva">Crear comisión</NavLink></nav>; }
