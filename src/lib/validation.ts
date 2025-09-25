// Input validation utilities for financial data

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationRule {
  field: string;
  validator: (value: any) => boolean;
  errorMessage: string;
  warningMessage?: string;
}

export class FinancialDataValidator {
  private static readonly MIN_PRICE = 0.01;
  private static readonly MAX_PRICE = 10000;
  private static readonly MIN_QUANTITY = 0;
  private static readonly MAX_QUANTITY = 10000;
  private static readonly MIN_PERCENTAGE = 0;
  private static readonly MAX_PERCENTAGE = 1000;
  private static readonly MIN_HOURS = 0;
  private static readonly MAX_HOURS = 24;
  private static readonly MIN_DAYS = 0;
  private static readonly MAX_DAYS = 7;

  static validateMenuItem(menuItem: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!menuItem.id || typeof menuItem.id !== 'string') {
      errors.push('Menu ID is required and must be a string');
    }

    if (!menuItem.name || typeof menuItem.name !== 'string') {
      errors.push('Menu name is required and must be a string');
    }

    // Price validation
    if (typeof menuItem.price !== 'number' || isNaN(menuItem.price)) {
      errors.push('Price must be a valid number');
    } else {
      if (menuItem.price < this.MIN_PRICE) {
        errors.push(`Price must be at least ${this.MIN_PRICE}`);
      }
      if (menuItem.price > this.MAX_PRICE) {
        warnings.push(`Price seems high: ${menuItem.price}. Please verify.`);
      }
    }

    // Channel mix validation
    if (!menuItem.channelMix) {
      errors.push('Channel mix is required');
    } else {
      const { dineIn, takeaway, delivery } = menuItem.channelMix;
      const total = (dineIn || 0) + (takeaway || 0) + (delivery || 0);
      
      if (total <= 0) {
        errors.push('Channel mix total must be greater than 0');
      }
      
      if (total > 1.5) {
        warnings.push(`Channel mix total (${total}) seems high. Please verify.`);
      }
    }

