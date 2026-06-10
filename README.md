# EGS Backend API

REST API backend untuk manajemen jadwal mengajar pada sistem **EGS (Education & Grading System)**. Dibangun dengan **Node.js + Express**, terhubung ke database **PostgreSQL (Supabase)**, dan di-deploy di **Vercel**.

---

## 🚀 Tech Stack

| Teknologi | Keterangan |
|---|---|
| Node.js + Express | Runtime & framework server |
| PostgreSQL (Supabase) | Database cloud |
| `pg` | PostgreSQL client untuk Node.js |
| `multer` | Upload file (multipart/form-data) |
| `xlsx` | Baca & tulis file Excel |
| `uuid` | Generate ID unik |
| `dotenv` | Manajemen environment variable |
| Vercel | Platform deployment (serverless) |

---

## 📁 Struktur Proyek

```
egs-backend/
├── index.js                  # Entry point aplikasi
├── vercel.json               # Konfigurasi deployment Vercel
├── package.json
├── .env                      # Environment variable (tidak di-commit)
└── src/
    ├── config/
    │   └── db.js             # Koneksi PostgreSQL (Pool)
    ├── middleware/
    │   └── auth.js           # Verifikasi API Key (x-api-key)
    ├── routes/
    │   └── scheduleRoutes.js # Definisi semua route jadwal
    └── controllers/
        └── scheduleController.js # Logika bisnis (CRUD, upload, export)
```

---

## ⚙️ Setup & Instalasi

### 1. Clone repository

```bash
git clone <url-repository>
cd egs-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Konfigurasi environment variable

Buat file `.env` di root proyek:

```env
PORT=3000
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
API_SECRET=your_secret_api_key
```

| Variable | Keterangan |
|---|---|
| `PORT` | Port server lokal (default: 3000) |
| `DATABASE_URL` | Connection string Supabase/PostgreSQL |
| `API_SECRET` | Secret key untuk autentikasi API |

### 4. Jalankan server lokal

```bash
# Development (dengan auto-reload)
npm run dev

# Production
npm start
```

Server akan berjalan di `http://localhost:3000`

---

## 🔐 Autentikasi

Semua endpoint dilindungi dengan **API Key**. Sertakan header berikut di setiap request:

```
x-api-key: <API_SECRET>
```

Jika API Key tidak valid atau tidak disertakan, server akan mengembalikan:

```json
{
  "message": "Unauthorized"
}
```

---

## 📋 Skema Database

Tabel `schedules`:

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID / Serial | Primary key |
| `class_code` | VARCHAR | Kode kelas |
| `class_name` | VARCHAR | Nama kelas |
| `subject_code` | VARCHAR | Kode mata pelajaran |
| `teacher_nik` | VARCHAR | NIK guru |
| `teacher_name` | VARCHAR | Nama guru |
| `date` | DATE | Tanggal jadwal (`YYYY-MM-DD`) |
| `jam_ke` | INTEGER | Jam pelajaran ke-n |
| `time_start` | TIME | Waktu mulai |
| `time_end` | TIME | Waktu selesai |

---

## 📡 API Endpoints

Base URL: `/api/schedules`

### Jadwal (CRUD)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/schedules` | Ambil semua jadwal |
| `POST` | `/api/schedules` | Buat jadwal baru |
| `PUT` | `/api/schedules/:id` | Update jadwal berdasarkan ID |
| `DELETE` | `/api/schedules/:id` | Hapus jadwal berdasarkan ID |

### Query Khusus

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/schedules/students` | Jadwal siswa per kelas & tanggal |
| `GET` | `/api/schedules/teacher` | Jadwal guru per rentang tanggal |
| `GET` | `/api/schedules/report/rekap-jp` | Rekap JP guru untuk Yayasan |

### Import & Export

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/schedules/upload` | Upload jadwal massal via file Excel |
| `GET` | `/api/schedules/export` | Export rekap JP ke file Excel |

---

## 📄 Contoh Request & Response

### `POST /api/schedules` — Buat Jadwal

**Request Body:**
```json
{
  "class_code": "XII-RPL-1",
  "class_name": "XII RPL 1",
  "subject_code": "MTK",
  "teacher_nik": "1234567890",
  "teacher_name": "Budi Santoso",
  "date": "2026-06-15",
  "jam_ke": 1,
  "time_start": "07:00",
  "time_end": "07:45"
}
```

**Response (201 Created):**
```json
{
  "status": "Success",
  "message": "Schedule created successfully",
  "data": { ... }
}
```

**Response jika bentrok (409 Conflict):**
```json
{
  "status": "Conflict",
  "message": "Bentrok jadwal: Kelas XII-RPL-1 sudah memiliki jadwal di jam tersebut"
}
```

---

### `GET /api/schedules/students` — Jadwal Siswa

**Query Params:**
```
?class_code=XII-RPL-1&date=2026-06-15
```

**Response:**
```json
{
  "classname": "XII RPL 1",
  "date": "2026-06-15",
  "Jadwal": [
    {
      "jam_ke": 1,
      "subject_code": "MTK",
      "teacher_name": "Budi Santoso",
      "time_start": "07:00:00",
      "time_end": "07:45:00"
    }
  ]
}
```

---

### `GET /api/schedules/teacher` — Jadwal Guru

**Query Params:**
```
?teacher_nik=1234567890&start_date=2026-06-01&end_date=2026-06-30
```

