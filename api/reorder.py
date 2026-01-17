"""Reorder - Batch update sort order for categories and products"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
from datetime import datetime, timezone
from ._utils.supabase_client import get_supabase_admin_client
from ._utils.auth_middleware import get_current_user

app = FastAPI()


class ReorderItem(BaseModel):
    id: str
    sort_order: int


class ReorderRequest(BaseModel):
    items: List[ReorderItem]


@app.put("/api/reorder/categories")
async def reorder_categories(request: Request):
    """Reorder categories (admin only)"""
    try:
        user = get_current_user(request)
        body = await request.json()
        data = ReorderRequest(**body)
        
        supabase = get_supabase_admin_client()
        
        for item in data.items:
            supabase.table("category").update({
                "c_sort_order": item.sort_order,
                "c_last_update": datetime.now(timezone.utc).isoformat()
            }).eq("id", item.id).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": "Categories reordered successfully!"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/reorder/products")
async def reorder_products(request: Request):
    """Reorder products (admin only)"""
    try:
        user = get_current_user(request)
        body = await request.json()
        data = ReorderRequest(**body)
        
        supabase = get_supabase_admin_client()
        
        for item in data.items:
            supabase.table("product").update({
                "p_sort_order": item.sort_order,
                "p_last_update": datetime.now(timezone.utc).isoformat()
            }).eq("id", item.id).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": "Products reordered successfully!"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