    // BOM validation
    if (!Array.isArray(menuItem.bom)) {
      errors.push('BOM must be an array');
    } else {
      menuItem.bom.forEach((bomItem: any, index: number) => {
        const bomValidation = this.validateBOMItem(bomItem);
        bomValidation.errors.forEach(error => 
          errors.push(`BOM item ${index + 1}: ${error}`)
        );
        bomValidation.warnings.forEach(warning => 
          warnings.push(`BOM item ${index + 1}: ${warning}`)
        );
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateBOMItem(bomItem: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!bomItem.item || typeof bomItem.item !== 'string') {
      errors.push('Item name is required');
    }

    // Quantity validation
    if (typeof bomItem.qtyG !== 'number' || isNaN(bomItem.qtyG)) {
      errors.push('Quantity (grams) must be a valid number');
    } else {
      if (bomItem.qtyG < this.MIN_QUANTITY) {
        errors.push(`Quantity must be at least ${this.MIN_QUANTITY}`);
      }
      if (bomItem.qtyG > this.MAX_QUANTITY) {
        warnings.push(`Quantity seems high: ${bomItem.qtyG}g. Please verify.`);
      }
    }

    // Unit cost validation
    if (typeof bomItem.unitCostPerKg !== 'number' || isNaN(bomItem.unitCostPerKg)) {
      errors.push('Unit cost per kg must be a valid number');
    } else {
      if (bomItem.unitCostPerKg < 0) {
        errors.push('Unit cost cannot be negative');
      }
      if (bomItem.unitCostPerKg > 1000) {
        warnings.push(`Unit cost seems high: ${bomItem.unitCostPerKg} THB/kg. Please verify.`);
      }
    }

    // Yield percentage validation
    if (typeof bomItem.yieldPercent !== 'number' || isNaN(bomItem.yieldPercent)) {
      errors.push('Yield percentage must be a valid number');
    } else {
      if (bomItem.yieldPercent <= 0) {
        errors.push('Yield percentage must be greater than 0');
      }
      if (bomItem.yieldPercent > 100) {
        warnings.push(`Yield percentage (${bomItem.yieldPercent}%) seems high. Please verify.`);
      }
    }

    // Waste percentage validation
    if (typeof bomItem.wastePercent !== 'number' || isNaN(bomItem.wastePercent)) {
      errors.push('Waste percentage must be a valid number');
    } else {
      if (bomItem.wastePercent < 0) {
        errors.push('Waste percentage cannot be negative');
      }
      if (bomItem.wastePercent > 50) {
        warnings.push(`Waste percentage (${bomItem.wastePercent}%) seems high. Please verify.`);
      }
    }

    // Packaging validation (if present)
    if (bomItem.packaging) {
      if (typeof bomItem.packaging.qtyUnit !== 'number' || isNaN(bomItem.packaging.qtyUnit)) {
        errors.push('Packaging quantity must be a valid number');
      }
      if (typeof bomItem.packaging.unitCost !== 'number' || isNaN(bomItem.packaging.unitCost)) {
        errors.push('Packaging unit cost must be a valid number');
      } else {
        if (bomItem.packaging.unitCost < 0) {
          errors.push('Packaging unit cost cannot be negative');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateSalesModel(salesModel: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Daily units validation
    if (typeof salesModel.forecastDailyUnits !== 'number' || isNaN(salesModel.forecastDailyUnits)) {
      errors.push('Daily units forecast must be a valid number');
    } else {
      if (salesModel.forecastDailyUnits < 1) {
        errors.push('Daily units forecast must be at least 1');
      }
      if (salesModel.forecastDailyUnits > 1000) {
        warnings.push(`Daily units forecast (${salesModel.forecastDailyUnits}) seems high. Please verify.`);
      }
    }

    // Payment fee validation
    if (typeof salesModel.paymentFeePercent !== 'number' || isNaN(salesModel.paymentFeePercent)) {
      errors.push('Payment fee percentage must be a valid number');
    } else {
      if (salesModel.paymentFeePercent < 0) {
        errors.push('Payment fee percentage cannot be negative');
      }
      if (salesModel.paymentFeePercent > 10) {
        warnings.push(`Payment fee (${salesModel.paymentFeePercent}%) seems high. Please verify.`);
      }
    }

    // Delivery commission validation
    if (typeof salesModel.deliveryCommissionPercent !== 'number' || isNaN(salesModel.deliveryCommissionPercent)) {
      errors.push('Delivery commission percentage must be a valid number');
    } else {
      if (salesModel.deliveryCommissionPercent < 0) {
        errors.push('Delivery commission percentage cannot be negative');
      }
      if (salesModel.deliveryCommissionPercent > 50) {
        warnings.push(`Delivery commission (${salesModel.deliveryCommissionPercent}%) seems high. Please verify.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateLaborItem(laborItem: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!laborItem.id || typeof laborItem.id !== 'string') {
      errors.push('Labor ID is required');
    }

    if (!laborItem.role || typeof laborItem.role !== 'string') {
      errors.push('Role is required');
    }

    if (!laborItem.type || !['direct', 'indirect'].includes(laborItem.type)) {
      errors.push('Type must be either "direct" or "indirect"');
    }

    // Wage validation
    if (typeof laborItem.wagePerHour !== 'number' || isNaN(laborItem.wagePerHour)) {
      errors.push('Wage per hour must be a valid number');
    } else {
      if (laborItem.wagePerHour < 0) {
        errors.push('Wage cannot be negative');
      }
      if (laborItem.wagePerHour > 1000) {
        warnings.push(`Wage (${laborItem.wagePerHour} THB/hour) seems high. Please verify.`);
      }
    }

    // Hours validation
    if (typeof laborItem.hoursPerDay !== 'number' || isNaN(laborItem.hoursPerDay)) {
      errors.push('Hours per day must be a valid number');
    } else {
      if (laborItem.hoursPerDay < this.MIN_HOURS) {
        errors.push(`Hours per day must be at least ${this.MIN_HOURS}`);
      }
      if (laborItem.hoursPerDay > this.MAX_HOURS) {
        errors.push(`Hours per day cannot exceed ${this.MAX_HOURS}`);
      }
    }

    // Days validation
    if (typeof laborItem.daysPerWeek !== 'number' || isNaN(laborItem.daysPerWeek)) {
      errors.push('Days per week must be a valid number');
    } else {
      if (laborItem.daysPerWeek < this.MIN_DAYS) {
        errors.push(`Days per week must be at least ${this.MIN_DAYS}`);
      }
      if (laborItem.daysPerWeek > this.MAX_DAYS) {
        errors.push(`Days per week cannot exceed ${this.MAX_DAYS}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateUtilityItem(utilityItem: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!utilityItem.id || typeof utilityItem.id !== 'string') {
      errors.push('Utility ID is required');
    }

    if (!utilityItem.type || !['electric', 'lpg', 'water'].includes(utilityItem.type)) {
      errors.push('Type must be "electric", "lpg", or "water"');
    }

    if (!utilityItem.device || typeof utilityItem.device !== 'string') {
      errors.push('Device name is required');
    }

    // Type-specific validation
    if (utilityItem.type === 'electric') {
      if (typeof utilityItem.kw !== 'number' || isNaN(utilityItem.kw)) {
        errors.push('KW rating is required for electric devices');
      } else if (utilityItem.kw <= 0) {
        errors.push('KW rating must be greater than 0');
      }

      if (typeof utilityItem.hoursPerDay !== 'number' || isNaN(utilityItem.hoursPerDay)) {
        errors.push('Hours per day is required for electric devices');
      } else if (utilityItem.hoursPerDay < 0 || utilityItem.hoursPerDay > 24) {
        errors.push('Hours per day must be between 0 and 24');
      }

      if (typeof utilityItem.ratePerKwh !== 'number' || isNaN(utilityItem.ratePerKwh)) {
        errors.push('Rate per KWh is required for electric devices');
      } else if (utilityItem.ratePerKwh < 0) {
        errors.push('Rate per KWh cannot be negative');
      }
    } else if (utilityItem.type === 'lpg') {
      if (typeof utilityItem.kgPerBatch !== 'number' || isNaN(utilityItem.kgPerBatch)) {
        errors.push('KG per batch is required for LPG devices');
      } else if (utilityItem.kgPerBatch <= 0) {
        errors.push('KG per batch must be greater than 0');
      }

      if (typeof utilityItem.batchesPerDay !== 'number' || isNaN(utilityItem.batchesPerDay)) {
        errors.push('Batches per day is required for LPG devices');
      } else if (utilityItem.batchesPerDay < 0) {
        errors.push('Batches per day cannot be negative');
      }

      if (typeof utilityItem.ratePerKg !== 'number' || isNaN(utilityItem.ratePerKg)) {
        errors.push('Rate per KG is required for LPG devices');
      } else if (utilityItem.ratePerKg < 0) {
        errors.push('Rate per KG cannot be negative');
      }
    } else if (utilityItem.type === 'water') {
      if (typeof utilityItem.m3PerDay !== 'number' || isNaN(utilityItem.m3PerDay)) {
        errors.push('M3 per day is required for water devices');
      } else if (utilityItem.m3PerDay < 0) {
        errors.push('M3 per day cannot be negative');
      }

      if (typeof utilityItem.ratePerM3 !== 'number' || isNaN(utilityItem.ratePerM3)) {
        errors.push('Rate per M3 is required for water devices');
      } else if (utilityItem.ratePerM3 < 0) {
        errors.push('Rate per M3 cannot be negative');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateFixedCost(fixedCost: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!fixedCost.id || typeof fixedCost.id !== 'string') {
      errors.push('Fixed cost ID is required');
    }

    if (!fixedCost.name || typeof fixedCost.name !== 'string') {
      errors.push('Fixed cost name is required');
    }

    // Amount validation
    if (typeof fixedCost.amountPerMonth !== 'number' || isNaN(fixedCost.amountPerMonth)) {
      errors.push('Amount per month must be a valid number');
    } else {
      if (fixedCost.amountPerMonth < 0) {
        errors.push('Amount per month cannot be negative');
      }
      if (fixedCost.amountPerMonth > 100000) {
        warnings.push(`Amount per month (${fixedCost.amountPerMonth} THB) seems high. Please verify.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateAllData(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Defensive guard: ensure data is present before attempting property access.
    // This prevents callers from crashing if they pass `null` or `undefined` during init.
    if (!data || typeof data !== 'object') {
      errors.push('No data available for validation');
      return { isValid: false, errors, warnings };
    }

    // Validate menus
    if (Array.isArray(data.menus)) {
      data.menus.forEach((menu: any, index: number) => {
        const menuValidation = this.validateMenuItem(menu);
        menuValidation.errors.forEach(error => 
          errors.push(`Menu ${index + 1}: ${error}`)
        );
        menuValidation.warnings.forEach(warning => 
          warnings.push(`Menu ${index + 1}: ${warning}`)
        );
      });
    }

    // Validate sales model
    if (data.salesModel) {
      const salesValidation = this.validateSalesModel(data.salesModel);
      salesValidation.errors.forEach(error => 
        errors.push(`Sales Model: ${error}`)
      );
      salesValidation.warnings.forEach(warning => 
        warnings.push(`Sales Model: ${warning}`)
      );
    }

    // Validate labor
    if (Array.isArray(data.labor)) {
      data.labor.forEach((labor: any, index: number) => {
        const laborValidation = this.validateLaborItem(labor);
        laborValidation.errors.forEach(error => 
          errors.push(`Labor ${index + 1}: ${error}`)
        );
        laborValidation.warnings.forEach(warning => 
          warnings.push(`Labor ${index + 1}: ${warning}`)
        );
      });
    }

    // Validate utilities
    if (Array.isArray(data.utilities)) {
      data.utilities.forEach((utility: any, index: number) => {
        const utilityValidation = this.validateUtilityItem(utility);
        utilityValidation.errors.forEach(error => 
          errors.push(`Utility ${index + 1}: ${error}`)
        );
        utilityValidation.warnings.forEach(warning => 
          warnings.push(`Utility ${index + 1}: ${warning}`)
        );
      });
    }

    // Validate fixed costs
    if (Array.isArray(data.fixedCosts)) {
      data.fixedCosts.forEach((cost: any, index: number) => {
        const costValidation = this.validateFixedCost(cost);
        costValidation.errors.forEach(error => 
          errors.push(`Fixed Cost ${index + 1}: ${error}`)
        );
        costValidation.warnings.forEach(warning => 
          warnings.push(`Fixed Cost ${index + 1}: ${warning}`)
        );
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
