"""Product by ID - GET, PUT, DELETE"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from .._utils.supabase_client import get_supabase_admin_client
from .._utils.auth_middleware import get_current_user

app = FastAPI()


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category_id: Optional[str] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None
    is_featured: Optional[bool] = None
    sort_order: Optional[int] = None


@app.get("/api/products/{product_id}")
async def get_product(request: Request, product_id: str):
    """Get product by ID"""
    try:
        supabase = get_supabase_admin_client()
        
        response = supabase.table("product").select("*, category(c_name)").eq("id", product_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        p = response.data
        return JSONResponse(content={
            "success": True,
            "product": {
                "id": p["id"],
                "name": p["p_name"],
                "description": p["p_description"],
                "price": float(p["p_price"]) if p["p_price"] else 0,
                "image_url": p["p_image_url"],
                "is_available": p["p_is_available"],
                "is_featured": p["p_is_featured"],
                "category_id": p["p_category_id"],
                "category_name": p["category"]["c_name"] if p.get("category") else None
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/products/{product_id}")
async def update_product(request: Request, product_id: str):
    """Update product (admin only)"""
    try:
        user = get_current_user(request)
        body = await request.json()
        data = ProductUpdate(**body)
        
        supabase = get_supabase_admin_client()
        
        update_data = {
            "p_last_update": datetime.now(timezone.utc).isoformat()
        }
        
        if data.name is not None:
            update_data["p_name"] = data.name
        if data.description is not None:
            update_data["p_description"] = data.description
        if data.price is not None:
            update_data["p_price"] = data.price
        if data.category_id is not None:
            update_data["p_category_id"] = data.category_id
        if data.image_url is not None:
            update_data["p_image_url"] = data.image_url
        if data.is_available is not None:
            update_data["p_is_available"] = data.is_available
        if data.is_featured is not None:
            update_data["p_is_featured"] = data.is_featured
        if data.sort_order is not None:
            update_data["p_sort_order"] = data.sort_order
        
        response = supabase.table("product").update(update_data).eq("id", product_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return JSONResponse(content={
            "success": True,
            "message": "Product updated successfully!",
            "product": response.data[0]
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/products/{product_id}")
async def delete_product(request: Request, product_id: str):
    """Delete product (admin only)"""
    try:
        user = get_current_user(request)
        supabase = get_supabase_admin_client()
        
        response = supabase.table("product").delete().eq("id", product_id).execute()
        
        return JSONResponse(content={
            "success": True,
            "message": "Product deleted successfully!"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
