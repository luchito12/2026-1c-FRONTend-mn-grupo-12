import { Header } from './Header.jsx'; import { Sidebar } from './Sidebar.jsx';
export function AppShell({ children }) { return <div className="app-shell"><Header /><div className="app-body"><Sidebar /><main className="content">{children}</main></div></div>; }
