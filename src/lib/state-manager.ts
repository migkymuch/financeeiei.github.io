// Centralized state management for Finance Simulator

import { FinanceEngine } from './finance-engine';
import { FinancialDataValidator, ValidationResult } from './validation';

export interface AppState {
  data: any;
  scenarios: Record<string, any>;
  currentScenario: string;
  computationResult: any;
  validationResults: ValidationResult[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string;
}

interface StateUpdateOptions {
  skipAuto?: boolean;
}

interface QueuedUpdate {
  update: StateUpdate;
  opts?: StateUpdateOptions;
}

export interface StateUpdate {
  type: 'DATA_UPDATE' | 'SCENARIO_UPDATE' | 'COMPUTATION_UPDATE' | 'VALIDATION_UPDATE' | 'ERROR_UPDATE' | 'LOADING_UPDATE';
  payload: any;
}

export class StateManager {
  private state: AppState;
  private financeEngine: FinanceEngine;
  private subscribers: Array<(state: AppState) => void> = [];
  private validationCache: Map<string, ValidationResult> = new Map();
  private updateQueue: QueuedUpdate[] = [];
  private isProcessingQueue: boolean = false;
  private queueTimeoutId: NodeJS.Timeout | null = null;
  // Dedup / debounce helpers to avoid tight compute/save loops
  private lastSavedDataString: string | null = null;
  private lastComputationHash: string | null = null;
  private syncTimeoutId: NodeJS.Timeout | null = null;
  private isSyncInProgress: boolean = false;
  private readonly SYNC_DEBOUNCE_MS = 500; // Increased debounce time to prevent rapid updates

  constructor() {
    this.financeEngine = new FinanceEngine();
    this.state = this.getInitialState();
    this.initializeState();
  }

  private getInitialState(): AppState {
    return {
      data: null,
      scenarios: {},
      currentScenario: 'base',
      computationResult: null,
      validationResults: [],
      isLoading: false,
      error: null,
      lastUpdated: new Date().toISOString()
    };
  }

  private initializeState(): void {
    try {
      // First load the data from storage
      this.financeEngine.init();
      
      // Get initial data and scenarios
      const data = this.financeEngine.getData();
      const scenarios = this.financeEngine.getScenarios();
      
      // Update state with initial data
      this.state.data = data;
      this.state.scenarios = scenarios;
      
      // Then trigger the full update cycle
      this.updateState({
        type: 'DATA_UPDATE',
        payload: { data, scenarios }
      });
      
      // Only compute and validate if we have data
      if (data) {
        this.computeAndValidate();
      }
    } catch (error) {
      this.updateState({
        type: 'ERROR_UPDATE',
        payload: { error: `Failed to initialize: ${this.formatError(error)}` }
      });
    }
  }

  // Helper to safely get message from unknown errors
  private formatError(err: unknown): string {
    if (!err) return String(err);
    return err instanceof Error ? err.message : String(err);
  }

  // State management methods
  updateState(update: StateUpdate, opts?: { skipAuto?: boolean }): void {
    // Add update to the queue
    this.updateQueue.push({ update, opts });
    
    // If we're already processing updates, let the current cycle handle this
    if (this.isProcessingQueue) {
      return;
    }

    // Clear any existing timeout
    if (this.queueTimeoutId) {
      clearTimeout(this.queueTimeoutId);
    }

    // Process queue after a small delay to batch updates
    this.queueTimeoutId = setTimeout(() => this.processUpdateQueue(), 0);
  }

