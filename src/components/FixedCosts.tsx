import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Calculator, Plus, Edit, Trash2, Home, Wifi, Wrench, TrendingDown } from 'lucide-react';
import { formatCurrency, parseNumberInput } from '../lib/utils';
import { FixedCost } from '../lib/finance-engine';
import { useFinanceState } from '../hooks/useFinanceState';

export default function FixedCosts() {
  const { data, updateFixedCosts } = useFinanceState();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newFixedCost, setNewFixedCost] = useState<FixedCost>({
    id: '',
    name: '',
    amountPerMonth: 0
  });

  // Use data from global state instead of local state
  const fixedCosts: FixedCost[] = data?.fixedCosts || [];

  const resetNewFixedCost = () => {
    setNewFixedCost({
      id: '',
      name: '',
      amountPerMonth: 0
    });
  };

  const getTotalMonthlyCost = (): number => {
    return fixedCosts.reduce((total, cost) => total + cost.amountPerMonth, 0);
  };

  const getTotalYearlyCost = (): number => {
    return getTotalMonthlyCost() * 12;
  };

  const handleSaveFixedCost = () => {
    const costId = newFixedCost.id || `fixed_${Date.now()}`;
    const costToSave = { ...newFixedCost, id: costId };

    const updatedFixedCosts = editingIndex !== null
      ? fixedCosts.map((cost, index) => index === editingIndex ? costToSave : cost)
      : [...fixedCosts, costToSave];

    // Avoid calling update if nothing changed
    try {
      const currentString = JSON.stringify(fixedCosts);
      const updatedString = JSON.stringify(updatedFixedCosts);
      if (currentString === updatedString) {
        // no-op
      } else {
        // Use the global state manager instead of direct financeEngine calls
        updateFixedCosts(updatedFixedCosts);
      }
    } catch (e) {
      updateFixedCosts(updatedFixedCosts);
    }

    resetNewFixedCost();
    setEditingIndex(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (index: number) => {
    setNewFixedCost(fixedCosts[index]);
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    const updatedFixedCosts = fixedCosts.filter((_, i) => i !== index);
    try {
      const currentString = JSON.stringify(fixedCosts);
      const updatedString = JSON.stringify(updatedFixedCosts);
      if (currentString !== updatedString) {
        updateFixedCosts(updatedFixedCosts);
      }
    } catch (e) {
      updateFixedCosts(updatedFixedCosts);
    }
  };

  const getCostIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('เช่า') || lowerName.includes('rent')) return <Home className="w-4 h-4" />;
    if (lowerName.includes('เน็ต') || lowerName.includes('internet')) return <Wifi className="w-4 h-4" />;
    if (lowerName.includes('ซ่อม') || lowerName.includes('maintenance')) return <Wrench className="w-4 h-4" />;
    if (lowerName.includes('เสื่อม') || lowerName.includes('depreciation')) return <TrendingDown className="w-4 h-4" />;
    return <Calculator className="w-4 h-4" />;
  };

  const getCostCategory = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('เช่า') || lowerName.includes('rent')) return 'เช่าและค่าธรรมเนียม';
    if (lowerName.includes('เน็ต') || lowerName.includes('internet') || lowerName.includes('โทร')) return 'สื่อสาร';
    if (lowerName.includes('ซ่อม') || lowerName.includes('maintenance')) return 'ซ่อมบำรุง';
    if (lowerName.includes('เสื่อม') || lowerName.includes('depreciation')) return 'ค่าเสื่อมราคา';
    if (lowerName.includes('ประกัน') || lowerName.includes('insurance')) return 'ประกัน';
    if (lowerName.includes('ใบอนุญาต') || lowerName.includes('license')) return 'ใบอนุญาต';
    return 'อื่น ๆ';
  };

  const groupedCosts = fixedCosts.reduce((groups: Record<string, FixedCost[]>, cost: FixedCost) => {
    const category = getCostCategory(cost.name);
    if (!groups[category]) groups[category] = [];
    groups[category].push(cost);
    return groups;
  }, {} as Record<string, FixedCost[]>);

  const predefinedCosts = [
    { name: 'ค่าเช่าพื้นที่', amount: 0, category: 'เช่าและค่าธรรมเนียม' },
    { name: 'ค่าอินเทอร์เน็ต', amount: 700, category: 'สื่อสาร' },
    { name: 'ค่าโทรศัพท์', amount: 300, category: 'สื่อสาร' },
    { name: 'ค่าซ่อมบำรุงขั้นต่ำ', amount: 1000, category: 'ซ่อมบำรุง' },
    { name: 'ค่าเสื่อมราคาอุปกรณ์', amount: 1500, category: 'ค่าเสื่อมราคา' },
    { name: 'ประกันอุบัติเหตุ', amount: 500, category: 'ประกัน' },
    { name: 'ใบอนุญาตประกอบการ', amount: 200, category: 'ใบอนุญาต' },
    { name: 'ค่าสมาชิกธนาคาร', amount: 50, category: 'เช่าและค่าธรรมเนียม' }
  ];

  // Local editable amounts to allow inline editing in the table
  const [editingAmounts, setEditingAmounts] = useState<Record<string, number>>({});
  const commitTimeouts = useRef<Record<string, any>>({});

  useEffect(() => {
    // When fixedCosts come from global state, reset any stale local edits for removed items
    const ids = new Set(fixedCosts.map(c => c.id));
    setEditingAmounts(prev => {
      const next: Record<string, number> = {};
      for (const id of Object.keys(prev)) {
        if (ids.has(id)) next[id] = prev[id];
      }
      return next;
    });
  }, [fixedCosts]);

  const scheduleCommitAmount = (id: string, amount: number) => {
    // debounce commit per-row
    if (commitTimeouts.current[id]) {
      clearTimeout(commitTimeouts.current[id]);
    }
    commitTimeouts.current[id] = setTimeout(() => {
      commitAmount(id);
      delete commitTimeouts.current[id];
    }, 600);
  };

  const commitAmount = (id: string) => {
    const amount = editingAmounts[id];
    // find existing cost
    const existing = fixedCosts.find(c => c.id === id);
    if (!existing) return;
    const newAmount = typeof amount === 'number' ? amount : existing.amountPerMonth;
    if (existing.amountPerMonth === newAmount) return;

    const updatedFixedCosts = fixedCosts.map(c => c.id === id ? { ...c, amountPerMonth: newAmount } : c);
    try {
      const currentString = JSON.stringify(fixedCosts);
      const updatedString = JSON.stringify(updatedFixedCosts);
      if (currentString !== updatedString) {
        updateFixedCosts(updatedFixedCosts);
      }
    } catch (e) {
      updateFixedCosts(updatedFixedCosts);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ค่าใช้จ่ายคงที่</h2>
          <p className="text-muted-foreground">จัดการต้นทุนที่ไม่เปลี่ยนแปลงตามปริมาณการขาย</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">ต้นทุนรวม/เดือน</div>
            <div className="text-xl font-bold">{formatCurrency(getTotalMonthlyCost())}</div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetNewFixedCost(); setEditingIndex(null); }}>
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มรายการ
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingIndex !== null ? 'แก้ไขค่าใช้จ่ายคงที่' : 'เพิ่มค่าใช้จ่ายคงที่'}
                </DialogTitle>
                <DialogDescription>
                  กรอกรายการค่าใช้จ่ายที่เกิดขึ้นประจำทุกเดือน
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cost-name">รายการ</Label>
                  <Input
                    id="cost-name"
                    value={newFixedCost.name}
                    onChange={(e) => setNewFixedCost(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="ค่าเช่า, ค่าไฟฟ้าพื้นฐาน, ค่าประกัน"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">จำนวนเงิน/เดือน (บาท)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newFixedCost.amountPerMonth}
                    onChange={(e) => setNewFixedCost(prev => ({ ...prev, amountPerMonth: parseNumberInput(e.target.value) }))}
                    onBlur={() => {
                      // Auto-save on blur for better UX - only when changed
                      if (newFixedCost.name && newFixedCost.amountPerMonth > 0) {
                        const costId = newFixedCost.id || `fixed_${Date.now()}`;
                        const costToSave = { ...newFixedCost, id: costId };
                        const updatedFixedCosts = editingIndex !== null
                          ? fixedCosts.map((cost, index) => index === editingIndex ? costToSave : cost)
                          : [...fixedCosts, costToSave];
                        try {
                          const currentString = JSON.stringify(fixedCosts);
                          const updatedString = JSON.stringify(updatedFixedCosts);
                          if (currentString !== updatedString) {
                            updateFixedCosts(updatedFixedCosts);
                          }
                        } catch (e) {
                          updateFixedCosts(updatedFixedCosts);
                        }
                      }
                    }}
                    placeholder="1000"
                  />
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">ประเภท: {getCostCategory(newFixedCost.name)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ต้นทุนต่อปี: {formatCurrency(newFixedCost.amountPerMonth * 12)}
                  </div>
                </div>

                {/* Quick Add Buttons */}
                <div className="space-y-2">
                  <Label>เพิ่มรายการแนะนำ:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {predefinedCosts.map((cost, index: number) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setNewFixedCost(prev => ({ 
                          ...prev, 
                          name: cost.name, 
                          amountPerMonth: cost.amount 
                        }))}
                      >
                        {cost.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleSaveFixedCost}>
                  {editingIndex !== null ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">ต้นทุนรวม/เดือน</div>
          <div className="text-2xl font-bold">{formatCurrency(getTotalMonthlyCost())}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">ต้นทุนรวม/ปี</div>
          <div className="text-2xl font-bold">{formatCurrency(getTotalYearlyCost())}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">จำนวนรายการ</div>
          <div className="text-2xl font-bold">{fixedCosts.length} รายการ</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">เฉลี่ย/รายการ</div>
          <div className="text-2xl font-bold">
            {fixedCosts.length > 0 ? formatCurrency(getTotalMonthlyCost() / fixedCosts.length) : formatCurrency(0)}
          </div>
        </Card>
      </div>

      {/* Fixed Costs Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการค่าใช้จ่ายคงที่</CardTitle>
          <CardDescription>
            ค่าใช้จ่ายที่เกิดขึ้นประจำทุกเดือนโดยไม่ขึ้นกับปริมาณการขาย
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รายการ</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead className="text-right">จำนวน/เดือน</TableHead>
                <TableHead className="text-right">จำนวน/ปี</TableHead>
                <TableHead className="text-right">สัดส่วน</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fixedCosts.map((cost: FixedCost, index: number) => (
                <TableRow key={cost.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getCostIcon(cost.name)}
                      {cost.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCostCategory(cost.name)}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <Input
                      type="number"
                      value={editingAmounts[cost.id] ?? cost.amountPerMonth}
                      onChange={(e) => {
                        const val = parseNumberInput(e.target.value);
                        setEditingAmounts(prev => ({ ...prev, [cost.id]: val }));
                        scheduleCommitAmount(cost.id, val);
                      }}
                      onBlur={() => commitAmount(cost.id)}
                      className="text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency((editingAmounts[cost.id] ?? cost.amountPerMonth) * 12)}
                  </TableCell>
                  <TableCell className="text-right">
                    {getTotalMonthlyCost() > 0 ? 
                      `${((cost.amountPerMonth / getTotalMonthlyCost()) * 100).toFixed(1)}%` : 
                      '0%'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(index)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Grouped by Category */}
      <Card>
        <CardHeader>
          <CardTitle>สรุปตามประเภท</CardTitle>
          <CardDescription>แสดงค่าใช้จ่ายคงที่จัดกลุ่มตามประเภท</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(groupedCosts as Record<string, FixedCost[]>).map(([category, costs]: [string, FixedCost[]]) => {
              const categoryTotal = costs.reduce((sum: number, cost: FixedCost) => sum + cost.amountPerMonth, 0);
              const categoryPercentage = getTotalMonthlyCost() > 0 ? 
                (categoryTotal / getTotalMonthlyCost()) * 100 : 0;
              
              return (
                <Card key={category} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{category}</h4>
                    <Badge variant="secondary">{costs.length} รายการ</Badge>
                  </div>
                  
                    <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    {costs.map((cost: FixedCost) => (
                      <div key={cost.id} className="flex justify-between">
                        <span>{cost.name}</span>
                        <span>{formatCurrency(cost.amountPerMonth)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">รวม/เดือน:</span>
                      <span className="font-bold">{formatCurrency(categoryTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>สัดส่วน:</span>
                      <span>{categoryPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>การวิเคราะห์ค่าใช้จ่ายคงที่</CardTitle>
          <CardDescription>ตัวชี้วัดและข้อเสนอแนะ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-900">ต้นทุนคงที่/วัน</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(getTotalMonthlyCost() / 30)}
              </div>
              <div className="text-xs text-blue-700">
                จำนวนเงินที่ต้องชดเชยทุกวัน
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-900">Break-Even ประมาณ</div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round((getTotalMonthlyCost() / 30) / 40)} จาน/วัน
              </div>
              <div className="text-xs text-green-700">
                สมมติ CM เฉลี่ย 40 บาท/จาน
              </div>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm font-medium text-orange-900">รายการสูงสุด</div>
              <div className="text-2xl font-bold text-orange-600">
                {fixedCosts.length > 0 ? formatCurrency(Math.max(...fixedCosts.map(c => c.amountPerMonth))) : formatCurrency(0)}
              </div>
              <div className="text-xs text-orange-700">
                {fixedCosts.length > 0 ? 
                  fixedCosts.find(c => c.amountPerMonth === Math.max(...fixedCosts.map(cost => cost.amountPerMonth)))?.name :
                  'ไม่มีข้อมูล'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}