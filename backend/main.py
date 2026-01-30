from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from typing import Optional
import uuid

from database import engine, get_db, Base
from models import Employee, Attendance, AttendanceStatus as ModelAttendanceStatus
from schemas import (
    EmployeeCreate,
    EmployeeResponse,
    EmployeeListResponse,
    AttendanceCreate,
    AttendanceResponse,
    AttendanceListResponse,
    DashboardStats,
    DailyAttendance,
    ErrorResponse,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HRMS Lite API",
    description="A lightweight Human Resource Management System API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Employee Endpoints
@app.get("/api/employees", response_model=EmployeeListResponse)
def get_employees(db: Session = Depends(get_db)):
    employees = db.query(Employee).all()

    # Single query to get all attendance counts
    attendance_stats = (
        db.query(
            Attendance.employee_id,
            Attendance.status,
            func.count(Attendance.id).label('count')
        )
        .group_by(Attendance.employee_id, Attendance.status)
        .all()
    )

    # Build lookup dict
    stats_map = {}
    for stat in attendance_stats:
        if stat.employee_id not in stats_map:
            stats_map[stat.employee_id] = {'present': 0, 'absent': 0}
        if stat.status == ModelAttendanceStatus.PRESENT:
            stats_map[stat.employee_id]['present'] = stat.count
        else:
            stats_map[stat.employee_id]['absent'] = stat.count

    employee_responses = [
        EmployeeResponse(
            employee_id=emp.employee_id,
            full_name=emp.full_name,
            email=emp.email,
            department=emp.department,
            total_present=stats_map.get(emp.employee_id, {}).get('present', 0),
            total_absent=stats_map.get(emp.employee_id, {}).get('absent', 0),
        )
        for emp in employees
    ]

    return EmployeeListResponse(employees=employee_responses, total=len(employees))


@app.get("/api/employees/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: str, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID '{employee_id}' not found",
        )

    present_count = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee_id,
            Attendance.status == ModelAttendanceStatus.PRESENT,
        )
        .count()
    )
    absent_count = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee_id,
            Attendance.status == ModelAttendanceStatus.ABSENT,
        )
        .count()
    )

    return EmployeeResponse(
        employee_id=employee.employee_id,
        full_name=employee.full_name,
        email=employee.email,
        department=employee.department,
        total_present=present_count,
        total_absent=absent_count,
    )


@app.post(
    "/api/employees",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Validation error"},
        409: {"model": ErrorResponse, "description": "Duplicate employee"},
    },
)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):
    # Check for duplicate employee ID
    existing_by_id = (
        db.query(Employee).filter(Employee.employee_id == employee.employee_id).first()
    )
    if existing_by_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Employee with ID '{employee.employee_id}' already exists",
        )

    # Check for duplicate email
    existing_by_email = (
        db.query(Employee).filter(Employee.email == employee.email).first()
    )
    if existing_by_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Employee with email '{employee.email}' already exists",
        )

    db_employee = Employee(
        employee_id=employee.employee_id,
        full_name=employee.full_name,
        email=employee.email,
        department=employee.department,
    )
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)

    return EmployeeResponse(
        employee_id=db_employee.employee_id,
        full_name=db_employee.full_name,
        email=db_employee.email,
        department=db_employee.department,
        total_present=0,
        total_absent=0,
    )


@app.delete(
    "/api/employees/{employee_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"model": ErrorResponse, "description": "Employee not found"}},
)
def delete_employee(employee_id: str, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID '{employee_id}' not found",
        )

    db.delete(employee)
    db.commit()
    return None


# Attendance Endpoints
@app.get("/api/attendance", response_model=AttendanceListResponse)
def get_attendance(
    employee_id: Optional[str] = Query(None, description="Filter by employee ID"),
    start_date: Optional[date] = Query(None, description="Filter from date"),
    end_date: Optional[date] = Query(None, description="Filter to date"),
    db: Session = Depends(get_db),
):
    query = db.query(Attendance)

    if employee_id:
        # Verify employee exists
        employee = (
            db.query(Employee).filter(Employee.employee_id == employee_id).first()
        )
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee with ID '{employee_id}' not found",
            )
        query = query.filter(Attendance.employee_id == employee_id)

    if start_date:
        query = query.filter(Attendance.date >= start_date)

    if end_date:
        query = query.filter(Attendance.date <= end_date)

    records = query.order_by(Attendance.date.desc()).all()

    attendance_responses = []
    for record in records:
        employee = (
            db.query(Employee)
            .filter(Employee.employee_id == record.employee_id)
            .first()
        )
        attendance_responses.append(
            AttendanceResponse(
                id=record.id,
                employee_id=record.employee_id,
                date=record.date,
                status=record.status,
                employee_name=employee.full_name if employee else None,
            )
        )

    total_present = sum(
        1 for r in records if r.status == ModelAttendanceStatus.PRESENT
    )
    total_absent = sum(1 for r in records if r.status == ModelAttendanceStatus.ABSENT)

    return AttendanceListResponse(
        records=attendance_responses,
        total=len(records),
        total_present=total_present,
        total_absent=total_absent,
    )


