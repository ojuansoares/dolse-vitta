"""Checkout - Process purchase and generate WhatsApp message"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
from datetime import datetime, timezone
from ._utils.supabase_client import get_supabase_admin_client

app = FastAPI()


class CartItem(BaseModel):
    product_id: str
    quantity: int


class CheckoutRequest(BaseModel):
    customer_name: str
    items: List[CartItem]


@app.post("/api/checkout")
async def checkout(request: Request):
    """
    Process checkout:
    1. Fetch product details from database
    2. Create order + order_items in history
    3. Return WhatsApp message with order summary
    """
    try:
        body = await request.json()
        data = CheckoutRequest(**body)
        
        if not data.items or len(data.items) == 0:
            raise HTTPException(status_code=400, detail="Cart is empty")
        
        if not data.customer_name or not data.customer_name.strip():
            raise HTTPException(status_code=400, detail="Customer name is required")
        
        supabase = get_supabase_admin_client()
        
        # 1. Fetch products from database
        product_ids = [item.product_id for item in data.items]
        products_response = supabase.table("product").select("*").in_("id", product_ids).execute()
        
        if not products_response.data:
            raise HTTPException(status_code=400, detail="No valid products found")
        
        # Create a map of products by ID
        products_map = {p["id"]: p for p in products_response.data}
        
        # 2. Build order items with full details
        order_items = []
        total = 0.0
        
        for cart_item in data.items:
            product = products_map.get(cart_item.product_id)
            if not product:
                continue  # Skip invalid products
            
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
        
        if not order_items:
            raise HTTPException(status_code=400, detail="No valid products in cart")
        
        # 3. Create order in database
        order_response = supabase.table("order").insert({
            "o_customer_name": data.customer_name.strip(),
            "o_customer_order": None,
            "o_total": total,
            "o_created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        if not order_response.data:
            raise HTTPException(status_code=400, detail="Error creating order")
        
        order_id = order_response.data[0]["id"]
        
        # 4. Create order items
        db_order_items = []
        for item in order_items:
            db_order_items.append({
                "oi_order_id": order_id,
                "oi_product_id": item["product_id"],
                "oi_product_name": item["product_name"],
                "oi_product_price": item["product_price"],
                "oi_quantity": item["quantity"],
                "oi_subtotal": item["subtotal"],
                "oi_created_at": datetime.now(timezone.utc).isoformat()
            })
        
        supabase.table("order_item").insert(db_order_items).execute()
        
        # 5. Get WhatsApp number from about table
        about_response = supabase.table("about").select("ab_whatsapp").limit(1).execute()
        whatsapp_number = "5511999999999"  # Default fallback
        if about_response.data and len(about_response.data) > 0:
            whatsapp_number = about_response.data[0].get("ab_whatsapp", whatsapp_number)
        
        # Remove non-numeric characters from whatsapp
        whatsapp_number = ''.join(filter(str.isdigit, whatsapp_number or ""))
        if not whatsapp_number:
            whatsapp_number = "5511999999999"
        
        # 6. Build WhatsApp message (usando texto simples para evitar problemas de encoding)
        message_lines = [
            "*PEDIDO - DOLCE VITTA*",
            "",
            f"*Cliente:* {data.customer_name.strip()}",
            "",
            "*Itens:*",
        ]
        
        for item in order_items:
            message_lines.append(
                f"- {item['quantity']}x {item['product_name']} - R$ {item['subtotal']:.2f}"
            )
        
        message_lines.extend([
            "",
            f"*TOTAL: R$ {total:.2f}*",
            "",
            "Aguardo confirmacao!"
        ])
        
        whatsapp_message = "\n".join(message_lines)
        
        return JSONResponse(content={
            "success": True,
            "order_id": order_id,
            "whatsapp_number": whatsapp_number,
            "whatsapp_message": whatsapp_message,
            "total": total,
            "items": order_items
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
