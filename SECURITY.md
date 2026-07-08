# BidifyX Security Architecture

## Authentication & Token Storage

### ✅ Secure: Auth Tokens in httpOnly Cookies

All authentication tokens (JWT access tokens and refresh tokens) are stored in **httpOnly cookies** set by the backend:

- **Access Token**: 60-minute expiry, httpOnly, sameSite=lax
- **Refresh Token**: 7-day expiry, httpOnly, sameSite=lax  
- **Session Token** (OAuth): 7-day expiry, httpOnly, secure, sameSite=none

These cookies are:
- **NOT accessible to JavaScript** (httpOnly flag prevents XSS attacks)
- **Automatically sent with API requests** via `withCredentials: true`
- **Managed entirely by the backend** for security

### ⚠️ localStorage Usage - NOT for Auth Tokens

localStorage is used ONLY for:
1. **Temporary OAuth role storage** during Google OAuth redirect
   - User selects "buyer" or "seller" before OAuth
   - Value stored: just the role string ("buyer" or "seller")
   - **Immediately deleted** after OAuth callback completes
   - **No sensitive data** - just user's role preference

**Files involved:**
- `src/pages/Login.jsx:40` - Stores role before redirect
- `src/pages/Register.jsx:47` - Stores role before redirect  
- `src/components/AuthCallback.jsx:40` - Reads and deletes role

**Why this is safe:**
- No authentication tokens in localStorage
- No user PII in localStorage
- Value is temporary (deleted within seconds)
- Even if XSS steals this, attacker only gets "buyer" or "seller" string

## Backend Security Features

### Password Security
- **bcrypt** with automatic salt generation
- Passwords never stored in plain text
- Hash verification on login

### Brute Force Protection
- 5 failed attempts = 15-minute lockout
- Tracked by IP + email combination
- Automatic attempt counter reset on success

### Database Security
- MongoDB queries always exclude `_id` field (`{"_id": 0}`)
- Custom `user_id` fields used to avoid BSON ObjectId serialization
- All user queries exclude `password_hash` from responses

### CORS Configuration
- Explicit origin allowlist (not wildcard with credentials)
- Credentials allowed only from known frontend URL
- Strict origin enforcement

## API Security

### Protected Endpoints
All `/api/buyer/*`, `/api/seller/*`, `/api/admin/*` routes require authentication via:
1. httpOnly cookie check (primary)
2. Bearer token header check (fallback)

### Role-Based Access Control (RBAC)
- Buyers can only access buyer routes
- Sellers can only access seller routes  
- Admins have full access
- Enforced at both route and database level

## Best Practices Implemented

✅ httpOnly cookies for auth tokens
✅ Secure password hashing with bcrypt
✅ JWT with short expiry times
✅ Brute force protection
✅ CORS with explicit origins
✅ No sensitive data in localStorage
✅ Database query protection
✅ Role-based access control

## Security Checklist for Production

Before deploying to production, ensure:

- [ ] Change `JWT_SECRET` to a strong, random 64+ character value
- [ ] Change `ADMIN_PASSWORD` to a strong password
- [ ] Set `secure: True` on all cookies (requires HTTPS)
- [ ] Update `CORS_ORIGINS` to only production domains
- [ ] Enable rate limiting on authentication endpoints
- [ ] Set up SSL/TLS certificates
- [ ] Review and update MongoDB connection security
- [ ] Enable MongoDB authentication
- [ ] Set up proper logging and monitoring
- [ ] Implement CSP headers
- [ ] Add CSRF protection for state-changing operations

## Reporting Security Issues

If you discover a security vulnerability, please email: security@bidifyx.com

Do NOT create public GitHub issues for security vulnerabilities.
