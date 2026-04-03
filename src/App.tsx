import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import { WorkflowPlaceholders } from '@/components/WorkflowPlaceholders';
import AdminPage from '@/pages/AdminPage';
import ProduktverwaltungPage from '@/pages/ProduktverwaltungPage';
import ErsatzteilpreisePage from '@/pages/ErsatzteilpreisePage';
import ReparaturWartungPage from '@/pages/ReparaturWartungPage';
import WiederverkaufswertPage from '@/pages/WiederverkaufswertPage';
import TcoBewertungPage from '@/pages/TcoBewertungPage';

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ActionsProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<><div className="mb-8"><WorkflowPlaceholders /></div><DashboardOverview /></>} />
              <Route path="produktverwaltung" element={<ProduktverwaltungPage />} />
              <Route path="ersatzteilpreise" element={<ErsatzteilpreisePage />} />
              <Route path="reparatur-&-wartung" element={<ReparaturWartungPage />} />
              <Route path="wiederverkaufswert" element={<WiederverkaufswertPage />} />
              <Route path="tco-bewertung" element={<TcoBewertungPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Routes>
        </ActionsProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
