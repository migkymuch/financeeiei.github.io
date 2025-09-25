import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { TrendingUp, Calendar, CreditCard, Truck, Clock } from 'lucide-react';
import { formatCurrency, formatPercent, parseNumberInput } from '../lib/utils';
import { useFinanceState } from '../hooks/useFinanceState';

export default function SalesModel() {
  const { data, updateSalesModel } = useFinanceState();
  
  // Use global state directly
  const salesData = data?.salesModel || {};

  // Define month arrays at the top
  const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const seasonalityKeys = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Local state initialized from global state
  const [forecastDaily, setForecastDaily] = useState<number>(salesData.forecastDailyUnits || 100);
  const [paymentFee, setPaymentFee] = useState<number>(salesData.paymentFeePercent || 3);
  const [deliveryCommission, setDeliveryCommission] = useState<number>(salesData.deliveryCommissionPercent || 15);

  // Local state for seasonality data to ensure smooth real-time updates
  const [localSeasonality, setLocalSeasonality] = useState<Record<string, number>>(() => {
    const seasonality: Record<string, number> = {};
    seasonalityKeys.forEach(month => {
      seasonality[month] = ((salesData.seasonality?.[month] || 1) * 100);
    });
    return seasonality;
  });

  // Mounted ref to skip initial sync effect (we already initialized state from salesData)
  const mountedRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state with global state when specific values change (skip initial mount)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    if (data?.salesModel) {
      const newForecastDaily = data.salesModel.forecastDailyUnits || 100;
      const newPaymentFee = data.salesModel.paymentFeePercent || 3;
      const newDeliveryCommission = data.salesModel.deliveryCommissionPercent || 15;

      if (newForecastDaily !== forecastDaily) setForecastDaily(newForecastDaily);
      if (newPaymentFee !== paymentFee) setPaymentFee(newPaymentFee);
      if (newDeliveryCommission !== deliveryCommission) setDeliveryCommission(newDeliveryCommission);

      // Sync seasonality data from global state
      if (data.salesModel.seasonality) {
        const newLocalSeasonality: Record<string, number> = {};
        let hasChanges = false;
        seasonalityKeys.forEach(month => {
          const globalValue = (data.salesModel.seasonality?.[month] || 1) * 100;
          const localValue = localSeasonality[month];
          newLocalSeasonality[month] = globalValue;
          if (Math.abs(globalValue - localValue) > 0.1) {
            hasChanges = true;
          }
        });

        if (hasChanges) {
          setLocalSeasonality(newLocalSeasonality);
        }
      }
    }
  }, [data?.salesModel?.forecastDailyUnits, data?.salesModel?.paymentFeePercent, data?.salesModel?.deliveryCommissionPercent, data?.salesModel?.seasonality]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSeasonalityChange = (month: string, value: number) => {
    // Update local state immediately for smooth UI
    setLocalSeasonality(prev => ({ ...prev, [month]: value }));

    const newValue = value / 100;
    const currentValue = (salesData.seasonality || {})[month] || 1;

    // Use a small tolerance for floating point comparison
    if (Math.abs(currentValue - newValue) < 0.001) return;

    const newSeasonality = { ...(salesData.seasonality || {}), [month]: newValue };
    const updatedSalesData = { ...salesData, seasonality: newSeasonality };

    // Debug log to verify function is being called
    console.log(`[SalesModel] Updating seasonality for ${month}: ${value.toFixed(1)}%`);

    updateSalesModel(updatedSalesData);
  };

  const handleSeasonalityInputChange = (month: string, inputValue: string) => {
    // Allow empty input for editing
    if (inputValue === '') {
      setLocalSeasonality(prev => ({ ...prev, [month]: 100 }));
      return;
    }

    const numValue = parseFloat(inputValue);

    // Validate input range
    if (isNaN(numValue)) {
      return; // Don't update if not a number
    }

    // Clamp the value to valid range
    const clampedValue = Math.max(25, Math.min(200, numValue));

    // Update local state immediately for responsiveness
    setLocalSeasonality(prev => ({ ...prev, [month]: clampedValue }));

    // Debounce the actual update to prevent excessive calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      handleSeasonalityChange(month, clampedValue);
    }, 300);
  };

  const handleForecastChange = (value: number) => {
    setForecastDaily(value);
    // Avoid no-op updates
    if ((salesData.forecastDailyUnits || 0) === value) return;
    const updatedSalesData = { ...salesData, forecastDailyUnits: value };
    updateSalesModel(updatedSalesData);
  };

  const handlePaymentFeeChange = (value: number) => {
    setPaymentFee(value);
    if ((salesData.paymentFeePercent || 0) === value) return;
    const updatedSalesData = { ...salesData, paymentFeePercent: value };
    updateSalesModel(updatedSalesData);
  };

  const handleDeliveryCommissionChange = (value: number) => {
    setDeliveryCommission(value);
    if ((salesData.deliveryCommissionPercent || 0) === value) return;
    const updatedSalesData = { ...salesData, deliveryCommissionPercent: value };
    updateSalesModel(updatedSalesData);
  };

  const calculateMonthlyUnits = (month: string) => {
    const seasonalityFactor = (localSeasonality[month] || 100) / 100;
    return Math.round(forecastDaily * 30 * seasonalityFactor);
  };

  const calculateMonthlyRevenue = (month: string) => {
    const units = calculateMonthlyUnits(month);
    const avgPrice = 60; // This should come from menu data
    return units * avgPrice;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">โมเดลยอดขาย</h2>
          <p className="text-muted-foreground">จัดการการคาดการณ์ยอดขายและค่าธรรมเนียม</p>
        </div>
        <Badge variant="outline">
          รายได้เดือนละ {formatCurrency(calculateMonthlyRevenue('Jan'))}
        </Badge>
      </div>

      <Tabs defaultValue="forecast" className="space-y-4">
        <TabsList>
          <TabsTrigger value="forecast">คาดการณ์ยอดขาย</TabsTrigger>
          <TabsTrigger value="seasonality">ปรับปรุงตามฤดูกาล</TabsTrigger>
          <TabsTrigger value="channels">ช่องทางและค่าธรรมเนียม</TabsTrigger>
          <TabsTrigger value="schedule">เวลาดำเนินการ</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                การคาดการณ์ยอดขายรายวัน
              </CardTitle>
              <CardDescription>
                ตั้งค่าจำนวนจานที่คาดว่าจะขายได้ต่อวัน
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="daily-forecast">จำนวนจานต่อวัน</Label>
                  <Input
                    id="daily-forecast"
                    type="number"
                    value={forecastDaily}
                    onChange={(e) => handleForecastChange(parseNumberInput(e.target.value))}
                    placeholder="120"
                  />
                  <p className="text-sm text-muted-foreground">
                    ยอดขายเฉลี่ยต่อวันที่คาดการณ์
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>ปรับด้วย Slider</Label>
                  <Slider
                    value={[forecastDaily]}
                    onValueChange={(value) => handleForecastChange(value[0])}
                    max={1000}
                    min={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>10 จาน</span>
                    <span>1,000 จาน</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <Card className="p-4">
                  <div className="text-sm font-medium text-muted-foreground">รายวัน</div>
                  <div className="text-xl font-bold">{forecastDaily} จาน</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm font-medium text-muted-foreground">รายสัปดาห์</div>
                  <div className="text-xl font-bold">{forecastDaily * 7} จาน</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm font-medium text-muted-foreground">รายเดือน</div>
                  <div className="text-xl font-bold">{forecastDaily * 30} จาน</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm font-medium text-muted-foreground">รายปี</div>
                  <div className="text-xl font-bold">{forecastDaily * 365} จาน</div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasonality" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover-lift card-animate">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">ยอดขายเฉลี่ย</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(
                        seasonalityKeys.reduce((sum, month) => 
                          sum + calculateMonthlyRevenue(month), 0
                        ) / 12
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover-lift card-animate">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">เดือนที่ดีที่สุด</p>
                    <p className="text-lg font-bold text-green-900">
                      {monthNames[seasonalityKeys.findIndex(month => 
                        calculateMonthlyRevenue(month) === Math.max(...seasonalityKeys.map(m => calculateMonthlyRevenue(m)))
                      )]}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover-lift card-animate">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-700">เดือนที่ต่ำสุด</p>
                    <p className="text-lg font-bold text-orange-900">
                      {monthNames[seasonalityKeys.findIndex(month => 
                        calculateMonthlyRevenue(month) === Math.min(...seasonalityKeys.map(m => calculateMonthlyRevenue(m)))
                      )]}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Seasonality Grid */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Calendar className="w-6 h-6" />
                ปรับปรุงตามฤดูกาล
              </CardTitle>
              <CardDescription className="text-purple-700">
                ลากแถบเลื่อนเพื่อปรับยอดขายในแต่ละเดือน (100% = ยอดปกติ)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {seasonalityKeys.map((month, index) => {
                  const percentage = localSeasonality[month] || 100;
                  const isHigh = percentage > 110;
                  const isLow = percentage < 90;
                  
                  return (
                    <div
                      key={month}
                      className={`group relative p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${
                        isHigh ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 hover:border-green-400' :
                        isLow ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 hover:border-red-400' :
                        'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 hover:border-blue-400'
                      }`}
                    >
                      {/* Month Header */}
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            isHigh ? 'bg-green-500' : isLow ? 'bg-red-500' : 'bg-blue-500'
                          }`} />
                          <Label className="text-sm font-semibold">{monthNames[index]}</Label>
                        </div>
                        <Badge
                          variant={isHigh ? 'default' : isLow ? 'destructive' : 'secondary'}
                          className="text-xs font-bold"
                        >
                          {percentage.toFixed(1)}%
                        </Badge>
                      </div>

                      {/* Interactive Slider */}
                      <div className="space-y-3">
                        <Slider
                          value={[percentage]}
                          onValueChange={(value) => handleSeasonalityChange(month, value[0])}
                          max={200}
                          min={25}
                          step={0.1}
                          className="w-full transition-opacity duration-200 group-hover:opacity-100 slider-smooth"
                        />

                        {/* Manual Input Field */}
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={25}
                            max={200}
                            step={0.1}
                            value={percentage.toFixed(1)}
                            onChange={(e) => handleSeasonalityInputChange(month, e.target.value)}
                            className={`h-8 text-xs text-center transition-all duration-200 ${
                              percentage < 25 || percentage > 200
                                ? 'border-red-300 bg-red-50 focus:border-red-500'
                                : 'border-input hover:border-accent-foreground/50 focus:border-accent-foreground'
                            }`}
                            placeholder="100"
                            title={`Valid range: 25% - 200% (Current: ${percentage.toFixed(1)}%)`}
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>

                        {/* Stats Display */}
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">จาน/เดือน</span>
                            <span className="font-medium">{calculateMonthlyUnits(month).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">รายได้</span>
                            <span className="font-bold text-green-600">
                              {formatCurrency(calculateMonthlyRevenue(month))}
                            </span>
                          </div>
                        </div>

                        {/* Visual Indicator */}
                        <div className="flex justify-center">
                          <div className={`w-full h-2 rounded-full ${
                            isHigh ? 'bg-gradient-to-r from-green-400 to-green-600' :
                            isLow ? 'bg-gradient-to-r from-red-400 to-red-600' :
                            'bg-gradient-to-r from-blue-400 to-blue-600'
                          }`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Summary Chart Placeholder */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader>
              <CardTitle className="text-indigo-900">สรุปยอดขายรายเดือน</CardTitle>
              <CardDescription className="text-indigo-700">
                ภาพรวมการเปลี่ยนแปลงยอดขายตลอดทั้งปี
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {seasonalityKeys.map((month, index) => {
                  const percentage = localSeasonality[month] || 100;
                  const height = Math.max(20, (percentage / 200) * 100);
                  
                  return (
                    <div key={month} className="flex flex-col items-center gap-1">
                      <div className="text-xs font-medium text-indigo-700">{monthNames[index]}</div>
                      <div 
                        className={`w-6 rounded-t transition-all duration-500 ${
                          percentage > 100 ? 'bg-gradient-to-t from-green-400 to-green-600' :
                          percentage < 90 ? 'bg-gradient-to-t from-red-400 to-red-600' :
                          'bg-gradient-to-t from-indigo-400 to-indigo-600'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                      <div className="text-xs text-indigo-600 font-medium">{percentage.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  ค่าธรรมเนียมการชำระเงิน
                </CardTitle>
                <CardDescription>
                  ค่าธรรมเนียมบัตรเครดิต/QR Payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-fee">ค่าธรรมเนียม (%)</Label>
                  <Input
                    id="payment-fee"
                    type="number"
                    step="0.1"
                    value={paymentFee}
                    onChange={(e) => handlePaymentFeeChange(parseFloat(e.target.value) || 0)}
                    placeholder="1.5"
                  />
                  <p className="text-sm text-muted-foreground">
                    ค่าธรรมเนียมเฉลี่ยของการชำระเงินแบบไม่ใช้เงินสด
                  </p>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">ผลกระทบต่อรายได้</div>
                  <div className="text-lg font-bold text-red-600">
                    -{formatCurrency((calculateMonthlyRevenue('Jan') * paymentFee) / 100)} /เดือน
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  ค่าคอมมิชชันเดลิเวอรี
                </CardTitle>
                <CardDescription>
                  ค่าคอมมิชชันแพลตฟอร์มเดลิเวอรี
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery-commission">ค่าคอมมิชชัน (%)</Label>
                  <Input
                    id="delivery-commission"
                    type="number"
                    step="0.1"
                    value={deliveryCommission}
                    onChange={(e) => handleDeliveryCommissionChange(parseFloat(e.target.value) || 0)}
                    placeholder="25"
                  />
                  <p className="text-sm text-muted-foreground">
                    ค่าคอมมิชชันของแพลตฟอร์มเดลิเวอรี (Grab, Foodpanda)
                  </p>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">ผลกระทบยอดเดลิเวอรี</div>
                  <div className="text-lg font-bold text-red-600">
                    -{formatCurrency((calculateMonthlyRevenue('Jan') * 0.1 * deliveryCommission) / 100)} /เดือน
                  </div>
                  <div className="text-xs text-muted-foreground">
                    สมมติเดลิเวอรี 10% ของยอดขาย
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                เวลาดำเนินการ
              </CardTitle>
              <CardDescription>
                ตั้งค่าวันและเวลาเปิด-ปิดร้าน
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>วันเปิดทำการ</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'].map((day, index) => (
                      <div key={day} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`day-${index}`}
                          defaultChecked={index < 6} // Default open Mon-Sat
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`day-${index}`} className="text-sm">{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="open-time">เวลาเปิด</Label>
                    <Input
                      id="open-time"
                      type="time"
                      defaultValue="07:00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="close-time">เวลาปิด</Label>
                    <Input
                      id="close-time"
                      type="time"
                      defaultValue="15:00"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900">ข้อมูลสรุป</div>
                <div className="text-sm text-blue-700">
                  เปิดทำการ 6 วัน/สัปดาห์ × 8 ชั่วโมง/วัน = 48 ชั่วโมง/สัปดาห์
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}