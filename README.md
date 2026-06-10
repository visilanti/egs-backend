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
| `express-validator` | Validasi input request body & query params |
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
    │   ├── auth.js           # Verifikasi API Key (x-api-key)
    │   └── validators.js     # Aturan validasi input (express-validator)
    ├── routes/
    │   └── scheduleRoutes.js # Definisi semua route jadwal
    └── controllers/
        └── scheduleController.js # Logika bisnis (CRUD, upload, export, laporan)
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
| `class_code` | VARCHAR(20) | Kode kelas |
| `class_name` | VARCHAR(50) | Nama kelas |
| `subject_code` | VARCHAR(20) | Kode mata pelajaran |
| `teacher_nik` | VARCHAR(20) | NIK guru |
| `teacher_name` | VARCHAR(100) | Nama guru |
| `date` | DATE | Tanggal jadwal (`YYYY-MM-DD`) |
| `jam_ke` | INTEGER | Jam pelajaran ke-n (1–12) |
| `time_start` | TIME | Waktu mulai (`HH:MM`) |
| `time_end` | TIME | Waktu selesai (`HH:MM`) |

---

## 📡 API Endpoints

Base URL: `/api/schedules`

### Jadwal (CRUD)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/schedules` | Ambil semua jadwal |
| `POST` | `/api/schedules` | Buat jadwal baru |
| `PUT` | `/api/schedules/:id` | Update jadwal penuh (semua field wajib) |
| `PATCH` | `/api/schedules/:id` | Update jadwal sebagian (partial update) |
| `DELETE` | `/api/schedules/:id` | Hapus jadwal berdasarkan ID |

