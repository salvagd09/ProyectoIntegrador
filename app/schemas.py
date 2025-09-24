from pydantic import BaseModel
class LoginPassword(BaseModel):
    username: str
    password: str

class LoginPin(BaseModel):
    pin_code: str
