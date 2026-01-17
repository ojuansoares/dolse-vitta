"""API Principal - Health Check"""
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()


@app.get("/api")
def handler():
    """Health check da API"""
    return JSONResponse(
        content={
            "status": "ok",
            "message": "API funcionando!",
            "version": "1.0.0",
            "endpoints": {
                "auth": "/api/auth",
                "items": "/api/items",
                "users": "/api/users"
            }
        }
    )
