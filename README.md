# HRMS Lite

A lightweight Human Resource Management System for managing employee records and tracking daily attendance.

## Live Demo

**Live Application:** https://hrms-lite.duckdns.org

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (navigation)
- Axios (API client)
- Lucide React (icons)
- React Hot Toast (notifications)

### Backend
- Python 3.11+
- FastAPI (web framework)
- SQLAlchemy (ORM)
- SQLite (database)
- Pydantic (validation)

## Features

### Core Features
- **Employee Management**
  - Add new employees (ID, name, email, department)
  - View all employees with attendance summary
  - Delete employees (cascades to attendance records)
  - Search/filter employees

- **Attendance Management**
  - Mark daily attendance (Present/Absent)
  - View attendance records
  - Filter by employee, date range
  - Prevents duplicate entries for same employee on same date

### Bonus Features
- Filter attendance records by date range
- Display total present/absent days per employee
- Dashboard with summary statistics:
  - Total employees
  - Total departments
  - Today's attendance status
  - Overall attendance rate

## Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`

## API Endpoints

### Employees
- `GET /api/employees` - List all employees
- `GET /api/employees/{id}` - Get employee by ID
- `POST /api/employees` - Create new employee
- `DELETE /api/employees/{id}` - Delete employee

### Attendance
- `GET /api/attendance` - List attendance records (supports filters)
- `POST /api/attendance` - Mark attendance
- `PUT /api/attendance/{id}` - Update attendance record

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## Deployment

The application is deployed on AWS EC2 with the following setup:

- **Server**: AWS EC2 (t2.micro)
- **Web Server**: Caddy (reverse proxy + auto SSL)
- **Domain**: DuckDNS (free subdomain)
- **SSL**: Auto-provisioned via Let's Encrypt

### Architecture
```
https://hrms-lite.duckdns.org
        │
        ▼
    [Caddy - HTTPS]
        │
        ├── /api/*  →  FastAPI (port 8000)
        │
        └── /*      →  Static files (React build)
```

## Assumptions & Limitations

1. **Single Admin User**: No authentication implemented as per requirements
2. **SQLite Database**: Using SQLite for simplicity. For production with high traffic, consider PostgreSQL
3. **No Edit Employee**: Edit functionality not implemented as it wasn't in requirements
4. **Date Validation**: Attendance can be marked for any date (past or future)
5. **No Pagination**: Lists show all records. For large datasets, pagination should be added

## Project Structure

```
hrms-lite/
├── backend/
│   ├── main.py           # FastAPI application & routes
│   ├── models.py         # SQLAlchemy models
│   ├── schemas.py        # Pydantic schemas
│   ├── database.py       # Database configuration
│   ├── requirements.txt  # Python dependencies
│   └── Procfile          # Render deployment config
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service layer
│   │   ├── types/        # TypeScript types
│   │   ├── App.tsx       # Main app component
│   │   └── main.tsx      # Entry point
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Author

Rishabh
