import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, BarChart3 } from 'lucide-react';
import { formatCurrency, formatPercent, formatNumber } from '../lib/utils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  currentScenario: string;
  financialData: any;
}

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  status?: 'good' | 'warning' | 'danger';
  description?: string;
}

function KPICard({ title, value, change, icon, status = 'good', description }: KPICardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'danger': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={getStatusColor()}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground">
            {change > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {formatPercent(Math.abs(change))} จากเดือนที่แล้ว
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard({ currentScenario, financialData }: DashboardProps) {
  if (!financialData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p>กำลังโหลดข้อมูลการเงิน...</p>
        </div>
      </div>
    );
  }

  // Safe destructuring with fallback values to prevent runtime errors
  const kpis = financialData?.kpis || {
    revenue: 0,
    grossProfit: 0,
    operatingProfit: 0,
    primeCostPct: 0,
    foodCostPct: 0,
    laborPct: 0,
    bepPerDay: 0,
    safetyMargin: 0,
    cmPct: 0
  };
  const pnl = financialData?.pnl || {
    daily: { revenue: 0, cogs: 0, grossProfit: 0, operatingExpenses: 0, operatingProfit: 0 },
    monthly: { revenue: 0, cogs: 0, grossProfit: 0, operatingExpenses: 0, operatingProfit: 0 }
  };
  const menus = financialData?.menus || [];

  // Sample data for charts
  const monthlyData = [
    { month: 'ม.ค.', revenue: 180000, costs: 120000, profit: 60000 },
    { month: 'ก.พ.', revenue: 190000, costs: 125000, profit: 65000 },
    { month: 'มี.ค.', revenue: 200000, costs: 130000, profit: 70000 },
    { month: 'เม.ย.', revenue: 210000, costs: 135000, profit: 75000 },
    { month: 'พ.ค.', revenue: 195000, costs: 128000, profit: 67000 },
    { month: 'มิ.ย.', revenue: 205000, costs: 132000, profit: 73000 },
  ];

  // Safe cost breakdown with null checks
  const costBreakdown = [
    { name: 'วัตถุดิบ', value: kpis?.foodCostPct || 0, color: '#8884d8' },
    { name: 'แรงงาน', value: kpis?.laborPct || 0, color: '#82ca9d' },
    { name: 'ค่าใช้จ่ายคงที่', value: Math.max(0, 100 - (kpis?.foodCostPct || 0) - (kpis?.laborPct || 0)), color: '#ffc658' },
  ];

  const getKPIStatus = (metric: string, value: number) => {
    switch (metric) {
      case 'primeCost':
        return value > 65 ? 'danger' : value > 55 ? 'warning' : 'good';
      case 'foodCost':
        return value > 35 ? 'danger' : value > 30 ? 'warning' : 'good';
      case 'safetyMargin':
        return value < 20 ? 'danger' : value < 40 ? 'warning' : 'good';
      default:
        return 'good';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Scenario Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">แดชบอร์ดการเงิน</h2>
          <p className="text-muted-foreground">ภาพรวมผลการดำเนินงานและตัวชี้วัดสำคัญ</p>
        </div>
        <Badge variant="outline" className="text-sm">
          สถานการณ์: {currentScenario === 'base' ? 'ฐาน (Base)' : currentScenario}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="รายได้รายวัน"
          value={formatCurrency(kpis.revenue)}
          icon={<DollarSign className="h-4 w-4" />}
          description="จากยอดขายประมาณ"
        />
        
        <KPICard
          title="กำไรขั้นต้น"
          value={formatCurrency(kpis.grossProfit)}
          icon={<TrendingUp className="h-4 w-4" />}
          description={`อัตรากำไรขั้นต้น ${formatPercent((kpis.grossProfit / kpis.revenue) * 100)}`}
        />
        
        <KPICard
          title="Prime Cost %"
          value={formatPercent(kpis.primeCostPct)}
          status={getKPIStatus('primeCost', kpis.primeCostPct)}
          icon={<Target className="h-4 w-4" />}
          description="วัตถุดิบ + แรงงานโดยตรง"
        />
        
        <KPICard
          title="จุดคุ้มทุน/วัน"
          value={`${formatNumber(kpis.bepPerDay)} จาน`}
          icon={<Target className="h-4 w-4" />}
          description={`Safety Margin: ${formatPercent(kpis.safetyMargin)}`}
          status={getKPIStatus('safetyMargin', kpis.safetyMargin)}
        />
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Food Cost %</div>
          <div className="text-xl font-bold mt-1">{formatPercent(kpis.foodCostPct)}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Labor %</div>
          <div className="text-xl font-bold mt-1">{formatPercent(kpis.laborPct)}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Avg Ticket</div>
          <div className="text-xl font-bold mt-1">{formatCurrency(kpis.avgTicket)}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">CM %</div>
          <div className="text-xl font-bold mt-1">{formatPercent(kpis.cmPct)}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Operating Profit</div>
          <div className="text-xl font-bold mt-1">{formatCurrency(kpis.operatingProfit)}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">BEP Units/Month</div>
          <div className="text-xl font-bold mt-1">{formatNumber(kpis.bepUnits)}</div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>แนวโน้มรายได้และกำไร</CardTitle>
            <CardDescription>6 เดือนที่ผ่านมา</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="รายได้"
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="กำไร"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle>โครงสร้างต้นทุน</CardTitle>
            <CardDescription>สัดส่วนต้นทุนต่อรายได้</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatPercent(value)}`}
                >
                  {costBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatPercent(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Menu Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>ผลการดำเนินงานรายเมนู</CardTitle>
          <CardDescription>Unit Economics ของแต่ละรายการอาหาร</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">เมนู</th>
                  <th className="text-right py-2">ราคาขาย</th>
                  <th className="text-right py-2">ต้นทุนผันแปร</th>
                  <th className="text-right py-2">Contribution Margin</th>
                  <th className="text-right py-2">CM %</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((menu: any) => (
                  <tr key={menu.id} className="border-b">
                    <td className="py-2 font-medium">{menu.name}</td>
                    <td className="text-right py-2">{formatCurrency(menu.price)}</td>
                    <td className="text-right py-2">{formatCurrency(menu.vc)}</td>
                    <td className="text-right py-2">{formatCurrency(menu.cm)}</td>
                    <td className="text-right py-2">
                      <Badge 
                        variant={menu.cmPct > 60 ? 'default' : menu.cmPct > 40 ? 'secondary' : 'destructive'}
                      >
                        {formatPercent(menu.cmPct)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            ข้อเสนอแนะการปรับปรุง
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {kpis.primeCostPct > 60 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Prime Cost สูงเกินมาตรฐาน</p>
                  <p className="text-sm text-red-700">ควรลดต้นทุนวัตถุดิบหรือปรับปรุงประสิทธิภาพแรงงาน</p>
                </div>
              </div>
            )}
            
            {kpis.safetyMargin < 30 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Safety Margin ต่ำ</p>
                  <p className="text-sm text-yellow-700">ควรเพิ่มยอดขายหรือลดต้นทุนคงที่เพื่อความปลอดภัยทางการเงิน</p>
                </div>
              </div>
            )}
            
            {menus.some((m: any) => m.cmPct < 40) && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">เมนูที่ควรปรับปรุง CM</p>
                  <p className="text-sm text-blue-700">บางเมนูมี Contribution Margin ต่ำ ควรทบทวนราคาขายหรือต้นทุน</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}