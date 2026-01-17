"""Auth Login"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from .._utils.supabase_client import get_supabase_client, get_supabase_admin_client

app = FastAPI()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@app.post("/api/auth/login")
async def login(request: Request):
    """Admin login"""
    try:
        body = await request.json()
        data = LoginRequest(**body)
        
        supabase = get_supabase_client()
        
        # 1. Login with Supabase Auth
        auth_response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })
        
        if auth_response.user is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # 2. Check if user is an active admin
        admin_client = get_supabase_admin_client()
        admin_result = admin_client.table("admin").select("*").eq("id", auth_response.user.id).eq("a_is_active", True).execute()
        
        if not admin_result.data or len(admin_result.data) == 0:
            raise HTTPException(status_code=403, detail="Access denied. You are not an admin.")
        
        admin_data = admin_result.data[0]
        
        return JSONResponse(content={
            "success": True,
            "message": "Login successful!",
            "user": {
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "name": admin_data.get("a_name"),
                "is_admin": True
            },
            "session": {
                "access_token": auth_response.session.access_token,
                "refresh_token": auth_response.session.refresh_token,
                "expires_at": auth_response.session.expires_at
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
