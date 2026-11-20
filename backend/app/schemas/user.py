# from pydantic import BaseModel, EmailStr


# class UserRegister(BaseModel):
#     name: str
#     email: EmailStr
#     password: str
#     role: str = "candidate"

# class UserResponse(BaseModel):
#     id: int
#     name: str
#     email: EmailStr
#     role: str

#     class Config:
#         from_attributes = True

from pydantic import BaseModel, EmailStr
from typing import Literal


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Literal["candidate", "recruiter"]


class UserLogin(BaseModel):
    email: EmailStr
    password: str