**Response:**
```json
{
  "teacher_name": "Budi Santoso",
  "periode": { "start date": "2026-06-01", "end_date": "2026-06-30" },
  "total jp": 20,
  "jadwal": [ ... ]
}
```

---

### `GET /api/schedules/report/rekap-jp` — Rekap JP Yayasan

**Query Params:**
```
?start_date=2026-06-01&end_date=2026-06-30
```

**Response:**
```json
{
  "periode": { "start date": "2026-06-01", "end date": "2026-06-30" },
  "total pengajar": 5,
  "rekap": [
    {
      "teacher nik": "1234567890",
      "teacher_name": "Budi Santoso",
      "total jp": 20,
      "total_kelas": 3,
      "detail": [
        { "class_name": "XII RPL 1", "jumlah jp": 10 }
      ]
    }
  ]
}
```

---

### `POST /api/schedules/upload` — Upload Excel

Upload file Excel (`multipart/form-data`) dengan field name `file`.

**Format kolom Excel yang diharapkan:**

| class_code | class_name | subject_code | teacher_nik | teacher_name | date | jam_ke | time_start | time_end |
|---|---|---|---|---|---|---|---|---|
| XII-RPL-1 | XII RPL 1 | MTK | 123... | Budi | 2026-06-15 | 1 | 07:00 | 07:45 |

**Response:**
```json
{
  "message": "Upload selesai. 10 baris berhasil, 2 baris gagal.",
  "success_count": 10,
  "failed_count": 2,
  "failed_rows": [
    { "row": 5, "data": { ... }, "reason": "Kelas XII-RPL-1 bentrok" }
  ]
}
```

---

### `GET /api/schedules/export` — Export Excel

**Query Params:**
```
?start_date=2026-06-01&end_date=2026-06-30
```

Mengembalikan file `rekap_jp.xlsx` yang langsung terunduh.

---

## 🌐 Deployment (Vercel)

Proyek ini dikonfigurasi untuk berjalan sebagai **Vercel Serverless Function** melalui `vercel.json`.

### Langkah Deploy:

1. Push kode ke GitHub.
2. Import repository di [vercel.com](https://vercel.com).
3. Tambahkan **Environment Variables** di dashboard Vercel:
   - `DATABASE_URL`
   - `API_SECRET`
4. Klik **Deploy**.

> **Catatan:** File `.env` **tidak perlu** di-push ke GitHub. Environment variable wajib dikonfigurasi manual di dashboard Vercel.

---

## 🧪 Pengujian dengan Postman

File Postman Collection sudah disediakan untuk mempermudah pengujian semua endpoint tanpa perlu membuat request dari nol.

📁 **Lokasi file:** `docs/EGS Backend Test.postman_collection.json`

### Cara Import ke Postman:

1. Buka aplikasi **Postman**.
2. Klik tombol **Import** (pojok kiri atas).
3. Pilih file `docs/EGS Backend Test.postman_collection.json`.
4. Collection **"EGS Backend Test"** akan langsung muncul berisi semua request yang siap digunakan.

### Pengujian di Production (Vercel)

Collection sudah dikonfigurasi secara default untuk mengarah ke URL production:

```
BASE_URL = https://visilanti-egs-backend.vercel.app/
```

API Key (`x-api-key`) sudah terpasang di level Collection sehingga otomatis diterapkan ke semua request.

### Pengujian Lokal (localhost)

Jika ingin menguji di server lokal, cukup ubah nilai variabel `BASE_URL`:

1. Klik nama collection **"EGS Backend Test"** → tab **Variables**.
2. Ubah nilai `BASE_URL` dari:
   ```
   https://visilanti-egs-backend.vercel.app/
   ```
   menjadi:
   ```
   http://localhost:3000
   ```
3. Klik **Save**, lalu jalankan request seperti biasa.

> **Catatan:** Pastikan server lokal sudah berjalan terlebih dahulu dengan `npm run dev` dan file `.env` sudah terkonfigurasi dengan benar sebelum melakukan pengujian lokal.

### Request yang Tersedia

| Nama Request | Method | Endpoint |
|---|---|---|
| `get_all_schedules` | GET | `/api/schedules` |
| `create_schedule` | POST | `/api/schedules` |
| `update_schedule/:id` | PUT | `/api/schedules/:id` |
| `delete_schedule/:id` | DELETE | `/api/schedules/:id` |
| `get_student_schedule` | GET | `/api/schedules/students` |
| `get_teacher_schedule` | GET | `/api/schedules/teacher` |
| `get_rekap_JP` | GET | `/api/schedules/report/rekap-jp` |
| `upload_excel` | POST | `/api/schedules/upload` |

---

## 🛡️ Fitur Deteksi Bentrok Jadwal

Sistem secara otomatis mendeteksi dan menolak jadwal yang **bentrok** berdasarkan:

- **Bentrok Kelas**: Satu kelas tidak bisa memiliki lebih dari satu jadwal pada tanggal & jam pelajaran yang sama.
- **Bentrok Guru**: Satu guru tidak bisa mengajar di dua kelas berbeda pada tanggal & jam pelajaran yang sama.

Deteksi ini berlaku pada endpoint:
- `POST /api/schedules` (buat jadwal)
- `PUT /api/schedules/:id` (update jadwal)
- `POST /api/schedules/upload` (upload massal via Excel)

---

## 📜 Scripts

```bash
npm run dev    # Jalankan dengan nodemon (development)
npm start      # Jalankan tanpa nodemon (production)
```

---