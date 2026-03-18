# AI-Powered Personal Finance Tracker

Personal Finance Tracker berbasis Next.js + Prisma + PostgreSQL yang ditingkatkan dengan layer Machine Learning terpisah (FastAPI + scikit-learn).

## Ringkasan

Project ini **tidak membangun ulang aplikasi dari nol**. Fitur inti finance tracker tetap dipakai, lalu ditambah kemampuan AI berikut:

- Automatic transaction categorization
- Monthly spending prediction
- Smart financial insights (Bahasa Indonesia)
- Overbudget risk warning
- CSV import intelligence (auto kategori untuk data kosong/tidak jelas)

## Fitur Aplikasi

### Fitur Existing

- Authentication (Auth.js)
- Dashboard summary + charts
- Transactions CRUD
- Categories CRUD
- Budgets CRUD
- Savings goals CRUD
- CSV import dan PDF export
- Per-user data isolation

### Fitur ML Baru

- Prediksi kategori transaksi dari deskripsi + confidence score
- Metadata AI di transaksi (`isAutoCategorized`, `confidenceScore`, dst)
- Prediksi total pengeluaran bulan berjalan
- Prediksi tren (UP / DOWN / STABLE)
- Insight cerdas berbasis statistik + output model
- Warning budget prediktif

## Arsitektur

Project dibagi menjadi 2 service:

1. **Main App (Next.js)**
- UI, auth, API utama, akses database Prisma
- Mengirim request ke ML service untuk prediksi

2. **ML Service (FastAPI)**
- Endpoint inferensi kategori, spending, dan insight
- Model baseline scikit-learn + rule-based insight engine

Alur integrasi utama:

- Form transaksi -> Next.js API -> ML `/predict/category` -> simpan transaksi + metadata AI
- Dashboard/Budget -> Next.js API -> ML `/predict/spending` + `/insights/generate` -> tampilkan kartu prediksi dan insight

## Tech Stack

### Main App

- Next.js App Router + TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Auth.js
- Recharts

### ML Service

- FastAPI
- scikit-learn
- pandas
- numpy
- joblib

## Struktur Folder

```text
financeTracker/
├─ src/                       # Next.js app
├─ prisma/                    # Prisma schema & seed
├─ ml-service/
│  ├─ app.py
│  ├─ routes/
│  ├─ services/
│  ├─ models/
│  ├─ training/
│  │  ├─ data/
│  │  ├─ train_category_model.py
│  │  └─ train_spending_model.py
│  ├─ artifacts/
│  └─ requirements.txt
└─ README.md
```

## Environment Variables

Set di file `.env` root project:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
ML_SERVICE_URL="http://127.0.0.1:8001"
```

## Setup dan Menjalankan Project

### 1. Install dependency Next.js

```bash
npm install
```

### 2. Setup database Prisma

```bash
npm run prisma:generate
npm run db:push
npm run db:seed
```

### 3. Setup ML service

Masuk ke folder ML:

```bash
cd ml-service
```

Install dependency Python:

```bash
python -m pip install -r requirements.txt
```

Training model:

```bash
python training\train_category_model.py
python training\train_spending_model.py
```

Jalankan service:

```bash
python -m uvicorn app:app --reload --port 8001
```

### 4. Jalankan Next.js app

Buka terminal baru di root project:

```bash
npm run dev
```

## Endpoint ML Service

- `GET /health`
- `POST /predict/category`
- `POST /predict/spending`
- `POST /insights/generate`

## Endpoint Main App (ringkas)

- `POST /api/auth/register`
- `GET/POST /api/transactions`
- `PUT/DELETE /api/transactions/:id`
- `GET/POST /api/categories`
- `PUT/DELETE /api/categories/:id`
- `GET/POST /api/budgets`
- `PUT/DELETE /api/budgets/:id`
- `GET/POST /api/savings`
- `PUT/DELETE /api/savings/:id`
- `GET /api/export/pdf`
- `POST /api/import/csv`
- `POST /api/ml/category`

## Model ML yang Digunakan

### 1. Auto Categorization

- Preprocessing teks: lowercase, hapus punctuation/angka, normalisasi spasi
- Vectorizer: `TfidfVectorizer(ngram_range=(1, 2), min_df=1)`
- Classifier: `LogisticRegression(max_iter=1200, class_weight="balanced")`
- Artifact: `ml-service/artifacts/category_pipeline.joblib`

### 2. Spending Prediction

- Input: pengeluaran harian bulan berjalan + histori bulanan
- Metode: kombinasi run-rate dan baseline linear regression
- Artifact: `ml-service/artifacts/spending_regressor.joblib`

### 3. Smart Insights

Rule-based + statistik:

- Growth kategori month-over-month
- Kategori pengeluaran terbesar
- Budget utilization dan prediksi overbudget
- Deteksi transaksi tidak biasa (IQR/median threshold)

## Validasi Cepat

1. Cek health ML service:

```bash
curl http://127.0.0.1:8001/health
```

2. Buka dashboard:
- Kartu `Predicted Expense (AI)` harus tampil
- Section `Smart Insights` harus berisi insight AI, bukan fallback message

## Troubleshooting

### Insight AI belum tersedia

Pastikan:

- `ML_SERVICE_URL` benar
- ML service sedang running di `127.0.0.1:8001`
- Model sudah di-train dan file artifact sudah ada

### `uvicorn` tidak dikenali

Gunakan:

```bash
python -m uvicorn app:app --reload --port 8001
```

### Training script tidak ketemu

Gunakan nama file lengkap:

```bash
python training\train_category_model.py
```
