# ML Service (FastAPI)

Standalone machine learning service for the finance tracker.

## Features

- `POST /predict/category` for transaction auto-categorization
- `POST /predict/spending` for monthly spending prediction
- `POST /insights/generate` for smart financial insights in Indonesian
- `GET /health` health check

## Setup

1. Create and activate virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Train models:

```bash
python training/train_category_model.py
python training/train_spending_model.py
```

4. Run the service:

```bash
uvicorn app:app --reload --port 8001
```

## Dataset format

Category dataset file: `training/data/category_dataset.csv`

- `description`: transaction text
- `label`: target category (e.g. `Makanan`, `Transportasi`, `Hiburan`, `Gaji`)

Spending dataset file: `training/data/spending_dataset.csv`

- `month_index`: sequential month number
- `total_expense`: total monthly expense
