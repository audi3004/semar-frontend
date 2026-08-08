# PANDUAN LENGKAP MIGRASI PRODUCTION & SETUP DATABASE
## DIGITAL WORKFORCE MANAGEMENT SYSTEM
**PT PLN Electricity Services - Unit Pelaksana 2 JATENG & DIY**

---

## 📌 SPESIFIKASI PERSYARATAN SISTEM (SYSTEM REQUIREMENTS)

### 1. Application Tech Stack Specs
| Komponen | Spesifikasi & Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Backend** | Node.js (v20+ LTS) | Dijalankan sebagai service via PM2 Process Manager |
| **Database** | MariaDB 10.5+ / MySQL 8.0+ | Relational DB dengan Engine InnoDB (utf8mb4) |
| **Language** | JavaScript (ES Module / CommonJS) | Node.js Backend & React.js Frontend |
| **ORM Engine** | Sequelize ORM | Pemetaan skema, migrasi, dan query data transaksional |
| **Frontend** | React.js 18+ (Vite Build) | Di-serve sebagai static SPA web via NGINX Web Server |
| **CronJob** | Node.js Scheduled Tasks / Cron | Pembersihan log otomatis & rekapan presensi harian |
| **Operating System** | Windows Server 2019/2022 *(Preferred)* / Ubuntu 22.04 LTS | Dukungan Penuh Cross-Platform |

### 2. Infrastructure & Upload Limits Specs
| Parameter | Nilai Minimum | Nilai Rekomendasi Production |
| :--- | :--- | :--- |
| **CPU Core** | 2 Cores | 4 Cores vCPU |
| **RAM Memory** | 4 GB | 8 GB RAM |
| **Storage Capacity** | 60 GB SSD / NVMe | 100 GB SSD NVMe |
| **Batas Upload Foto** | **Maksimal 25 KB** | Otomatis ter-compress sebelum disimpan/dikirim |
| **Batas Upload File** | **Maksimal 250 KB** | Berkas lampiran PDF / SK Dokter / Bukti Pendukung |

---

## 🗄️ 1. SETUP DATABASE MARIADB & SEQUELIZE ORM

### A. Eksekusi Skrip DDL (MariaDB / MySQL)
Akses prompt terminal / MySQL Workbench / HeidiSQL di Windows atau Linux, lalu buat database dan jalankan `database/schema.sql` serta `database/seed.sql`:

```sql
-- Create Database & User
CREATE DATABASE IF NOT EXISTS epresensi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'epresensi_user'@'localhost' IDENTIFIED BY 'PasswordPlnEs2026!';
GRANT ALL PRIVILEGES ON epresensi_db.* TO 'epresensi_user'@'localhost';
FLUSH PRIVILEGES;
```

Eksekusi file skrip SQL:
* **Di Windows PowerShell / CMD**:
  ```cmd
  mysql -u epresensi_user -pPasswordPlnEs2026! epresensi_db < database\schema.sql
  mysql -u epresensi_user -pPasswordPlnEs2026! epresensi_db < database\seed.sql
  ```
* **Di Ubuntu Linux Terminal**:
  ```bash
  mariadb -u epresensi_user -p'PasswordPlnEs2026!' epresensi_db < database/schema.sql
  mariadb -u epresensi_user -p'PasswordPlnEs2026!' epresensi_db < database/seed.sql
  ```

### B. Inisialisasi Sequelize ORM
Aplikasi telah dilengkapi file konfig ORM Sequelize di `database/sequelize-config.js`. Pasang dependency pendukung:
```bash
npm install sequelize mariadb mysql2
```

Lakukan sinking model Sequelize secara otomatis jika diperlukan:
```javascript
import { sequelize } from './database/sequelize-config.js';

// Sync Database Tables via Sequelize
async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Koneksi MariaDB via Sequelize berhasil!');
    await sequelize.sync({ alter: true });
    console.log('✅ Sinkronisasi Model Sequelize selesai.');
  } catch (error) {
    console.error('❌ Gagal koneksi ke MariaDB:', error);
  }
}
initDatabase();
```

---

## 💻 2. PANDUAN DEPLOYMENT DI WINDOWS SERVER (PREFERRED)

### Step 2.1: Install Prasyarat
1. Download & install **Node.js LTS** (v20+): https://nodejs.org
2. Download & install **MariaDB Server 10.5+**: https://mariadb.org
3. Download & install **NGINX for Windows**: http://nginx.org/en/download.html
4. Install **PM2 for Windows** via Command Prompt:
   ```cmd
   npm install -g pm2
   npm install -g pm2-windows-startup
   pm2-startup install
   ```

