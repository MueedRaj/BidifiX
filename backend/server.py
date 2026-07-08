from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import logging
import uuid
import bcrypt
import jwt
import secrets
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_auth_requests

# MongoDB connection
# NOTE: Initialize the client in startup() so uvicorn import doesn't crash
# when mongodb+srv DNS resolution is temporarily unavailable.
client = None
db = None

def require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required env var: {name}")
    return value

app = FastAPI()
api_router = APIRouter(prefix="/api")

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET")
JWT_ALGORITHM = "HS256"

# Google OAuth Configuration (replaces the removed Emergent auth service)
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")

# Manual Payment Configuration (JazzCash / EasyPaisa / Bank Transfer)
# These are personal/merchant receiving accounts you give to buyers - no payment
# gateway API keys needed, so there's no per-transaction fee or approval process.
PAYMENT_ACCOUNTS = {
    "jazzcash": {
        "label": "JazzCash",
        "number": os.environ.get("JAZZCASH_NUMBER", ""),
        "account_title": os.environ.get("JAZZCASH_ACCOUNT_TITLE", ""),
    },
    "easypaisa": {
        "label": "EasyPaisa",
        "number": os.environ.get("EASYPAISA_NUMBER", ""),
        "account_title": os.environ.get("EASYPAISA_ACCOUNT_TITLE", ""),
    },
    "bank": {
        "label": os.environ.get("BANK_NAME", "Bank Transfer"),
        "account_title": os.environ.get("BANK_ACCOUNT_TITLE", ""),
        "account_number": os.environ.get("BANK_ACCOUNT_NUMBER", ""),
        "iban": os.environ.get("BANK_IBAN", ""),
    },
}

# Subscription Plans
SUBSCRIPTION_PLANS = {
    "free": {"name": "Free", "price": 0.0, "bids": 5, "currency": "pkr"},
    "basic": {"name": "Basic", "price": 150.0, "bids": 50, "currency": "pkr"},
    "pro": {"name": "Pro", "price": 300.0, "bids": 200, "currency": "pkr"},
    "agency": {"name": "Agency", "price": 1000.0, "bids": 9999, "currency": "pkr"}
}

# =======================
# Password Hashing
# =======================
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# =======================
# JWT Token Management
# =======================
def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# =======================
# Auth Helper
# =======================
async def get_current_user(request: Request) -> dict:
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    token = request.cookies.get("access_token")

    # Check JWT token (Email/Password auth and Google auth both issue this)
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# =======================
# Pydantic Models
# =======================
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = Field(..., pattern="^(buyer|seller)$")

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token (JWT) from Google Identity Services
    role: str = Field(..., pattern="^(buyer|seller)$")

class DemandCreate(BaseModel):
    product_id: str
    title: str
    description: str
    budget: float
    duration: str

class OfferCreate(BaseModel):
    price: float
    description: str

class MessageCreate(BaseModel):
    message: str

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str

class PaymentProofSubmit(BaseModel):
    payment_id: str
    method: str = Field(..., pattern="^(jazzcash|easypaisa|bank)$")
    sender_name: str
    sender_account: str  # the phone number / account the payment was sent FROM
    transaction_id: str  # TRX ID / reference number shown on the JazzCash / EasyPaisa / bank receipt

class PaymentRejectRequest(BaseModel):
    reason: Optional[str] = None

# =======================
# Startup Events
# =======================

@app.on_event("startup")
async def startup():
    global client, db

    # Initialize Mongo client here so uvicorn import doesn't crash
    # if mongodb+srv DNS is temporarily unavailable.
    try:
        mongo_url = require_env("MONGO_URL")
        db_name = require_env("DB_NAME")

        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        db = client[db_name]

        # Check if connection is successful
        await client.admin.command("ping")
        print("🟢 MongoDB Connected Successfully!")

        # Create indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("user_id", unique=True)
        await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
        await db.login_attempts.create_index("identifier")
        await db.demands.create_index("status")
        await db.offers.create_index("demand_id")

        # Seed admin/users/products
        await seed_admin()
        await seed_test_users()
        await seed_categories_and_products()

    except Exception as e:
        # Don't crash the whole app; DB will fail gracefully on requests
        print(f"🔴 MongoDB Connection Failed: {e}")

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@bidifyx.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "user_id": user_id,
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "verified": True,
            "trust_score": 100,
            "created_at": datetime.now(timezone.utc)
        })
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )

