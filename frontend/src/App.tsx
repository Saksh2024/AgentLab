import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { PromptStudioPage } from './features/prompt-studio/pages/PromptStudioPage';
import { SimulatorPage } from './features/simulator/pages/SimulatorPage';
import { AnalyzerPage } from './features/analyzer/pages/AnalyzerPage';
import { PromptEvolutionPage } from './features/evolution/pages/PromptEvolutionPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/studio" element={<PromptStudioPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/analyzer" element={<AnalyzerPage />} />
          <Route path="/evolution" element={<PromptEvolutionPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
