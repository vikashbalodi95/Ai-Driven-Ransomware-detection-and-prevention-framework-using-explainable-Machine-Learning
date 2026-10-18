import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { OverviewPage } from './pages/OverviewPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { ExplainabilityPage } from './pages/ExplainabilityPage';
import { AlertHistoryPage } from './pages/AlertHistoryPage';
import { ModelInfoPage } from './pages/ModelInfoPage';
import { SimulationPage } from './pages/SimulationPage';
import { DetectionDetailModal } from './components/DetectionDetailModal';
import { DashboardSummary, DetectionEvent } from './types';
import { api } from './services/api';
import { ShieldAlert, Terminal } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<DetectionEvent | null>(null);

  const fetchSummary = async () => {
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // 5-second auto-refresh polling
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchSummary();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleSelectEventById = async (eventId: string) => {
    try {
      const event = await api.getDetectionById(eventId);
      setSelectedEvent(event);
    } catch (err) {
      console.error('Error fetching event by ID:', err);
    }
  };

  const handleAcknowledgeAlert = async (eventId: string) => {
    try {
      const alerts = await api.getAlerts();
      const match = alerts.find(a => a.event_id === eventId);
      if (match) {
        await api.updateAlert(match.id, { status: 'ACKNOWLEDGED' });
      }
      fetchSummary();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-['Inter',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        alertCount={summary?.active_alerts_count || 0}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewPage
            summary={summary}
            onSelectEvent={setSelectedEvent}
            onNavigateToAlerts={() => setActiveTab('alerts')}
            onNavigateToSimulation={() => setActiveTab('simulation')}
          />
        )}

        {activeTab === 'live' && (
          <LiveMonitoringPage
            onSelectEvent={setSelectedEvent}
          />
        )}

        {activeTab === 'xai' && (
          <ExplainabilityPage />
        )}

        {activeTab === 'alerts' && (
          <AlertHistoryPage
            onSelectEventId={handleSelectEventById}
          />
        )}

        {activeTab === 'model' && (
          <ModelInfoPage />
        )}

        {activeTab === 'simulation' && (
          <SimulationPage
            onSelectEventId={handleSelectEventById}
          />
        )}
      </main>

      {/* Detection & SHAP Waterfall Inspector Modal */}
      <DetectionDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onAcknowledgeAlert={handleAcknowledgeAlert}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            <span className="font-semibold text-slate-300">
              AI Ransomware Detection with Explainable AI (XAI)
            </span>
            <span>• Final-Year B.Tech CSE Capstone Project</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Model: XGBoost / RansomGuard-XAI</span>
            <span>XAI: TreeSHAP</span>
            <span className="text-emerald-400">STATUS: OPERATIONAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
