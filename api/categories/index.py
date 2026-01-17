"""Categories - List all and Create"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from .._utils.supabase_client import get_supabase_client, get_supabase_admin_client
from .._utils.auth_middleware import get_current_user

app = FastAPI()


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


@app.get("/api/categories")
async def list_categories(request: Request):
    """List all active categories (public)"""
    try:
        supabase = get_supabase_client()
        
        response = supabase.table("category").select("*").eq("c_is_active", True).order("c_sort_order").execute()
        
        categories = []
        for c in response.data:
            categories.append({
                "id": c["id"],
                "name": c["c_name"],
                "description": c["c_description"],
                "image_url": c["c_image_url"],
                "is_active": c["c_is_active"],
                "sort_order": c["c_sort_order"]
            })
        
        return JSONResponse(content={
            "success": True,
            "categories": categories
        })
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/categories")
async def create_category(request: Request):
    """Create new category (admin only)"""
    try:
        user = get_current_user(request)
        body = await request.json()
        data = CategoryCreate(**body)
        
        supabase = get_supabase_admin_client()
        
        response = supabase.table("category").insert({
            "c_name": data.name,
            "c_description": data.description,
            "c_image_url": data.image_url,
            "c_is_active": data.is_active,
            "c_sort_order": data.sort_order,
            "c_created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Error creating category")
        
        return JSONResponse(content={
            "success": True,
            "message": "Category created successfully!",
            "category": response.data[0]
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
