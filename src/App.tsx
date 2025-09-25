import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Calculator, BarChart3, Settings, FileText, TrendingUp, Menu as MenuIcon, Zap, Users, Home } from 'lucide-react';
import Dashboard from './components/Dashboard';
import SalesModel from './components/SalesModel';
import MenuBOM from './components/MenuBOM';
import UtilitiesModel from './components/UtilitiesModel';
import LaborModel from './components/LaborModel';
import FixedCosts from './components/FixedCosts';
import Scenarios from './components/Scenarios';
import Reports from './components/Reports';
import FinanceSettings from './components/FinanceSettings';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner, LoadingOverlay } from './components/LoadingSpinner';
import { ValidationDisplay } from './components/ValidationDisplay';
import DataPersistenceIndicator from './components/DataPersistenceIndicator';
import { useFinanceState, useValidationResults } from './hooks/useFinanceState';
import { useRealTimeUpdates } from './hooks/useRealTimeUpdates';

interface ScenarioSelectorProps {
  scenarios: string[];
  currentScenario: string;
  onScenarioChange: (scenario: string) => void;
  onCompare: () => void;
}

function ScenarioSelector({ scenarios, currentScenario, onScenarioChange, onCompare }: ScenarioSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium">สถานการณ์:</span>
        <select 
          value={currentScenario}
          onChange={(e) => onScenarioChange(e.target.value)}
          className="bg-background border border-border rounded px-2 py-1 text-sm"
        >
          {scenarios.map(scenario => (
            <option key={scenario} value={scenario}>
              {scenario === 'base' ? 'ฐาน (Base)' : scenario}
            </option>
          ))}
        </select>
      </div>
      <Button size="sm" variant="outline" onClick={onCompare}>
        <BarChart3 className="w-4 h-4 mr-1" />
        เปรียบเทียบ
      </Button>
    </div>
  );
}

export default function App() {
  // Initialize activeTab from localStorage or default to 'dashboard'
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('lastActiveTab') || 'dashboard';
    } catch (error) {
      console.warn('Failed to load last active tab:', error);
      return 'dashboard';
    }
  });
  
  // Use new state management
  const {
    data,
    computationResult,
    validationResults,
    isLoading,
    error,
    scenarios,
    currentScenario,
    setCurrentScenario,
    clearError,
    forceSave
  } = useFinanceState();

  // Enable real-time updates and auto-save
  useRealTimeUpdates({
    data,
    forceSave
  });

  const { hasErrors, hasWarnings } = useValidationResults();

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('lastActiveTab', activeTab);
    } catch (error) {
      console.warn('Failed to save active tab:', error);
    }
  }, [activeTab]);

  // Save current tab on beforeunload (tab close/refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        localStorage.setItem('lastActiveTab', activeTab);
      } catch (error) {
        console.warn('Failed to save active tab on beforeunload:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeTab]);

  // Show loading screen during initialization
  if (isLoading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" text="กำลังเริ่มต้นระบบเสน่ห์ข้าวมันไก่..." />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b brand-header">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calculator className="w-8 h-8 brand-icon" />
                <div>
                  <h1 className="brand-title">เสน่ห์ข้าวมันไก่</h1>
                  <p className="brand-subtitle">SANAE CHICKEN RICE</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <ScenarioSelector
                  scenarios={Object.keys(scenarios)}
                  currentScenario={currentScenario}
                  onScenarioChange={setCurrentScenario}
                  onCompare={() => setActiveTab('scenarios')}
                />
                <DataPersistenceIndicator />
              </div>
            </div>
          </div>
        </header>

        {/* Error Display */}
        {error && (
          <div className="container mx-auto px-4 py-2">
            <ValidationDisplay
              validationResults={[{
                isValid: false,
                errors: [error],
                warnings: []
              }]}
              onDismiss={clearError}
              compact
            />
          </div>
        )}

        {/* Validation Display */}
        {(hasErrors || hasWarnings) && (
          <div className="container mx-auto px-4 py-2">
            <ValidationDisplay
              validationResults={validationResults}
              onDismiss={clearError}
            />
          </div>
        )}

        {/* Main Content */}
        <LoadingOverlay isLoading={isLoading} text="กำลังคำนวณ...">
          <div className="container mx-auto px-4 py-6 page-transition">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-9 gap-1">
                <TabsTrigger value="dashboard" className="flex flex-col gap-1 p-3 tab-smooth hover-lift">
                  <Home className="w-4 h-4" />
                  <span className="text-xs">แดชบอร์ด</span>
                </TabsTrigger>
                <TabsTrigger value="sales" className="flex flex-col gap-1 p-3 tab-smooth hover-lift">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">ยอดขาย</span>
                </TabsTrigger>
                <TabsTrigger value="menu" className="flex flex-col gap-1 p-3 tab-smooth hover-lift">
                  <MenuIcon className="w-4 h-4" />
                  <span className="text-xs">เมนู & สูตร</span>
                </TabsTrigger>
                <TabsTrigger value="utilities" className="flex flex-col gap-1 p-3 tab-smooth hover-lift">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs">สาธารณูปโภค</span>
                </TabsTrigger>
                <TabsTrigger value="labor" className="flex flex-col gap-1 p-3 tab-smooth hover-lift">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">แรงงาน</span>
                </TabsTrigger>
                <TabsTrigger value="fixed" className="flex flex-col gap-1 p-3 tab-smooth hover-lift">
                  <Calculator className="w-4 h-4" />
                  <span className="text-xs">ค่าใช้จ่ายคงที่</span>
                </TabsTrigger>
                <TabsTrigger value="scenarios" className="flex flex-col gap-1 p-3 tab-smooth hover-lift">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-xs">สถานการณ์</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex flex-col gap-1 p-3 tab-smooth hover-lift">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">รายงาน</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex flex-col gap-1 p-3 tab-smooth hover-lift">
                  <Settings className="w-4 h-4" />
                  <span className="text-xs">ตั้งค่า</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
                <Dashboard 
                  currentScenario={currentScenario}
                  financialData={computationResult}
                />
              </TabsContent>

              <TabsContent value="sales" className="space-y-6">
                <SalesModel />
              </TabsContent>

              <TabsContent value="menu" className="space-y-6">
                <MenuBOM />
              </TabsContent>

              <TabsContent value="utilities" className="space-y-6">
                <UtilitiesModel />
              </TabsContent>

              <TabsContent value="labor" className="space-y-6">
                <LaborModel />
              </TabsContent>

              <TabsContent value="fixed" className="space-y-6">
                <FixedCosts />
              </TabsContent>

              <TabsContent value="scenarios" className="space-y-6">
                <Scenarios 
                  currentScenario={currentScenario}
                  onScenarioChange={setCurrentScenario}
                />
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <Reports 
                  financialData={computationResult}
                />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <FinanceSettings />
              </TabsContent>
            </Tabs>
          </div>
        </LoadingOverlay>
      </div>
    </ErrorBoundary>
  );
}