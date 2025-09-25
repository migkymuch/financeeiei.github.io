// Core Finance Engine for Restaurant Financial Modeling

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  channelMix: {
    dineIn: number;
    takeaway: number;
    delivery: number;
  };
  bom: BOMItem[];
}

export interface BOMItem {
  item: string;
  qtyG: number;
  unitCostPerKg: number;
  yieldPercent: number;
  wastePercent: number;
  packaging?: {
    qtyUnit: number;
    unitCost: number;
  };
}

export interface SalesModel {
  forecastDailyUnits: number;
  seasonality: Record<string, number>;
  paymentFeePercent: number;
  deliveryCommissionPercent: number;
  openDays: string[];
  operatingHours: {
    open: string;
    close: string;
  };
}

export interface UtilityItem {
  id: string;
  type: 'electric' | 'lpg' | 'water';
  device: string;
  kw?: number;
  hoursPerDay?: number;
  ratePerKwh?: number;
  kgPerBatch?: number;
  batchesPerDay?: number;
  ratePerKg?: number;
  m3PerDay?: number;
  ratePerM3?: number;
}

export interface LaborItem {
  id: string;
  role: string;
  type: 'direct' | 'indirect';
  wagePerHour: number;
  hoursPerDay: number;
  daysPerWeek: number;
}

export interface FixedCost {
  id: string;
  name: string;
  amountPerMonth: number;
}

export interface FinancialMetrics {
  revenue: number;
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
  primeCostPct: number;
  foodCostPct: number;
  laborPct: number;
  cmPct: number;
  bepUnits: number;
  bepPerDay: number;
  safetyMargin: number;
  avgTicket: number;
}

export interface Scenario {
  id: string;
  name: string;
  deltas: {
    menuPriceDeltaPercent?: number;
    ingredientCostDeltaPercent?: number;
    electricRateDeltaPercent?: number;
    laborProductivityDeltaPercent?: number;
    wasteDeltaPercent?: number;
  };
}

export class FinanceEngine {
  private data: any = {};
  private scenarios: Record<string, Scenario> = {};

  constructor() {
    this.initializeDefaultData();
  }

  init(): void {
    this.loadFromStorage();
  }

  private initializeDefaultData(): void {
    this.data = {
      meta: {
        currency: 'THB',
        vatPercent: 7,
        openDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        operatingHours: { open: '07:00', close: '15:00' }
      },
      menus: [
        {
          id: 'khao_man_gai',
          name: 'ข้าวมันไก่',
          price: 50,
          channelMix: { dineIn: 0.7, takeaway: 0.2, delivery: 0.1 },
          bom: [
            {
              item: 'chicken_thigh',
              qtyG: 120,
              unitCostPerKg: 70,
              yieldPercent: 85,
              wastePercent: 5
            },
            {
              item: 'rice',
              qtyG: 180,
              unitCostPerKg: 30,
              yieldPercent: 95,
              wastePercent: 2
            },
            {
              item: 'sauce',
              qtyG: 30,
              unitCostPerKg: 60,
              yieldPercent: 100,
              wastePercent: 0
            },
            {
              item: 'packaging',
              qtyG: 0,
              unitCostPerKg: 0,
              yieldPercent: 100,
              wastePercent: 0,
              packaging: {
                qtyUnit: 1,
                unitCost: 2.5
              }
            }
          ]
        }
      ],
      salesModel: {
        forecastDailyUnits: 120,
        seasonality: {
          Jan: 0.9, Feb: 0.95, Mar: 1.0, Apr: 1.1, May: 1.0, Jun: 0.9,
          Jul: 0.9, Aug: 1.1, Sep: 1.0, Oct: 1.0, Nov: 1.1, Dec: 1.2
        },
        paymentFeePercent: 1.5,
        deliveryCommissionPercent: 25
      },
      utilities: [
        {
          id: 'ac_main',
          type: 'electric',
          device: 'เครื่องปรับอากาศ',
          kw: 2.5,
          hoursPerDay: 6,
          ratePerKwh: 5
        },
        {
          id: 'rice_cooker',
          type: 'electric',
          device: 'หม้อหุงข้าว',
          kw: 1.8,
          hoursPerDay: 3,
          ratePerKwh: 5
        },
        {
          id: 'gas_stove',
          type: 'lpg',
          device: 'เตาแก๊ส',
          kgPerBatch: 0.25,
          batchesPerDay: 2,
          ratePerKg: 29.33
        }
      ],
      labor: [
        {
          id: 'kitchen_chef',
          role: 'พ่อครัว',
          type: 'direct',
          wagePerHour: 45,
          hoursPerDay: 8,
          daysPerWeek: 6
        },
        {
          id: 'cashier',
          role: 'แคชเชียร์',
          type: 'indirect',
          wagePerHour: 40,
          hoursPerDay: 6,
          daysPerWeek: 6
        }
      ],
      fixedCosts: [
        { id: 'rent', name: 'ค่าเช่า', amountPerMonth: 0 },
        { id: 'internet', name: 'อินเทอร์เน็ต', amountPerMonth: 700 },
        { id: 'maintenance', name: 'ซ่อมบำรุง', amountPerMonth: 1000 },
        { id: 'depreciation', name: 'ค่าเสื่อมราคา', amountPerMonth: 1500 }
      ]
    };

    this.scenarios = {
      base: { id: 'base', name: 'ฐาน (Base)', deltas: {} },
      S1: { 
        id: 'S1', 
        name: 'สถานการณ์ 1', 
        deltas: { 
          menuPriceDeltaPercent: 5, 
          ingredientCostDeltaPercent: 8 
        } 
      }
    };
  }

