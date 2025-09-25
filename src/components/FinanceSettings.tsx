import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Settings, Shield, Trash2, RotateCcw, Globe, Calculator, HelpCircle, Download, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { formatCurrency, parseNumberInput } from '../lib/utils';
import { useFinanceState } from '../hooks/useFinanceState';

export default function FinanceSettings() {
  const { data, reset, exportData, importData } = useFinanceState();
  const [settings, setSettings] = useState(() => data?.meta || {});
  const [language, setLanguage] = useState('th');
  const [currency, setCurrency] = useState('THB');
  const [vatPercent, setVatPercent] = useState(7);
  const [isDataProtectionAccepted, setIsDataProtectionAccepted] = useState(true);

  // Update settings when data changes
  useEffect(() => {
    if (data?.meta) {
      setSettings(data.meta);
      setCurrency(data.meta.currency || 'THB');
      setVatPercent(data.meta.vatPercent || 7);
    }
  }, [data]);

  const handleSaveSettings = () => {
    const updatedMeta = {
      ...settings,
      currency,
      vatPercent,
      language
    };
    
    // Update data through state manager
    setSettings(updatedMeta);
    alert('บันทึกการตั้งค่าเรียบร้อย');
  };

  const handleClearAllData = () => {
    localStorage.clear();
    alert('ข้อมูลทั้งหมดถูกลบแล้ว กรุณาโหลดหน้าใหม่');
    window.location.reload();
  };

  const handleFactoryReset = () => {
    // Reset to default values using state manager
    reset();
    alert('รีเซ็ตการตั้งค่าเรียบร้อย');
  };

  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleExportData = () => {
    try {
      setExportStatus('loading');
      setErrorMessage('');

      const dataString = exportData();

      if (!dataString || dataString.trim() === '') {
        throw new Error('ไม่มีข้อมูลที่จะส่งออก');
      }

      // Add UTF-8 BOM for better Thai character support
      const BOM = '\uFEFF';
      const jsonWithBOM = BOM + dataString;

      const blob = new Blob([jsonWithBOM], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งออกข้อมูล';
      setErrorMessage(message);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 5000);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    setErrorMessage('');

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      setErrorMessage('กรุณาเลือกไฟล์ .json เท่านั้น');
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 5000);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)');
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 5000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileContent = e.target?.result as string;

        // Remove BOM if present
        const cleanContent = fileContent.replace(/^\uFEFF/, '');

        // Validate JSON format
        try {
          JSON.parse(cleanContent);
        } catch (parseError) {
          throw new Error('ไฟล์ JSON ไม่ถูกต้อง');
        }

        const result = importData(cleanContent);
        if (result.success) {
          setImportStatus('success');
          setTimeout(() => {
            setImportStatus('idle');
            window.location.reload(); // Reload to ensure all components reflect the imported data
          }, 2000);
        } else {
          throw new Error(result.error || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
        }
      } catch (error) {
        console.error('Import failed:', error);
        const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล';
        setErrorMessage(message);
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 5000);
      }
    };

    reader.onerror = () => {
      setErrorMessage('ไม่สามารถอ่านไฟล์ได้');
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 5000);
    };

    reader.readAsText(file, 'utf-8');

    // Clear the input value so the same file can be selected again if needed
    event.target.value = '';
  };

  const defaultSettings = [
    { name: 'ค่าไฟฟ้าต่อหน่วย', value: '5.00 บาท/kWh', description: 'อัตราเฉลี่ยสำหรับธุรกิจขนาดเล็ก' },
    { name: 'ค่าแก๊ส LPG', value: '29.33 บาท/กก.', description: 'ราคาถังแก๊ส 15 กก. ประมาณ 440 บาท' },
    { name: 'ค่าน้ำประปา', value: '14.00 บาท/ลบ.ม.', description: 'อัตราเฉลี่ยกรุงเทพและปริมณฑล' },
    { name: 'ค่าจ้างขั้นต่ำ', value: '354 บาท/วัน', description: 'ปี 2024 (อ้างอิงเท่านั้น)' },
    { name: 'Prime Cost เป้าหมาย', value: '< 60%', description: 'มาตรฐานอุตสาหกรรมอาหาร' },
    { name: 'Food Cost เป้าหมาย', value: '< 35%', description: 'เฉพาะต้นทุนวัตถุดิบ' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">การตั้งค่าระบบ</h2>
          <p className="text-muted-foreground">จัดการการตั้งค่าทั่วไปและความเป็นส่วนตัว</p>
        </div>
        <Button onClick={handleSaveSettings}>
          <Settings className="w-4 h-4 mr-2" />
          บันทึกการตั้งค่า
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">ทั่วไป</TabsTrigger>
          <TabsTrigger value="finance">การเงิน</TabsTrigger>
          <TabsTrigger value="privacy">ความเป็นส่วนตัว</TabsTrigger>
          <TabsTrigger value="defaults">ค่าเริ่มต้น</TabsTrigger>
          <TabsTrigger value="help">ความช่วยเหลือ</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                การตั้งค่าทั่วไป
              </CardTitle>
              <CardDescription>
                ภาษา สกุลเงิน และรูปแบบการแสดงผล
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">ภาษา</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="th">ไทย</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">สกุลเงิน</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="THB">บาทไทย (THB)</SelectItem>
                      <SelectItem value="USD">ดอลลาร์สหรัฐ (USD)</SelectItem>
                      <SelectItem value="EUR">ยูโร (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vat">อัตราภาษีมูลค่าเพิ่ม (%)</Label>
                  <Input
                    id="vat"
                    type="number"
                    step="0.1"
                    value={vatPercent}
                    onChange={(e) => setVatPercent(parseFloat(e.target.value) || 0)}
                    placeholder="7"
                  />
                  <p className="text-xs text-muted-foreground">
                    อัตรา VAT มาตรฐานในประเทศไทย: 7%
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="decimal">ทศนิยม</Label>
                  <Select defaultValue="2">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">ไม่มีทศนิยม</SelectItem>
                      <SelectItem value="2">2 ตำแหน่ง</SelectItem>
                      <SelectItem value="4">4 ตำแหน่ง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>วันและเวลาดำเนินการ</CardTitle>
              <CardDescription>กำหนดวันเปิด-ปิดและชั่วโมงทำการ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              
              <div className="space-y-2">
                <Label>วันเปิดทำการ</Label>
                <div className="grid grid-cols-4 gap-2">
                  {['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'].map((day, index) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Switch id={`day-${index}`} defaultChecked={index < 6} />
                      <Label htmlFor={`day-${index}`} className="text-sm">{day}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                การตั้งค่าทางการเงิน
              </CardTitle>
              <CardDescription>
                กำหนดค่าเริ่มต้นสำหรับการคำนวณทางการเงิน
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target-profit">เป้าหมายกำไร/เดือน (บาท)</Label>
                  <Input
                    id="target-profit"
                    type="number"
                    placeholder="50000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="safety-margin">Safety Margin ขั้นต่ำ (%)</Label>
                  <Input
                    id="safety-margin"
                    type="number"
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max-prime-cost">Prime Cost สูงสุด (%)</Label>
                  <Input
                    id="max-prime-cost"
                    type="number"
                    defaultValue="60"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-food-cost">Food Cost สูงสุด (%)</Label>
                  <Input
                    id="max-food-cost"
                    type="number"
                    defaultValue="35"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-vat">รวม VAT ในราคาขาย</Label>
                  <Switch id="include-vat" defaultChecked />
                </div>
                <p className="text-xs text-muted-foreground">
                  เปิดใช้งานหากราคาเมนูในระบบรวม VAT แล้ว
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-calculate">คำนวณอัตโนมัติ</Label>
                  <Switch id="auto-calculate" defaultChecked />
                </div>
                <p className="text-xs text-muted-foreground">
                  คำนวณใหม่ทุกครั้งที่มีการเปลี่ยนแปลงข้อมูล
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          {/* Privacy Notice */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">ข้อมูลของคุณปลอดภัย</h3>
            </div>
            <p className="text-sm text-blue-700">
              ข้อมูลทั้งหมดถูกเก็บไว้ในเครื่องของคุณเท่านั้น ไม่มีการส่งข้อมูลไปยังเซิร์ฟเวอร์ภายนอก
            </p>
          </div>

          {/* Export Data Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Download className="w-5 h-5" />
                ส่งออกข้อมูล
              </CardTitle>
              <CardDescription>
                ดาวน์โหลดข้อมูลทั้งหมดเพื่อสำรองหรือโอนย้าย
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  onClick={handleExportData}
                  disabled={exportStatus === 'loading'}
                  className="w-full justify-start bg-green-600 hover:bg-green-700"
                >
                  {exportStatus === 'loading' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  ส่งออกข้อมูลทั้งหมด (JSON)
                </Button>

                {exportStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    ส่งออกข้อมูลเรียบร้อยแล้ว
                  </div>
                )}

                {exportStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errorMessage}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  ไฟล์จะถูกบันทึกในรูปแบบ JSON พร้อมการเข้ารหัส UTF-8 สำหรับตัวอักษรไทย
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Import Data Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Upload className="w-5 h-5" />
                นำเข้าข้อมูล
              </CardTitle>
              <CardDescription>
                อัพโหลดไฟล์ข้อมูลที่ส่งออกไว้ก่อนหน้า
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    disabled={importStatus === 'loading'}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <Button
                    variant="outline"
                    className="w-full justify-start border-blue-200 hover:bg-blue-50"
                    disabled={importStatus === 'loading'}
                  >
                    {importStatus === 'loading' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    เลือกไฟล์เพื่อนำเข้า (.json)
                  </Button>
                </div>

                {importStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    นำเข้าข้อมูลเรียบร้อย กำลังโหลดหน้าใหม่...
                  </div>
                )}

                {importStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>• รองรับเฉพาะไฟล์ .json ที่ส่งออกจากระบบนี้</p>
                  <p>• ขนาดไฟล์สูงสุด 10MB</p>
                  <p>• การนำเข้าจะแทนที่ข้อมูลปัจจุบันทั้งหมด</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reset/Delete Actions Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Trash2 className="w-5 h-5" />
                รีเซ็ต / ลบข้อมูลทั้งหมด
              </CardTitle>
              <CardDescription>
                การดำเนินการที่ไม่สามารถย้อนกลับได้
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start border-orange-200 text-orange-700 hover:bg-orange-50">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      รีเซ็ตการตั้งค่าเป็นค่าเริ่มต้น
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-orange-600" />
                        รีเซ็ตการตั้งค่า
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        การดำเนินการนี้จะรีเซ็ตการตั้งค่าทั้งหมดกลับเป็นค่าเริ่มต้น แต่จะ<strong>ไม่ลบข้อมูล</strong>เมนู ต้นทุน และสถานการณ์ที่คุณสร้างไว้
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                      <AlertDialogAction onClick={handleFactoryReset} className="bg-orange-600 hover:bg-orange-700">
                        รีเซ็ตการตั้งค่า
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full justify-start">
                      <Trash2 className="w-4 h-4 mr-2" />
                      ลบข้อมูลทั้งหมดอย่างถาวร
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-red-600" />
                        ลบข้อมูลทั้งหมด
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        <div className="space-y-2">
                          <p>⚠️ <strong>การดำเนินการนี้จะลบข้อมูลทั้งหมดอย่างถาวร</strong></p>
                          <p>ข้อมูลที่จะถูกลบ:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>เมนูอาหารและราคา</li>
                            <li>ต้นทุนและค่าใช้จ่าย</li>
                            <li>สถานการณ์จำลอง</li>
                            <li>การตั้งค่าทั้งหมด</li>
                          </ul>
                          <p className="text-red-600 font-medium">ไม่สามารถกู้คืนได้!</p>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearAllData} className="bg-red-600 hover:bg-red-700">
                        ลบข้อมูลทั้งหมด
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-800">
                    <strong>คำแนะนำ:</strong> ควรส่งออกข้อมูลเพื่อสำรองก่อนที่จะดำเนินการรีเซ็ตหรือลบ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                การตั้งค่าความเป็นส่วนตัว
              </CardTitle>
              <CardDescription>
                จัดการการรักษาความปลอดภัยข้อมูล
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>ยอมรับนโยบายความเป็นส่วนตัว</Label>
                    <p className="text-xs text-muted-foreground">
                      ข้อมูลจะถูกเก็บในหน่วยความจำของเบราว์เซอร์เท่านั้น
                    </p>
                  </div>
                  <Switch
                    checked={isDataProtectionAccepted}
                    onCheckedChange={setIsDataProtectionAccepted}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>เปิดใช้งานการสำรองข้อมูลอัตโนมัติ</Label>
                    <p className="text-xs text-muted-foreground">
                      สำรองข้อมูลลงใน localStorage ทุก 5 นาที
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defaults" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ค่าเริ่มต้นที่แนะนำ</CardTitle>
              <CardDescription>
                ค่าต่าง ๆ ที่แนะนำสำหรับร้านอาหารขนาดเล็ก (ข้อมูลอ้างอิงเท่านั้น)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {defaultSettings.map((setting, index) => (
                  <div key={index} className="flex justify-between items-start p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">{setting.name}</div>
                      <div className="text-sm text-muted-foreground">{setting.description}</div>
                    </div>
                    <Badge variant="outline">{setting.value}</Badge>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">หมายเหตุ</h4>
                <p className="text-sm text-orange-700">
                  ค่าดังกล่าวเป็นเพียงข้อมูลอ้างอิงเท่านั้น กรุณาปรับให้เหมาะสมกับสถานการณ์จริงของธุรกิจ
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                ความช่วยเหลือ
              </CardTitle>
              <CardDescription>
                คำแนะนำการใช้งานและคำศัพท์ทางการเงิน
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">คำศัพท์สำคัญ</h4>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-muted rounded">
                        <div className="font-medium">Prime Cost</div>
                        <div className="text-muted-foreground">ต้นทุนวัตถุดิบ + แรงงานโดยตรง</div>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <div className="font-medium">Contribution Margin (CM)</div>
                        <div className="text-muted-foreground">ราคาขาย - ต้นทุนผันแปร</div>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <div className="font-medium">Break-Even Point (BEP)</div>
                        <div className="text-muted-foreground">จุดคุ้มทุน (ไม่กำไรไม่ขาดทุน)</div>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <div className="font-medium">Safety Margin</div>
                        <div className="text-muted-foreground">ระยะห่างจากจุดคุ้มทุน</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">เป้าหมายที่แนะนำ</h4>
                  <div className="space-y-2 text-sm">
                    <div>• Prime Cost: ไม่เกิน 60% ของรายได้</div>
                    <div>• Food Cost: ไม่เกิน 35% ของรายได้</div>
                    <div>• Labor Cost: ไม่เกิน 25% ของรายได้</div>
                    <div>• Contribution Margin: มากกว่า 60%</div>
                    <div>• Safety Margin: มากกว่า 30%</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">การแก้ไขปัญหา</h4>
                  <div className="space-y-2 text-sm">
                    <div>• หาก Prime Cost สูง: ลดต้นทุนวัตถุดิบหรือเพิ่มราคาขาย</div>
                    <div>• หาก Safety Margin ต่ำ: เพิ่มยอดขายหรือลดต้นทุนคงที่</div>
                    <div>• หาก CM % ต่ำ: ทบทวนสูตรอาหารหรือขึ้นราคา</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}