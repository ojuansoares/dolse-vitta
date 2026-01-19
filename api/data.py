"""Consolidated Data API - Categories, Products, Orders"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from ._utils.supabase_client import get_supabase_client, get_supabase_admin_client
from ._utils.auth_middleware import get_current_user

app = FastAPI()


# ============== MODELS ==============

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category_id: Optional[str] = None
    image_url: Optional[str] = None
    is_available: bool = True
    is_featured: bool = False
    sort_order: int = 0


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category_id: Optional[str] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None
    is_featured: Optional[bool] = None
    sort_order: Optional[int] = None


class OrderItem(BaseModel):
    product_id: str
    product_name: str
    product_price: float
    quantity: int


class OrderCreate(BaseModel):
    customer_name: str
    customer_order: Optional[str] = None
    items: List[OrderItem]
    total: float


# ============== CATEGORIES ==============

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
                "c_name": c["c_name"],
                "c_description": c["c_description"],
                "c_image_url": c["c_image_url"],
                "c_is_active": c["c_is_active"],
                "c_sort_order": c["c_sort_order"]
            })
        
        return JSONResponse(content={"success": True, "categories": categories})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/categories")
async def create_category(request: Request):
    """Create new category (admin only)"""
    try:
        get_current_user(request)
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
        
        return JSONResponse(content={"success": True, "message": "Category created!", "category": response.data[0]})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/categories/{category_id}")
async def get_category(request: Request, category_id: str):
    """Get single category"""
    try:
        supabase = get_supabase_client()
        response = supabase.table("category").select("*").eq("id", category_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Category not found")
        
        c = response.data
        return JSONResponse(content={
            "success": True,
            "category": {
                "id": c["id"],
                "c_name": c["c_name"],
                "c_description": c["c_description"],
                "c_image_url": c["c_image_url"],
                "c_is_active": c["c_is_active"],
                "c_sort_order": c["c_sort_order"]
            }
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/categories/{category_id}")
async def update_category(request: Request, category_id: str):
    """Update category (admin only)"""
    try:
        get_current_user(request)
        body = await request.json()
        data = CategoryUpdate(**body)
        
        supabase = get_supabase_admin_client()
        update_data = {"c_last_update": datetime.now(timezone.utc).isoformat()}
        
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
        
        return JSONResponse(content={"success": True, "message": "Category updated!"})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/categories/{category_id}")
async def delete_category(request: Request, category_id: str):
    """Delete category (admin only)"""
    try:
        get_current_user(request)
        supabase = get_supabase_admin_client()
        # Delete all products linked to this category and check result
        prod_del = supabase.table("product").delete().eq("p_category_id", category_id).execute()
        if hasattr(prod_del, "error") and prod_del.error:
            raise HTTPException(status_code=400, detail=f"Erro ao apagar produtos: {prod_del.error}")
        # Now delete the category itself
        cat_del = supabase.table("category").delete().eq("id", category_id).execute()
        if hasattr(cat_del, "error") and cat_del.error:
            raise HTTPException(status_code=400, detail=f"Erro ao apagar categoria: {cat_del.error}")
        return JSONResponse(content={"success": True, "message": "Category and its products deleted!"})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============== PRODUCTS ==============

@app.get("/api/products")
async def list_products(request: Request):
    """List all products (public) - filtering done on frontend"""
    try:
        supabase = get_supabase_client()
        auth_header = request.headers.get("Authorization")
        if auth_header and "Bearer " in auth_header:
            token = auth_header.split(" ")[1]
            supabase.postgrest.auth(token)
        response = supabase.table("product") \
            .select("*, category(c_name)") \
            .order("p_sort_order") \
            .execute()
        
        products = []
        for p in response.data:
            products.append({
                "id": p["id"],
                "p_name": p["p_name"],
                "p_description": p["p_description"],
                "p_price": float(p["p_price"]) if p["p_price"] else 0,
                "p_image_url": p["p_image_url"],
                "p_is_available": p["p_is_available"],
                "p_is_featured": p["p_is_featured"],
                "p_category_id": p["p_category_id"],
                "p_sort_order": p.get("p_sort_order", 0),
                "category_name": p["category"]["c_name"] if p.get("category") else None
            })
        
        return JSONResponse(content={"success": True, "products": products})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/products")
async def create_product(request: Request):
    """Create new product (admin only)"""
    try:
        get_current_user(request)
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
        
        return JSONResponse(content={"success": True, "message": "Product created!", "product": response.data[0]})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


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
                "p_name": p["p_name"],
                "p_description": p["p_description"],
                "p_price": float(p["p_price"]) if p["p_price"] else 0,
                "p_image_url": p["p_image_url"],
                "p_is_available": p["p_is_available"],
                "p_is_featured": p["p_is_featured"],
                "p_category_id": p["p_category_id"],
                "p_sort_order": p.get("p_sort_order", 0),
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
        get_current_user(request)
        body = await request.json()
        data = ProductUpdate(**body)
        
        supabase = get_supabase_admin_client()
        update_data = {"p_last_update": datetime.now(timezone.utc).isoformat()}
        
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
        
        return JSONResponse(content={"success": True, "message": "Product updated!", "product": response.data[0]})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/products/{product_id}")
async def delete_product(request: Request, product_id: str):
    """Delete product (admin only)"""
    try:
        get_current_user(request)
        supabase = get_supabase_admin_client()
        supabase.table("product").delete().eq("id", product_id).execute()
        return JSONResponse(content={"success": True, "message": "Product deleted!"})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============== ORDERS ==============

@app.get("/api/orders")
async def list_orders(request: Request):
    """List all orders (admin only)"""
    try:
        get_current_user(request)
        supabase = get_supabase_admin_client()
        response = supabase.table("order").select("*, order_item(*)").order("o_created_at", desc=True).execute()
        
        orders = []
        for o in response.data:
            orders.append({
                "id": o["id"],
                "o_customer_name": o["o_customer_name"],
                "o_customer_order": o["o_customer_order"],
                "o_total": float(o["o_total"]) if o["o_total"] else 0,
                "o_created_at": o["o_created_at"],
                "order_item": o.get("order_item", [])
            })
        
        return JSONResponse(content={"success": True, "orders": orders})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/orders")
async def create_order(request: Request):
    """Create new order (public)"""
    try:
        body = await request.json()
        data = OrderCreate(**body)
        
        supabase = get_supabase_admin_client()
        
        order_response = supabase.table("order").insert({
            "o_customer_name": data.customer_name,
            "o_customer_order": data.customer_order,
            "o_total": data.total,
            "o_created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        if not order_response.data:
            raise HTTPException(status_code=400, detail="Error creating order")
        
        order_id = order_response.data[0]["id"]
        
        order_items = []
        for item in data.items:
            order_items.append({
                "oi_order_id": order_id,
                "oi_product_id": item.product_id,
                "oi_product_name": item.product_name,
                "oi_product_price": item.product_price,
                "oi_quantity": item.quantity,
                "oi_subtotal": item.product_price * item.quantity,
                "oi_created_at": datetime.now(timezone.utc).isoformat()
            })
        
        if order_items:
            supabase.table("order_item").insert(order_items).execute()
        
        return JSONResponse(content={"success": True, "message": "Order created!", "order_id": order_id})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/orders")
async def delete_all_orders(request: Request):
    """Delete all orders (admin only)"""
    try:
        get_current_user(request)
        supabase = get_supabase_admin_client()
        
        # Delete all order items first
        supabase.table("order_item").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        # Delete all orders
        supabase.table("order").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        
        return JSONResponse(content={"success": True, "message": "All orders deleted!"})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
