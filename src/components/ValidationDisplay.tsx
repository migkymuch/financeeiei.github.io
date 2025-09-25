// Validation Display Component for Finance Simulator

import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ValidationResult } from '../lib/validation';

interface ValidationDisplayProps {
  validationResults: ValidationResult[];
  onDismiss?: () => void;
  className?: string;
  showWarnings?: boolean;
  compact?: boolean;
}

export const ValidationDisplay: React.FC<ValidationDisplayProps> = ({
  validationResults,
  onDismiss,
  className,
  showWarnings = true,
  compact = false
}) => {
  if (!validationResults || validationResults.length === 0) {
    return null;
  }

  const hasErrors = validationResults.some(result => !result.isValid);
  const hasWarnings = validationResults.some(result => result.warnings.length > 0);
  
  const allErrors = validationResults.flatMap(result => result.errors);
  const allWarnings = validationResults.flatMap(result => result.warnings);

  if (!hasErrors && (!showWarnings || !hasWarnings)) {
    return null;
  }

  if (compact) {
    return (
      <div className={className}>
        {hasErrors && (
          <Alert variant="destructive" className="mb-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  พบข้อผิดพลาด {allErrors.length} ข้อ
                  {hasWarnings && showWarnings && ` และคำเตือน ${allWarnings.length} ข้อ`}
                </span>
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                    className="h-auto p-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {!hasErrors && hasWarnings && showWarnings && (
          <Alert className="mb-2">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>พบคำเตือน {allWarnings.length} ข้อ</span>
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                    className="h-auto p-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {hasErrors && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-red-800">ข้อผิดพลาดที่ต้องแก้ไข</CardTitle>
              </div>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-auto p-1 text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <CardDescription className="text-red-700">
              พบข้อผิดพลาด {allErrors.length} ข้อที่ต้องแก้ไขก่อนดำเนินการต่อ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {allErrors.map((error, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-red-700">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {hasWarnings && showWarnings && (
        <Card className="mb-4 border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-yellow-800">คำเตือน</CardTitle>
              </div>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-auto p-1 text-yellow-600 hover:text-yellow-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <CardDescription className="text-yellow-700">
              พบคำเตือน {allWarnings.length} ข้อ กรุณาตรวจสอบข้อมูล
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {allWarnings.map((warning, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-yellow-700">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Validation status indicator
interface ValidationStatusProps {
  isValid: boolean;
  hasWarnings: boolean;
  errorCount: number;
  warningCount: number;
  className?: string;
}

export const ValidationStatus: React.FC<ValidationStatusProps> = ({
  isValid,
  hasWarnings,
  errorCount,
  warningCount,
  className
}) => {
  if (isValid && !hasWarnings) {
    return (
      <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">ข้อมูลถูกต้อง</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {!isValid && (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <AlertTriangle className="h-3 w-3" />
          <span>{errorCount}</span>
        </Badge>
      )}
      {hasWarnings && (
        <Badge variant="secondary" className="flex items-center space-x-1">
          <Info className="h-3 w-3" />
          <span>{warningCount}</span>
        </Badge>
      )}
    </div>
  );
};

// Field-level validation display
interface FieldValidationProps {
  errors: string[];
  warnings: string[];
  className?: string;
}

export const FieldValidation: React.FC<FieldValidationProps> = ({
  errors,
  warnings,
  className
}) => {
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {errors.map((error, index) => (
        <p key={index} className="text-sm text-red-600 mt-1">
          {error}
        </p>
      ))}
      {warnings.map((warning, index) => (
        <p key={index} className="text-sm text-yellow-600 mt-1">
          {warning}
        </p>
      ))}
    </div>
  );
};
