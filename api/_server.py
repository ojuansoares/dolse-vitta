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
    
    # Return in the format the frontend expects: { token, user, admin_profile }
    return {
        "success": True,
        "token": auth_response.session.access_token,
        "user": {
            "id": auth_response.user.id,
            "email": auth_response.user.email,
            "name": admin_data.get("a_name")
        },
        "admin_profile": {
            "id": admin_data["id"],
            "a_email": admin_data.get("a_email"),
            "a_name": admin_data.get("a_name"),
            "a_phone": admin_data.get("a_phone"),
            "a_avatar_url": admin_data.get("a_avatar_url"),
            "a_is_active": admin_data.get("a_is_active", True)
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
    response = supabase.table("product").select("*").order("p_sort_order").execute()
    
    products = [{
        "id": p["id"],
        "p_name": p["p_name"],
        "p_description": p["p_description"],
        "p_price": float(p["p_price"]) if p["p_price"] else 0,
        "p_image_url": p["p_image_url"],
        "p_category_id": p["p_category_id"],
        "p_sort_order": p.get("p_sort_order", 0),
        "p_is_available": p.get("p_is_available"),
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


@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    supabase = get_supabase_client()
    response = supabase.table("product").select("*").eq("id", product_id).single().execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Product not found")
    
    p = response.data
    return {
        "success": True,
        "product": {
            "id": p["id"],
            "p_name": p["p_name"],
            "p_description": p.get("p_description"),
            "p_price": float(p["p_price"]),
            "p_image_url": p.get("p_image_url"),
            "p_category_id": p.get("p_category_id"),
            "p_is_available": p.get("p_is_available", True),
        }
    }


@app.put("/api/products/{product_id}")
async def update_product(product_id: str, request: Request):
    user = get_current_user(request)
    body = await request.json()
    
    supabase = get_supabase_admin_client()
    update_data = {}
    
    if "name" in body: update_data["p_name"] = body["name"]
    if "description" in body: update_data["p_description"] = body["description"]
    if "price" in body: update_data["p_price"] = body["price"]
    if "image_url" in body: update_data["p_image_url"] = body["image_url"]
    if "category_id" in body: update_data["p_category_id"] = body["category_id"]
    if "is_available" in body: update_data["p_is_available"] = body["is_available"]
    if "is_featured" in body: update_data["p_is_featured"] = body["is_featured"]
    if "sort_order" in body: update_data["p_sort_order"] = body["sort_order"]
    
    if not update_data:
        return {"success": True, "message": "Nothing to update"}
    
    supabase.table("product").update(update_data).eq("id", product_id).execute()
    return {"success": True, "message": "Product updated!"}


@app.delete("/api/products/{product_id}")
async def delete_product(product_id: str, request: Request):
    user = get_current_user(request)
    supabase = get_supabase_admin_client()
    supabase.table("product").delete().eq("id", product_id).execute()
    return {"success": True, "message": "Product deleted!"}


# --- CATEGORIES ---
@app.get("/api/categories")
async def list_categories():
    supabase = get_supabase_client()
    response = supabase.table("category").select("*").eq("c_is_active", True).order("c_sort_order").execute()
    
    categories = [{
        "id": c["id"],
        "c_name": c["c_name"],
        "c_description": c["c_description"],
        "c_image_url": c.get("c_image_url"),
        "c_sort_order": c.get("c_sort_order", 0),
        "c_is_active": c.get("c_is_active", True),
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


@app.delete("/api/orders")
async def delete_all_orders(request: Request):
    """Delete all orders and order items (clear history)"""
    user = get_current_user(request)
    supabase = get_supabase_admin_client()
    
    # First delete all order items
    supabase.table("order_item").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    # Then delete all orders
    supabase.table("order").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    return {"success": True, "message": "All orders deleted!"}


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


# --- CHECKOUT (public) ---
class CartItem(BaseModel):
    product_id: str
    quantity: int


class CheckoutRequest(BaseModel):
    customer_name: str
    items: List[CartItem]


@app.post("/api/checkout")
async def checkout(request: Request):
    body = await request.json()
    data = CheckoutRequest(**body)
    
    supabase = get_supabase_admin_client()
    
    # Fetch products
    product_ids = [item.product_id for item in data.items]
    products_response = supabase.table("product").select("*").in_("id", product_ids).execute()
    products_map = {p["id"]: p for p in products_response.data}
    
    # Build order items
    order_items = []
    total = 0.0
    
    for cart_item in data.items:
        product = products_map.get(cart_item.product_id)
        if not product:
            continue
        price = float(product["p_price"])
        subtotal = price * cart_item.quantity
        total += subtotal
        order_items.append({
            "product_id": cart_item.product_id,
            "product_name": product["p_name"],
            "product_price": price,
            "quantity": cart_item.quantity,
            "subtotal": subtotal
        })
    
    # Create order
    order_response = supabase.table("order").insert({
        "o_customer_name": data.customer_name.strip(),
        "o_total": total,
    }).execute()
    
    order_id = order_response.data[0]["id"]
    
    # Create order items
    for item in order_items:
        supabase.table("order_item").insert({
            "oi_order_id": order_id,
            "oi_product_id": item["product_id"],
            "oi_product_name": item["product_name"],
            "oi_product_price": item["product_price"],
            "oi_quantity": item["quantity"],
            "oi_subtotal": item["subtotal"],
        }).execute()
    
    # Get WhatsApp from about
    about_response = supabase.table("about").select("ab_whatsapp").limit(1).execute()
    whatsapp_number = "5511999999999"
    if about_response.data:
        whatsapp_number = about_response.data[0].get("ab_whatsapp", whatsapp_number)
    whatsapp_number = ''.join(filter(str.isdigit, whatsapp_number or "")) or "5511999999999"
    
    # Build message (sem emojis para evitar problemas de encoding)
    message_lines = ["*PEDIDO - DOLCE VITTA*", "", f"*Cliente:* {data.customer_name.strip()}", "", "*Itens:*"]
    for item in order_items:
        message_lines.append(f"- {item['quantity']}x {item['product_name']} - R$ {item['subtotal']:.2f}")
    message_lines.extend(["", f"*TOTAL: R$ {total:.2f}*", "", "Aguardo confirmacao!"])
    
    return {
        "success": True,
        "order_id": order_id,
        "whatsapp_number": whatsapp_number,
        "whatsapp_message": "\n".join(message_lines),
        "total": total,
        "items": order_items
    }


# --- ABOUT (public GET, admin PUT) ---
@app.get("/api/about")
async def get_about():
    supabase = get_supabase_client()
    response = supabase.table("about").select("*").limit(1).execute()
    
    if not response.data:
        return {"success": True, "about": None}
    
    ab = response.data[0]
    return {
        "success": True,
        "about": {
            "id": ab["id"],
            "name": ab["ab_name"],
            "photo_url": ab["ab_photo_url"],
            "title": ab["ab_title"],
            "story": ab["ab_story"],
            "specialty": ab["ab_specialty"],
            "experience_years": ab["ab_experience_years"],
            "quote": ab["ab_quote"],
            "instagram": ab["ab_instagram"],
            "whatsapp": ab["ab_whatsapp"],
            "email": ab["ab_email"],
            "city": ab["ab_city"],
            "accepts_orders": ab["ab_accepts_orders"],
            "delivery_areas": ab["ab_delivery_areas"]
        }
    }


@app.put("/api/about")
async def update_about(request: Request):
    user = get_current_user(request)
    body = await request.json()
    
    supabase = get_supabase_admin_client()
    existing = supabase.table("about").select("id").limit(1).execute()
    
    update_data = {"ab_updated_at": datetime.now(timezone.utc).isoformat()}
    field_map = {
        "name": "ab_name", "photo_url": "ab_photo_url", "title": "ab_title",
        "story": "ab_story", "specialty": "ab_specialty", "experience_years": "ab_experience_years",
        "quote": "ab_quote", "instagram": "ab_instagram", "whatsapp": "ab_whatsapp",
        "email": "ab_email", "city": "ab_city", "accepts_orders": "ab_accepts_orders",
        "delivery_areas": "ab_delivery_areas"
    }
    
    for key, db_key in field_map.items():
        if key in body and body[key] is not None:
            update_data[db_key] = body[key]
    
    if existing.data:
        supabase.table("about").update(update_data).eq("id", existing.data[0]["id"]).execute()
    else:
        update_data["ab_created_at"] = datetime.now(timezone.utc).isoformat()
        supabase.table("about").insert(update_data).execute()
    
    return {"success": True, "message": "About updated!"}


# --- REORDER ---
class ReorderItem(BaseModel):
    id: str
    sort_order: int


class ReorderRequest(BaseModel):
    items: List[ReorderItem]


@app.put("/api/reorder/categories")
async def reorder_categories(request: Request):
    user = get_current_user(request)
    body = await request.json()
    data = ReorderRequest(**body)
    
    supabase = get_supabase_admin_client()
    for item in data.items:
        supabase.table("category").update({"c_sort_order": item.sort_order}).eq("id", item.id).execute()
    
    return {"success": True, "message": "Categories reordered!"}


@app.put("/api/reorder/products")
async def reorder_products(request: Request):
    user = get_current_user(request)
    body = await request.json()
    data = ReorderRequest(**body)
    
    supabase = get_supabase_admin_client()
    for item in data.items:
        supabase.table("product").update({"p_sort_order": item.sort_order}).eq("id", item.id).execute()
    
    return {"success": True, "message": "Products reordered!"}


# --- CATEGORY BY ID ---
@app.get("/api/categories/{category_id}")
async def get_category(category_id: str):
    supabase = get_supabase_client()
    response = supabase.table("category").select("*").eq("id", category_id).single().execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Category not found")
    
    c = response.data
    return {
        "success": True,
        "category": {
            "id": c["id"], "name": c["c_name"], "description": c["c_description"],
            "image_url": c["c_image_url"], "is_active": c["c_is_active"], "sort_order": c["c_sort_order"]
        }
    }


@app.put("/api/categories/{category_id}")
async def update_category(category_id: str, request: Request):
    user = get_current_user(request)
    body = await request.json()
    
    supabase = get_supabase_admin_client()
    update_data = {}
    
    if "name" in body: update_data["c_name"] = body["name"]
    if "description" in body: update_data["c_description"] = body["description"]
    if "image_url" in body: update_data["c_image_url"] = body["image_url"]
    if "is_active" in body: update_data["c_is_active"] = body["is_active"]
    if "sort_order" in body: update_data["c_sort_order"] = body["sort_order"]
    
    if not update_data:
        return {"success": True, "message": "Nothing to update"}
    
    supabase.table("category").update(update_data).eq("id", category_id).execute()
    return {"success": True, "message": "Category updated!"}


@app.delete("/api/categories/{category_id}")
async def delete_category(category_id: str, request: Request):
    user = get_current_user(request)
    supabase = get_supabase_admin_client()
    supabase.table("category").delete().eq("id", category_id).execute()
    return {"success": True, "message": "Category deleted!"}


if __name__ == "__main__":
    uvicorn.run("api._server:app", host="0.0.0.0", port=3001, reload=True)

