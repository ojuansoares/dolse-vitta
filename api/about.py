"""About - Public GET and Admin PUT"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from ._utils.supabase_client import get_supabase_client, get_supabase_admin_client
from ._utils.auth_middleware import get_current_user

app = FastAPI()


class AboutUpdate(BaseModel):
    name: Optional[str] = None
    photo_url: Optional[str] = None
    title: Optional[str] = None
    story: Optional[str] = None
    specialty: Optional[str] = None
    experience_years: Optional[int] = None
    quote: Optional[str] = None
    instagram: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    accepts_orders: Optional[bool] = None
    delivery_areas: Optional[str] = None


@app.get("/api/about")
async def get_about(request: Request):
    """Get about page content (public)"""
    try:
        supabase = get_supabase_client()
        
        response = supabase.table("about").select("*").limit(1).execute()
        
        if not response.data or len(response.data) == 0:
            # Return empty about if none exists
            return JSONResponse(content={
                "success": True,
                "about": None
            })
        
        ab = response.data[0]
        
        return JSONResponse(content={
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
        })
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/about")
async def update_about(request: Request):
    """Update about page content (admin only)"""
    try:
        user = get_current_user(request)
        body = await request.json()
        data = AboutUpdate(**body)
        
        supabase = get_supabase_admin_client()
        
        # Check if about exists
        existing = supabase.table("about").select("id").limit(1).execute()
        
        update_data = {
            "ab_updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if data.name is not None:
            update_data["ab_name"] = data.name
        if data.photo_url is not None:
            update_data["ab_photo_url"] = data.photo_url
        if data.title is not None:
            update_data["ab_title"] = data.title
        if data.story is not None:
            update_data["ab_story"] = data.story
        if data.specialty is not None:
            update_data["ab_specialty"] = data.specialty
        if data.experience_years is not None:
            update_data["ab_experience_years"] = data.experience_years
        if data.quote is not None:
            update_data["ab_quote"] = data.quote
        if data.instagram is not None:
            update_data["ab_instagram"] = data.instagram
        if data.whatsapp is not None:
            update_data["ab_whatsapp"] = data.whatsapp
        if data.email is not None:
            update_data["ab_email"] = data.email
        if data.city is not None:
            update_data["ab_city"] = data.city
        if data.accepts_orders is not None:
            update_data["ab_accepts_orders"] = data.accepts_orders
        if data.delivery_areas is not None:
            update_data["ab_delivery_areas"] = data.delivery_areas
        
        if existing.data and len(existing.data) > 0:
            # Update existing
            about_id = existing.data[0]["id"]
            response = supabase.table("about").update(update_data).eq("id", about_id).execute()
        else:
            # Insert new (need at least name)
            if not data.name:
                raise HTTPException(status_code=400, detail="Name is required for new about")
            update_data["ab_name"] = data.name
            update_data["ab_created_at"] = datetime.now(timezone.utc).isoformat()
            response = supabase.table("about").insert(update_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Error updating about")
        
        return JSONResponse(content={
            "success": True,
            "message": "About updated successfully!"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
