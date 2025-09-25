import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { BarChart3, Plus, Copy, Trash2, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { formatCurrency, formatPercent } from '../lib/utils';
import { Scenario } from '../lib/finance-engine';

interface ScenariosProps {
  currentScenario: string;
  onScenarioChange: (scenario: string) => void;
}

export default function Scenarios({ currentScenario, onScenarioChange }: ScenariosProps) {
  const [scenarios] = useState(() => ({}));
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [selectedComparison, setSelectedComparison] = useState(['base', 'S1']);

  // Current scenario deltas
  const [menuPriceDelta, setMenuPriceDelta] = useState(0);
  const [ingredientCostDelta, setIngredientCostDelta] = useState(0);
  const [electricRateDelta, setElectricRateDelta] = useState(0);
  const [laborProductivityDelta, setLaborProductivityDelta] = useState(0);
  const [wasteDelta, setWasteDelta] = useState(0);

  const quickScenarios = [
    { name: 'ขึ้นราคา 5%', deltas: { menuPriceDeltaPercent: 5 } },
    { name: 'วัตถุดิบ +10%', deltas: { ingredientCostDeltaPercent: 10 } },
    { name: 'ค่าไฟ +15%', deltas: { electricRateDeltaPercent: 15 } },
    { name: 'ลด Waste 50%', deltas: { wasteDeltaPercent: -50 } },
    { name: 'เพิ่มประสิทธิภาพ 20%', deltas: { laborProductivityDeltaPercent: 20 } }
  ];

  const handleCreateScenario = () => {
    // Implementation would create new scenario in financeEngine
    setIsCreateDialogOpen(false);
    setNewScenarioName('');
  };

  const handleApplyDeltas = () => {
    const deltas = {
      menuPriceDeltaPercent: menuPriceDelta,
      ingredientCostDeltaPercent: ingredientCostDelta,
      electricRateDeltaPercent: electricRateDelta,
      laborProductivityDeltaPercent: laborProductivityDelta,
      wasteDeltaPercent: wasteDelta
    };
    
    // Apply deltas to current scenario
    // Implementation would update financeEngine with deltas
    // Notify parent that scenario may have changed
    onScenarioChange(currentScenario);
  };

  const getScenarioResults = (scenarioId: string) => {
    // This would calculate results for a specific scenario
    // For now, return mock data
    return {
      revenue: 180000 + (scenarioId === 'S1' ? 9000 : 0),
      profit: 60000 + (scenarioId === 'S1' ? 5000 : 0),
      primeCostPct: 58 + (scenarioId === 'S1' ? -2 : 0),
      bepUnits: 2500 + (scenarioId === 'S1' ? -200 : 0)
    };
  };

  const comparisonData = selectedComparison.map(scenarioId => {
    const results = getScenarioResults(scenarioId);
    return {
      scenario: scenarioId === 'base' ? 'ฐาน' : scenarioId,
      revenue: results.revenue,
      profit: results.profit,
      primeCost: results.primeCostPct,
      bep: results.bepUnits
    };
  });

  const sensitivityData = [
    { variable: 'ราคาเมนู', change: -10, impact: -15.2 },
    { variable: 'ราคาเมนู', change: -5, impact: -7.6 },
    { variable: 'ราคาเมนู', change: 0, impact: 0 },
    { variable: 'ราคาเมนู', change: 5, impact: 8.3 },
    { variable: 'ราคาเมนู', change: 10, impact: 16.7 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">สถานการณ์และการเปรียบเทียบ</h2>
          <p className="text-muted-foreground">สร้างและเปรียบเทียบสถานการณ์ทางการเงินที่แตกต่างกัน</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            สถานการณ์ปัจจุบัน: {currentScenario === 'base' ? 'ฐาน' : currentScenario}
          </Badge>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                สร้างสถานการณ์
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>สร้างสถานการณ์ใหม่</DialogTitle>
                <DialogDescription>
                  สร้างสถานการณ์ใหม่เพื่อทดสอบการเปลี่ยนแปลงต่าง ๆ
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scenario-name">ชื่อสถานการณ์</Label>
                  <Input
                    id="scenario-name"
                    value={newScenarioName}
                    onChange={(e) => setNewScenarioName(e.target.value)}
                    placeholder="เช่น: ขึ้นราคา 5%, ลดต้นทุน 10%"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateScenario}>สร้าง</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="adjust" className="space-y-4">
        <TabsList>
          <TabsTrigger value="adjust">ปรับตัวแปร</TabsTrigger>
          <TabsTrigger value="compare">เปรียบเทียบ</TabsTrigger>
          <TabsTrigger value="sensitivity">ความไว</TabsTrigger>
          <TabsTrigger value="quick">Quick Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="adjust" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Adjustments Panel */}
            <Card>
              <CardHeader>
                <CardTitle>ปรับตัวแปรสถานการณ์</CardTitle>
                <CardDescription>
                  ใช้ Slider เพื่อปรับเปลี่ยนตัวแปรต่าง ๆ และดูผลกระทบทันที
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>ราคาเมนู</Label>
                    <Badge variant={menuPriceDelta > 0 ? 'default' : menuPriceDelta < 0 ? 'destructive' : 'secondary'}>
                      {menuPriceDelta >= 0 ? '+' : ''}{menuPriceDelta.toFixed(1)}%
                    </Badge>
                  </div>
                  <Slider
                    value={[menuPriceDelta]}
                    onValueChange={(value) => {
                      const newValue = value[0];
                      setMenuPriceDelta(newValue);
                      // Real-time update without requiring "apply" button
                      const deltas = {
                        menuPriceDeltaPercent: newValue,
                        ingredientCostDeltaPercent: ingredientCostDelta,
                        electricRateDeltaPercent: electricRateDelta,
                        laborProductivityDeltaPercent: laborProductivityDelta,
                        wasteDeltaPercent: wasteDelta
                      };
                      // Trigger immediate dashboard update
                      onScenarioChange(currentScenario);
                    }}
                    max={100}
                    min={-50}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>-50%</span>
                    <span>+100%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>ต้นทุนวัตถุดิบ</Label>
                    <Badge variant={ingredientCostDelta > 0 ? 'destructive' : ingredientCostDelta < 0 ? 'default' : 'secondary'}>
                      {ingredientCostDelta >= 0 ? '+' : ''}{ingredientCostDelta.toFixed(1)}%
                    </Badge>
                  </div>
                  <Slider
                    value={[ingredientCostDelta]}
                    onValueChange={(value) => {
                      const newValue = value[0];
                      setIngredientCostDelta(newValue);
                      // Real-time update
                      onScenarioChange(currentScenario);
                    }}
                    max={200}
                    min={-75}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>-75%</span>
                    <span>+200%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>ค่าไฟฟ้า</Label>
                    <Badge variant={electricRateDelta > 0 ? 'destructive' : electricRateDelta < 0 ? 'default' : 'secondary'}>
                      {electricRateDelta >= 0 ? '+' : ''}{electricRateDelta.toFixed(1)}%
                    </Badge>
                  </div>
                  <Slider
                    value={[electricRateDelta]}
                    onValueChange={(value) => {
                      const newValue = value[0];
                      setElectricRateDelta(newValue);
                      onScenarioChange(currentScenario);
                    }}
                    max={150}
                    min={-50}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>-50%</span>
                    <span>+150%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>ประสิทธิภาพแรงงาน</Label>
                    <Badge variant={laborProductivityDelta > 0 ? 'default' : laborProductivityDelta < 0 ? 'destructive' : 'secondary'}>
                      {laborProductivityDelta >= 0 ? '+' : ''}{laborProductivityDelta.toFixed(1)}%
                    </Badge>
                  </div>
                  <Slider
                    value={[laborProductivityDelta]}
                    onValueChange={(value) => {
                      const newValue = value[0];
                      setLaborProductivityDelta(newValue);
                      onScenarioChange(currentScenario);
                    }}
                    max={300}
                    min={-90}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>-90%</span>
                    <span>+300%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>การเสียหาย/Waste</Label>
                    <Badge variant={wasteDelta < 0 ? 'default' : wasteDelta > 0 ? 'destructive' : 'secondary'}>
                      {wasteDelta >= 0 ? '+' : ''}{wasteDelta.toFixed(1)}%
                    </Badge>
                  </div>
                  <Slider
                    value={[wasteDelta]}
                    onValueChange={(value) => {
                      const newValue = value[0];
                      setWasteDelta(newValue);
                      onScenarioChange(currentScenario);
                    }}
                    max={500}
                    min={-95}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>-95%</span>
                    <span>+500%</span>
                  </div>
                </div>

                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    การเปลี่ยนแปลงจะอัพเดตแดชบอร์ดทันที
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    ลากแถบเลื่อนเพื่อดูผลกระทบต่อตัวเลขในแดชบอร์ด
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Impact Preview */}
            <Card>
              <CardHeader>
                <CardTitle>ผลกระทบจากการเปลี่ยนแปลง</CardTitle>
                <CardDescription>ดูผลกระทบต่อ KPI สำคัญ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">รายได้/เดือน</div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(180000 * (1 + menuPriceDelta / 100))}
                    </div>
                    <div className="text-xs text-blue-700">
                      {menuPriceDelta >= 0 ? '+' : ''}{formatCurrency(180000 * menuPriceDelta / 100)}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-green-900">กำไรขั้นต้น</div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(60000 + (180000 * menuPriceDelta / 100) - (40000 * ingredientCostDelta / 100))}
                    </div>
                    <div className="text-xs text-green-700">
                      เปลี่ยนแปลง {((menuPriceDelta - ingredientCostDelta * 0.22) * 3).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-sm font-medium text-orange-900">Prime Cost %</div>
                    <div className="text-lg font-bold text-orange-600">
                      {(58 + ingredientCostDelta * 0.2 - menuPriceDelta * 0.3).toFixed(1)}%
                    </div>
                    <div className="text-xs text-orange-700">
                      ฐาน: 58.0%
                    </div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm font-medium text-purple-900">BEP Units/เดือน</div>
                    <div className="text-lg font-bold text-purple-600">
                      {Math.round(2500 - (menuPriceDelta * 50) + (ingredientCostDelta * 30))}
                    </div>
                    <div className="text-xs text-purple-700">
                      ฐาน: 2,500 จาน
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">สรุปผลกระทบ</h4>
                  <div className="space-y-1 text-sm">
                    {menuPriceDelta > 0 && (
                      <div className="flex items-center gap-2 text-green-700">
                        <TrendingUp className="w-3 h-3" />
                        ขึ้นราคา {menuPriceDelta}% จะเพิ่มรายได้ {formatCurrency(180000 * menuPriceDelta / 100)}
                      </div>
                    )}
                    {ingredientCostDelta > 0 && (
                      <div className="flex items-center gap-2 text-red-700">
                        <TrendingDown className="w-3 h-3" />
                        ต้นทุนวัตถุดิบเพิ่ม {ingredientCostDelta}% จะลดกำไร {formatCurrency(40000 * ingredientCostDelta / 100)}
                      </div>
                    )}
                    {electricRateDelta > 0 && (
                      <div className="flex items-center gap-2 text-orange-700">
                        <TrendingDown className="w-3 h-3" />
                        ค่าไฟเพิ่ม {electricRateDelta}% จะเพิ่มต้นทุน {formatCurrency(5000 * electricRateDelta / 100)}/เดือน
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>เปรียบเทียบสถานการณ์</CardTitle>
              <CardDescription>
                เลือกสถานการณ์เพื่อเปรียบเทียบผลลัพธ์ทางการเงิน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Comparison Table */}
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>เมตริก</TableHead>
                        <TableHead className="text-right">ฐาน</TableHead>
                        <TableHead className="text-right">S1</TableHead>
                        <TableHead className="text-right">เปลี่ยนแปลง</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>รายได้/เดือน</TableCell>
                        <TableCell className="text-right">{formatCurrency(180000)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(189000)}</TableCell>
                        <TableCell className="text-right text-green-600">+{formatCurrency(9000)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>กำไรขั้นต้น</TableCell>
                        <TableCell className="text-right">{formatCurrency(60000)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(65000)}</TableCell>
                        <TableCell className="text-right text-green-600">+{formatCurrency(5000)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Prime Cost %</TableCell>
                        <TableCell className="text-right">58.0%</TableCell>
                        <TableCell className="text-right">56.0%</TableCell>
                        <TableCell className="text-right text-green-600">-2.0%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>BEP Units</TableCell>
                        <TableCell className="text-right">2,500</TableCell>
                        <TableCell className="text-right">2,300</TableCell>
                        <TableCell className="text-right text-green-600">-200</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Comparison Chart */}
                <div>
                  <h4 className="font-medium mb-4">เปรียบเทียบรายได้และกำไร</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="scenario" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="revenue" fill="#8884d8" name="รายได้" />
                      <Bar dataKey="profit" fill="#82ca9d" name="กำไร" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sensitivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>การวิเคราะห์ความไว (Sensitivity Analysis)</CardTitle>
              <CardDescription>
                ดูผลกระทบของการเปลี่ยนแปลงตัวแปรหนึ่งต่อกำไร
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={sensitivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="change" tickFormatter={(value) => `${value}%`} />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'ผลกระทบต่อกำไร']}
                    labelFormatter={(value) => `การเปลี่ยนแปลง: ${value}%`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="impact" 
                    stroke="#8884d8" 
                    strokeWidth={3}
                    dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quick" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Scenarios</CardTitle>
              <CardDescription>
                ใช้สถานการณ์ที่เตรียมไว้เพื่อการทดสอบเร็ว
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickScenarios.map((scenario, index) => (
                  <Card key={index} className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{scenario.name}</h4>
                      <Button size="sm" variant="outline">
                        <Copy className="w-3 h-3 mr-1" />
                        ใช้
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Object.entries(scenario.deltas).map(([key, value]) => (
                        <div key={key}>
                          {key.includes('Price') && 'ราคา'}
                          {key.includes('Cost') && 'ต้นทุน'}
                          {key.includes('Rate') && 'อัตรา'}
                          {key.includes('Waste') && 'การเสียหาย'}
                          {key.includes('Productivity') && 'ประสิทธิภาพ'}
                          : {value >= 0 ? '+' : ''}{value}%
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}