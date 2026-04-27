import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { ProfilePage } from './pages/ProfilePage';
import { TermsPage } from './pages/TermsPage';
import { HowItWorksPage } from './pages/HowItWorksPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="game/:gameId" element={<GamePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
