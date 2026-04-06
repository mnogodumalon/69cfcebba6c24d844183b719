import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import ErsatzteilpreisePage from '@/pages/ErsatzteilpreisePage';
import TcoBewertungPage from '@/pages/TcoBewertungPage';
import ProduktverwaltungPage from '@/pages/ProduktverwaltungPage';
import ReparaturWartungPage from '@/pages/ReparaturWartungPage';
import WiederverkaufswertPage from '@/pages/WiederverkaufswertPage';

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ActionsProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="ersatzteilpreise" element={<ErsatzteilpreisePage />} />
              <Route path="tco-bewertung" element={<TcoBewertungPage />} />
              <Route path="produktverwaltung" element={<ProduktverwaltungPage />} />
              <Route path="reparatur-wartung" element={<ReparaturWartungPage />} />
              <Route path="wiederverkaufswert" element={<WiederverkaufswertPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Routes>
        </ActionsProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
