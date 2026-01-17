"""Products - List all and Create"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from .._utils.supabase_client import get_supabase_client, get_supabase_admin_client
from .._utils.auth_middleware import get_current_user

app = FastAPI()


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category_id: Optional[str] = None
    image_url: Optional[str] = None
    is_available: bool = True
    is_featured: bool = False
    sort_order: int = 0


@app.get("/api/products")
async def list_products(request: Request):
    """List all available products (public)"""
    try:
        supabase = get_supabase_client()
        
        # Public: only available products
        response = supabase.table("product").select("*, category(c_name)").eq("p_is_available", True).order("p_sort_order").execute()
        
        products = []
        for p in response.data:
            products.append({
                "id": p["id"],
                "name": p["p_name"],
                "description": p["p_description"],
                "price": float(p["p_price"]) if p["p_price"] else 0,
                "image_url": p["p_image_url"],
                "is_available": p["p_is_available"],
                "is_featured": p["p_is_featured"],
                "category_id": p["p_category_id"],
                "category_name": p["category"]["c_name"] if p.get("category") else None
            })
        
        return JSONResponse(content={
            "success": True,
            "products": products
        })
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/products")
async def create_product(request: Request):
    """Create new product (admin only)"""
    try:
        user = get_current_user(request)
        body = await request.json()
        data = ProductCreate(**body)
        
        supabase = get_supabase_admin_client()
        
        response = supabase.table("product").insert({
            "p_name": data.name,
            "p_description": data.description,
            "p_price": data.price,
            "p_category_id": data.category_id,
            "p_image_url": data.image_url,
            "p_is_available": data.is_available,
            "p_is_featured": data.is_featured,
            "p_sort_order": data.sort_order,
            "p_created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Error creating product")
        
        return JSONResponse(content={
            "success": True,
            "message": "Product created successfully!",
            "product": response.data[0]
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
