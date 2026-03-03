Live demo https://demoposbytonxz.vercel.app
username: admin
password: 123456

# 🍽️ POS System — ระบบจัดการร้านอาหาร

![Dashboard Preview](image.png)

ระบบ POS สำหรับร้านอาหาร พัฒนาด้วย **Next.js 16** รองรับการจัดการเมนู โต๊ะ ออเดอร์ และคำนวณราคารวมอัตโนมัติผ่าน State — เหมาะสำหรับศึกษาและนำไปต่อยอด

## ✨ Features

- 📊 **Dashboard** — สรุปยอดขายรายวัน, กราฟ 7 วัน, ผังโต๊ะแบบ Real-time
- 🍜 **จัดการเมนู** — เพิ่ม/ลบเมนู, ตั้งราคา, อัปโหลดรูปภาพ, เปิด/ปิดขาย
- 🪑 **จัดการโต๊ะ** — เพิ่ม/ลบโต๊ะ, สร้าง QR Code สำหรับลูกค้าสแกน
- 🛒 **ระบบสั่งอาหาร** — ลูกค้าสแกน QR → สั่งผ่านมือถือ → ครัวรับออเดอร์ Real-time
- 👨‍🍳 **คิวออเดอร์** — ติดตามสถานะ PENDING → COOKING → SERVED
- 💰 **ชำระเงิน** — บันทึกการจ่ายเงิน (เงินสด/โอน) พร้อมคำนวณเงินทอน
- 🔒 **ระบบ Auth** — Login ด้วย NextAuth v5 (JWT + Credentials)

## 🛠️ Tech Stack

| เทคโนโลยี | เวอร์ชัน |
|---|---|
| Bun | — |
| Next.js (App Router) | 16.1.6 |
| React | 19.2.3 |
| TypeScript | 5.x |
| Tailwind CSS | 4.x |
| Prisma ORM | 7.x |
| PostgreSQL (Neon) | — |
| NextAuth.js | v5 beta |
| UploadThing | 7.x |
| Zod | 4.x |
| Recharts | 3.x |

## 📦 Getting Started

### 1. Clone โปรเจค

```bash
git clone https://github.com/TonXz123/Pos.git
cd Pos
```

### 2. ติดตั้ง Dependencies

```bash
bun install
# หรือ
npm install
```

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ที่ root ของโปรเจค:

```env
DATABASE_URL="postgresql://username:password@host/dbname?sslmode=require"
UPLOADTHING_TOKEN="your-uploadthing-token"
AUTH_SECRET="your-secret-key-at-least-32-characters"
```

> 💡 แนะนำใช้ [Neon](https://neon.tech) สำหรับ PostgreSQL ฟรี

### 4. สร้าง Database

```bash
bunx prisma migrate dev
```

### 5. Seed Admin User

```bash
bunx tsx seed-admin.ts
```

> ⚠️ **อย่าลืมเปลี่ยนรหัสผ่าน** หลัง seed เสร็จ

### 6. รัน Development Server

```bash
bun dev
```

เปิด [http://localhost:3000](http://localhost:3000) เพื่อเข้าสู่หน้า Login

## 📁 โครงสร้างโปรเจค

```
├── app/
│   ├── api/              # API Routes
│   │   ├── auth/         # NextAuth endpoints
│   │   ├── dashboard/    # สรุปยอดขาย, กราฟ, คิว
│   │   ├── menu/         # CRUD เมนู + options
│   │   ├── orders/       # จัดการออเดอร์
│   │   ├── table/        # CRUD โต๊ะ + SSE stream
│   │   └── uploadthing/  # อัปโหลดรูปเมนู
│   ├── admin/            # หน้า Admin Dashboard
│   ├── scan/[id]/        # QR Code redirect
│   ├── table/[tableNo]/  # หน้าสั่งอาหาร (ฝั่งลูกค้า)
│   └── page.tsx          # หน้า Login
├── components/
│   ├── features/         # Components แยกตาม feature
│   ├── layouts/          # Sidebar, Header
│   └── ui/               # Shared UI components
├── lib/
│   ├── actions/          # Server Actions
│   ├── auth-guard.ts     # Auth utility
│   ├── prisma.ts         # Prisma client
│   ├── validators.ts     # Zod schemas
│   └── uploadthing.ts    # UploadThing config
├── prisma/
│   └── schema.prisma     # Database schema
├── auth.ts               # NextAuth config
├── auth.config.ts        # Auth callbacks
└── proxy.ts              # Next.js 16 middleware
```

## 🗄️ Database Schema

```
User ──< Order ──< OrderItem >── MenuItem ──< MenuOption
  │        │
  │        └── Payment
  │
  └──< CashDrawerSession ──< Payment

Table ──< Order
```

## 🚀 Deploy บน Vercel

1. Push โค้ดขึ้น GitHub
2. เชื่อม repo กับ [Vercel](https://vercel.com)
3. ตั้งค่า Environment Variables บน Vercel Dashboard:
   - `DATABASE_URL`
   - `UPLOADTHING_TOKEN`
   - `AUTH_SECRET`
4. Deploy!

**Made with ❤️ for learning purposes**