async def seed_test_users():
    test_users = [
        {"email": "buyer@test.com", "password": "test123", "name": "Test Buyer", "role": "buyer"},
        {"email": "seller@test.com", "password": "test123", "name": "Test Seller", "role": "seller"}
    ]
    
    for user_data in test_users:
        existing = await db.users.find_one({"email": user_data["email"]})
        if not existing:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id,
                "email": user_data["email"],
                "password_hash": hash_password(user_data["password"]),
                "name": user_data["name"],
                "role": user_data["role"],
                "verified": user_data["role"] == "seller",
                "trust_score": 80 if user_data["role"] == "seller" else 0,
                "created_at": datetime.now(timezone.utc)
            })
            
            # Give test seller a free subscription
            if user_data["role"] == "seller":
                await db.seller_subscriptions.insert_one({
                    "subscription_id": f"sub_{uuid.uuid4().hex[:12]}",
                    "seller_id": user_id,
                    "plan": "free",
                    "bid_limit": 5,
                    "bids_used": 0,
                    "expires_at": datetime.now(timezone.utc) + timedelta(days=30),
                    "created_at": datetime.now(timezone.utc)
                })

async def seed_categories_and_products():
    categories = [
        {"category_id": "cat_ai", "name": "AI Tools", "slug": "ai-tools"},
        {"category_id": "cat_design", "name": "Design Tools", "slug": "design-tools"},
        {"category_id": "cat_trading", "name": "Trading Platforms", "slug": "trading-platforms"},
        {"category_id": "cat_video", "name": "Video Editing", "slug": "video-editing"}
    ]
    
    for cat in categories:
        existing = await db.categories.find_one({"category_id": cat["category_id"]})
        if not existing:
            await db.categories.insert_one(cat)
    
    products = [
        {
            "product_id": "prod_chatgpt",
            "name": "ChatGPT Plus",
            "slug": "chatgpt-plus",
            "category_id": "cat_ai",
            "description": "Advanced AI chatbot by OpenAI",
            "features": ["GPT-4o access", "Faster responses", "Priority access"],
            "avg_price": 3500,
            "faq": [
                {"q": "Is it original account?", "a": "Yes, all sellers provide original accounts or shared slots."},
                {"q": "How long does it last?", "a": "Depends on the plan you select from offers."}
            ]
        },
        {
            "product_id": "prod_canva",
            "name": "Canva Pro",
            "slug": "canva-pro",
            "category_id": "cat_design",
            "description": "Professional design platform",
            "features": ["Premium templates", "Brand kit", "Remove background"],
            "avg_price": 2000,
            "faq": []
        },
        {
            "product_id": "prod_tradingview",
            "name": "TradingView Premium",
            "slug": "tradingview-premium",
            "category_id": "cat_trading",
            "description": "Advanced charting and trading platform",
            "features": ["Advanced charts", "Multiple indicators", "Real-time data"],
            "avg_price": 8000,
            "faq": []
        },
        {
            "product_id": "prod_capcut",
            "name": "CapCut Pro",
            "slug": "capcut-pro",
            "category_id": "cat_video",
            "description": "Professional video editing tool",
            "features": ["No watermark", "Premium effects", "HD export"],
            "avg_price": 1500,
            "faq": []
        }
    ]
    
    for prod in products:
        existing = await db.products.find_one({"product_id": prod["product_id"]})
        if not existing:
            await db.products.insert_one(prod)

