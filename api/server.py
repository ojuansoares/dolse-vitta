"""
Local development server for Windows
Run from project root: python -m api.server
"""
import sys
import os

# Add parent directory to path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone

# Import utils
from api._utils.supabase_client import get_supabase_client, get_supabase_admin_client
from api._utils.auth_middleware import get_current_user

app = FastAPI(title="Local Dev API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== MODELS ====================
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category_id: Optional[str] = None
    image_url: Optional[str] = None
    is_available: bool = True
    is_featured: bool = False


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True


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


# ==================== ROUTES ====================

@app.get("/api")
def root():
    return {"message": "API is running!", "version": "1.0.0"}


# --- AUTH ---
@app.post("/api/auth/register")
async def register(request: Request):
    body = await request.json()
    data = RegisterRequest(**body)
    
    supabase = get_supabase_client()
    auth_response = supabase.auth.sign_up({
        "email": data.email,
        "password": data.password,
        "options": {"data": {"name": data.name}}
    })
    
    if auth_response.user is None:
        raise HTTPException(status_code=400, detail="Error creating user")
    
    admin_client = get_supabase_admin_client()
    admin_client.table("admin").insert({
        "id": auth_response.user.id,
        "a_email": data.email,
        "a_name": data.name,
        "a_is_active": True,
        "a_created_at": datetime.now(timezone.utc).isoformat()
    }).execute()
    
    return {"success": True, "message": "Account created!", "user": {"id": auth_response.user.id, "email": auth_response.user.email}}


@app.post("/api/auth/login")
async def login(request: Request):
    body = await request.json()
    data = LoginRequest(**body)
    
    supabase = get_supabase_client()
    auth_response = supabase.auth.sign_in_with_password({
        "email": data.email,
        "password": data.password
    })
    
    if auth_response.user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    admin_client = get_supabase_admin_client()
    admin_result = admin_client.table("admin").select("*").eq("id", auth_response.user.id).eq("a_is_active", True).execute()
    
    if not admin_result.data:
        raise HTTPException(status_code=403, detail="Access denied")
    
    admin_data = admin_result.data[0]
    
    return {
        "success": True,
        "user": {"id": auth_response.user.id, "email": auth_response.user.email, "name": admin_data.get("a_name")},
        "session": {
            "access_token": auth_response.session.access_token,
            "refresh_token": auth_response.session.refresh_token,
            "expires_at": auth_response.session.expires_at
        }
    }


@app.post("/api/auth/logout")
async def logout():
    supabase = get_supabase_client()
    supabase.auth.sign_out()
    return {"success": True, "message": "Logout successful!"}


@app.get("/api/auth/me")
async def me(request: Request):
    user = get_current_user(request)
    admin_client = get_supabase_admin_client()
    admin_result = admin_client.table("admin").select("*").eq("id", user["id"]).execute()
    admin_data = admin_result.data[0] if admin_result.data else None
    
    return {
        "success": True,
        "user": {
            "id": user["id"],
            "email": user.get("email"),
            "name": admin_data.get("a_name") if admin_data else None,
            "phone": admin_data.get("a_phone") if admin_data else None,
        }
    }


# --- USERS ---
@app.get("/api/users/profile")
async def get_profile(request: Request):
    user = get_current_user(request)
    supabase = get_supabase_admin_client()
    response = supabase.table("admin").select("*").eq("id", user["id"]).single().execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    admin = response.data
    return {
        "success": True,
        "profile": {
            "id": admin["id"],
            "email": admin["a_email"],
            "name": admin["a_name"],
            "phone": admin["a_phone"],
        }
    }


@app.put("/api/users/profile")
async def update_profile(request: Request):
    user = get_current_user(request)
    body = await request.json()
    data = UserUpdate(**body)
    
    supabase = get_supabase_admin_client()
    update_data = {"a_last_update": datetime.now(timezone.utc).isoformat()}
    if data.name is not None:
        update_data["a_name"] = data.name
    if data.phone is not None:
        update_data["a_phone"] = data.phone
    
    response = supabase.table("admin").update(update_data).eq("id", user["id"]).execute()
    
    return {"success": True, "message": "Profile updated!"}


# --- PRODUCTS ---
@app.get("/api/products")
async def list_products():
    supabase = get_supabase_client()
    response = supabase.table("product").select("*").eq("p_is_available", True).order("p_sort_order").execute()
    
    products = [{
        "id": p["id"],
        "name": p["p_name"],
        "description": p["p_description"],
        "price": float(p["p_price"]) if p["p_price"] else 0,
        "image_url": p["p_image_url"],
    } for p in response.data]
    
    return {"success": True, "products": products}


@app.post("/api/products")
async def create_product(request: Request):
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
    }).execute()
    
    return {"success": True, "product": response.data[0] if response.data else None}


# --- CATEGORIES ---
@app.get("/api/categories")
async def list_categories():
    supabase = get_supabase_client()
    response = supabase.table("category").select("*").eq("c_is_active", True).order("c_sort_order").execute()
    
    categories = [{
        "id": c["id"],
        "name": c["c_name"],
        "description": c["c_description"],
    } for c in response.data]
    
    return {"success": True, "categories": categories}


@app.post("/api/categories")
async def create_category(request: Request):
    user = get_current_user(request)
    body = await request.json()
    data = CategoryCreate(**body)
    
    supabase = get_supabase_admin_client()
    response = supabase.table("category").insert({
        "c_name": data.name,
        "c_description": data.description,
        "c_image_url": data.image_url,
        "c_is_active": data.is_active,
    }).execute()
    
    return {"success": True, "category": response.data[0] if response.data else None}


# --- ORDERS ---
@app.get("/api/orders")
async def list_orders(request: Request):
    user = get_current_user(request)
    supabase = get_supabase_admin_client()
    response = supabase.table("order").select("*, order_item(*)").order("o_created_at", desc=True).execute()
    
    return {"success": True, "orders": response.data}


@app.post("/api/orders")
async def create_order(request: Request):
    body = await request.json()
    data = OrderCreate(**body)
    
    supabase = get_supabase_admin_client()
    
    order_response = supabase.table("order").insert({
        "o_customer_name": data.customer_name,
        "o_customer_order": data.customer_order,
        "o_total": data.total,
    }).execute()
    
    order_id = order_response.data[0]["id"]
    
    order_items = [{
        "oi_order_id": order_id,
        "oi_product_id": item.product_id,
        "oi_product_name": item.product_name,
        "oi_product_price": item.product_price,
        "oi_quantity": item.quantity,
        "oi_subtotal": item.product_price * item.quantity,
    } for item in data.items]
    
    if order_items:
        supabase.table("order_item").insert(order_items).execute()
    
    return {"success": True, "order_id": order_id}


if __name__ == "__main__":
    uvicorn.run("api.server:app", host="0.0.0.0", port=3001, reload=True)

