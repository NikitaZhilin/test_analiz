"""
Middleware для безопасности приложения.
"""

import time
import re
from collections import defaultdict
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded


# Rate limiting
limiter = Limiter(key_func=get_remote_address)

# Хранилище для rate limiting (в памяти, для production использовать Redis)
request_history = defaultdict(list)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Добавляет security заголовки к ответам."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        
        # CSP для API (строгий, без inline скриптов)
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Простой rate limiting middleware.
    Ограничивает количество запросов для защиты от brute force.
    """

    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def dispatch(self, request: Request, call_next) -> Response:
        # Пропускаем health check
        if request.url.path == "/health":
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Очищаем старые записи
        request_history[client_ip] = [
            t for t in request_history[client_ip]
            if current_time - t < self.window_seconds
        ]
        
        # Проверяем лимит
        if len(request_history[client_ip]) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Слишком много запросов. Попробуйте позже."
            )
        
        request_history[client_ip].append(current_time)
        
        return await call_next(request)


class FileUploadSecurityMiddleware(BaseHTTPMiddleware):
    """
    Middleware для безопасности загрузки файлов.
    Проверяет размер и тип файла.
    """

    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
    ALLOWED_PDF_MAGIC = b"%PDF-"  # PDF magic bytes

    async def dispatch(self, request: Request, call_next) -> Response:
        # Проверяем только upload endpoints
        if "/import" in request.url.path and request.method == "POST":
            content_length = request.headers.get("content-length")
            
            if content_length and int(content_length) > self.MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Файл слишком большой. Максимальный размер: 10 MB"
                )
        
        return await call_next(request)


def setup_security_middleware(app: FastAPI):
    """Настройка security middleware для приложения."""
    
    # Security headers
    app.add_middleware(SecurityHeadersMiddleware)
    
    # Rate limiting
    app.add_middleware(
        RateLimitMiddleware,
        max_requests=100,  # 100 запросов в минуту
        window_seconds=60
    )
    
    # File upload security
    app.add_middleware(FileUploadSecurityMiddleware)
    
    # Exception handler for rate limiting
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