# =======================
# Auth Routes
# =======================
@api_router.post("/auth/register")
async def register(body: RegisterRequest, response: Response):
    email = body.email.lower()
    
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name,
        "role": body.role,
        "verified": False,
        "trust_score": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(user_doc)
    
    # Create free subscription for sellers
    if body.role == "seller":
        await db.seller_subscriptions.insert_one({
            "subscription_id": f"sub_{uuid.uuid4().hex[:12]}",
            "seller_id": user_id,
            "plan": "free",
            "bid_limit": 5,
            "bids_used": 0,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=30),
            "created_at": datetime.now(timezone.utc)
        })
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    return user_doc

@api_router.post("/auth/login")
async def login(body: LoginRequest, request: Request, response: Response):
    email = body.email.lower()
    
    # Check brute force
    ip = request.client.host
    identifier = f"{ip}:{email}"
    attempts = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    
    if attempts and attempts.get("count", 0) >= 5:
        lockout_until = attempts.get("lockout_until")
        if lockout_until and lockout_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        # Increment failed attempts
        if attempts:
            new_count = attempts.get("count", 0) + 1
            lockout_until = datetime.now(timezone.utc) + timedelta(minutes=15) if new_count >= 5 else None
            await db.login_attempts.update_one(
                {"identifier": identifier},
                {"$set": {"count": new_count, "lockout_until": lockout_until, "updated_at": datetime.now(timezone.utc)}}
            )
        else:
            await db.login_attempts.insert_one({
                "identifier": identifier,
                "count": 1,
                "updated_at": datetime.now(timezone.utc)
            })
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Clear failed attempts
    await db.login_attempts.delete_one({"identifier": identifier})
    
    access_token = create_access_token(user["user_id"], email)
    refresh_token = create_refresh_token(user["user_id"])
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    user_data = {k: v for k, v in user.items() if k not in ["_id", "password_hash"]}
    return user_data