### Query Khusus per Peran

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/schedules/students` | Jadwal siswa per kelas & tanggal |
| `GET` | `/api/schedules/teacher` | Jadwal & total JP guru per rentang tanggal |
| `GET` | `/api/schedules/report/rekap-jp` | Rekap JP semua guru untuk Yayasan |
| `GET` | `/api/schedules/report/harian` | Laporan aktivitas pengajar per hari |
| `GET` | `/api/schedules/report/bulanan` | Laporan rekap JP per pekan dalam satu bulan |

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

**Response jika validasi gagal (400):**
```json
{
  "status": "Bad Request",
  "message": "Validasi gagal",
  "errors": [
    { "field": "jam_ke", "message": "jam_ke harus bilangan bulat antara 1 - 12" },
    { "field": "time_end", "message": "time_end harus berformat HH:MM (contoh: 07:45)" }
  ]
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

### `PATCH /api/schedules/:id` — Partial Update Jadwal

Hanya field yang dikirim yang akan diupdate. Field yang tidak dikirim tetap menggunakan nilai lama.

**Request Body (contoh: hanya ubah nama guru & waktu selesai):**
```json
{
  "teacher_name": "Budi Santoso S.Pd",
  "time_end": "08:30"
}
```

**Response (200 OK):**
```json
{
  "status": "Success",
  "message": "Schedule partially updated successfully",
  "data": { ... }
}
```

> **Catatan:** Conflict detection hanya berjalan jika field `date`, `jam_ke`, `class_code`, atau `teacher_nik` ikut diubah.

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

### `GET /api/schedules/report/harian` — Laporan Harian

**Query Params:**
```
?date=2026-06-15
```

**Response:**
```json
{
  "status": "Success",
  "message": "Laporan harian berhasil diambil",
  "data": {
    "date": "2026-06-15",
    "total_pengajar": 3,
    "total_jp_hari": 12.5,
    "rekap": [
      {
        "teacher_nik": "1234567890",
        "teacher_name": "Budi Santoso",
        "kelas_diajar": "XII RPL 1, XII RPL 2",
        "total_sesi": 4,
        "total_jam": 3.0,
        "detail_jadwal": [ ... ]
      }
    ]
  }
}
```

---

### `GET /api/schedules/report/bulanan` — Laporan Bulanan

**Query Params:**
```
?year=2026&month=6
```

**Response:**
```json
{
  "status": "Success",
  "message": "Laporan bulanan berhasil diambil",
  "data": {
    "periode": {
      "year": "2026",
      "month": "6",
      "nama_bulan": "Juni",
      "start_date": "2026-06-01",
      "end_date": "2026-06-30"
    },
    "total_pengajar": 5,
    "grand_total_jp": 87.5,
    "rekap": [
      {
        "no": 1,
        "nik": "1234567890",
        "nama_pengajar": "Budi Santoso",
        "kelas_diajar": "XII RPL 1",
        "pekan_1": 5.0,
        "pekan_2": 5.0,
        "pekan_3": 5.0,
        "pekan_4": 5.0,
        "pekan_5": 0,
        "total_jp": 20.0
      }
    ]
  }
}
```

---

### `POST /api/schedules/upload` — Upload Excel

Upload file Excel (`multipart/form-data`) dengan field name `file`.

**Batasan upload:**
- Format: `.xlsx` atau `.xls` saja
- Ukuran maksimum: **5 MB**

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

**Response jika file terlalu besar (400):**
```json
{
  "status": "Bad Request",
  "message": "Ukuran file melebihi batas maksimum 5 MB"
}
```

**Response jika format file salah (400):**
```json
{
  "status": "Bad Request",
  "message": "Hanya file Excel (.xlsx / .xls) yang diperbolehkan"
}
```

---

### `GET /api/schedules/export` — Export Excel

**Query Params:**
```
?start_date=2026-06-01&end_date=2026-06-30
```

Mengembalikan file Excel (`rekap_<start>_<end>.xlsx`) berisi rekap JP per guru per pekan, dengan format header 2 baris dan merged cell.

---

## ✅ Validasi Input

Semua endpoint dengan body atau query params dilindungi oleh **express-validator** (`src/middleware/validators.js`).

### Aturan validasi field body (POST / PUT)

| Field | Aturan |
|---|---|
| `class_code` | Wajib, maks 20 karakter |
| `class_name` | Wajib, maks 50 karakter |
| `subject_code` | Wajib, maks 20 karakter |
| `teacher_nik` | Wajib, maks 20 karakter |
| `teacher_name` | Wajib, maks 100 karakter |
| `date` | Wajib, format `YYYY-MM-DD` |
| `jam_ke` | Wajib, integer antara 1–12 |
| `time_start` | Wajib, format `HH:MM` |
| `time_end` | Wajib, format `HH:MM`, harus lebih besar dari `time_start` |

> **PATCH** menggunakan aturan yang sama, namun semua field bersifat **opsional** — jika dikirim, tetap harus valid.

### Aturan validasi query params

| Endpoint | Field | Aturan |
|---|---|---|
| `/students` | `class_code`, `date` | Wajib; `date` format `YYYY-MM-DD` |
| `/teacher` | `teacher_nik`, `start_date`, `end_date` | Wajib; date format `YYYY-MM-DD` |
| `/report/rekap-jp` | `start_date`, `end_date` | Wajib; date format `YYYY-MM-DD`; `end_date` ≥ `start_date` |

---

## 🛡️ Fitur Deteksi Bentrok Jadwal

Sistem secara otomatis mendeteksi dan menolak jadwal yang **bentrok** berdasarkan:

- **Bentrok Kelas**: Satu kelas tidak bisa memiliki lebih dari satu jadwal pada tanggal & jam pelajaran yang sama.
- **Bentrok Guru**: Satu guru tidak bisa mengajar di dua kelas berbeda pada tanggal & jam pelajaran yang sama.

Deteksi ini berlaku pada endpoint:
- `POST /api/schedules` (buat jadwal)
- `PUT /api/schedules/:id` (update jadwal penuh)
- `PATCH /api/schedules/:id` (partial update — hanya cek jika `date`/`jam_ke`/`class_code`/`teacher_nik` diubah)
- `POST /api/schedules/upload` (upload massal via Excel)

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

Production URL: `https://visilanti-egs-backend.vercel.app/`

---

## 🧪 Pengujian dengan Postman

File Postman Collection sudah disediakan untuk mempermudah pengujian semua endpoint.

📁 **Lokasi file:** `docs/EGS Backend API - Schedule Management.postman_collection.json`

### Cara Import ke Postman:

1. Buka aplikasi **Postman**.
2. Klik tombol **Import** (pojok kiri atas).
3. Pilih file `docs/EGS Backend API - Schedule Management.postman_collection.json`.
4. Collection **"EGS Backend API - Schedule Management"** akan langsung muncul berisi semua request yang siap digunakan.

### Pengujian di Production (Vercel)

Collection sudah dikonfigurasi secara default untuk mengarah ke URL production:

```
BASE_URL = https://visilanti-egs-backend.vercel.app/
```

API Key (`x-api-key`) sudah terpasang di level Collection sehingga otomatis diterapkan ke semua request.

### Pengujian Lokal (localhost)

Jika ingin menguji di server lokal, cukup ubah nilai variabel `BASE_URL`:

1. Klik nama collection → tab **Variables**.
2. Ubah nilai `BASE_URL` menjadi `http://localhost:3000`.
3. Klik **Save**, lalu jalankan request seperti biasa.

> **Catatan:** Pastikan server lokal sudah berjalan terlebih dahulu dengan `npm run dev` dan file `.env` sudah terkonfigurasi dengan benar.

### Request yang Tersedia

| Nama Request | Method | Endpoint |
|---|---|---|
| `get_all_schedules` | GET | `/api/schedules` |
| `create_schedule` | POST | `/api/schedules` |
| `update_schedule/:id` | PUT | `/api/schedules/:id` |
| `patch_schedule/:id` | PATCH | `/api/schedules/:id` |
| `delete_schedule/:id` | DELETE | `/api/schedules/:id` |
| `get_student_schedule` | GET | `/api/schedules/students` |
| `get_teacher_schedule` | GET | `/api/schedules/teacher` |
| `get_rekap_JP` | GET | `/api/schedules/report/rekap-jp` |
| `get_laporan_harian` | GET | `/api/schedules/report/harian` |
| `get_laporan_bulanan` | GET | `/api/schedules/report/bulanan` |
| `upload_excel` | POST | `/api/schedules/upload` |
| `export_excel` | GET | `/api/schedules/export` |

---

## 📜 Scripts

```bash
npm run dev    # Jalankan dengan nodemon (development)
npm start      # Jalankan tanpa nodemon (production)
```

---