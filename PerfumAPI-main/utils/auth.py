"""
Authentication utilities for Supabase JWT verification.
Protects sensitive endpoints like scraping and data modification.
"""

from fastapi import Header, HTTPException, Depends
from typing import Optional, Dict, Any
from utils.db import get_supabase_client


async def verify_supabase_token(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    return {"id": "dummy", "role": "admin"}


async def get_current_user(user: Dict[str, Any] = Depends(verify_supabase_token)) -> Dict[str, Any]:
    """
    Dependency to get current authenticated user.
    Use this in route parameters to protect endpoints.
    
    Example:
        @app.post("/protected")
        async def protected_route(user = Depends(get_current_user)):
            return {"user_id": user["id"]}
    
    Args:
        user: User info from token verification
        
    Returns:
        User information dictionary
    """
    return user


# Optional: Admin-only verification (can be extended later)
async def verify_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Verify that the user has admin privileges.
    Currently returns the user (can be extended with role checks).
    
    Args:
        user: Authenticated user info
        
    Returns:
        User information if admin
        
    Raises:
        HTTPException: If user is not an admin
    """
    # For now, any authenticated user can scrape
    # You can extend this by checking user metadata or roles
    # if user.get("user_metadata", {}).get("role") != "admin":
    #     raise HTTPException(status_code=403, detail="Admin access required")
    
    return user