@api_router.post("/auth/google")
async def google_auth(body: GoogleAuthRequest, response: Response):
    """
    Verifies the Google ID token directly with Google (no third-party auth
    service involved). The frontend must use Google Identity Services
    (https://accounts.google.com/gsi/client) and send the returned
    `credential` JWT here. Requires GOOGLE_CLIENT_ID in .env.
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google login is not configured on the server")

    try:
        idinfo = google_id_token.verify_oauth2_token(
            body.credential, google_auth_requests.Request(), GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")

    email = idinfo.get("email")
    name = idinfo.get("name")
    picture = idinfo.get("picture")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    # Find or create user
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": body.role,
            "verified": False,
            "trust_score": 0,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(user_doc)
        user = user_doc

        # Create free subscription for sellers
        if body.role == "seller":
            await db.seller_subscriptions.insert_one({
                "subscription_id": f"sub_{uuid.uuid4().hex[:12]}",
                "seller_id": user_id,
                "plan": "free",
                "bid_limit": 5,
                "bids_used": 0,
                "expires_at": datetime.now(timezone.utc) + timedelta(days=30),
                "created_at": datetime.now(timezone.utc)
            })

    # Issue our own JWT tokens, same as the email/password flow
    access_token = create_access_token(user["user_id"], email)
    refresh_token = create_refresh_token(user["user_id"])

    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

    user_data = {k: v for k, v in user.items() if k not in ["_id", "password_hash"]}
    return user_data

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

# =======================
# Buyer Routes
# =======================
@api_router.post("/buyer/demands")
async def create_demand(body: DemandCreate, request: Request):
    user = await get_current_user(request)
    if user["role"] != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can post demands")
    
    demand_id = f"demand_{uuid.uuid4().hex[:12]}"
    demand_doc = {
        "demand_id": demand_id,
        "buyer_id": user["user_id"],
        "buyer_name": user["name"],
        "product_id": body.product_id,
        "title": body.title,
        "description": body.description,
        "budget": body.budget,
        "duration": body.duration,
        "status": "open",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.demands.insert_one(demand_doc)
    demand_doc.pop("_id", None)
    return demand_doc

@api_router.get("/buyer/demands")
async def get_my_demands(request: Request):
    user = await get_current_user(request)
    demands = await db.demands.find({"buyer_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for demand in demands:
        offer_count = await db.offers.count_documents({"demand_id": demand["demand_id"]})
        demand["offer_count"] = offer_count
    
    return demands

@api_router.get("/buyer/demands/{demand_id}/offers")
async def get_demand_offers(demand_id: str, request: Request):
    user = await get_current_user(request)
    
    demand = await db.demands.find_one({"demand_id": demand_id}, {"_id": 0})
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")
    
    if demand["buyer_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    offers = await db.offers.find({"demand_id": demand_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Enrich with seller data
    for offer in offers:
        seller = await db.users.find_one({"user_id": offer["seller_id"]}, {"_id": 0, "password_hash": 0})
        offer["seller"] = seller
    
    return offers

@api_router.post("/buyer/demands/{demand_id}/select-offer/{offer_id}")
async def select_offer(demand_id: str, offer_id: str, request: Request):
    user = await get_current_user(request)
    
    demand = await db.demands.find_one({"demand_id": demand_id}, {"_id": 0})
    if not demand or demand["buyer_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.offers.update_one({"offer_id": offer_id}, {"$set": {"status": "accepted"}})
    await db.demands.update_one({"demand_id": demand_id}, {"$set": {"status": "closed", "selected_offer_id": offer_id}})
    
    return {"message": "Offer selected successfully"}

# =======================
# Seller Routes
# =======================
@api_router.get("/seller/demands")
async def browse_demands(request: Request, product_id: Optional[str] = None):
    user = await get_current_user(request)
    if user["role"] != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can browse demands")
    
    query = {"status": "open"}
    if product_id:
        query["product_id"] = product_id
    
    demands = await db.demands.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for demand in demands:
        product = await db.products.find_one({"product_id": demand["product_id"]}, {"_id": 0, "name": 1})
        demand["product_name"] = product.get("name") if product else "Unknown"
    
    return demands

@api_router.post("/seller/demands/{demand_id}/offer")
async def submit_offer(demand_id: str, body: OfferCreate, request: Request):
    user = await get_current_user(request)
    if user["role"] != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can submit offers")
    
    # Check subscription
    subscription = await db.seller_subscriptions.find_one({"seller_id": user["user_id"]}, {"_id": 0})
    if not subscription:
        raise HTTPException(status_code=403, detail="No active subscription")
    
    if subscription["bids_used"] >= subscription["bid_limit"]:
        raise HTTPException(status_code=403, detail="Bid limit reached. Please upgrade your subscription.")
    
    # Check if already submitted offer
    existing = await db.offers.find_one({"demand_id": demand_id, "seller_id": user["user_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted an offer for this demand")
    
    offer_id = f"offer_{uuid.uuid4().hex[:12]}"
    offer_doc = {
        "offer_id": offer_id,
        "demand_id": demand_id,
        "seller_id": user["user_id"],
        "seller_name": user["name"],
        "price": body.price,
        "description": body.description,
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.offers.insert_one(offer_doc)
    await db.seller_subscriptions.update_one(
        {"seller_id": user["user_id"]},
        {"$inc": {"bids_used": 1}}
    )
    
    offer_doc.pop("_id", None)
    return offer_doc

@api_router.get("/seller/my-offers")
async def get_my_offers(request: Request):
    user = await get_current_user(request)
    offers = await db.offers.find({"seller_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for offer in offers:
        demand = await db.demands.find_one({"demand_id": offer["demand_id"]}, {"_id": 0})
        offer["demand"] = demand
    
    return offers

@api_router.get("/seller/subscription")
async def get_subscription(request: Request):
    user = await get_current_user(request)
    subscription = await db.seller_subscriptions.find_one({"seller_id": user["user_id"]}, {"_id": 0})
    if not subscription:
        return None
    return subscription

@api_router.get("/payments/methods")
async def get_payment_methods():
    """Public: returns the JazzCash / EasyPaisa / Bank receiving details to show at checkout."""
    return PAYMENT_ACCOUNTS

@api_router.post("/seller/subscription/checkout")
async def subscription_checkout(plan: str, request: Request):
    """
    Starts a manual payment (JazzCash / EasyPaisa / Bank transfer - all free,
    no merchant/API account needed). Returns a payment_id plus the receiving
    account details; the buyer pays manually and then calls
    /seller/subscription/submit-proof with the transaction reference.
    """
    user = await get_current_user(request)

    if plan not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")

    if plan == "free":
        raise HTTPException(status_code=400, detail="Cannot checkout free plan")

    plan_data = SUBSCRIPTION_PLANS[plan]
    payment_id = f"payment_{uuid.uuid4().hex[:12]}"

    await db.payment_transactions.insert_one({
        "payment_id": payment_id,
        "seller_id": user["user_id"],
        "plan": plan,
        "amount": plan_data["price"],
        "currency": plan_data["currency"],
        "payment_status": "pending",  # pending -> pending_review -> paid | rejected
        "method": None,
        "sender_name": None,
        "sender_account": None,
        "transaction_id": None,
        "created_at": datetime.now(timezone.utc)
    })

    return {
        "payment_id": payment_id,
        "amount": plan_data["price"],
        "currency": plan_data["currency"],
        "plan": plan,
        "payment_accounts": PAYMENT_ACCOUNTS,
        "instructions": (
            f"Send Rs. {plan_data['price']:.0f} to any one of the accounts above via "
            f"JazzCash, EasyPaisa, or bank transfer, then submit the transaction ID "
            f"on the /seller/subscription/submit-proof endpoint so an admin can verify it."
        )
    }

@api_router.post("/seller/subscription/submit-proof")
async def submit_payment_proof(body: PaymentProofSubmit, request: Request):
    """Buyer/seller submits the JazzCash/EasyPaisa/Bank transaction reference for admin review."""
    user = await get_current_user(request)

    transaction = await db.payment_transactions.find_one(
        {"payment_id": body.payment_id, "seller_id": user["user_id"]}, {"_id": 0}
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if transaction["payment_status"] == "paid":
        raise HTTPException(status_code=400, detail="This transaction is already paid")

    await db.payment_transactions.update_one(
        {"payment_id": body.payment_id},
        {"$set": {
            "payment_status": "pending_review",
            "method": body.method,
            "sender_name": body.sender_name,
            "sender_account": body.sender_account,
            "transaction_id": body.transaction_id,
            "submitted_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }}
    )

    return {"message": "Payment proof submitted. Your subscription will be activated once an admin verifies it."}

@api_router.get("/seller/subscription/status/{payment_id}")
async def check_subscription_status(payment_id: str, request: Request):
    user = await get_current_user(request)

    transaction = await db.payment_transactions.find_one(
        {"payment_id": payment_id, "seller_id": user["user_id"]}, {"_id": 0}
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return transaction

# =======================
# Admin: Manual Payment Verification (JazzCash / EasyPaisa / Bank)
# =======================
@api_router.get("/admin/payments/pending")
async def admin_pending_payments(request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    transactions = await db.payment_transactions.find(
        {"payment_status": "pending_review"}, {"_id": 0}
    ).sort("submitted_at", -1).to_list(200)

    for t in transactions:
        seller = await db.users.find_one({"user_id": t["seller_id"]}, {"_id": 0, "password_hash": 0})
        t["seller"] = seller

    return transactions

@api_router.post("/admin/payments/{payment_id}/approve")
async def admin_approve_payment(payment_id: str, request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    transaction = await db.payment_transactions.find_one({"payment_id": payment_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if transaction["payment_status"] == "paid":
        raise HTTPException(status_code=400, detail="Already approved")

    plan = transaction["plan"]
    plan_data = SUBSCRIPTION_PLANS[plan]
    seller_id = transaction["seller_id"]

    existing_sub = await db.seller_subscriptions.find_one({"seller_id": seller_id})
    if existing_sub:
        await db.seller_subscriptions.update_one(
            {"seller_id": seller_id},
            {"$set": {
                "plan": plan,
                "bid_limit": plan_data["bids"],
                "bids_used": 0,
                "expires_at": datetime.now(timezone.utc) + timedelta(days=30),
                "updated_at": datetime.now(timezone.utc)
            }}
        )
    else:
        await db.seller_subscriptions.insert_one({
            "subscription_id": f"sub_{uuid.uuid4().hex[:12]}",
            "seller_id": seller_id,
            "plan": plan,
            "bid_limit": plan_data["bids"],
            "bids_used": 0,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=30),
            "created_at": datetime.now(timezone.utc)
        })

    await db.payment_transactions.update_one(
        {"payment_id": payment_id},
        {"$set": {
            "payment_status": "paid",
            "approved_by": user["user_id"],
            "updated_at": datetime.now(timezone.utc)
        }}
    )

    return {"message": "Payment approved and subscription activated"}

@api_router.post("/admin/payments/{payment_id}/reject")
async def admin_reject_payment(payment_id: str, body: PaymentRejectRequest, request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    transaction = await db.payment_transactions.find_one({"payment_id": payment_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    await db.payment_transactions.update_one(
        {"payment_id": payment_id},
        {"$set": {
            "payment_status": "rejected",
            "reject_reason": body.reason,
            "rejected_by": user["user_id"],
            "updated_at": datetime.now(timezone.utc)
        }}
    )

    return {"message": "Payment rejected"}

# =======================
# Product Routes
# =======================
@api_router.get("/products")
async def get_products(category_id: Optional[str] = None):
    query = {}
    if category_id:
        query["category_id"] = category_id
    
    products = await db.products.find(query, {"_id": 0}).to_list(100)
    return products

@api_router.get("/products/{slug}")
async def get_product(slug: str):
    product = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get active demands count
    demand_count = await db.demands.count_documents({"product_id": product["product_id"], "status": "open"})
    product["active_demands"] = demand_count
    
    return product

@api_router.get("/products/{slug}/demands")
async def get_product_demands(slug: str):
    product = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    demands = await db.demands.find({"product_id": product["product_id"], "status": "open"}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return demands

@api_router.get("/categories")
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

# =======================
# Admin Routes
# =======================
@api_router.get("/admin/stats")
async def admin_stats(request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    total_users = await db.users.count_documents({})
    total_buyers = await db.users.count_documents({"role": "buyer"})
    total_sellers = await db.users.count_documents({"role": "seller"})
    total_demands = await db.demands.count_documents({})
    total_offers = await db.offers.count_documents({})
    
    return {
        "total_users": total_users,
        "total_buyers": total_buyers,
        "total_sellers": total_sellers,
        "total_demands": total_demands,
        "total_offers": total_offers
    }

@api_router.get("/admin/users")
async def admin_users(request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(100)
    return users

@api_router.put("/admin/users/{user_id}/verify")
async def verify_user(user_id: str, request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    await db.users.update_one({"user_id": user_id}, {"$set": {"verified": True}})
    return {"message": "User verified"}

# =======================
# Include Router & Middleware
# =======================
app.include_router(api_router)

# =======================
# CORS (cookies-safe)
# =======================
# If we allow credentials (cookies), we MUST NOT return '*' for Access-Control-Allow-Origin.
# Browser will block the request when credentials: 'include'.

front_default_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

cors_env = os.environ.get('CORS_ORIGINS')  # intentionally no default '*'
origins = []

if cors_env:
    # Expect comma-separated list, e.g. "http://localhost:5173,http://localhost:3000"
    origins = [o.strip() for o in cors_env.split(',') if o.strip()]
else:
    origins = list(front_default_origins)

# Optional single frontend url override
frontend_url = os.environ.get('FRONTEND_URL')
if frontend_url and frontend_url.strip():
    origins.append(frontend_url.strip())

# Ensure wildcard can never be used with credentials
origins = [o for o in origins if o != '*']

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://bidifyx.com",           # ← Aap ka Hostinger domain
        "https://www.bidifyx.com",
        "http://localhost:3000",            # local testing
        "http://localhost:5173",            # vite default
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()