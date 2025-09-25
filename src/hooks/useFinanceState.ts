// React hook for Finance State Management

import { useState, useEffect, useCallback, useRef } from 'react';
import { StateManager, AppState } from '../lib/state-manager';

let globalStateManager: StateManager | null = null;

// Singleton pattern for state manager
const getStateManager = (): StateManager => {
  if (!globalStateManager) {
    globalStateManager = new StateManager();
  }
  return globalStateManager;
};

export const useFinanceState = () => {
  const [state, setState] = useState<AppState>(() => {
    const stateManager = getStateManager();
    return stateManager.getState();
  });
  
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const stateManager = getStateManager();

    // Subscribe to state changes with error handling
    unsubscribeRef.current = stateManager.subscribe((newState) => {
      try {
        setState(newState);
      } catch (error) {
        console.error('[useFinanceState] State update failed:', error);
        // Continue with previous state to prevent crashes
      }
    });

    // Cleanup subscription on unmount
    return () => {
      try {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      } catch (error) {
        console.error('[useFinanceState] Cleanup failed:', error);
      }
    };
  }, []);

  // Get singleton instance of state manager - this won't change
  const stateManager = useRef(getStateManager());

  // Memoized actions to prevent unnecessary re-renders
  const actions = {
    updateMenu: useCallback((menuId: string, updates: any) => {
      stateManager.current.updateMenu(menuId, updates);
    }, []),
    addMenu: useCallback((menu: any) => {
      // @ts-ignore
      stateManager.current.addMenu(menu);
    }, []),
    deleteMenu: useCallback((menuId: string) => {
      stateManager.current.deleteMenu(menuId);
    }, []),

    updateSalesModel: useCallback((updates: any) => {
      stateManager.current.updateSalesModel(updates);
    }, []),

    updateUtilities: useCallback((utilities: any[]) => {
      stateManager.current.updateUtilities(utilities);
    }, []),

    updateLabor: useCallback((labor: any[]) => {
      stateManager.current.updateLabor(labor);
    }, []),

    updateFixedCosts: useCallback((fixedCosts: any[]) => {
      stateManager.current.updateFixedCosts(fixedCosts);
    }, []),

    importData: useCallback((jsonString: string) => {
      return stateManager.current.importData(jsonString);
    }, []),

    exportData: useCallback(() => {
      return stateManager.current.exportData();
    }, []),

    exportFreshData: useCallback(async () => {
      return await stateManager.current.exportFreshData();
    }, []),

    setCurrentScenario: useCallback((scenarioId: string) => {
      stateManager.current.setCurrentScenario(scenarioId);
    }, []),

    clearError: useCallback(() => {
      stateManager.current.clearError();
    }, []),

    reset: useCallback(() => {
      stateManager.current.reset();
    }, []),

    forceSave: useCallback(() => {
      stateManager.current.forceSave();
    }, [])
  };

  return {
    ...state,
    ...actions
  };
};

// Hook for specific data access
export const useFinanceData = () => {
  const { data, isLoading, error } = useFinanceState();
  
  return {
    data,
    isLoading,
    error,
    menus: data?.menus || [],
    salesModel: data?.salesModel || {},
    utilities: data?.utilities || [],
    labor: data?.labor || [],
    fixedCosts: data?.fixedCosts || []
  };
};

// Hook for computation results
export const useComputationResults = () => {
  const { computationResult, isLoading, error } = useFinanceState();
  
  return {
    pnl: computationResult?.pnl || null,
    kpis: computationResult?.kpis || null,
    menus: computationResult?.menus || [],
    sensitivity: computationResult?.sensitivity || null,
    isLoading,
    error,
    computedAt: computationResult?.computedAt || null,
    dataVersion: computationResult?.dataVersion || null
  };
};

// Hook for validation results
export const useValidationResults = () => {
  const { validationResults, isLoading, error } = useFinanceState();
  
  const hasErrors = validationResults.some(result => !result.isValid);
  const hasWarnings = validationResults.some(result => result.warnings.length > 0);
  
  const allErrors = validationResults.flatMap(result => result.errors);
  const allWarnings = validationResults.flatMap(result => result.warnings);
  
  return {
    validationResults,
    hasErrors,
    hasWarnings,
    allErrors,
    allWarnings,
    isLoading,
    error
  };
};

// Hook for scenarios
export const useScenarios = () => {
  const { scenarios, currentScenario, setCurrentScenario } = useFinanceState();
  
  return {
    scenarios,
    currentScenario,
    setCurrentScenario,
    scenarioOptions: Object.values(scenarios).map(scenario => ({
      value: scenario.id,
      label: scenario.name
    }))
  };
};
