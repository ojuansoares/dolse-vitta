"""Auth Logout"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from .._utils.supabase_client import get_supabase_client

app = FastAPI()


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
