// Unit tests for Finance Engine

import { FinanceEngine, MenuItem, BOMItem, SalesModel, LaborItem, UtilityItem, FixedCost } from '../finance-engine';
import { FinancialDataValidator } from '../validation';

describe('FinanceEngine', () => {
  let financeEngine: FinanceEngine;

  beforeEach(() => {
    financeEngine = new FinanceEngine();
  });

  describe('calculateVariableCostPerUnit', () => {
    it('should calculate variable cost correctly for valid BOM', () => {
      const menu: MenuItem = {
        id: 'test_menu',
        name: 'Test Menu',
        price: 100,
        channelMix: { dineIn: 0.5, takeaway: 0.3, delivery: 0.2 },
        bom: [
          {
            item: 'ingredient1',
            qtyG: 100,
            unitCostPerKg: 50,
            yieldPercent: 90,
            wastePercent: 5
          },
          {
            item: 'packaging',
            qtyG: 0,
            unitCostPerKg: 0,
            yieldPercent: 100,
            wastePercent: 0,
            packaging: {
              qtyUnit: 1,
              unitCost: 2
            }
          }
        ]
      };

      const result = (financeEngine as any).calculateVariableCostPerUnit(menu);
      
      // Expected calculation:
      // Ingredient1: (100g / 1000) * (1 + 5/100) / (90/100) * 50 = 0.1 * 1.05 / 0.9 * 50 = 5.83
      // Packaging: 1 * 2 = 2
      // Total: 5.83 + 2 = 7.83
      expect(result).toBeCloseTo(7.83, 2);
    });

    it('should handle zero yield percentage gracefully', () => {
      const menu: MenuItem = {
        id: 'test_menu',
        name: 'Test Menu',
        price: 100,
        channelMix: { dineIn: 1, takeaway: 0, delivery: 0 },
        bom: [
          {
            item: 'ingredient1',
            qtyG: 100,
            unitCostPerKg: 50,
            yieldPercent: 0, // Invalid yield
            wastePercent: 5
          }
        ]
      };

      const result = (financeEngine as any).calculateVariableCostPerUnit(menu);
      expect(result).toBe(0); // Should return 0 due to validation
    });

    it('should handle negative waste percentage', () => {
      const menu: MenuItem = {
        id: 'test_menu',
        name: 'Test Menu',
        price: 100,
        channelMix: { dineIn: 1, takeaway: 0, delivery: 0 },
        bom: [
          {
            item: 'ingredient1',
            qtyG: 100,
            unitCostPerKg: 50,
            yieldPercent: 90,
            wastePercent: -10 // Negative waste
          }
        ]
      };

      const result = (financeEngine as any).calculateVariableCostPerUnit(menu);
      
      // Should treat negative waste as 0
      // Calculation: (100g / 1000) * (1 + 0/100) / (90/100) * 50 = 0.1 * 1 / 0.9 * 50 = 5.56
      expect(result).toBeCloseTo(5.56, 2);
    });

    it('should return 0 for invalid menu data', () => {
      const result = (financeEngine as any).calculateVariableCostPerUnit(null);
      expect(result).toBe(0);
    });

    it('should return 0 for menu without BOM', () => {
      const menu: MenuItem = {
        id: 'test_menu',
        name: 'Test Menu',
        price: 100,
        channelMix: { dineIn: 1, takeaway: 0, delivery: 0 },
        bom: []
      };

      const result = (financeEngine as any).calculateVariableCostPerUnit(menu);
      expect(result).toBe(0);
    });
  });

  describe('calculateDailyRevenue', () => {
    it('should calculate daily revenue correctly', () => {
      const testData = {
        menus: [
          {
            id: 'menu1',
            name: 'Menu 1',
            price: 100,
            channelMix: { dineIn: 0.5, takeaway: 0.3, delivery: 0.2 },
            bom: []
          },
          {
            id: 'menu2',
            name: 'Menu 2',
            price: 150,
            channelMix: { dineIn: 0.6, takeaway: 0.2, delivery: 0.2 },
            bom: []
          }
        ],
        salesModel: {
          forecastDailyUnits: 50
        }
      };

      (financeEngine as any).data = testData;
      const result = (financeEngine as any).calculateDailyRevenue();
      
      // Expected: (100 * 50 * 1.0) + (150 * 50 * 1.0) = 5000 + 7500 = 12500
      expect(result).toBe(12500);
    });

    it('should handle negative channel mix percentages', () => {
      const testData = {
        menus: [
          {
            id: 'menu1',
            name: 'Menu 1',
            price: 100,
            channelMix: { dineIn: -0.1, takeaway: 0.5, delivery: 0.6 }, // Negative dineIn
            bom: []
          }
        ],
        salesModel: {
          forecastDailyUnits: 50
        }
      };

      (financeEngine as any).data = testData;
      const result = (financeEngine as any).calculateDailyRevenue();
      
      // Should treat negative as 0: (100 * 50 * 1.1) = 5500
      expect(result).toBe(5500);
    });

    it('should return 0 for invalid data', () => {
      (financeEngine as any).data = null;
      const result = (financeEngine as any).calculateDailyRevenue();
      expect(result).toBe(0);
    });
  });

  describe('calculateKPIs', () => {
    it('should calculate KPIs correctly', () => {
      const mockPnL = {
        daily: {
          revenue: 10000,
          cogs: 4000,
          grossProfit: 6000,
          operatingProfit: 3000
        }
      };

      const testData = {
        menus: [
          {
            id: 'menu1',
            name: 'Menu 1',
            price: 100,
            channelMix: { dineIn: 1, takeaway: 0, delivery: 0 },
            bom: [
              {
                item: 'ingredient1',
                qtyG: 100,
                unitCostPerKg: 50,
                yieldPercent: 90,
                wastePercent: 5
              }
            ]
          }
        ],
        labor: [
          {
            id: 'chef',
            role: 'Chef',
            type: 'direct',
            wagePerHour: 50,
            hoursPerDay: 8,
            daysPerWeek: 6
          }
        ],
        salesModel: {
          forecastDailyUnits: 100
        }
      };

      (financeEngine as any).data = testData;
      const result = (financeEngine as any).calculateKPIs(mockPnL);
      
      expect(result.revenue).toBe(10000);
      expect(result.grossProfit).toBe(6000);
      expect(result.operatingProfit).toBe(3000);
      expect(result.foodCostPct).toBe(40); // 4000/10000 * 100
      expect(result.avgTicket).toBe(100); // 10000/100
    });

    it('should handle division by zero gracefully', () => {
      const mockPnL = {
        daily: {
          revenue: 0,
          cogs: 0,
          grossProfit: 0,
          operatingProfit: 0
        }
      };

      (financeEngine as any).data = { menus: [], salesModel: { forecastDailyUnits: 0 } };
      const result = (financeEngine as any).calculateKPIs(mockPnL);
      
      expect(result.revenue).toBe(0);
      expect(result.foodCostPct).toBe(0);
      expect(result.avgTicket).toBe(0);
    });
  });

  describe('compute', () => {
    it('should return valid computation result', () => {
      const result = financeEngine.compute();
      
      expect(result).toHaveProperty('pnl');
      expect(result).toHaveProperty('kpis');
      expect(result).toHaveProperty('menus');
      expect(result).toHaveProperty('sensitivity');
      expect(result).toHaveProperty('computedAt');
      expect(result).toHaveProperty('dataVersion');
    });

    it('should handle computation errors gracefully', () => {
      // Set invalid data to trigger error
      (financeEngine as any).data = null;
      const result = financeEngine.compute();
      
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Computation failed');
    });
  });

  describe('importJSON', () => {
    it('should import valid JSON successfully', () => {
      const validData = {
        data: {
          menus: [
            {
              id: 'test_menu',
              name: 'Test Menu',
              price: 100,
              channelMix: { dineIn: 1, takeaway: 0, delivery: 0 },
              bom: []
            }
          ],
          salesModel: { forecastDailyUnits: 50 },
          utilities: [],
          labor: [],
          fixedCosts: []
        },
        scenarios: {}
      };

      const result = financeEngine.importJSON(JSON.stringify(validData));
      expect(result.success).toBe(true);
    });

    it('should reject invalid JSON', () => {
      const result = financeEngine.importJSON('invalid json');
      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON parsing failed');
    });

    it('should reject data with missing required fields', () => {
      const invalidData = {
        data: {
          menus: [],
          // Missing salesModel, utilities, labor, fixedCosts
        },
        scenarios: {}
      };

      const result = financeEngine.importJSON(JSON.stringify(invalidData));
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid data structure');
    });
  });
});

