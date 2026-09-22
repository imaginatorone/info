import { NavLink, Outlet } from "react-router-dom";
import { SceneSurface } from "../components/SceneSurface";

const links = [
  ["/", "home"],
  ["/about", "about"],
  ["/code", "code"],
  ["/sound", "sound"],
  ["/links", "links"],
] as const;

export function SiteShell() {
  return (
    <div className="site-shell">
      <SceneSurface />
      <nav className="site-nav" aria-label="Primary">
        {links.map(([to, label]) => (
          <NavLink key={to} to={to}>
            {label}
          </NavLink>
        ))}
      </nav>
      <main className="site-content">
        <Outlet />
      </main>
    </div>
  );
}
