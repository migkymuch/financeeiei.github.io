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
import { Zap, Flame, Droplets, Plus, Edit, Trash2, Calculator } from 'lucide-react';
import { formatCurrency, parseNumberInput } from '../lib/utils';
import { UtilityItem } from '../lib/finance-engine';
import { useFinanceState } from '../hooks/useFinanceState';

export default function UtilitiesModel() {
  const { data, updateUtilities } = useFinanceState();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newUtility, setNewUtility] = useState<UtilityItem>({
    id: '',
    type: 'electric',
    device: '',
    kw: 0,
    hoursPerDay: 0,
    ratePerKwh: 5
  });

  // Use data from global state instead of local state
  const utilities: UtilityItem[] = data?.utilities || [];

  const resetNewUtility = () => {
    setNewUtility({
      id: '',
      type: 'electric',
      device: '',
      kw: 0,
      hoursPerDay: 0,
      ratePerKwh: 5
    });
  };

  const calculateDailyCost = (utility: UtilityItem): number => {
    if (utility.type === 'electric' && utility.kw && utility.hoursPerDay && utility.ratePerKwh) {
      return utility.kw * utility.hoursPerDay * utility.ratePerKwh;
    } else if (utility.type === 'lpg' && utility.kgPerBatch && utility.batchesPerDay && utility.ratePerKg) {
      return utility.kgPerBatch * utility.batchesPerDay * utility.ratePerKg;
    } else if (utility.type === 'water' && utility.m3PerDay && utility.ratePerM3) {
      return utility.m3PerDay * utility.ratePerM3;
    }
    return 0;
  };

  const calculateMonthlyCost = (utility: UtilityItem): number => {
    return calculateDailyCost(utility) * 30;
  };

  const getTotalMonthlyCost = (): number => {
    return utilities.reduce((total, utility) => total + calculateMonthlyCost(utility), 0);
  };

  const handleSaveUtility = () => {
    const utilityId = newUtility.id || `utility_${Date.now()}`;
    const utilityToSave = { ...newUtility, id: utilityId };

    const updatedUtilities = editingIndex !== null
      ? utilities.map((utility, index) => index === editingIndex ? utilityToSave : utility)
      : [...utilities, utilityToSave];

    try {
      const currentString = JSON.stringify(utilities);
      const updatedString = JSON.stringify(updatedUtilities);
      if (currentString !== updatedString) {
        updateUtilities(updatedUtilities);
      }
    } catch (e) {
      updateUtilities(updatedUtilities);
    }

    resetNewUtility();
    setEditingIndex(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (index: number) => {
    setNewUtility(utilities[index]);
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    const updatedUtilities = utilities.filter((_, i) => i !== index);
    try {
      const currentString = JSON.stringify(utilities);
      const updatedString = JSON.stringify(updatedUtilities);
      if (currentString !== updatedString) {
        updateUtilities(updatedUtilities);
      }
    } catch (e) {
      updateUtilities(updatedUtilities);
    }
  };

  const getUtilityIcon = (type: string) => {
    switch (type) {
      case 'electric': return <Zap className="w-4 h-4" />;
      case 'lpg': return <Flame className="w-4 h-4" />;
      case 'water': return <Droplets className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      electric: 'bg-yellow-100 text-yellow-800',
      lpg: 'bg-orange-100 text-orange-800',
      water: 'bg-blue-100 text-blue-800'
    };
    
    const labels = {
      electric: 'ไฟฟ้า',
      lpg: 'แก๊ส LPG',
      water: 'น้ำประปา'
    };

    return (
      <Badge className={colors[type as keyof typeof colors] || colors.electric}>
        {labels[type as keyof typeof labels] || 'ไฟฟ้า'}
      </Badge>
    );
  };

  const electricUtilities = utilities.filter((u: UtilityItem) => u.type === 'electric');
  const lpgUtilities = utilities.filter((u: UtilityItem) => u.type === 'lpg');
  const waterUtilities = utilities.filter((u: UtilityItem) => u.type === 'water');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">สาธารณูปโภค</h2>
          <p className="text-muted-foreground">จัดการต้นทุนไฟฟ้า แก๊ส และน้ำประปา</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">ต้นทุนรวม/เดือน</div>
            <div className="text-xl font-bold">{formatCurrency(getTotalMonthlyCost())}</div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetNewUtility(); setEditingIndex(null); }}>
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มรายการ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingIndex !== null ? 'แก้ไขรายการสาธารณูปโภค' : 'เพิ่มรายการสาธารณูปโภค'}
                </DialogTitle>
                <DialogDescription>
                  กรอกข้อมูลการใช้งานและอัตราค่าบริการ
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="device">ชื่ออุปกรณ์/บริการ</Label>
                    <Input
                      id="device"
                      value={newUtility.device}
                      onChange={(e) => setNewUtility(prev => ({ ...prev, device: e.target.value }))}
                      placeholder="เครื่องปรับอากาศ"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">ประเภท</Label>
                    <Select value={newUtility.type} onValueChange={(value: 'electric' | 'lpg' | 'water') => 
                      setNewUtility(prev => ({ ...prev, type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electric">ไฟฟ้า</SelectItem>
                        <SelectItem value="lpg">แก๊ส LPG</SelectItem>
                        <SelectItem value="water">น้ำประปา</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newUtility.type === 'electric' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kw">กำลังไฟ (kW)</Label>
                      <Input
                        id="kw"
                        type="number"
                        step="0.1"
                        value={newUtility.kw || ''}
                        onChange={(e) => setNewUtility(prev => ({ ...prev, kw: parseFloat(e.target.value) || 0 }))}
                        onBlur={() => {
                          // Auto-save on blur for better UX
                          const kw = newUtility.kw ?? 0;
                          const hours = newUtility.hoursPerDay ?? 0;
                          if (newUtility.device && kw > 0 && hours > 0) {
                            const utilityId = newUtility.id || `utility_${Date.now()}`;
                            const utilityToSave = { ...newUtility, id: utilityId };
                            const updatedUtilities = editingIndex !== null
                              ? utilities.map((utility, index) => index === editingIndex ? utilityToSave : utility)
                              : [...utilities, utilityToSave];
                            updateUtilities(updatedUtilities);
                          }
                        }}
                        placeholder="2.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hours">ชั่วโมง/วัน</Label>
                      <Input
                        id="hours"
                        type="number"
                        value={newUtility.hoursPerDay || ''}
                        onChange={(e) => setNewUtility(prev => ({ ...prev, hoursPerDay: parseFloat(e.target.value) || 0 }))}
                        placeholder="6"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rate-kwh">อัตรา บาท/kWh</Label>
                      <Input
                        id="rate-kwh"
                        type="number"
                        step="0.01"
                        value={newUtility.ratePerKwh || ''}
                        onChange={(e) => setNewUtility(prev => ({ ...prev, ratePerKwh: parseFloat(e.target.value) || 0 }))}
                        placeholder="5.00"
                      />
                    </div>
                  </div>
                )}

                {newUtility.type === 'lpg' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kg-batch">กก./batch</Label>
                      <Input
                        id="kg-batch"
                        type="number"
                        step="0.01"
                        value={newUtility.kgPerBatch || ''}
                        onChange={(e) => setNewUtility(prev => ({ ...prev, kgPerBatch: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.25"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="batches">batch/วัน</Label>
                      <Input
                        id="batches"
                        type="number"
                        value={newUtility.batchesPerDay || ''}
                        onChange={(e) => setNewUtility(prev => ({ ...prev, batchesPerDay: parseFloat(e.target.value) || 0 }))}
                        placeholder="2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rate-kg">อัตรา บาท/กก.</Label>
                      <Input
                        id="rate-kg"
                        type="number"
                        step="0.01"
                        value={newUtility.ratePerKg || ''}
                        onChange={(e) => setNewUtility(prev => ({ ...prev, ratePerKg: parseFloat(e.target.value) || 0 }))}
                        placeholder="29.33"
                      />
                    </div>
                  </div>
                )}

                {newUtility.type === 'water' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="m3-day">ลูกบาศก์เมตร/วัน</Label>
                      <Input
                        id="m3-day"
                        type="number"
                        step="0.1"
                        value={newUtility.m3PerDay || ''}
                        onChange={(e) => setNewUtility(prev => ({ ...prev, m3PerDay: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rate-m3">อัตรา บาท/ลบ.ม.</Label>
                      <Input
                        id="rate-m3"
                        type="number"
                        step="0.01"
                        value={newUtility.ratePerM3 || ''}
                        onChange={(e) => setNewUtility(prev => ({ ...prev, ratePerM3: parseFloat(e.target.value) || 0 }))}
                        placeholder="14.00"
                      />
                    </div>
                  </div>
                )}

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-4 h-4" />
                    <span className="font-medium">การคำนวณต้นทุน</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">ต้นทุน/วัน:</span>
                      <div className="font-bold">{formatCurrency(calculateDailyCost(newUtility))}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ต้นทุน/เดือน:</span>
                      <div className="font-bold">{formatCurrency(calculateMonthlyCost(newUtility))}</div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleSaveUtility}>
                  {editingIndex !== null ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
          <TabsTrigger value="electric">ไฟฟ้า ({electricUtilities.length})</TabsTrigger>
          <TabsTrigger value="lpg">แก๊ส ({lpgUtilities.length})</TabsTrigger>
          <TabsTrigger value="water">น้ำประปา ({waterUtilities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>รายการสาธารณูปโภคทั้งหมด</CardTitle>
              <CardDescription>
                ต้นทุนรวมทั้งหมด {formatCurrency(getTotalMonthlyCost())} ต่อเดือน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>อุปกรณ์/บริการ</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead className="text-right">การใช้งาน</TableHead>
                    <TableHead className="text-right">อัตรา</TableHead>
                    <TableHead className="text-right">ต้นทุน/วัน</TableHead>
                    <TableHead className="text-right">ต้นทุน/เดือน</TableHead>
                    <TableHead className="text-right">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {utilities.map((utility, index) => (
                    <TableRow key={utility.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getUtilityIcon(utility.type)}
                          {utility.device}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(utility.type)}</TableCell>
                      <TableCell className="text-right">
                        {utility.type === 'electric' && `${utility.kw} kW × ${utility.hoursPerDay} ชม.`}
                        {utility.type === 'lpg' && `${utility.kgPerBatch} กก. × ${utility.batchesPerDay} batch`}
                        {utility.type === 'water' && `${utility.m3PerDay} ลบ.ม./วัน`}
                      </TableCell>
                      <TableCell className="text-right">
                        {utility.type === 'electric' && `${utility.ratePerKwh} บาท/kWh`}
                        {utility.type === 'lpg' && `${utility.ratePerKg} บาท/กก.`}
                        {utility.type === 'water' && `${utility.ratePerM3} บาท/ลบ.ม.`}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(calculateDailyCost(utility))}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(calculateMonthlyCost(utility))}
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

        <TabsContent value="electric">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                ไฟฟ้า
              </CardTitle>
              <CardDescription>
                ต้นทุนไฟฟ้ารวม {formatCurrency(electricUtilities.reduce((sum, u) => sum + calculateMonthlyCost(u), 0))} ต่อเดือน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {electricUtilities.map((utility, index) => (
                  <Card key={utility.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{utility.device}</h4>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(utilities.indexOf(utility))}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(utilities.indexOf(utility))}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>กำลังไฟ: {utility.kw} kW</div>
                      <div>ใช้งาน: {utility.hoursPerDay} ชั่วโมง/วัน</div>
                      <div>อัตรา: {utility.ratePerKwh} บาท/kWh</div>
                    </div>
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm">ต้นทุน/เดือน:</span>
                        <span className="font-bold">{formatCurrency(calculateMonthlyCost(utility))}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lpg">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5" />
                แก๊ส LPG
              </CardTitle>
              <CardDescription>
                ต้นทุนแก๊สรวม {formatCurrency(lpgUtilities.reduce((sum, u) => sum + calculateMonthlyCost(u), 0))} ต่อเดือน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lpgUtilities.map((utility) => (
                  <Card key={utility.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{utility.device}</h4>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(utilities.indexOf(utility))}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(utilities.indexOf(utility))}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>การใช้: {utility.kgPerBatch} กก./batch</div>
                      <div>จำนวน: {utility.batchesPerDay} batch/วัน</div>
                      <div>อัตรา: {utility.ratePerKg} บาท/กก.</div>
                    </div>
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm">ต้นทุน/เดือน:</span>
                        <span className="font-bold">{formatCurrency(calculateMonthlyCost(utility))}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="water">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="w-5 h-5" />
                น้ำประปา
              </CardTitle>
              <CardDescription>
                ต้นทุนน้ำรวม {formatCurrency(waterUtilities.reduce((sum, u) => sum + calculateMonthlyCost(u), 0))} ต่อเดือน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {waterUtilities.map((utility) => (
                  <Card key={utility.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{utility.device}</h4>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(utilities.indexOf(utility))}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(utilities.indexOf(utility))}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>การใช้: {utility.m3PerDay} ลูกบาศก์เมตร/วัน</div>
                      <div>อัตรา: {utility.ratePerM3} บาท/ลบ.ม.</div>
                    </div>
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm">ต้นทุน/เดือน:</span>
                        <span className="font-bold">{formatCurrency(calculateMonthlyCost(utility))}</span>
                      </div>
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