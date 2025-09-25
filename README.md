# 🧮 Finance Simulator Dashboard

ระบบจำลองการเงินสำหรับร้านอาหาร พร้อมการคำนวณต้นทุน กำไร และจุดคุ้มทุน

## ✨ ฟีเจอร์หลัก

- 📊 **แดชบอร์ด**: แสดงภาพรวมทางการเงินแบบเรียลไทม์
- 🍽️ **จัดการเมนู**: เพิ่ม/แก้ไขเมนูและสูตรอาหาร (BOM)
- 📈 **โมเดลยอดขาย**: คาดการณ์ยอดขายและค่าธรรมเนียม
- ⚡ **สาธารณูปโภค**: คำนวณค่าไฟ แก๊ส น้ำ
- 👥 **แรงงาน**: จัดการค่าแรงและชั่วโมงทำงาน
- 💰 **ค่าใช้จ่ายคงที่**: ค่าเช่า อินเทอร์เน็ต ซ่อมบำรุง
- 📋 **สถานการณ์**: วิเคราะห์สถานการณ์ต่างๆ (Base/Best/Worst)
- 📊 **รายงาน**: สร้างรายงานทางการเงินและส่งออกข้อมูล
- ⚙️ **ตั้งค่า**: จัดการการตั้งค่าระบบและความเป็นส่วนตัว

## 🚀 การ Deploy บน Vercel

### วิธีที่ 1: Deploy อัตโนมัติ (แนะนำ)

1. **Push โค้ดขึ้น GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy บน Vercel**
   - ไปที่ [vercel.com](https://vercel.com)
   - สมัครสมาชิกด้วย GitHub
   - กด "New Project"
   - เลือก repository ของคุณ
   - กด "Deploy"

### วิธีที่ 2: Deploy ด้วย Vercel CLI

```bash
# ติดตั้ง Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy production
vercel --prod
```

## 🛠️ การพัฒนา

### ติดตั้ง Dependencies
```bash
npm install
```

### รัน Development Server
```bash
npm run dev
```

### Build สำหรับ Production
```bash
npm run build
```

### ทดสอบ Production Build
```bash
npm run preview
```

### รัน Tests
```bash
npm run test
npm run test:coverage
```

## 📁 โครงสร้างโปรเจกต์

```
src/
├── components/          # React Components
│   ├── ui/             # UI Components (Radix UI)
│   ├── Dashboard.tsx   # แดชบอร์ดหลัก
│   ├── SalesModel.tsx  # โมเดลยอดขาย
│   ├── MenuBOM.tsx     # จัดการเมนูและสูตร
│   ├── UtilitiesModel.tsx # สาธารณูปโภค
│   ├── LaborModel.tsx  # แรงงาน
│   ├── FixedCosts.tsx  # ค่าใช้จ่ายคงที่
│   ├── Scenarios.tsx   # สถานการณ์
│   ├── Reports.tsx     # รายงาน
│   └── FinanceSettings.tsx # ตั้งค่า
├── lib/                # Business Logic
│   ├── finance-engine.ts # เครื่องมือคำนวณทางการเงิน
│   ├── validation.ts   # ตรวจสอบข้อมูล
│   ├── state-manager.ts # จัดการ State
│   └── utils.ts        # Utilities
├── hooks/              # React Hooks
│   └── useFinanceState.ts # State Management Hook
└── styles/             # CSS Styles
```

## 🔧 การตั้งค่า

### Environment Variables
สร้างไฟล์ `.env.local`:
```env
VITE_APP_TITLE=Finance Simulator Dashboard
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=false
```

### การปรับแต่ง
- แก้ไข `src/lib/finance-engine.ts` สำหรับสูตรคำนวณ
- แก้ไข `src/components/` สำหรับ UI/UX
- แก้ไข `src/styles/` สำหรับ styling

## 📊 สูตรการคำนวณ

### Prime Cost
```
Prime Cost = Food Cost + Direct Labor Cost
```

### Contribution Margin
```
CM = Selling Price - Variable Cost per Unit
CM% = (CM / Selling Price) × 100
```

### Break-Even Point
```
BEP Units = Fixed Costs / CM per Unit
BEP Revenue = BEP Units × Selling Price
```

### Safety Margin
```
Safety Margin = (Actual Sales - BEP Sales) / Actual Sales × 100
```

## 🛡️ ความปลอดภัย

- ข้อมูลทั้งหมดเก็บใน localStorage (ไม่ส่งออกนอกเครื่อง)
- มีการตรวจสอบข้อมูลเข้า (Input Validation)
- Error Boundary จับ JavaScript errors
- ไม่เก็บข้อมูลส่วนตัวที่อ่อนไหว

## 📱 การใช้งาน

1. **เพิ่มเมนู**: ไปที่แท็บ "เมนู & สูตร" เพิ่มเมนูและวัตถุดิบ
2. **ตั้งยอดขาย**: ไปที่แท็บ "ยอดขาย" กำหนดการคาดการณ์
3. **เพิ่มต้นทุน**: ไปที่แท็บ "สาธารณูปโภค", "แรงงาน", "ค่าใช้จ่ายคงที่"
4. **ดูผลลัพธ์**: ไปที่แท็บ "แดชบอร์ด" ดูภาพรวม
5. **วิเคราะห์**: ไปที่แท็บ "สถานการณ์" เปรียบเทียบสถานการณ์ต่างๆ
6. **ส่งออก**: ไปที่แท็บ "รายงาน" ส่งออกข้อมูล

## 🤝 การสนับสนุน

หากพบปัญหา:
1. ตรวจสอบ Console Logs ใน Browser DevTools
2. ดู Error ID ในหน้า Error Boundary
3. ลองรีเฟรชหน้าเว็บ
4. ล้างข้อมูล Browser (Cache & Cookies)

## 📄 License

MIT License - ใช้งานได้ฟรีสำหรับการค้าและส่วนตัว

## 🔄 การอัปเดต

### Version 1.0.0
- ✅ ระบบคำนวณทางการเงินครบถ้วน
- ✅ UI/UX ที่ใช้งานง่าย
- ✅ การตรวจสอบข้อมูลเข้า
- ✅ Error Handling ที่ครอบคลุม
- ✅ State Management ที่เสถียร
- ✅ Unit Tests
- ✅ พร้อม Deploy บน Vercel

---

**สร้างด้วย ❤️ สำหรับร้านอาหารไทย**