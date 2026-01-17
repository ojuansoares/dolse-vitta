"""Orders - List all and Create"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from .._utils.supabase_client import get_supabase_client, get_supabase_admin_client
from .._utils.auth_middleware import get_current_user

app = FastAPI()


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


@app.get("/api/orders")
async def list_orders(request: Request):
    """List all orders (admin only)"""
    try:
        user = get_current_user(request)
        supabase = get_supabase_admin_client()
        
        response = supabase.table("order").select("*, order_item(*)").order("o_created_at", desc=True).execute()
        
        orders = []
        for o in response.data:
            orders.append({
                "id": o["id"],
                "customer_name": o["o_customer_name"],
                "customer_order": o["o_customer_order"],
                "total": float(o["o_total"]) if o["o_total"] else 0,
                "created_at": o["o_created_at"],
                "items": o.get("order_item", [])
            })
        
        return JSONResponse(content={
            "success": True,
            "orders": orders
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/orders")
async def create_order(request: Request):
    """Create new order (public - customer doesn't need login)"""
    try:
        body = await request.json()
        data = OrderCreate(**body)
        
        # Use admin client to bypass RLS for inserts
        supabase = get_supabase_admin_client()
        
        # 1. Create order
        order_response = supabase.table("order").insert({
            "o_customer_name": data.customer_name,
            "o_customer_order": data.customer_order,
            "o_total": data.total,
            "o_created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        if not order_response.data:
            raise HTTPException(status_code=400, detail="Error creating order")
        
        order_id = order_response.data[0]["id"]
        
        # 2. Create order items
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
        
        return JSONResponse(content={
            "success": True,
            "message": "Order created successfully!",
            "order_id": order_id
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
