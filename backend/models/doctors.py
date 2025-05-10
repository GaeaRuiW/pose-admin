from datetime import datetime

from sqlmodel import Field, SQLModel


class Doctors(SQLModel, table=True):
    id: int = Field(primary_key=True)
    username: str = Field(index=True)
    password: str
    email: str
    phone: str
    department: str = Field(default="康复科")
    role_id: int = Field(default=1)
    create_time: str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    update_time: str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    is_deleted: bool

    def __init__(self, username: str, password: str, email: str, phone: int, create_time: str, update_time: str, is_deleted: bool, department: str = "康复科", role_id: int = 1):
        self.username = username
        self.password = password
        self.email = email
        self.phone = phone
        self.role_id = role_id
        self.create_time = create_time
        self.update_time = update_time
        self.is_deleted = is_deleted
        self.department = department

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "phone": self.phone,
            "role_id": self.role_id,
            "create_time": self.create_time,
            "update_time": self.update_time,
            "is_deleted": self.is_deleted,
            "department": self.department
        }
