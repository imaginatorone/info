import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SiteShell } from "./app/SiteShell";
import { AboutPage } from "./pages/AboutPage";
import { CodePage } from "./pages/CodePage";
import { HomePage } from "./pages/HomePage";
import { LinksPage } from "./pages/LinksPage";
import { SoundPage } from "./pages/SoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteShell />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="code" element={<CodePage />} />
          <Route path="sound" element={<SoundPage />} />
          <Route path="links" element={<LinksPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
