"""
Production settings for Render deployment
"""
from .settings import *
import dj_database_url
import os

# Production settings
DEBUG = False

# Render provides the PORT environment variable
PORT = int(os.environ.get('PORT', 8000))

# Update ALLOWED_HOSTS for Render
ALLOWED_HOSTS = [
    '.onrender.com',
    'localhost',
    '127.0.0.1',
]

# Add your custom domain if you have one
custom_domain = os.environ.get('CUSTOM_DOMAIN')
if custom_domain:
    ALLOWED_HOSTS.append(custom_domain)

# Database configuration for Render (PostgreSQL)
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES['default'] = dj_database_url.parse(DATABASE_URL)

# Static files configuration for production
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

# WhiteNoise configuration
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Security settings for production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# CORS settings for production
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.getenv('CORS_ALLOWED_ORIGINS', 
    'https://your-frontend-domain.com').split(',')
    if origin.strip()
]

# If you want to allow all origins during development (NOT recommended for production)
# CORS_ALLOW_ALL_ORIGINS = True

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}
