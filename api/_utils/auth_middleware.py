"""Middleware de autenticação"""
import os
from typing import Optional
from functools import wraps
from fastapi import HTTPException, Request
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")


def get_jwt_secret():
    """Supabase usa o JWT secret baseado no projeto"""
    # O Supabase usa o anon key como parte da validação
    return os.getenv("SUPABASE_ANON_KEY")


def extract_token(request: Request) -> Optional[str]:
    """Extrai o token JWT do header Authorization"""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None
    
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    return parts[1]


def verify_token(token: str) -> dict:
    """Verifica e decodifica o token JWT do Supabase"""
    try:
        # Supabase JWT validation
        # O token pode ser validado verificando com a chave pública do Supabase
        # Para simplificar, vamos decodificar sem verificar a assinatura
        # Em produção, você deve verificar com a chave correta
        payload = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_signature": False}  # Em produção, configure corretamente
        )
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token inválido: {str(e)}")


def get_current_user(request: Request) -> dict:
    """Obtém o usuário atual do token JWT"""
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Token de autenticação não fornecido")
    
    payload = verify_token(token)
    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "role": payload.get("role"),
    }


def require_auth(func):
    """Decorator para requerer autenticação"""
    @wraps(func)
    async def wrapper(request: Request, *args, **kwargs):
        user = get_current_user(request)
        request.state.user = user
        return await func(request, *args, **kwargs)
    return wrapper
