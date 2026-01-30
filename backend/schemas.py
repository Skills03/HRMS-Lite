from pydantic import BaseModel, EmailStr, field_validator
from datetime import date
from typing import Optional
from enum import Enum


class AttendanceStatus(str, Enum):
    PRESENT = "Present"
    ABSENT = "Absent"


# Employee Schemas
class EmployeeCreate(BaseModel):
    employee_id: str
    full_name: str
    email: EmailStr
    department: str

    @field_validator("employee_id", "full_name", "department")
    @classmethod
    def not_empty(cls, v: str, info) -> str:
        if not v or not v.strip():
            raise ValueError(f"{info.field_name} cannot be empty")
        return v.strip()


class EmployeeResponse(BaseModel):
    employee_id: str
    full_name: str
    email: str
    department: str
    total_present: int = 0
    total_absent: int = 0

    class Config:
        from_attributes = True


class EmployeeListResponse(BaseModel):
    employees: list[EmployeeResponse]
    total: int


# Attendance Schemas
class AttendanceCreate(BaseModel):
    employee_id: str
    date: date
    status: AttendanceStatus


class AttendanceResponse(BaseModel):
    id: str
    employee_id: str
    date: date
    status: AttendanceStatus
    employee_name: Optional[str] = None

    class Config:
        from_attributes = True


class AttendanceListResponse(BaseModel):
    records: list[AttendanceResponse]
    total: int
    total_present: int
    total_absent: int


# Dashboard Schemas
class DashboardStats(BaseModel):
    total_employees: int
    total_departments: int
    todays_present: int
    todays_absent: int
    todays_unmarked: int
    attendance_rate: float


# Error Response
class ErrorResponse(BaseModel):
    detail: str