  compute(): any {
    try {
      // Validate data before computation
      if (!this.validateData()) {
        console.error('Data validation failed');
        return this.getDefaultComputationResult();
      }

      const pnl = this.calculatePnL();
      const kpis = this.calculateKPIs(pnl);
      const menus = this.calculateMenuMetrics();
      
      return {
        pnl,
        kpis,
        menus,
        sensitivity: this.calculateSensitivity(),
        computedAt: new Date().toISOString(),
        dataVersion: this.getDataVersion()
      };
        } catch (e: unknown) {
      console.error('Failed to load stored data:', e instanceof Error ? e.message : String(e));
      return this.getDefaultComputationResult();
    }
  }

  private validateData(): boolean {
    try {
      // Check if essential data exists
      if (!this.data) {
        console.warn('No data available');
        return false;
      }

      // Validate menus
      if (!this.data.menus || !Array.isArray(this.data.menus) || this.data.menus.length === 0) {
        console.warn('No menus data available');
        return false;
      }

      // Validate sales model
      if (!this.data.salesModel || typeof this.data.salesModel.forecastDailyUnits !== 'number') {
        console.warn('Invalid sales model data');
        return false;
      }

      // Validate utilities, labor, and fixed costs arrays
      if (!Array.isArray(this.data.utilities) || !Array.isArray(this.data.labor) || !Array.isArray(this.data.fixedCosts)) {
        console.warn('Invalid utilities, labor, or fixed costs data');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating data:', error);
      return false;
    }
  }

  private getDefaultComputationResult(): any {
    return {
      pnl: {
        daily: { revenue: 0, cogs: 0, grossProfit: 0, operatingExpenses: 0, operatingProfit: 0 },
        monthly: { revenue: 0, cogs: 0, grossProfit: 0, operatingExpenses: 0, operatingProfit: 0 }
      },
      kpis: this.getDefaultFinancialMetrics(),
      menus: [],
      sensitivity: { variable: 'ingredient_cost', series: [] },
      computedAt: new Date().toISOString(),
      dataVersion: this.getDataVersion(),
      error: 'Computation failed due to invalid data'
    };
  }

  private getDataVersion(): string {
    // Simple versioning based on data hash
    try {
      const dataString = JSON.stringify(this.data);
      return btoa(dataString).substring(0, 8);
    } catch (error) {
      return 'unknown';
    }
  }

  private calculatePnL(): any {
    const dailyRevenue = this.calculateDailyRevenue();
    const dailyCOGS = this.calculateDailyCOGS();
    const monthlyFixedCosts = this.calculateMonthlyFixedCosts();
    const monthlyLaborCosts = this.calculateMonthlyLaborCosts();
    const monthlyUtilityCosts = this.calculateMonthlyUtilityCosts();

    const grossProfitDaily = dailyRevenue - dailyCOGS;
    const operatingExpensesDaily = (monthlyFixedCosts + monthlyLaborCosts + monthlyUtilityCosts) / 30;
    const operatingProfitDaily = grossProfitDaily - operatingExpensesDaily;

    return {
      daily: {
        revenue: dailyRevenue,
        cogs: dailyCOGS,
        grossProfit: grossProfitDaily,
        operatingExpenses: operatingExpensesDaily,
        operatingProfit: operatingProfitDaily
      },
      monthly: {
        revenue: dailyRevenue * 30,
        cogs: dailyCOGS * 30,
        grossProfit: grossProfitDaily * 30,
        operatingExpenses: monthlyFixedCosts + monthlyLaborCosts + monthlyUtilityCosts,
        operatingProfit: operatingProfitDaily * 30
      }
    };
  }

  private calculateDailyRevenue(): number {
    // Validate sales model data
    if (!this.data.salesModel || typeof this.data.salesModel.forecastDailyUnits !== 'number') {
      console.warn('Invalid sales model data:', this.data.salesModel);
      return 0;
    }

    if (!this.data.menus || !Array.isArray(this.data.menus)) {
      console.warn('Invalid menus data:', this.data.menus);
      return 0;
    }

    return this.data.menus.reduce((total: number, menu: MenuItem) => {
      // Validate menu data
      if (!menu || typeof menu.price !== 'number' || !menu.channelMix) {
        console.warn('Invalid menu data:', menu);
        return total;
      }

      // Validate channel mix percentages
      const { dineIn, takeaway, delivery } = menu.channelMix;
      if (typeof dineIn !== 'number' || typeof takeaway !== 'number' || typeof delivery !== 'number') {
        console.warn('Invalid channel mix data:', menu.channelMix);
        return total;
      }

      // Ensure channel mix percentages are not negative
      const validDineIn = Math.max(0, dineIn);
      const validTakeaway = Math.max(0, takeaway);
      const validDelivery = Math.max(0, delivery);

      const menuUnits = this.data.salesModel.forecastDailyUnits * (validDineIn + validTakeaway + validDelivery);
      return total + (menu.price * menuUnits);
    }, 0);
  }

  private calculateDailyCOGS(): number {
    return this.data.menus.reduce((total: number, menu: MenuItem) => {
      const menuUnits = this.data.salesModel.forecastDailyUnits;
      const variableCostPerUnit = this.calculateVariableCostPerUnit(menu);
      return total + (variableCostPerUnit * menuUnits);
    }, 0);
  }

  private calculateVariableCostPerUnit(menu: MenuItem): number {
    // Validate input data
    if (!menu || !menu.bom || !Array.isArray(menu.bom)) {
      console.warn('Invalid menu or BOM data:', menu);
      return 0;
    }

    return menu.bom.reduce((total: number, bomItem: BOMItem) => {
      // Validate BOM item
      if (!bomItem) {
        console.warn('Invalid BOM item:', bomItem);
        return total;
      }

      if (bomItem.packaging) {
        // Validate packaging data
        if (typeof bomItem.packaging.qtyUnit !== 'number' || typeof bomItem.packaging.unitCost !== 'number') {
          console.warn('Invalid packaging data:', bomItem.packaging);
          return total;
        }
        return total + (bomItem.packaging.qtyUnit * bomItem.packaging.unitCost);
      }
      
      // Validate ingredient data
      if (typeof bomItem.qtyG !== 'number' || typeof bomItem.unitCostPerKg !== 'number' ||
          typeof bomItem.yieldPercent !== 'number' || typeof bomItem.wastePercent !== 'number') {
        console.warn('Invalid ingredient data:', bomItem);
        return total;
      }

      // Prevent division by zero
      if (bomItem.yieldPercent <= 0) {
        console.warn('Invalid yield percentage (must be > 0):', bomItem.yieldPercent);
        return total;
      }

      // Ensure waste percentage is not negative
      const wastePercent = Math.max(0, bomItem.wastePercent);
      
      const effectiveYield = bomItem.yieldPercent / 100;
      const wasteMultiplier = 1 + (wastePercent / 100);
      
      // Convert grams to kg and calculate actual quantity needed
      const qtyInKg = bomItem.qtyG / 1000;
      const actualQtyNeeded = qtyInKg * wasteMultiplier / effectiveYield;
      
      return total + (actualQtyNeeded * bomItem.unitCostPerKg);
    }, 0);
  }

  private calculateMonthlyFixedCosts(): number {
    return this.data.fixedCosts.reduce((total: number, cost: FixedCost) => {
      return total + cost.amountPerMonth;
    }, 0);
  }

  private calculateMonthlyLaborCosts(): number {
    return this.data.labor.reduce((total: number, labor: LaborItem) => {
      const monthlyHours = labor.hoursPerDay * labor.daysPerWeek * 4.33; // Average weeks per month
      return total + (labor.wagePerHour * monthlyHours);
    }, 0);
  }

  private calculateMonthlyUtilityCosts(): number {
    return this.data.utilities.reduce((total: number, utility: UtilityItem) => {
      let dailyCost = 0;
      
      if (utility.type === 'electric' && utility.kw && utility.hoursPerDay && utility.ratePerKwh) {
        dailyCost = utility.kw * utility.hoursPerDay * utility.ratePerKwh;
      } else if (utility.type === 'lpg' && utility.kgPerBatch && utility.batchesPerDay && utility.ratePerKg) {
        dailyCost = utility.kgPerBatch * utility.batchesPerDay * utility.ratePerKg;
      } else if (utility.type === 'water' && utility.m3PerDay && utility.ratePerM3) {
        dailyCost = utility.m3PerDay * utility.ratePerM3;
      }
      
      return total + (dailyCost * 30);
    }, 0);
  }

  private calculateKPIs(pnl: any): FinancialMetrics {
    // Validate PnL data
    if (!pnl || !pnl.daily) {
      console.warn('Invalid PnL data:', pnl);
      return this.getDefaultFinancialMetrics();
    }

    const revenue = pnl.daily.revenue || 0;
    const grossProfit = pnl.daily.grossProfit || 0;
    const operatingProfit = pnl.daily.operatingProfit || 0;
    
    // Validate menus data
    if (!this.data.menus || !Array.isArray(this.data.menus) || this.data.menus.length === 0) {
      console.warn('No menus data available for KPI calculation');
      return this.getDefaultFinancialMetrics();
    }
    
    // Calculate weighted average contribution margin
    const totalCM = this.data.menus.reduce((total: number, menu: MenuItem) => {
      if (!menu || typeof menu.price !== 'number') {
        console.warn('Invalid menu data for CM calculation:', menu);
        return total;
      }
      const vc = this.calculateVariableCostPerUnit(menu);
      const cm = menu.price - vc;
      return total + cm;
    }, 0);
    
    const avgCM = totalCM / this.data.menus.length;
    const monthlyFixedTotal = this.calculateMonthlyFixedCosts() + this.calculateMonthlyLaborCosts() + this.calculateMonthlyUtilityCosts();
    
    // Prevent division by zero
    const bepUnits = avgCM > 0 ? monthlyFixedTotal / avgCM : 0;
    const bepPerDay = bepUnits / 30;
    
    const directLaborCost = this.data.labor
      .filter((l: LaborItem) => l && l.type === 'direct')
      .reduce((total: number, labor: LaborItem) => {
        if (!labor || typeof labor.wagePerHour !== 'number' || typeof labor.hoursPerDay !== 'number') {
          console.warn('Invalid labor data:', labor);
          return total;
        }
        return total + (labor.wagePerHour * labor.hoursPerDay);
      }, 0);
    
    const foodCost = pnl.daily.cogs || 0;
    const primeCost = foodCost + directLaborCost;
    
    // Prevent division by zero
    const primeCostPct = revenue > 0 ? (primeCost / revenue) * 100 : 0;
    const foodCostPct = revenue > 0 ? (foodCost / revenue) * 100 : 0;
    const laborPct = revenue > 0 ? (directLaborCost / revenue) * 100 : 0;
    
    // Calculate CM percentage based on average menu price
    const avgMenuPrice = this.data.menus.reduce((sum: number, menu: MenuItem) => {
      return sum + (menu?.price || 0);
    }, 0) / this.data.menus.length;
    const cmPct = avgMenuPrice > 0 ? (avgCM / avgMenuPrice) * 100 : 0;
    
    // Calculate safety margin
    const forecastUnits = this.data.salesModel?.forecastDailyUnits || 0;
    const safetyMargin = forecastUnits > 0 ? ((forecastUnits - bepPerDay) / forecastUnits) * 100 : 0;
    const avgTicket = forecastUnits > 0 ? revenue / forecastUnits : 0;
    
    return {
      revenue,
      grossProfit,
      operatingProfit,
      netProfit: operatingProfit, // Simplified for now
      primeCostPct,
      foodCostPct,
      laborPct,
      cmPct,
      bepUnits,
      bepPerDay,
      safetyMargin,
      avgTicket
    };
  }

  private getDefaultFinancialMetrics(): FinancialMetrics {
    return {
      revenue: 0,
      grossProfit: 0,
      operatingProfit: 0,
      netProfit: 0,
      primeCostPct: 0,
      foodCostPct: 0,
      laborPct: 0,
      cmPct: 0,
      bepUnits: 0,
      bepPerDay: 0,
      safetyMargin: 0,
      avgTicket: 0
    };
  }

  private calculateMenuMetrics(): any[] {
    return this.data.menus.map((menu: MenuItem) => {
      const vc = this.calculateVariableCostPerUnit(menu);
      const cm = menu.price - vc;
      const cmPct = (cm / menu.price) * 100;
      
      return {
        id: menu.id,
        name: menu.name,
        price: menu.price,
        vc,
        cm,
        cmPct
      };
    });
  }

  private calculateSensitivity(): any {
    // Simplified sensitivity analysis
    return {
      variable: 'ingredient_cost',
      series: [
        { change: -10, impact: 15 },
        { change: -5, impact: 7.5 },
        { change: 0, impact: 0 },
        { change: 5, impact: -7.5 },
        { change: 10, impact: -15 }
      ]
    };
  }

  // Data management methods
  save(): void {
    try {
      localStorage.setItem('finance_data', JSON.stringify(this.data));
      localStorage.setItem('finance_scenarios', JSON.stringify(this.scenarios));
      // Debug log to help verify persistence during dev/testing
      // eslint-disable-next-line no-console
      console.log('[FinanceEngine] save() called. menus:', Array.isArray(this.data?.menus) ? this.data.menus.length : 0);
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error('[FinanceEngine] save() failed:', e instanceof Error ? e.message : String(e));
    }
  }

  load(data: any): void {
    this.data = data;
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('finance_data');
    const storedScenarios = localStorage.getItem('finance_scenarios');
    
    if (stored) {
      try {
        this.data = JSON.parse(stored);
      } catch (e: unknown) {
        console.error('Failed to load stored data:', e instanceof Error ? e.message : String(e));
      }
    }
    
    if (storedScenarios) {
      try {
        this.scenarios = JSON.parse(storedScenarios);
      } catch (e: unknown) {
        console.error('Failed to load stored scenarios:', e instanceof Error ? e.message : String(e));
      }
    }
  }

  exportJSON(): string {
    return JSON.stringify({
      data: this.data,
      scenarios: this.scenarios,
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  importJSON(jsonString: string): { success: boolean; error?: string } {
    try {
      // Validate input
      if (!jsonString || typeof jsonString !== 'string') {
        return { success: false, error: 'Invalid JSON string provided' };
      }

      const imported = JSON.parse(jsonString);
      
      // Validate imported data structure
      if (!imported.data || !imported.scenarios) {
        return { success: false, error: 'Invalid data structure: missing data or scenarios' };
      }

      // Validate data types
      if (!Array.isArray(imported.data.menus) || 
          !Array.isArray(imported.data.utilities) || 
          !Array.isArray(imported.data.labor) || 
          !Array.isArray(imported.data.fixedCosts)) {
        return { success: false, error: 'Invalid data structure: arrays expected for menus, utilities, labor, and fixedCosts' };
      }

      // Backup current data
      const backup = {
        data: JSON.parse(JSON.stringify(this.data)),
        scenarios: JSON.parse(JSON.stringify(this.scenarios))
      };

      try {
        this.data = imported.data;
        this.scenarios = imported.scenarios;
        
        // Validate imported data
        if (!this.validateData()) {
          // Restore backup
          this.data = backup.data;
          this.scenarios = backup.scenarios;
          return { success: false, error: 'Imported data failed validation' };
        }

        this.save();
        return { success: true };
      } catch (validationError: unknown) {
        // Restore backup
        this.data = backup.data;
        this.scenarios = backup.scenarios;
        return { success: false, error: `Data validation failed: ${validationError instanceof Error ? validationError.message : String(validationError)}` };
      }
    } catch (e: unknown) {
      console.error('Failed to import JSON:', e instanceof Error ? e.message : String(e));
      return { success: false, error: `JSON parsing failed: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  // Getters for components
  getData(): any {
    return this.data;
  }

  getScenarios(): Record<string, Scenario> {
    return this.scenarios;
  }

  updateMenu(menuId: string, updates: Partial<MenuItem>): void {
    const menuIndex = this.data.menus.findIndex((m: MenuItem) => m.id === menuId);
    if (menuIndex >= 0) {
      this.data.menus[menuIndex] = { ...this.data.menus[menuIndex], ...updates };
      this.save();
    }
  }

  // Add a new menu to the data store. If a menu with the same id exists, it will not duplicate.
  addMenu(menu: MenuItem): void {
    if (!this.data.menus) this.data.menus = [];
    const exists = this.data.menus.some((m: MenuItem) => m.id === menu.id);
    if (!exists) {
      this.data.menus.push(menu);
      // Debug log to show addMenu invocation
      // eslint-disable-next-line no-console
      console.log('[FinanceEngine] addMenu:', menu.id);
      this.save();
    }
  }

  // Remove a menu by id and persist
  deleteMenu(menuId: string): void {
    try {
      if (!this.data || !Array.isArray(this.data.menus)) return;
      const before = this.data.menus.length;
      this.data.menus = this.data.menus.filter((m: MenuItem) => m.id !== menuId);
      const after = this.data.menus.length;
      if (after !== before) {
        // eslint-disable-next-line no-console
        console.log('[FinanceEngine] deleteMenu:', menuId, 'remaining:', after);
        this.save();
      }
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error('[FinanceEngine] deleteMenu failed:', e instanceof Error ? e.message : String(e));
    }
  }

  updateSalesModel(updates: Partial<SalesModel>): void {
    this.data.salesModel = { ...this.data.salesModel, ...updates };
    this.save();
  }

  updateUtilities(utilities: UtilityItem[]): void {
    this.data.utilities = utilities;
    this.save();
  }

  updateLabor(labor: LaborItem[]): void {
    this.data.labor = labor;
    this.save();
  }

  updateFixedCosts(fixedCosts: FixedCost[]): void {
    this.data.fixedCosts = fixedCosts;
    this.save();
  }
}