import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Users, Plus, Edit, Trash2, Calculator, Clock, DollarSign } from 'lucide-react';
import { formatCurrency, parseNumberInput } from '../lib/utils';
import { LaborItem } from '../lib/finance-engine';
import { useFinanceState } from '../hooks/useFinanceState';

export default function LaborModel() {
  const { data, updateLabor } = useFinanceState();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newLaborItem, setNewLaborItem] = useState<LaborItem>({
    id: '',
    role: '',
    type: 'direct',
    wagePerHour: 45,
    hoursPerDay: 8,
    daysPerWeek: 6
  });

  // Use data from global state instead of local state
  const laborItems: LaborItem[] = data?.labor || [];

  const resetNewLaborItem = () => {
    setNewLaborItem({
      id: '',
      role: '',
      type: 'direct',
      wagePerHour: 45,
      hoursPerDay: 8,
      daysPerWeek: 6
    });
  };

  const calculateDailyWage = (item: LaborItem): number => {
    return item.wagePerHour * item.hoursPerDay;
  };

  const calculateWeeklyWage = (item: LaborItem): number => {
    return calculateDailyWage(item) * item.daysPerWeek;
  };

  const calculateMonthlyWage = (item: LaborItem): number => {
    return calculateWeeklyWage(item) * 4.33; // Average weeks per month
  };

  const getTotalMonthlyCost = (): number => {
    return laborItems.reduce((total: number, item: LaborItem) => total + calculateMonthlyWage(item), 0);
  };

  const getDirectLaborCost = (): number => {
    return laborItems
      .filter((item: LaborItem) => item.type === 'direct')
      .reduce((total: number, item: LaborItem) => total + calculateMonthlyWage(item), 0);
  };

  const getIndirectLaborCost = (): number => {
    return laborItems
      .filter((item: LaborItem) => item.type === 'indirect')
      .reduce((total: number, item: LaborItem) => total + calculateMonthlyWage(item), 0);
  };

  const handleSaveLaborItem = () => {
    const itemId = newLaborItem.id || `labor_${Date.now()}`;
    const itemToSave = { ...newLaborItem, id: itemId };

    const updatedLaborItems = editingIndex !== null
      ? laborItems.map((item: LaborItem, index: number) => index === editingIndex ? itemToSave : item)
      : [...laborItems, itemToSave];

    try {
      const currentString = JSON.stringify(laborItems);
      const updatedString = JSON.stringify(updatedLaborItems);
      if (currentString !== updatedString) {
        updateLabor(updatedLaborItems);
      }
    } catch (e) {
      updateLabor(updatedLaborItems);
    }

    resetNewLaborItem();
    setEditingIndex(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (index: number) => {
    setNewLaborItem(laborItems[index]);
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    const updatedLaborItems = laborItems.filter((_, i: number) => i !== index);
    try {
      const currentString = JSON.stringify(laborItems);
      const updatedString = JSON.stringify(updatedLaborItems);
      if (currentString !== updatedString) {
        updateLabor(updatedLaborItems);
      }
    } catch (e) {
      updateLabor(updatedLaborItems);
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'direct' ? (
      <Badge className="bg-green-100 text-green-800">แรงงานโดยตรง</Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-800">แรงงานทางอ้อม</Badge>
    );
  };

  const directLaborItems = laborItems.filter((item: LaborItem) => item.type === 'direct');
  const indirectLaborItems = laborItems.filter((item: LaborItem) => item.type === 'indirect');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">แรงงาน</h2>
          <p className="text-muted-foreground">จัดการต้นทุนแรงงานและตารางงาน</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">ต้นทุนรวม/เดือน</div>
            <div className="text-xl font-bold">{formatCurrency(getTotalMonthlyCost())}</div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetNewLaborItem(); setEditingIndex(null); }}>
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มพนักงาน
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingIndex !== null ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
                </DialogTitle>
                <DialogDescription>
                  กรอกข้อมูลตำแหน่งงาน ค่าจ้าง และตารางงาน
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">ตำแหน่งงาน</Label>
                    <Input
                      id="role"
                      value={newLaborItem.role}
                      onChange={(e) => setNewLaborItem(prev => ({ ...prev, role: e.target.value }))}
                      placeholder="พ่อครัว, แคชเชียร์, ผู้ช่วย"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">ประเภทแรงงาน</Label>
                    <Select value={newLaborItem.type} onValueChange={(value: 'direct' | 'indirect') => 
                      setNewLaborItem(prev => ({ ...prev, type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">แรงงานโดยตรง (เกี่ยวข้องการผลิต)</SelectItem>
                        <SelectItem value="indirect">แรงงานทางอ้อม (บริหาร/ขาย)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wage">ค่าจ้าง/ชั่วโมง (บาท)</Label>
                    <Input
                      id="wage"
                      type="number"
                      step="0.5"
                      value={newLaborItem.wagePerHour}
                      onChange={(e) => setNewLaborItem(prev => ({ ...prev, wagePerHour: parseFloat(e.target.value) || 0 }))}
                      placeholder="45"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours">ชั่วโมง/วัน</Label>
                    <Input
                      id="hours"
                      type="number"
                      value={newLaborItem.hoursPerDay}
                      onChange={(e) => setNewLaborItem(prev => ({ ...prev, hoursPerDay: parseFloat(e.target.value) || 0 }))}
                      placeholder="8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="days">วัน/สัปดาห์</Label>
                    <Input
                      id="days"
                      type="number"
                      value={newLaborItem.daysPerWeek}
                      onChange={(e) => setNewLaborItem(prev => ({ ...prev, daysPerWeek: parseFloat(e.target.value) || 0 }))}
                      placeholder="6"
                    />
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-4 h-4" />
                    <span className="font-medium">การคำนวณค่าจ้าง</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">รายวัน:</span>
                      <div className="font-bold">{formatCurrency(calculateDailyWage(newLaborItem))}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">รายสัปดาห์:</span>
                      <div className="font-bold">{formatCurrency(calculateWeeklyWage(newLaborItem))}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">รายเดือน:</span>
                      <div className="font-bold">{formatCurrency(calculateMonthlyWage(newLaborItem))}</div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleSaveLaborItem}>
                  {editingIndex !== null ? 'บันทึกการแก้ไข' : 'เพิ่มพนักงาน'}
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
          <div className="text-sm font-medium text-muted-foreground">แรงงานโดยตรง</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(getDirectLaborCost())}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">แรงงานทางอ้อม</div>
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(getIndirectLaborCost())}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">จำนวนพนักงาน</div>
          <div className="text-2xl font-bold">{laborItems.length} คน</div>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
          <TabsTrigger value="direct">แรงงานโดยตรง ({directLaborItems.length})</TabsTrigger>
          <TabsTrigger value="indirect">แรงงานทางอ้อม ({indirectLaborItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>รายการพนักงานทั้งหมด</CardTitle>
              <CardDescription>
                ต้นทุนแรงงานรวม {formatCurrency(getTotalMonthlyCost())} ต่อเดือน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ตำแหน่งงาน</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead className="text-right">ค่าจ้าง/ชม.</TableHead>
                    <TableHead className="text-right">ชั่วโมง/วัน</TableHead>
                    <TableHead className="text-right">วัน/สัปดาห์</TableHead>
                    <TableHead className="text-right">รายวัน</TableHead>
                    <TableHead className="text-right">รายเดือน</TableHead>
                    <TableHead className="text-right">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laborItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {item.role}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(item.type)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.wagePerHour)}</TableCell>
                      <TableCell className="text-right">{item.hoursPerDay}</TableCell>
                      <TableCell className="text-right">{item.daysPerWeek}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(calculateDailyWage(item))}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(calculateMonthlyWage(item))}
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
        </TabsContent>

        <TabsContent value="direct">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                แรงงานโดยตรง
              </CardTitle>
              <CardDescription>
                พนักงานที่เกี่ยวข้องการผลิตโดยตรง - ต้นทุน {formatCurrency(getDirectLaborCost())} ต่อเดือน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {directLaborItems.map((item, index) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{item.role}</h4>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(laborItems.indexOf(item))}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(laborItems.indexOf(item))}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(item.wagePerHour)}/ชั่วโมง
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.hoursPerDay} ชม./วัน × {item.daysPerWeek} วัน/สัปดาห์
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm">ต้นทุน/เดือน:</span>
                        <span className="font-bold text-green-600">{formatCurrency(calculateMonthlyWage(item))}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indirect">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                แรงงานทางอ้อม
              </CardTitle>
              <CardDescription>
                พนักงานบริหารและขาย - ต้นทุน {formatCurrency(getIndirectLaborCost())} ต่อเดือน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {indirectLaborItems.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{item.role}</h4>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(laborItems.indexOf(item))}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(laborItems.indexOf(item))}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(item.wagePerHour)}/ชั่วโมง
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.hoursPerDay} ชม./วัน × {item.daysPerWeek} วัน/สัปดาห์
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm">ต้นทุน/เดือน:</span>
                        <span className="font-bold text-blue-600">{formatCurrency(calculateMonthlyWage(item))}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Labor Efficiency Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>การวิเคราะห์ประสิทธิภาพแรงงาน</CardTitle>
          <CardDescription>ตัวชี้วัดประสิทธิภาพและต้นทุนแรงงาน</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-900">สัดส่วนแรงงานโดยตรง</div>
              <div className="text-2xl font-bold text-green-600">
                {getTotalMonthlyCost() > 0 ? ((getDirectLaborCost() / getTotalMonthlyCost()) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-xs text-green-700">
                {formatCurrency(getDirectLaborCost())} จาก {formatCurrency(getTotalMonthlyCost())}
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-900">สัดส่วนแรงงานทางอ้อม</div>
              <div className="text-2xl font-bold text-blue-600">
                {getTotalMonthlyCost() > 0 ? ((getIndirectLaborCost() / getTotalMonthlyCost()) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-xs text-blue-700">
                {formatCurrency(getIndirectLaborCost())} จาก {formatCurrency(getTotalMonthlyCost())}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900">ค่าแรงเฉลี่ย/ชั่วโมง</div>
              <div className="text-2xl font-bold text-gray-600">
                {laborItems.length > 0 ? formatCurrency(
                  laborItems.reduce((sum, item) => sum + item.wagePerHour, 0) / laborItems.length
                ) : formatCurrency(0)}
              </div>
              <div className="text-xs text-gray-700">เฉลี่ยทั้งหมด {laborItems.length} ตำแหน่ง</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}