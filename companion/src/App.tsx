import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { HomePage } from './pages/HomePage';
import { MatchPage } from './pages/MatchPage';
import { RosterPage } from './pages/RosterPage';
import { TrainingPage } from './pages/TrainingPage';
import { WikiPage } from './pages/WikiPage';
import { AppProvider } from './state/AppContext';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="match" element={<MatchPage />} />
            <Route path="wiki" element={<WikiPage />} />
            <Route path="training" element={<TrainingPage />} />
            <Route path="roster" element={<RosterPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
