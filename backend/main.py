from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
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

    employee_responses = []
    for emp in employees:
        present_count = (
            db.query(Attendance)
            .filter(
                Attendance.employee_id == emp.employee_id,
                Attendance.status == ModelAttendanceStatus.PRESENT,
            )
            .count()
        )
        absent_count = (
            db.query(Attendance)
            .filter(
                Attendance.employee_id == emp.employee_id,
                Attendance.status == ModelAttendanceStatus.ABSENT,
            )
            .count()
        )
        employee_responses.append(
            EmployeeResponse(
                employee_id=emp.employee_id,
                full_name=emp.full_name,
                email=emp.email,
                department=emp.department,
                total_present=present_count,
                total_absent=absent_count,
            )
        )

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

    todays_attendance = (
        db.query(Attendance).filter(Attendance.date == today).all()
    )

    todays_present = sum(
        1 for a in todays_attendance if a.status == ModelAttendanceStatus.PRESENT
    )
    todays_absent = sum(
        1 for a in todays_attendance if a.status == ModelAttendanceStatus.ABSENT
    )
    todays_unmarked = total_employees - len(todays_attendance)

    # Calculate overall attendance rate
    total_attendance_records = db.query(Attendance).count()
    total_present = (
        db.query(Attendance)
        .filter(Attendance.status == ModelAttendanceStatus.PRESENT)
        .count()
    )

    attendance_rate = (
        (total_present / total_attendance_records * 100)
        if total_attendance_records > 0
        else 0
    )

    return DashboardStats(
        total_employees=total_employees,
        total_departments=departments,
        todays_present=todays_present,
        todays_absent=todays_absent,
        todays_unmarked=todays_unmarked,
        attendance_rate=round(attendance_rate, 1),
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