### Step 2.2: Setup Environment & Build
Buat file `.env` di folder aplikasi:
```env
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_NAME=epresensi_db
DB_USER=epresensi_user
DB_PASSWORD=PasswordPlnEs2026!
JWT_SECRET=PLN_ES_SECRET_2026
MAX_FOTO_SIZE_KB=25
MAX_FILE_SIZE_KB=250
```

Jalankan build frontend & backend bundle:
```cmd
npm run build
```

### Step 2.3: Jalankan Service Backend dengan PM2
```cmd
pm2 start dist/server.js --name "plnes-workforce-backend"
pm2 save
```

### Step 2.4: Konfigurasi NGINX untuk Windows
Buka file `C:\nginx\conf\nginx.conf` dan tambahkan blok server:

```nginx
server {
    listen       80;
    server_name  localhost workforce.pln-es.co.id;

    # Limit Payload Body Size sesuai spek (Foto 25kB, File 250kB)
    client_max_body_size 5M;

    # Serve React Frontend Static Build
    location / {
        root   C:/apps/plnes-workforce/dist;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Reverse Proxy API Routes ke PM2 Node.js (Port 3000)
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Jalankan NGINX:
```cmd
cd C:\nginx
start nginx
```

---

## 🐧 3. PANDUAN DEPLOYMENT DI UBUNTU LINUX SERVER

### Step 3.1: Install Dependency
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git mariadb-server nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### Step 3.2: Build & Start PM2
```bash
cd /var/www/plnes-workforce
npm install
npm run build
pm2 start dist/server.js --name "plnes-workforce-backend"
pm2 save
pm2 startup
```

### Step 3.3: Konfigurasi NGINX Ubuntu
Buat file `/etc/nginx/sites-available/plnes-workforce`:
```nginx
server {
    listen 80;
    server_name workforce.pln-es.co.id;

    client_max_body_size 5M;

    location / {
        root /var/www/plnes-workforce/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
Enable & restart:
```bash
sudo ln -s /etc/nginx/sites-available/plnes-workforce /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## ⏱️ 4. KONFIGURASI CRONJOB (NODE.JS SCHEDULER)

CronJob otomatis terintegrasi menggunakan Node.js scheduler yang berjalan di background PM2 service (`dist/server.js`), melakukan tugas berikut:
1. **Rekap Presensi Harian (00:01 WIB)**: Memeriksa dan menandai pegawai yang tidak check-in sebagai Alpha/Cuti.
2. **Pembersihan Log Notifikasi (02:00 WIB)**: Menghapus log notifikasi yang berusia lebih dari 90 hari.

---

## 🗺️ 5. PEMETAAN REACT ROUTER DOM & DATA SERVICES

| Route UI Path | Komponen React Page | Deskripsi & Fungsi |
| :--- | :--- | :--- |
| `/login` | `LoginPage.jsx` | Autentikasi User 6-Tingkat Peran |
| `/` | `DashboardPage.jsx` | KPI Ringkasan Presensi, Pengajuan, Grafik & Kalender |
| `/lembur` | `LemburPage.jsx` | CRUD Pengajuan Lembur & Kalkulator Kategori |
| `/sppd` | `SppdPage.jsx` | Pengajuan SPPD, Rincian Biaya Checker/Approved2 |
| `/cuti` | `CutiPage.jsx` | Pengajuan Cuti & Kalkulasi Sisa Kuota Cuti |
| `/ijin` | `IjinPage.jsx` | Pengajuan Ijin & Potongan Hari |
| `/sakit` | `SakitPage.jsx` | Pengajuan Sakit & Upload Surat Dokter |
| `/master/pegawai` | `PegawaiPage.jsx` | Master Data Tenaga Kerja, NIP, & Gaji |
| `/master/hari-libur` | `FaktorUpahPage.jsx` | Master DPL & Hari Libur Nasional |
| `/master/umk` | `UmkPage.jsx` | Master Upah Dasar / UMK Kab & Kota |
| `/master/kategori-lembur` | `JabatanPage.jsx` | Kategori Pekerjaan & Lembur |
| `/master/unit-kerja` | `UnitKerjaPage.jsx` | Master UPT, ULTG, dan Gardu Induk |
| `/pengaturan` | `PengaturanPage.jsx` | Batas Operasional (Max Cuti, Overtime Limit) |

---
*Dokumen ini disusun secara resmi untuk PT PLN Electricity Services - Unit Pelaksana 2 JATENG & DIY.*
