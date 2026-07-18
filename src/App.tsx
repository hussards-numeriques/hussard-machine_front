import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from './services/http';
import { AppLayout } from './layouts/AppLayout';
import { GameLayout } from './layouts/GameLayout';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { ProfilePage } from './pages/ProfilePage';
import { QuestsPage } from './pages/QuestsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TermsPage } from './pages/TermsPage';
import { TermsOfSalePage } from './pages/TermsOfSalePage';
import { ProgressionPage } from './pages/ProgressionPage';
import { LegalNoticePage } from './pages/LegalNoticePage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => !(error instanceof ApiError) && failureCount < 2,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="quests" element={<QuestsPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="terms-of-sale" element={<TermsOfSalePage />} />
            <Route path="progression" element={<ProgressionPage />} />
            <Route path="legal-notice" element={<LegalNoticePage />} />
            <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="auth/callback" element={<OAuthCallbackPage />} />
          </Route>
          <Route element={<GameLayout />}>
            <Route path="game/:gameId?" element={<GamePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
