import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FileText, Download, Printer, Share, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { formatCurrency, formatPercent, downloadJSON, downloadCSV } from '../lib/utils';
import { useFinanceState } from '../hooks/useFinanceState';

interface ReportsProps {
  financialData: any;
}

export default function Reports({ financialData }: ReportsProps) {
  const { exportData, exportFreshData, importData, forceSave } = useFinanceState();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  // Comprehensive export utility with real-time data fetching and retry logic
  const performRealTimeExport = async (
    exportType: 'json' | 'pnl' | 'menu' | 'comprehensive',
    maxRetries = 3
  ): Promise<{
    freshData: any;
    computationResult: any;
    exportInfo: {
      timestamp: string;
      version: string;
      type: string;
      attempt: number;
    };
  }> => {
    let attempt = 0;
    const maxAttempts = maxRetries + 1;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        // Update progress
        setExportProgress(`กำลังเตรียมข้อมูลล่าสุด... (${attempt}/${maxAttempts})`);
        console.log(`[Reports] Export attempt ${attempt}/${maxAttempts} for type: ${exportType}`);

        // Get fresh real-time data using the new method
        const freshDataString = await exportFreshData();
        const freshData = JSON.parse(freshDataString);

        // Validate that we have the computation results
        if (!freshData.computationResult) {
          throw new Error('ไม่พบผลการคำนวณ ระบบอาจกำลังประมวลผลอยู่');
        }

        setExportProgress('กำลังสร้างไฟล์...');
        console.log(`[Reports] Fresh data validated successfully for ${exportType} export`);

        return {
          freshData,
          computationResult: freshData.computationResult,
          exportInfo: {
            timestamp: freshData.exportTimestamp,
            version: freshData.dataVersion,
            type: exportType,
            attempt
          }
        };

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ';
        console.error(`Export attempt ${attempt}/${maxAttempts} failed:`, errorMsg);

        if (attempt === maxAttempts) {
          // Final attempt failed
          throw new Error(`การส่งออกล้มเหลวหลังจากพยายาม ${maxAttempts} ครั้ง: ${errorMsg}`);
        }

        // Wait before retry, with exponential backoff
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
        setExportProgress(`เกิดข้อผิดพลาด กำลังลองใหม่ในอีก ${Math.ceil(waitTime / 1000)} วินาที...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // This should never be reached due to the throw in the final attempt,
    // but TypeScript needs this for type safety
    throw new Error('การส่งออกล้มเหลวโดยไม่ทราบสาเหตุ');
  };

  if (!financialData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p>กำลังโหลดข้อมูลรายงาน...</p>
        </div>
      </div>
    );
  }

  // Get fresh data for display - but DO NOT use for exports to ensure real-time data
  const kpis = financialData?.kpis || {};
  const pnl = financialData?.pnl || { daily: {}, monthly: {} };
  const menus = financialData?.menus || [];

  const handleExportJSON = async () => {
    setIsExporting(true);
    setExportProgress('กำลังเริ่มต้น...');

    try {
      const exportData = await performRealTimeExport('json');
      const filename = `finance-data-${new Date().toISOString().split('T')[0]}.json`;

      setExportProgress('กำลังดาวน์โหลด...');
      downloadJSON(exportData.freshData, filename);

      console.log(`[Reports] Real-time JSON export completed at ${exportData.exportInfo.timestamp}`);
      setExportProgress('เสร็จสิ้น!');

    } catch (error) {
      console.error('Real-time JSON export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถส่งออกข้อมูล JSON ได้';
      alert(`ข้อผิดพลาด: ${errorMessage}`);
      setExportProgress('');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress('');
      }, 1000);
    }
  };

  const handleExportPnL = async () => {
    setIsExporting(true);
    setExportProgress('กำลังเริ่มต้น...');

    try {
      const exportData = await performRealTimeExport('pnl');
      const freshPnL = exportData.computationResult?.pnl || { daily: {}, monthly: {} };

      setExportProgress('กำลังสร้าง P&L...');

      const pnlData = [
        {
          period: 'รายวัน',
          revenue: freshPnL.daily?.revenue || 0,
          cogs: freshPnL.daily?.cogs || 0,
          grossProfit: freshPnL.daily?.grossProfit || 0,
          operatingExpenses: freshPnL.daily?.operatingExpenses || 0,
          operatingProfit: freshPnL.daily?.operatingProfit || 0
        },
        {
          period: 'รายเดือน',
          revenue: freshPnL.monthly?.revenue || 0,
          cogs: freshPnL.monthly?.cogs || 0,
          grossProfit: freshPnL.monthly?.grossProfit || 0,
          operatingExpenses: freshPnL.monthly?.operatingExpenses || 0,
          operatingProfit: freshPnL.monthly?.operatingProfit || 0
        }
      ];

      const filename = `pnl-${new Date().toISOString().split('T')[0]}.csv`;
      setExportProgress('กำลังดาวน์โหลด...');
      downloadCSV(pnlData, filename);

      console.log(`[Reports] Real-time P&L export completed at ${exportData.exportInfo.timestamp}`);
      setExportProgress('เสร็จสิ้น!');

    } catch (error) {
      console.error('Real-time P&L export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถส่งออก P&L ได้';
      alert(`ข้อผิดพลาด: ${errorMessage}`);
      setExportProgress('');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress('');
      }, 1000);
    }
  };

  const handleExportMenuAnalysis = async () => {
    setIsExporting(true);
    setExportProgress('กำลังเริ่มต้น...');

    try {
      const exportData = await performRealTimeExport('menu');
      const freshMenus = exportData.computationResult?.menus || [];

      setExportProgress('กำลังสร้างการวิเคราะห์เมนู...');

      const menuData = freshMenus.map((menu: any) => ({
        menuName: menu?.name || 'Unknown',
        price: menu?.price || 0,
        variableCost: menu?.vc || 0,
        contributionMargin: menu?.cm || 0,
        contributionMarginPercent: menu?.cmPct || 0
      }));

      const filename = `menu-analysis-${new Date().toISOString().split('T')[0]}.csv`;
      setExportProgress('กำลังดาวน์โหลด...');
      downloadCSV(menuData, filename);

      console.log(`[Reports] Real-time menu analysis export completed at ${exportData.exportInfo.timestamp}`);
      setExportProgress('เสร็จสิ้น!');

    } catch (error) {
      console.error('Real-time menu analysis export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถส่งออกการวิเคราะห์เมนูได้';
      alert(`ข้อผิดพลาด: ${errorMessage}`);
      setExportProgress('');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress('');
      }, 1000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportAllReports = async () => {
    setIsExporting(true);
    setExportProgress('กำลังเริ่มต้น...');

    try {
      const exportData = await performRealTimeExport('comprehensive');

      // Validate export data structure
      if (!exportData || !exportData.computationResult) {
        throw new Error('ไม่พบผลการคำนวณ กรุณาตรวจสอบข้อมูลในระบบ');
      }

      const freshKpis = exportData.computationResult?.kpis || {};
      const freshPnL = exportData.computationResult?.pnl || { daily: {}, monthly: {} };
      const freshMenus = exportData.computationResult?.menus || [];

      // Additional validation for critical data
      if (!freshPnL.daily || !freshPnL.monthly) {
        console.warn('[Reports] P&L data incomplete, using empty structure');
        freshPnL.daily = freshPnL.daily || {};
        freshPnL.monthly = freshPnL.monthly || {};
      }

      const today = new Date().toISOString().split('T')[0];
      setExportProgress('กำลังสร้างรายงานครบถ้วน...');

      console.log('[Reports] Export data validated successfully:', {
        hasKpis: !!freshKpis,
        hasPnL: !!freshPnL,
        hasMenus: Array.isArray(freshMenus),
        menuCount: freshMenus.length
      });

      // Calculate fresh profit margins with null checks
      const freshProfitMarginAnalysis = {
        grossMargin: freshPnL.daily?.grossProfit && freshPnL.daily?.revenue
          ? (freshPnL.daily.grossProfit / freshPnL.daily.revenue) * 100 : 0,
        operatingMargin: freshPnL.daily?.operatingProfit && freshPnL.daily?.revenue
          ? (freshPnL.daily.operatingProfit / freshPnL.daily.revenue) * 100 : 0,
        contributionMargin: freshKpis?.cmPct || 0
      };

      // Calculate fresh cost structure with null checks
      const freshCostStructure = [
        {
          category: 'ต้นทุนขาย (COGS)',
          amount: freshPnL.daily?.cogs || 0,
          percentage: freshPnL.daily?.cogs && freshPnL.daily?.revenue
            ? (freshPnL.daily.cogs / freshPnL.daily.revenue) * 100 : 0
        },
        {
          category: 'ค่าใช้จ่ายดำเนินงาน',
          amount: freshPnL.daily?.operatingExpenses || 0,
          percentage: freshPnL.daily?.operatingExpenses && freshPnL.daily?.revenue
            ? (freshPnL.daily.operatingExpenses / freshPnL.daily.revenue) * 100 : 0
        }
      ];

      const csvRows = [
        // Header
        ['หัวข้อ', 'ค่า', 'หน่วย/หมายเหตุ'],
        [''],

        // Summary section
        ['=== สรุปผลรวม ==='],
        ['รายได้รายวัน', formatCurrency(freshKpis?.revenue || 0), 'บาท'],
        ['กำไรขั้นต้น', formatCurrency(freshKpis?.grossProfit || 0), 'บาท'],
        ['กำไรจากการดำเนินงาน', formatCurrency(freshKpis?.operatingProfit || 0), 'บาท'],
        ['เปอร์เซ็นต์ต้นทุนหลัก', formatPercent(freshKpis?.primeCostPct || 0), '%'],
        ['เปอร์เซ็นต์ต้นทุนอาหาร', formatPercent(freshKpis?.foodCostPct || 0), '%'],
        ['เปอร์เซ็นต์ค่าแรงงาน', formatPercent(freshKpis?.laborPct || 0), '%'],
        ['จุดคุ้มทุนต่อวัน', `${Math.round(freshKpis?.bepPerDay || 0)} จาน`, 'จาน'],
        ['อัตราส่วนความปลอดภัย', formatPercent(freshKpis?.safetyMargin || 0), '%'],
        [''],

        // Profit margins section
        ['=== อัตรากำไร ==='],
        ['อัตรากำไรขั้นต้น', formatPercent(freshProfitMarginAnalysis.grossMargin), '%'],
        ['อัตรากำไรจากการดำเนินงาน', formatPercent(freshProfitMarginAnalysis.operatingMargin), '%'],
        ['อัตรากำไรส่วนเพิ่ม', formatPercent(freshProfitMarginAnalysis.contributionMargin), '%'],
        [''],

        // Cost structure section
        ['=== โครงสร้างต้นทุน ==='],
        ...freshCostStructure.map(cost => [
          cost.category,
          formatCurrency(cost.amount),
          `${formatPercent(cost.percentage)} ของรายได้`
        ]),
        [''],

        // P&L Statement section
        ['=== งบกำไรขาดทุน (P&L) ==='],
        ['รายการ', 'รายวัน', 'รายเดือน', 'เปอร์เซ็นต์ของรายได้'],
        ['รายได้',
          formatCurrency(freshPnL.daily?.revenue || 0),
          formatCurrency(freshPnL.monthly?.revenue || 0),
          '100.0%'
        ],
        ['ต้นทุนขาย',
          `(${formatCurrency(freshPnL.daily?.cogs || 0)})`,
          `(${formatCurrency(freshPnL.monthly?.cogs || 0)})`,
          `(${formatPercent(freshPnL.daily?.cogs && freshPnL.daily?.revenue ? (freshPnL.daily.cogs / freshPnL.daily.revenue) * 100 : 0)})`
        ],
        ['กำไรขั้นต้น',
          formatCurrency(freshPnL.daily?.grossProfit || 0),
          formatCurrency(freshPnL.monthly?.grossProfit || 0),
          formatPercent(freshPnL.daily?.grossProfit && freshPnL.daily?.revenue ? (freshPnL.daily.grossProfit / freshPnL.daily.revenue) * 100 : 0)
        ],
        ['ค่าใช้จ่ายดำเนินงาน',
          `(${formatCurrency(freshPnL.daily?.operatingExpenses || 0)})`,
          `(${formatCurrency(freshPnL.monthly?.operatingExpenses || 0)})`,
          `(${formatPercent(freshPnL.daily?.operatingExpenses && freshPnL.daily?.revenue ? (freshPnL.daily.operatingExpenses / freshPnL.daily.revenue) * 100 : 0)})`
        ],
        ['กำไรจากการดำเนินงาน',
          formatCurrency(freshPnL.daily?.operatingProfit || 0),
          formatCurrency(freshPnL.monthly?.operatingProfit || 0),
          formatPercent(freshPnL.daily?.operatingProfit && freshPnL.daily?.revenue ? (freshPnL.daily.operatingProfit / freshPnL.daily.revenue) * 100 : 0)
        ],
        [''],

        // Menu analysis section
        ['=== การวิเคราะห์เมนู ==='],
        ['ชื่อเมนู', 'ราคาขาย', 'ต้นทุนผันแปร', 'กำไรส่วนเพิ่ม', 'เปอร์เซ็นต์กำไรส่วนเพิ่ม'],
        ...freshMenus.map((menu: any) => [
          menu?.name || 'Unknown',
          formatCurrency(menu?.price || 0),
          formatCurrency(menu?.vc || 0),
          formatCurrency(menu?.cm || 0),
          formatPercent(menu?.cmPct || 0)
        ])
      ];

      // Convert 2D array to CSV string with proper escaping
      const csvContent = csvRows
        .map(row =>
          row.map((cell: any) => {
            const cellStr = String(cell || '');
            // Escape cells containing commas, quotes, or newlines
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          }).join(',')
        )
        .join('\r\n'); // Use Windows line endings for better Excel compatibility

      // Add UTF-8 BOM for proper Thai character encoding in Excel
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      // Create blob with UTF-8 encoding
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      // Download the file
      const link = document.createElement('a');
      link.href = url;
      link.download = `financial_report_${today}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      console.log(`[Reports] Real-time comprehensive export completed at ${exportData.exportInfo.timestamp}`);
      setExportProgress('เสร็จสิ้น!');

    } catch (error) {
      console.error('Real-time comprehensive export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถส่งออกรายงานครบถ้วนได้';
      alert(`ข้อผิดพลาด: ${errorMessage}`);
      setExportProgress('');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress('');
      }, 1000);
    }
  };

  const profitMarginAnalysis = {
    grossMargin: (pnl.daily.grossProfit / pnl.daily.revenue) * 100,
    operatingMargin: (pnl.daily.operatingProfit / pnl.daily.revenue) * 100,
    contributionMargin: kpis.cmPct
  };

  const costStructure = [
    { category: 'ต้นทุนขาย (COGS)', amount: pnl.daily.cogs, percentage: (pnl.daily.cogs / pnl.daily.revenue) * 100 },
    { category: 'ค่าใช้จ่ายดำเนินงาน', amount: pnl.daily.operatingExpenses, percentage: (pnl.daily.operatingExpenses / pnl.daily.revenue) * 100 }
  ];

  const kpiSummary = [
    { metric: 'รายได้รายวัน', value: formatCurrency(kpis.revenue), status: 'good' },
    { metric: 'กำไรขั้นต้น', value: formatCurrency(kpis.grossProfit), status: 'good' },
    { metric: 'กำไรจากการดำเนินงาน', value: formatCurrency(kpis.operatingProfit), status: kpis.operatingProfit > 0 ? 'good' : 'warning' },
    { metric: 'Prime Cost %', value: formatPercent(kpis.primeCostPct), status: kpis.primeCostPct < 60 ? 'good' : 'warning' },
    { metric: 'Food Cost %', value: formatPercent(kpis.foodCostPct), status: kpis.foodCostPct < 35 ? 'good' : 'warning' },
    { metric: 'Labor %', value: formatPercent(kpis.laborPct), status: kpis.laborPct < 25 ? 'good' : 'warning' },
    { metric: 'จุดคุ้มทุน/วัน', value: `${Math.round(kpis.bepPerDay)} จาน`, status: kpis.bepPerDay < 100 ? 'good' : 'warning' },
    { metric: 'Safety Margin', value: formatPercent(kpis.safetyMargin), status: kpis.safetyMargin > 30 ? 'good' : 'warning' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">รายงานการเงิน</h2>
          <p className="text-muted-foreground">สรุปผลการดำเนินงานและการส่งออกข้อมูล</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            พิมพ์
          </Button>
          <Button variant="outline" onClick={handleExportAllReports} disabled={isExporting}>
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? (exportProgress || 'กำลังส่งออก...') : 'Export'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">สรุปผลการดำเนินงาน</TabsTrigger>
          <TabsTrigger value="pnl">งบกำไรขาดทุน</TabsTrigger>
          <TabsTrigger value="menu">วิเคราะห์เมนู</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                สรุปผู้บริหาร
              </CardTitle>
              <CardDescription>
                ตัวชี้วัดสำคัญและผลการดำเนินงาน ณ วันที่ {new Date().toLocaleDateString('th-TH')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {kpiSummary.map((kpi, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground">{kpi.metric}</div>
                    <div className="text-lg font-bold mt-1">{kpi.value}</div>
                    <Badge 
                      variant={kpi.status === 'good' ? 'default' : 'secondary'}
                      className="text-xs mt-1"
                    >
                      {kpi.status === 'good' ? 'ดี' : 'ต้องปรับปรุง'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Profitability Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                วิเคราะห์ความสามารถในการทำกำไร
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-900">Gross Profit Margin</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatPercent(profitMarginAnalysis.grossMargin)}
                  </div>
                  <div className="text-xs text-green-700">
                    อุตสาหกรรมเฉลี่ย: 65-75%
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">Operating Profit Margin</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPercent(profitMarginAnalysis.operatingMargin)}
                  </div>
                  <div className="text-xs text-blue-700">
                    เป้าหมาย: {'>'} 15%
                  </div>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-sm font-medium text-orange-900">Contribution Margin</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatPercent(profitMarginAnalysis.contributionMargin)}
                  </div>
                  <div className="text-xs text-orange-700">
                    เป้าหมาย: {'>'} 60%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Structure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                โครงสร้างต้นทุน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>หมวดหมู่</TableHead>
                    <TableHead className="text-right">จำนวน (รายวัน)</TableHead>
                    <TableHead className="text-right">ร้อยละของรายได้</TableHead>
                    <TableHead className="text-right">สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costStructure.map((cost, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{cost.category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(cost.amount)}</TableCell>
                      <TableCell className="text-right">{formatPercent(cost.percentage)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={cost.percentage < 50 ? 'default' : 'secondary'}>
                          {cost.percentage < 50 ? 'เหมาะสม' : 'ต้องตรวจสอบ'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pnl" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>งบกำไรขาดทุน (P&L Statement)</CardTitle>
                  <CardDescription>
                    แสดงผลการดำเนินงานทางการเงินรายวันและรายเดือน
                  </CardDescription>
                </div>
                <Button onClick={handleExportPnL} disabled={isExporting}>
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? (exportProgress || 'กำลังส่งออก...') : 'Export P&L'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รายการ</TableHead>
                    <TableHead className="text-right">รายวัน</TableHead>
                    <TableHead className="text-right">รายเดือน</TableHead>
                    <TableHead className="text-right">% ของรายได้</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="font-medium">
                    <TableCell>รายได้</TableCell>
                    <TableCell className="text-right">{formatCurrency(pnl.daily.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(pnl.monthly.revenue)}</TableCell>
                    <TableCell className="text-right">100.0%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-4">ต้นทุนขาย (COGS)</TableCell>
                    <TableCell className="text-right">({formatCurrency(pnl.daily.cogs)})</TableCell>
                    <TableCell className="text-right">({formatCurrency(pnl.monthly.cogs)})</TableCell>
                    <TableCell className="text-right">({formatPercent((pnl.daily.cogs / pnl.daily.revenue) * 100)})</TableCell>
                  </TableRow>
                  <TableRow className="font-medium border-t">
                    <TableCell>กำไรขั้นต้น</TableCell>
                    <TableCell className="text-right">{formatCurrency(pnl.daily.grossProfit)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(pnl.monthly.grossProfit)}</TableCell>
                    <TableCell className="text-right">{formatPercent((pnl.daily.grossProfit / pnl.daily.revenue) * 100)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-4">ค่าใช้จ่ายดำเนินงาน</TableCell>
                    <TableCell className="text-right">({formatCurrency(pnl.daily.operatingExpenses)})</TableCell>
                    <TableCell className="text-right">({formatCurrency(pnl.monthly.operatingExpenses)})</TableCell>
                    <TableCell className="text-right">({formatPercent((pnl.daily.operatingExpenses / pnl.daily.revenue) * 100)})</TableCell>
                  </TableRow>
                  <TableRow className="font-bold border-t">
                    <TableCell>กำไรจากการดำเนินงาน</TableCell>
                    <TableCell className="text-right">{formatCurrency(pnl.daily.operatingProfit)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(pnl.monthly.operatingProfit)}</TableCell>
                    <TableCell className="text-right">{formatPercent((pnl.daily.operatingProfit / pnl.daily.revenue) * 100)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>วิเคราะห์ผลตอบแทนรายเมนู</CardTitle>
                  <CardDescription>
                    Unit Economics และ Contribution Margin ของแต่ละรายการอาหาร
                  </CardDescription>
                </div>
                <Button onClick={handleExportMenuAnalysis} disabled={isExporting}>
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? (exportProgress || 'กำลังส่งออก...') : 'Export Menu Analysis'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เมนู</TableHead>
                    <TableHead className="text-right">ราคาขาย</TableHead>
                    <TableHead className="text-right">ต้นทุนผันแปร</TableHead>
                    <TableHead className="text-right">Contribution Margin</TableHead>
                    <TableHead className="text-right">CM %</TableHead>
                    <TableHead className="text-right">การประเมิน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menus.map((menu: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{menu.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(menu.price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(menu.vc)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(menu.cm)}</TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={menu.cmPct > 60 ? 'default' : menu.cmPct > 40 ? 'secondary' : 'destructive'}
                        >
                          {formatPercent(menu.cmPct)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {menu.cmPct > 60 ? '⭐ ดีเยี่ยม' : menu.cmPct > 40 ? '✅ ปานกลาง' : '⚠️ ต้องปรับปรุง'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">ข้อเสนะแนะการปรับปรุงเมนู</h4>
                <div className="space-y-2 text-sm">
                  {menus.some((m: any) => m.cmPct < 40) && (
                    <div className="text-orange-700">
                      • เมนูที่มี CM % ต่ำกว่า 40% ควรทบทวนราคาขายหรือลดต้นทุนวัตถุดิบ
                    </div>
                  )}
                  {menus.some((m: any) => m.cmPct > 70) && (
                    <div className="text-green-700">
                      • เมนูที่มี CM % สูงกว่า 70% สามารถใช้เป็นจุดแข็งในการขาย
                    </div>
                  )}
                  <div className="text-blue-700">
                    • เป้าหมาย CM % เฉลี่ย: 60-65% สำหรับร้านอาหารประเภทนี้
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