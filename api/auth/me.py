"""Auth Me - Get current user"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from .._utils.supabase_client import get_supabase_admin_client
from .._utils.auth_middleware import get_current_user

app = FastAPI()


@app.get("/api/auth/me")
async def me(request: Request):
    """Get current logged in admin data"""
    try:
        user = get_current_user(request)
        
        # Get admin profile
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
