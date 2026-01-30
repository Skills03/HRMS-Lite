from sqlalchemy import Column, String, Date, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
import enum

from database import Base


class AttendanceStatus(str, enum.Enum):
    PRESENT = "Present"
    ABSENT = "Absent"


class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(String, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    department = Column(String, nullable=False)

    attendance_records = relationship(
        "Attendance", back_populates="employee", cascade="all, delete-orphan"
    )


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(String, primary_key=True)
    employee_id = Column(String, ForeignKey("employees.employee_id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(Enum(AttendanceStatus), nullable=False)

    employee = relationship("Employee", back_populates="attendance_records")

    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="unique_employee_date"),
    )
