"""Auth Register"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
from .._utils.supabase_client import get_supabase_client, get_supabase_admin_client

app = FastAPI()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None


@app.post("/api/auth/register")
async def register(request: Request):
    """Register new admin user"""
    try:
        body = await request.json()
        data = RegisterRequest(**body)
        
        supabase = get_supabase_client()
        
        # 1. Create user in Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password,
            "options": {
                "data": {
                    "name": data.name
                }
            }
        })
        
        if auth_response.user is None:
            raise HTTPException(status_code=400, detail="Error creating user")
        
        # 2. Create admin profile in our table
        admin_client = get_supabase_admin_client()
        admin_client.table("admin").insert({
            "id": auth_response.user.id,
            "a_email": data.email,
            "a_name": data.name,
            "a_is_active": True,
            "a_created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": "Account created successfully! Check your email to confirm.",
            "user": {
                "id": auth_response.user.id,
                "email": auth_response.user.email
            }
        })
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