@app.post(
    "/api/attendance",
    response_model=AttendanceResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        404: {"model": ErrorResponse, "description": "Employee not found"},
        409: {"model": ErrorResponse, "description": "Attendance already marked"},
    },
)
def mark_attendance(attendance: AttendanceCreate, db: Session = Depends(get_db)):
    # Verify employee exists
    employee = (
        db.query(Employee).filter(Employee.employee_id == attendance.employee_id).first()
    )
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID '{attendance.employee_id}' not found",
        )

    # Check if attendance already marked for this date
    existing = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == attendance.employee_id,
            Attendance.date == attendance.date,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Attendance for employee '{attendance.employee_id}' on {attendance.date} is already marked",
        )

    db_attendance = Attendance(
        id=str(uuid.uuid4()),
        employee_id=attendance.employee_id,
        date=attendance.date,
        status=ModelAttendanceStatus(attendance.status.value),
    )
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)

    return AttendanceResponse(
        id=db_attendance.id,
        employee_id=db_attendance.employee_id,
        date=db_attendance.date,
        status=db_attendance.status,
        employee_name=employee.full_name,
    )


@app.put(
    "/api/attendance/{attendance_id}",
    response_model=AttendanceResponse,
    responses={404: {"model": ErrorResponse, "description": "Attendance not found"}},
)
def update_attendance(
    attendance_id: str, attendance: AttendanceCreate, db: Session = Depends(get_db)
):
    db_attendance = (
        db.query(Attendance).filter(Attendance.id == attendance_id).first()
    )
    if not db_attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attendance record with ID '{attendance_id}' not found",
        )

    db_attendance.status = ModelAttendanceStatus(attendance.status.value)
    db.commit()
    db.refresh(db_attendance)

    employee = (
        db.query(Employee)
        .filter(Employee.employee_id == db_attendance.employee_id)
        .first()
    )

    return AttendanceResponse(
        id=db_attendance.id,
        employee_id=db_attendance.employee_id,
        date=db_attendance.date,
        status=db_attendance.status,
        employee_name=employee.full_name if employee else None,
    )


# Dashboard Endpoint
@app.get("/api/dashboard", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_employees = db.query(Employee).count()
    departments = db.query(Employee.department).distinct().count()

    today = date.today()
    week_ago = today - timedelta(days=6)

    # Single query for all attendance in last 7 days
    recent_attendance = (
        db.query(
            Attendance.date,
            Attendance.status,
            func.count(Attendance.id).label('count')
        )
        .filter(Attendance.date >= week_ago)
        .group_by(Attendance.date, Attendance.status)
        .all()
    )

    # Build daily stats map
    daily_stats = {}
    for record in recent_attendance:
        if record.date not in daily_stats:
            daily_stats[record.date] = {'present': 0, 'absent': 0}
        if record.status == ModelAttendanceStatus.PRESENT:
            daily_stats[record.date]['present'] = record.count
        else:
            daily_stats[record.date]['absent'] = record.count

    # Today's stats
    today_stats = daily_stats.get(today, {'present': 0, 'absent': 0})
    todays_present = today_stats['present']
    todays_absent = today_stats['absent']
    todays_unmarked = total_employees - (todays_present + todays_absent)

    # Overall attendance rate (single query)
    total_stats = (
        db.query(
            Attendance.status,
            func.count(Attendance.id).label('count')
        )
        .group_by(Attendance.status)
        .all()
    )

    total_present = 0
    total_records = 0
    for stat in total_stats:
        total_records += stat.count
        if stat.status == ModelAttendanceStatus.PRESENT:
            total_present = stat.count

    attendance_rate = (total_present / total_records * 100) if total_records > 0 else 0

    # Build 7-day trend
    recent_trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_stats = daily_stats.get(day, {'present': 0, 'absent': 0})
        day_total = day_stats['present'] + day_stats['absent']
        day_rate = (day_stats['present'] / day_total * 100) if day_total > 0 else 0
        recent_trend.append(DailyAttendance(
            date=day,
            present=day_stats['present'],
            absent=day_stats['absent'],
            rate=round(day_rate, 1),
        ))

    return DashboardStats(
        total_employees=total_employees,
        total_departments=departments,
        todays_present=todays_present,
        todays_absent=todays_absent,
        todays_unmarked=todays_unmarked,
        attendance_rate=round(attendance_rate, 1),
        recent_trend=recent_trend,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