  private processUpdateQueue(): void {
    if (this.isProcessingQueue || this.updateQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Process all updates in the queue
      while (this.updateQueue.length > 0) {
        const queuedUpdate = this.updateQueue.shift()!;
        const skipAuto = this.updateQueue.length > 0 || queuedUpdate.opts?.skipAuto; 

        this.applyStateUpdate(queuedUpdate.update, { skipAuto });
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private applyStateUpdate(update: StateUpdate, opts?: { skipAuto?: boolean }): void {
    const prevState = { ...this.state };

    try {
      // Validate update payload
      this.validateStateUpdate(update);

      switch (update.type) {
        case 'DATA_UPDATE':
          if (!this.validateDataPayload(update.payload)) {
            throw new Error('Invalid data update payload');
          }
          this.state.data = update.payload.data;
          this.state.scenarios = update.payload.scenarios;
          break;
          
        case 'SCENARIO_UPDATE':
          if (!this.state.scenarios[update.payload.scenarioId]) {
            throw new Error(`Invalid scenario ID: ${update.payload.scenarioId}`);
          }
          this.state.currentScenario = update.payload.scenarioId;
          break;
          
        case 'COMPUTATION_UPDATE':
          if (!this.validateComputationPayload(update.payload)) {
            throw new Error('Invalid computation result payload');
          }
          this.state.computationResult = update.payload.result;
          break;
          
        case 'VALIDATION_UPDATE':
          if (!Array.isArray(update.payload.results)) {
            throw new Error('Validation results must be an array');
          }
          this.state.validationResults = update.payload.results;
          break;
          
        case 'ERROR_UPDATE':
          this.state.error = update.payload.error;
          this.state.isLoading = false;
          break;
          
        case 'LOADING_UPDATE':
          // Avoid notifying subscribers when loading state hasn't changed
          if (this.state.isLoading === update.payload.isLoading) {
            // still ensure errors are cleared when entering loading
            if (update.payload.isLoading) {
              this.state.error = null;
            }
            break;
          }

          this.state.isLoading = update.payload.isLoading;
          if (update.payload.isLoading) {
            this.state.error = null;
          }
          break;

        default:
          // Exhaustiveness check - should never happen due to TypeScript
          throw new Error(`Unsupported update type: ${(update as any).type}`);
      }
      
      this.state.lastUpdated = new Date().toISOString();
      
      // Notify subscribers
      this.notifySubscribers();
      
      // Auto-save and recompute on data changes unless caller asked to skip
      if (update.type === 'DATA_UPDATE' && !opts?.skipAuto) {
        this.autoSave();
        // Trigger recomputation when data changes
        this.computeAndValidate();
      }

      // Log successful update for debugging
      console.debug(`State update successful: ${update.type}`);
    } catch (error) {
      // Revert state if update failed
      this.state = prevState;

      console.error('Error updating state:', error);
      const errorMessage = this.formatError(error);

      // Don't trigger another state update if this was already an error update
      if (update.type !== 'ERROR_UPDATE') {
        this.updateState({
          type: 'ERROR_UPDATE',
          payload: { 
            error: `State update failed (${update.type}): ${errorMessage}`,
            originalError: error
          }
        });
      }

      // Re-throw error for error boundary catch
      throw error;
    }
  }

  private validateStateUpdate(update: StateUpdate): void {
    if (!update || typeof update !== 'object') {
      throw new Error('State update must be an object');
    }

    if (!update.type) {
      throw new Error('State update must have a type');
    }

    if (!update.payload) {
      throw new Error('State update must have a payload');
    }
  }

  private validateDataPayload(payload: any): boolean {
    return payload && 
           typeof payload === 'object' && 
           'data' in payload && 
           'scenarios' in payload && 
           typeof payload.scenarios === 'object';
  }

  private validateComputationPayload(payload: any): boolean {
    return payload && 
           typeof payload === 'object' && 
           'result' in payload;
  }

  // When data changes, persist, compute, validate and publish results as an atomic sync
  private syncAfterDataChange(reason?: string): void {
    // If sync is in progress, skip this update to prevent tight loops
    if (this.isSyncInProgress) {
      console.debug('[StateManager] Skipping sync, already in progress');
      // Ensure any caller waiting on loading state gets cleared
      try {
        this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: false } });
      } catch (err) {
        // ignore
      }
      return;
    }

    // Debounce rapid calls to avoid tight loops
    if (this.syncTimeoutId) {
      clearTimeout(this.syncTimeoutId);
    }

    this.syncTimeoutId = setTimeout(() => {
      this.isSyncInProgress = true;
      console.debug(`[StateManager] Starting sync: ${reason || 'unknown reason'}`);

      try {
        // Read authoritative data from engine
        const data = typeof this.financeEngine.getData === 'function' ? this.financeEngine.getData() : this.state.data;

        // If no data, just clear loading and skip heavy work
        if (!data) {
          try {
            this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: false } });
          } catch (err) {
            // ignore
          }
          this.isSyncInProgress = false;
          return;
        }

        const dataString = JSON.stringify(data);
        // If data hasn't changed since last save, skip save/compute to avoid loops
        if (this.lastSavedDataString && this.lastSavedDataString === dataString) {
          try {
            this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: false } });
          } catch (err) {
            // ignore
          }
          this.isSyncInProgress = false;
          return;
        }

        // Persist current engine data
        try {
          if (typeof this.financeEngine.save === 'function') {
            this.financeEngine.save();
          }
          this.lastSavedDataString = dataString;
        } catch (saveErr) {
          console.error('syncAfterDataChange: save failed', saveErr);
        }

        // Ensure finance engine has latest data before computation
        try {
          if (typeof this.financeEngine.load === 'function') {
            this.financeEngine.load(data);
          }
        } catch (loadErr) {
          console.error('syncAfterDataChange: load failed', loadErr);
        }

        // Compute derived results
        let computationResult: any = null;
        try {
          if (typeof this.financeEngine.compute === 'function') {
            computationResult = this.financeEngine.compute();
          }
        } catch (computeErr) {
          console.error('syncAfterDataChange: compute failed', computeErr);
        }

        // Publish authoritative data without retriggering auto-save/compute
        try {
          this.updateState({ type: 'DATA_UPDATE', payload: { data, scenarios: this.state.scenarios } }, { skipAuto: true });
        } catch (err) {
          // ignore
        }

        // Publish computation result if available and changed
        if (computationResult) {
          try {
            const compHash = JSON.stringify(computationResult);
            if (this.lastComputationHash !== compHash) {
              this.lastComputationHash = compHash;
              this.updateState({ type: 'COMPUTATION_UPDATE', payload: { result: computationResult } }, { skipAuto: true });
            }

            // Small summary log to help verify behavior during development
            const kpis = computationResult?.kpis;
            const menusCount = Array.isArray(data?.menus) ? data.menus.length : 0;
            const firstMenu = data?.menus?.[0];
            const firstMenuBOMCost = firstMenu?.bom?.reduce((total: number, item: any) => {
              if (item.packaging) {
                return total + (item.packaging.qtyUnit * item.packaging.unitCost);
              }
              const effectiveYield = item.yieldPercent / 100;
              const wasteMultiplier = 1 + (item.wastePercent / 100);
              const actualQtyNeeded = (item.qtyG / 1000) * wasteMultiplier / effectiveYield;
              return total + (actualQtyNeeded * item.unitCostPerKg);
            }, 0);
            const firstMenuFoodCostPct = firstMenu && firstMenuBOMCost ? ((firstMenuBOMCost / firstMenu.price) * 100).toFixed(1) : 'n/a';
            console.log(`[StateManager] syncAfterDataChange${reason ? ' (' + reason + ')' : ''} => menus=${menusCount}, computedAt=${computationResult?.computedAt || 'n/a'}, revenue=${kpis?.revenue ?? 'n/a'}, dashboardFoodCost%=${kpis?.foodCostPct?.toFixed(1) ?? 'n/a'}, firstMenuFoodCost%=${firstMenuFoodCostPct}`);
          } catch (logErr) {
            // ignore logging errors
          }
        }

        // Run validation using current state (guarded inside validator)
        try {
          this.validateAllData();
        } catch (valErr) {
          console.error('syncAfterDataChange: validation failed', valErr);
        }

        // Clear loading state - sync completed
        try {
          this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: false } });
        } catch (err) {
          // ignore
        }
      } finally {
        this.isSyncInProgress = false;
      }
    }, this.SYNC_DEBOUNCE_MS);
  }

  // Subscription management
  subscribe(callback: (state: AppState) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  // Data management methods
  updateMenu(menuId: string, updates: any): void {
    try {
      this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: true } });

      // Validate updates
      const validationResult = FinancialDataValidator.validateMenuItem(updates);
      if (!validationResult.isValid) {
        this.updateState({
          type: 'ERROR_UPDATE',
          payload: { error: `Menu validation failed: ${validationResult.errors.join(', ')}` }
        });
        return;
      }

      // Force save and reload to ensure data consistency
      this.financeEngine.updateMenu(menuId, updates);
      this.financeEngine.save();

      // If updateMenu did not find the menu (i.e., trying to add a new menu), allow adding via addMenu
      const existing = this.financeEngine.getData()?.menus?.some((m: any) => m.id === menuId);
      if (!existing) {
        try {
          // If updates contain full menu shape, add it. Otherwise construct minimal menu object.
          const menuToAdd = {
            id: menuId,
            name: updates.name || `เมนูใหม่ ${menuId}`,
            price: typeof updates.price === 'number' ? updates.price : 0,
            channelMix: updates.channelMix || { dineIn: 0.7, takeaway: 0.2, delivery: 0.1 },
            bom: updates.bom || []
          };
          // FinanceEngine may have addMenu; call if present
          // @ts-ignore
          if (typeof this.financeEngine.addMenu === 'function') {
            // @ts-ignore
            this.financeEngine.addMenu(menuToAdd);
          }
        } catch (err) {
          // ignore add errors here - validation already done above
        }
      }

      // Get fresh data after update
      const data = this.financeEngine.getData();

      // Update state and then run the unified sync path
      this.updateState({ type: 'DATA_UPDATE', payload: { data, scenarios: this.state.scenarios } }, { skipAuto: true });
      this.syncAfterDataChange('updateMenu');
    } catch (error) {
      this.updateState({
        type: 'ERROR_UPDATE',
        payload: { error: `Failed to update menu: ${this.formatError(error)}` }
      });
    } finally {
      // Always clear loading to avoid stuck spinner
      try { this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: false } }); } catch (e) { /* ignore */ }
    }
  }

  // Explicit add menu API - validates, adds, saves, and updates state
  addMenu(menu: any): void {
    try {
      this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: true } });

      const validationResult = FinancialDataValidator.validateMenuItem(menu);
      if (!validationResult.isValid) {
        this.updateState({
          type: 'ERROR_UPDATE',
          payload: { error: `Menu validation failed: ${validationResult.errors.join(', ')}` }
        });
        return;
      }

      // Use engine API to add and persist
      // @ts-ignore
      if (typeof this.financeEngine.addMenu === 'function') {
        // @ts-ignore
        this.financeEngine.addMenu(menu);
      } else {
        // Fallback: mutate data directly
        const data = this.financeEngine.getData ? this.financeEngine.getData() : null;
        if (data && Array.isArray(data.menus)) {
          data.menus.push(menu);
          if (typeof this.financeEngine.load === 'function') {
            // try to replace engine data
            // @ts-ignore
            this.financeEngine.load(data);
          }
        }
      }

      const data = this.financeEngine.getData();
      this.updateState({ type: 'DATA_UPDATE', payload: { data, scenarios: this.state.scenarios } }, { skipAuto: true });
      this.syncAfterDataChange('addMenu');
    } catch (error) {
      this.updateState({
        type: 'ERROR_UPDATE',
        payload: { error: `Failed to add menu: ${this.formatError(error)}` }
      });
    } finally {
      try { this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: false } }); } catch (e) { }
    }
  }

  updateSalesModel(updates: any): void {
    try {
      this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: true } });

      // Validate updates
      const validationResult = FinancialDataValidator.validateSalesModel(updates);
      if (!validationResult.isValid) {
        this.updateState({
          type: 'ERROR_UPDATE',
          payload: { error: `Sales model validation failed: ${validationResult.errors.join(', ')}` }
        });
        return;
      }

      this.financeEngine.updateSalesModel(updates);
      const data = this.financeEngine.getData();
      this.updateState({ type: 'DATA_UPDATE', payload: { data, scenarios: this.state.scenarios } }, { skipAuto: true });
      this.syncAfterDataChange('updateSalesModel');
    } catch (error) {
      this.updateState({
        type: 'ERROR_UPDATE',
        payload: { error: `Failed to update sales model: ${this.formatError(error)}` }
      });
    } finally {
      try { this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: false } }); } catch (e) { }
    }
  }

  updateUtilities(utilities: any[]): void {
    try {
      this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: true } });

      // Validate each utility
      const validationResults = utilities.map(utility => 
        FinancialDataValidator.validateUtilityItem(utility)
      );

      const hasErrors = validationResults.some(result => !result.isValid);
      if (hasErrors) {
        const errors = validationResults
          .filter(result => !result.isValid)
          .flatMap(result => result.errors);

        this.updateState({
          type: 'ERROR_UPDATE',
          payload: { error: `Utility validation failed: ${errors.join(', ')}` }
        });
        return;
      }

      this.financeEngine.updateUtilities(utilities);
      const data = this.financeEngine.getData();
      this.updateState({ type: 'DATA_UPDATE', payload: { data, scenarios: this.state.scenarios } }, { skipAuto: true });
      this.syncAfterDataChange('updateUtilities');
    } catch (error) {
      this.updateState({
        type: 'ERROR_UPDATE',
        payload: { error: `Failed to update utilities: ${this.formatError(error)}` }
      });
    } finally {
      try { this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: false } }); } catch (e) { }
    }
  }

  updateLabor(labor: any[]): void {
    try {
      this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: true } });

      // Validate each labor item
      const validationResults = labor.map(item => 
        FinancialDataValidator.validateLaborItem(item)
      );

      const hasErrors = validationResults.some(result => !result.isValid);
      if (hasErrors) {
        const errors = validationResults
          .filter(result => !result.isValid)
          .flatMap(result => result.errors);

        this.updateState({
          type: 'ERROR_UPDATE',
          payload: { error: `Labor validation failed: ${errors.join(', ')}` }
        });
        return;
      }

      this.financeEngine.updateLabor(labor);
      const data = this.financeEngine.getData();
      this.updateState({ type: 'DATA_UPDATE', payload: { data, scenarios: this.state.scenarios } }, { skipAuto: true });
      this.syncAfterDataChange('updateLabor');
    } catch (error) {
      this.updateState({
        type: 'ERROR_UPDATE',
        payload: { error: `Failed to update labor: ${this.formatError(error)}` }
      });
    } finally {
      try { this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: false } }); } catch (e) { }
    }
  }

  updateFixedCosts(fixedCosts: any[]): void {
    try {
      this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: true } });

      // Validate each fixed cost
      const validationResults = fixedCosts.map(cost => 
        FinancialDataValidator.validateFixedCost(cost)
      );

      const hasErrors = validationResults.some(result => !result.isValid);
      if (hasErrors) {
        const errors = validationResults
          .filter(result => !result.isValid)
          .flatMap(result => result.errors);

        this.updateState({
          type: 'ERROR_UPDATE',
          payload: { error: `Fixed cost validation failed: ${errors.join(', ')}` }
        });
        return;
      }

      this.financeEngine.updateFixedCosts(fixedCosts);
      const data = this.financeEngine.getData();
      this.updateState({ type: 'DATA_UPDATE', payload: { data, scenarios: this.state.scenarios } }, { skipAuto: true });
      this.syncAfterDataChange('updateFixedCosts');
    } catch (error) {
      this.updateState({
        type: 'ERROR_UPDATE',
        payload: { error: `Failed to update fixed costs: ${this.formatError(error)}` }
      });
    } finally {
      try { this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: false } }); } catch (e) { }
    }
  }

  // Delete a menu by id, update state and persist
  deleteMenu(menuId: string): void {
    try {
      this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: true } });

      // Use engine API if available
      // @ts-ignore
      if (typeof this.financeEngine.deleteMenu === 'function') {
        // @ts-ignore
        this.financeEngine.deleteMenu(menuId);
      } else {
        // Fallback mutation
        const data = this.financeEngine.getData ? this.financeEngine.getData() : null;
        if (data && Array.isArray(data.menus)) {
          data.menus = data.menus.filter((m: any) => m.id !== menuId);
          if (typeof this.financeEngine.load === 'function') {
            // @ts-ignore
            this.financeEngine.load(data);
          } else if (typeof (this.financeEngine as any).setData === 'function') {
            // @ts-ignore
            (this.financeEngine as any).setData(data);
          }
        }
      }

      const data = this.financeEngine.getData();
      this.updateState({ type: 'DATA_UPDATE', payload: { data, scenarios: this.state.scenarios } }, { skipAuto: true });
      this.syncAfterDataChange('deleteMenu');
    } catch (error) {
      this.updateState({
        type: 'ERROR_UPDATE',
        payload: { error: `Failed to delete menu: ${this.formatError(error)}` }
      });
    } finally {
      try { this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: false } }); } catch (e) { }
    }
  }

  // Computation and validation
  private computeAndValidate(): void {
    try {
      // Only proceed if we have data to compute with
      if (!this.state.data) {
        this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: false } });
        return;
      }

      // Compute financial metrics
      const computationResult = this.financeEngine.compute();
      
      this.updateState({
        type: 'COMPUTATION_UPDATE',
        payload: { result: computationResult }
      });
      
      // Validate all data
      this.validateAllData();
      
      this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: false } });
    } catch (error) {
      this.updateState({
        type: 'ERROR_UPDATE',
        payload: { error: `Computation failed: ${this.formatError(error)}` }
      });
    }
  }

  private validateAllData(): void {
    try {
      const dataHash = JSON.stringify(this.state.data);
      const cachedResult = this.validationCache.get(dataHash);
      
      if (cachedResult) {
        this.updateState({
          type: 'VALIDATION_UPDATE',
          payload: { results: [cachedResult] }
        });
        return;
      }
      
      const validationResult = FinancialDataValidator.validateAllData(this.state.data);
      
      // Cache the result
      this.validationCache.set(dataHash, validationResult);
      
      this.updateState({
        type: 'VALIDATION_UPDATE',
        payload: { results: [validationResult] }
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  }

  // Import/Export methods
  importData(jsonString: string): { success: boolean; error?: string } {
    try {
      this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: true } });
      
      const result = this.financeEngine.importJSON(jsonString);
      
      if (result.success) {
        const data = this.financeEngine.getData();
        const scenarios = this.financeEngine.getScenarios();
        
        this.updateState({
          type: 'DATA_UPDATE',
          payload: { data, scenarios }
        });
        
        this.computeAndValidate();
        
        // Clear validation cache
        this.validationCache.clear();
      } else {
        this.updateState({
          type: 'ERROR_UPDATE',
          payload: { error: result.error || 'Import failed' }
        });
      }
      
      return result;
    } catch (error) {
      this.updateState({
        type: 'ERROR_UPDATE',
        payload: { error: `Import failed: ${this.formatError(error)}` }
      });
      return { success: false, error: this.formatError(error) };
    }
  }

  exportData(): string {
    try {
      return this.financeEngine.exportJSON();
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  // New method to export with fresh, real-time data
  async exportFreshData(): Promise<string> {
    try {
      console.log('[StateManager] Starting fresh data export...');

      // First, force save any pending changes
      this.forceSave();

      // Wait for any ongoing operations to complete
      await this.waitForIdle();

      // Force a fresh computation cycle
      await this.forceRecompute();

      // Validate data completeness and freshness
      const validation = this.validateDataForExport();
      if (!validation.isValid) {
        const issues = validation.issues.join(', ');
        console.warn('[StateManager] Data validation issues:', issues);
        // Proceed with export but include warning in result
      }

      // Get the fresh export data
      const freshData = this.financeEngine.exportJSON();
      const parsedData = JSON.parse(freshData);

      // Add fresh computation result to the export
      const enrichedData = {
        ...parsedData,
        computationResult: this.state.computationResult,
        exportTimestamp: new Date().toISOString(),
        dataVersion: this.state.lastUpdated,
        isFreshExport: true,
        validation: validation,
        exportQuality: validation.isValid ? 'excellent' : 'warning'
      };

      console.log('[StateManager] Fresh data export completed successfully');
      console.log('[StateManager] Export summary:', {
        hasComputationResult: !!this.state.computationResult,
        hasKpis: !!this.state.computationResult?.kpis,
        hasPnL: !!this.state.computationResult?.pnl,
        hasMenus: !!this.state.computationResult?.menus,
        menuCount: this.state.computationResult?.menus?.length || 0,
        validationScore: validation.isValid ? 'pass' : 'warning',
        dataAge: new Date().toISOString()
      });

      return JSON.stringify(enrichedData, null, 2);
    } catch (error) {
      console.error('Fresh export failed:', error);
      console.error('State at failure:', {
        hasData: !!this.state.data,
        hasComputationResult: !!this.state.computationResult,
        isLoading: this.state.isLoading,
        error: this.state.error,
        lastUpdated: this.state.lastUpdated
      });
      throw new Error(`Failed to export fresh data: ${this.formatError(error)}`);
    }
  }

  // Wait for system to be idle (no ongoing operations)
  private async waitForIdle(maxWait = 2000): Promise<void> {
    const startTime = Date.now();

    while (this.isSyncInProgress || this.isProcessingQueue) {
      if (Date.now() - startTime > maxWait) {
        console.warn('[StateManager] Timeout waiting for idle state');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // Force a complete recomputation cycle
  private async forceRecompute(): Promise<void> {
    try {
      // Reload data from storage to ensure freshness
      const freshData = this.financeEngine.getData();

      if (freshData) {
        // Update state with fresh data
        this.updateState({
          type: 'DATA_UPDATE',
          payload: { data: freshData, scenarios: this.state.scenarios }
        }, { skipAuto: true });

        // Force computation
        const computationResult = this.financeEngine.compute();

        if (computationResult) {
          this.updateState({
            type: 'COMPUTATION_UPDATE',
            payload: { result: computationResult }
          }, { skipAuto: true });
        }

        // Run validation
        this.validateAllData();
      }

      // Wait for state updates to complete
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error('Force recompute failed:', error);
      throw error;
    }
  }

  // Validate data freshness and completeness for export
  validateDataForExport(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const data = this.state.data;
    const computationResult = this.state.computationResult;

    // Check if we have basic data
    if (!data) {
      issues.push('ไม่พบข้อมูลพื้นฐานในระบบ');
      return { isValid: false, issues };
    }

    // Check if we have computation results
    if (!computationResult) {
      issues.push('ไม่พบผลการคำนวณ อาจต้องรอให้ระบบประมวลผลเสร็จ');
    } else {
      // Validate computation result completeness
      if (!computationResult.kpis) {
        issues.push('ไม่พบตัวชี้วัดสำคัญ (KPIs)');
      }
      if (!computationResult.pnl) {
        issues.push('ไม่พบงบกำไรขาดทุน (P&L)');
      }
      if (!computationResult.menus || computationResult.menus.length === 0) {
        issues.push('ไม่พบข้อมูลเมนูหรือการวิเคราะห์เมนู');
      }
    }

    // Check data staleness
    const lastUpdated = new Date(this.state.lastUpdated);
    const now = new Date();
    const ageInMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);

    if (ageInMinutes > 5) {
      issues.push(`ข้อมูลอาจไม่เป็นปัจจุบัน (อัปเดตล่าสุด ${Math.round(ageInMinutes)} นาทีที่แล้ว)`);
    }

    // Check for validation errors
    if (this.state.validationResults.some(result => !result.isValid)) {
      issues.push('พบข้อผิดพลาดในการตรวจสอบข้อมูล');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Auto-save functionality with deduplication
  private autoSave(): void {
    try {
      // Check if data has actually changed before saving
      const currentData = this.financeEngine.getData();
      const currentDataString = JSON.stringify(currentData);
      
      if (this.lastSavedDataString === currentDataString) {
        console.debug('[StateManager] Skipping auto-save, data unchanged');
        return;
      }
      
      this.financeEngine.save();
      this.lastSavedDataString = currentDataString;
      console.debug('[StateManager] Data auto-saved successfully');
    } catch (error) {
      console.error('Auto-save failed:', error);
      this.updateState({
        type: 'ERROR_UPDATE',
        payload: { error: `Auto-save failed: ${this.formatError(error)}` }
      });
    }
  }

  // Force save method for immediate persistence
  forceSave(): void {
    try {
      // Only save if data changed since last save to avoid redundant work
      const currentData = this.financeEngine.getData();
      const currentDataString = JSON.stringify(currentData);
      if (this.lastSavedDataString && this.lastSavedDataString === currentDataString) {
        console.debug('[StateManager] forceSave skipped, data unchanged');
        return;
      }

      if (typeof this.financeEngine.save === 'function') {
        this.financeEngine.save();
      }
      this.lastSavedDataString = currentDataString;
      console.log('Data force-saved successfully');
    } catch (error) {
      console.error('Force save failed:', error);
      this.updateState({
        type: 'ERROR_UPDATE',
        payload: { error: `Force save failed: ${this.formatError(error)}` }
      });
    }
  }

  // Getters
  getState(): AppState {
    return { ...this.state };
  }

  getData(): any {
    return this.state.data;
  }

  getComputationResult(): any {
    return this.state.computationResult;
  }

  getValidationResults(): ValidationResult[] {
    return this.state.validationResults;
  }

  getError(): string | null {
    return this.state.error;
  }

  isLoading(): boolean {
    return this.state.isLoading;
  }

  // Scenario management
  setCurrentScenario(scenarioId: string): void {
    if (this.state.scenarios[scenarioId]) {
      this.updateState({
        type: 'SCENARIO_UPDATE',
        payload: { scenarioId }
      });
    } else {
      this.updateState({
        type: 'ERROR_UPDATE',
        payload: { error: `Scenario ${scenarioId} not found` }
      });
    }
  }

  getCurrentScenario(): string {
    return this.state.currentScenario;
  }

  getScenarios(): Record<string, any> {
    return this.state.scenarios;
  }

  // Error handling
  clearError(): void {
    this.updateState({
      type: 'ERROR_UPDATE',
      payload: { error: null }
    });
  }

  // Reset functionality
  reset(): void {
    try {
      this.updateState({ type: 'LOADING_UPDATE', payload: { isLoading: true } });
      
      // Clear localStorage
      localStorage.removeItem('finance_data');
      localStorage.removeItem('finance_scenarios');
      
      // Reinitialize
      this.financeEngine = new FinanceEngine();
      this.financeEngine.init();
      
      const data = this.financeEngine.getData();
      const scenarios = this.financeEngine.getScenarios();
      
      this.updateState({
        type: 'DATA_UPDATE',
        payload: { data, scenarios }
      });
      
      this.computeAndValidate();
      
      // Clear validation cache
      this.validationCache.clear();
    } catch (error) {
      this.updateState({
        type: 'ERROR_UPDATE',
        payload: { error: `Reset failed: ${this.formatError(error)}` }
      });
    }
  }

  // Cleanup method to prevent memory leaks
  cleanup(): void {
    try {
      console.log('[StateManager] Cleaning up resources...');

      // Clear all timeouts
      if (this.syncTimeoutId) {
        clearTimeout(this.syncTimeoutId);
        this.syncTimeoutId = null;
      }

      if (this.queueTimeoutId) {
        clearTimeout(this.queueTimeoutId);
        this.queueTimeoutId = null;
      }

      // Reset processing flags
      this.isProcessingQueue = false;
      this.isSyncInProgress = false;

      // Clear queues and caches
      this.updateQueue = [];
      this.validationCache.clear();

      // Notify all subscribers of cleanup (optional)
      this.subscribers.forEach(subscriber => {
        try {
          // Send a final state update indicating cleanup
          subscriber({
            ...this.state,
            isLoading: false,
            error: null
          });
        } catch (err) {
          console.warn('[StateManager] Subscriber notification failed during cleanup:', err);
        }
      });

      // Clear subscribers array
      this.subscribers = [];

      console.log('[StateManager] Cleanup completed successfully');
    } catch (error) {
      console.error('[StateManager] Cleanup failed:', error);
    }
  }

  // Method to check if StateManager is in a healthy state
  isHealthy(): boolean {
    try {
      return (
        !this.isSyncInProgress &&
        !this.isProcessingQueue &&
        this.updateQueue.length === 0 &&
        this.state.error === null
      );
    } catch (error) {
      console.error('[StateManager] Health check failed:', error);
      return false;
    }
  }
}
