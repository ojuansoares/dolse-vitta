"""Auth - All authentication endpoints"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
from ._utils.supabase_client import get_supabase_client, get_supabase_admin_client
from ._utils.auth_middleware import get_current_user

app = FastAPI()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None


@app.post("/api/auth/login")
async def login(request: Request):
    """Admin login"""
    try:
        body = await request.json()
        data = LoginRequest(**body)
        
        supabase = get_supabase_client()
        
        auth_response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })
        
        if auth_response.user is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        admin_client = get_supabase_admin_client()
        admin_result = admin_client.table("admin").select("*").eq("id", auth_response.user.id).eq("a_is_active", True).execute()
        
        if not admin_result.data or len(admin_result.data) == 0:
            raise HTTPException(status_code=403, detail="Access denied. You are not an admin.")
        
        admin_data = admin_result.data[0]
        
        return JSONResponse(content={
            "success": True,
            "message": "Login successful!",
            "token": auth_response.session.access_token,
            "user": {
                "id": auth_response.user.id,
                "email": auth_response.user.email
            },
            "admin_profile": {
                "id": admin_data.get("id"),
                "a_email": admin_data.get("a_email"),
                "a_name": admin_data.get("a_name"),
                "a_phone": admin_data.get("a_phone"),
                "a_avatar_url": admin_data.get("a_avatar_url"),
                "a_is_active": admin_data.get("a_is_active", True)
            },
            "session": {
                "access_token": auth_response.session.access_token,
                "refresh_token": auth_response.session.refresh_token
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.post("/api/auth/register")
async def register(request: Request):
    """Register new admin user"""
    try:
        body = await request.json()
        data = RegisterRequest(**body)
        
        supabase = get_supabase_client()
        
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
            "message": "Account created successfully!",
            "user": {
                "id": auth_response.user.id,
                "email": auth_response.user.email
            }
        })
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/auth/me")
async def me(request: Request):
    """Get current logged in admin data"""
    try:
        user = get_current_user(request)
        
        admin_client = get_supabase_admin_client()
        admin_result = admin_client.table("admin").select("*").eq("id", user["id"]).execute()
        
        admin_data = admin_result.data[0] if admin_result.data else None
        
        return JSONResponse(content={
            "success": True,
            "user": {
                "id": user["id"],
                "email": user.get("email"),
                "name": admin_data.get("a_name") if admin_data else None,
                "phone": admin_data.get("a_phone") if admin_data else None,
                "avatar_url": admin_data.get("a_avatar_url") if admin_data else None,
                "is_active": admin_data.get("a_is_active") if admin_data else False
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/auth/logout")
async def logout(request: Request):
    """Logout user"""
    try:
        supabase = get_supabase_client()
        supabase.auth.sign_out()
        
        return JSONResponse(content={
            "success": True,
            "message": "Logout successful!"
        })
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