describe('FinancialDataValidator', () => {
  describe('validateMenuItem', () => {
    it('should validate correct menu item', () => {
      const validMenuItem = {
        id: 'test_menu',
        name: 'Test Menu',
        price: 100,
        channelMix: { dineIn: 0.5, takeaway: 0.3, delivery: 0.2 },
        bom: [
          {
            item: 'ingredient1',
            qtyG: 100,
            unitCostPerKg: 50,
            yieldPercent: 90,
            wastePercent: 5
          }
        ]
      };

      const result = FinancialDataValidator.validateMenuItem(validMenuItem);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid menu item', () => {
      const invalidMenuItem = {
        id: '', // Empty ID
        name: '', // Empty name
        price: -10, // Negative price
        channelMix: { dineIn: -0.1, takeaway: 0.5, delivery: 0.6 }, // Negative channel mix
        bom: []
      };

      const result = FinancialDataValidator.validateMenuItem(invalidMenuItem);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateBOMItem', () => {
    it('should validate correct BOM item', () => {
      const validBOMItem = {
        item: 'ingredient1',
        qtyG: 100,
        unitCostPerKg: 50,
        yieldPercent: 90,
        wastePercent: 5
      };

      const result = FinancialDataValidator.validateBOMItem(validBOMItem);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid BOM item', () => {
      const invalidBOMItem = {
        item: '', // Empty item name
        qtyG: -10, // Negative quantity
        unitCostPerKg: -50, // Negative cost
        yieldPercent: 0, // Zero yield
        wastePercent: -5 // Negative waste
      };

      const result = FinancialDataValidator.validateBOMItem(invalidBOMItem);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateSalesModel', () => {
    it('should validate correct sales model', () => {
      const validSalesModel = {
        forecastDailyUnits: 100,
        paymentFeePercent: 2.5,
        deliveryCommissionPercent: 15
      };

      const result = FinancialDataValidator.validateSalesModel(validSalesModel);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid sales model', () => {
      const invalidSalesModel = {
        forecastDailyUnits: -10, // Negative units
        paymentFeePercent: -5, // Negative fee
        deliveryCommissionPercent: 100 // Too high commission
      };

      const result = FinancialDataValidator.validateSalesModel(invalidSalesModel);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
