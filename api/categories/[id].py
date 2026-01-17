"""Category by ID - GET, PUT, DELETE"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from .._utils.supabase_client import get_supabase_client, get_supabase_admin_client
from .._utils.auth_middleware import get_current_user

app = FastAPI()


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


@app.get("/api/categories/{category_id}")
async def get_category(request: Request, category_id: str = None):
    """Get single category"""
    try:
        # Get category_id from query params if not in path
        if not category_id:
            category_id = request.query_params.get("category_id")
        
        if not category_id:
            raise HTTPException(status_code=400, detail="Category ID is required")
        
        supabase = get_supabase_client()
        response = supabase.table("category").select("*").eq("id", category_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Category not found")
        
        c = response.data
        return JSONResponse(content={
            "success": True,
            "category": {
                "id": c["id"],
                "name": c["c_name"],
                "description": c["c_description"],
                "image_url": c["c_image_url"],
                "is_active": c["c_is_active"],
                "sort_order": c["c_sort_order"]
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/categories/{category_id}")
async def update_category(request: Request, category_id: str = None):
    """Update category (admin only)"""
    try:
        user = get_current_user(request)
        
        # Get category_id from query params if not in path
        if not category_id:
            category_id = request.query_params.get("category_id")
        
        if not category_id:
            raise HTTPException(status_code=400, detail="Category ID is required")
        
        body = await request.json()
        data = CategoryUpdate(**body)
        
        supabase = get_supabase_admin_client()
        
        update_data = {
            "c_last_update": datetime.now(timezone.utc).isoformat()
        }
        
        if data.name is not None:
            update_data["c_name"] = data.name
        if data.description is not None:
            update_data["c_description"] = data.description
        if data.image_url is not None:
            update_data["c_image_url"] = data.image_url
        if data.is_active is not None:
            update_data["c_is_active"] = data.is_active
        if data.sort_order is not None:
            update_data["c_sort_order"] = data.sort_order
        
        response = supabase.table("category").update(update_data).eq("id", category_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Category not found")
        
        return JSONResponse(content={
            "success": True,
            "message": "Category updated successfully!"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/categories/{category_id}")
async def delete_category(request: Request, category_id: str = None):
    """Delete category (admin only)"""
    try:
        user = get_current_user(request)
        
        if not category_id:
            category_id = request.query_params.get("category_id")
        
        if not category_id:
            raise HTTPException(status_code=400, detail="Category ID is required")
        
        supabase = get_supabase_admin_client()
        response = supabase.table("category").delete().eq("id", category_id).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": "Category deleted successfully!"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
