# QC Asset Control

เว็บแอปต้นแบบสำหรับงาน QC ภายในองค์กรและการตรวจครุภัณฑ์/ทรัพย์สิน รองรับการทดลองใช้งานแบบไม่ต้องติดตั้งฐานข้อมูล

## วิธีรัน

วิธีที่ง่ายที่สุดคือเปิดไฟล์ `index.html` ด้วยเบราว์เซอร์

หรือรันผ่าน local server:

```powershell
cd C:\Users\arthit.d\Documents\Codex\2026-07-09\499455\outputs\qc-app
python -m http.server 8080
```

แล้วเปิด `http://localhost:8080`

## บัญชีทดลอง

- Admin: `admin` / `admin123`
- QC: `qc` / `qc123`
- Supervisor: `supervisor` / `sup123`
- Viewer: `viewer` / `view123`

## ฟังก์ชันหลัก

- Login และ role-based access
- สแกน/กรอกรหัส QR หรือ Barcode เช่น `AST-1001`
- ตรวจคุณภาพพร้อม checklist, Pass/Fail, คะแนน, รูปแนบ, ลายเซ็น และ GPS
- บันทึก defect พร้อมประเภท สาเหตุ หมายเหตุ และสถานะแก้ไข
- Dashboard, กราฟ, สถิติ Pass/Fail และ ranking สาเหตุ
- ค้นหารายงานย้อนหลัง, export CSV สำหรับ Excel, print/PDF
- Backup/restore JSON และ offline queue จำลองก่อนซิงค์

## การต่อยอดจริง

- เชื่อม backend API กับ MySQL หรือ SQL Server
- เพิ่ม Android APK ด้วย Capacitor หรือ React Native
- ใช้กล้องจริงสำหรับ QR/Barcode ผ่าน Barcode Detector API หรือ native plugin
- ทำระบบแจ้งเตือนผ่าน email, LINE Notify, Teams หรือ push notification
