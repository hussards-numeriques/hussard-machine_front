import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { GameLayout } from './layouts/GameLayout';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { ProfilePage } from './pages/ProfilePage';
import { TermsPage } from './pages/TermsPage';
import { TermsOfSalePage } from './pages/TermsOfSalePage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { LegalNoticePage } from './pages/LegalNoticePage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="terms-of-sale" element={<TermsOfSalePage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="legal-notice" element={<LegalNoticePage />} />
          <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="auth/callback" element={<OAuthCallbackPage />} />
        </Route>
        <Route element={<GameLayout />}>
          <Route path="game/:gameId" element={<GamePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
