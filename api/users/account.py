"""User Account - DELETE"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from .._utils.supabase_client import get_supabase_admin_client
from .._utils.auth_middleware import get_current_user

app = FastAPI()


@app.delete("/api/users/account")
async def delete_account(request: Request):
    """Delete user account"""
    try:
        user = get_current_user(request)
        supabase_admin = get_supabase_admin_client()
        
        # Delete user from Supabase Auth (CASCADE will delete admin profile too)
        supabase_admin.auth.admin.delete_user(user["id"])
        
        return JSONResponse(content={
            "success": True,
            "message": "Account deleted successfully!"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
