"""User Profile - GET and PUT"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from .._utils.supabase_client import get_supabase_admin_client
from .._utils.auth_middleware import get_current_user

app = FastAPI()


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


@app.get("/api/users/profile")
async def get_profile(request: Request):
    """Get logged in admin profile"""
    try:
        user = get_current_user(request)
        supabase = get_supabase_admin_client()
        
        response = supabase.table("admin").select("*").eq("id", user["id"]).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        admin = response.data
        return JSONResponse(content={
            "success": True,
            "profile": {
                "id": admin["id"],
                "email": admin["a_email"],
                "name": admin["a_name"],
                "phone": admin["a_phone"],
                "avatar_url": admin["a_avatar_url"],
                "is_active": admin["a_is_active"],
                "created_at": admin["a_created_at"]
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/users/profile")
async def update_profile(request: Request):
    """Update logged in admin profile"""
    try:
        user = get_current_user(request)
        body = await request.json()
        data = UserUpdate(**body)
        
        supabase = get_supabase_admin_client()
        
        update_data = {
            "a_last_update": datetime.now(timezone.utc).isoformat()
        }
        if data.name is not None:
            update_data["a_name"] = data.name
        if data.phone is not None:
            update_data["a_phone"] = data.phone
        if data.avatar_url is not None:
            update_data["a_avatar_url"] = data.avatar_url
        
        response = supabase.table("admin").update(update_data).eq("id", user["id"]).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        admin = response.data[0]
        return JSONResponse(content={
            "success": True,
            "message": "Profile updated successfully!",
            "profile": {
                "id": admin["id"],
                "email": admin["a_email"],
                "name": admin["a_name"],
                "phone": admin["a_phone"],
                "avatar_url": admin["a_avatar_url"]
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
