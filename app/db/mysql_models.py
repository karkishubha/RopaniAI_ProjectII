"""
MySQL Models for Land Marketplace
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.mysql_session import MySQLBase
import enum

class LandTypeEnum(str, enum.Enum):
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    AGRICULTURAL = "agricultural"

class AreaUnitEnum(str, enum.Enum):
    AANA = "aana"
    ROPANI = "ropani"
    BIGHA = "bigha"
    SQFT = "sqft"
    SQM = "sqm"

class ListingStatusEnum(str, enum.Enum):
    ACTIVE = "active"
    PENDING = "pending"
    SOLD = "sold"
    CANCELLED = "cancelled"

class TransactionStatusEnum(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class LandListing(MySQLBase):
    __tablename__ = "land_listings"

    id = Column(Integer, primary_key=True, index=True)
    
    # Basic Information
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    
    # Location
    province = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    municipality = Column(String(150), nullable=False, index=True)
    ward = Column(Integer, nullable=False)
    
    # Land Specifications
    area = Column(Float, nullable=False)
    area_unit = Column(Enum(AreaUnitEnum), nullable=False)
    price_per_unit = Column(Float, nullable=False)
    base_price = Column(Float, nullable=False)
    ml_suggested_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    
    # Land Details
    kitta_number = Column(String(50), nullable=False)
    plot_number = Column(String(50), nullable=False)
    road_width = Column(Float)
    
    # Amenities
    road_access = Column(Boolean, default=False)
    water_supply = Column(Boolean, default=False)
    electricity = Column(Boolean, default=False)
    
    # Land Type
    residential_zone = Column(Boolean, default=False)
    commercial_zone = Column(Boolean, default=False)
    agricultural_zone = Column(Boolean, default=False)
    
    # Owner Information
    owner_name = Column(String(150), nullable=False)
    owner_phone = Column(String(20), nullable=False)
    owner_email = Column(String(150), nullable=False)
    
    # Documents
    land_ownership_certificate = Column(Boolean, default=False)
    tax_clearance_certificate = Column(Boolean, default=False)
    character_certificate = Column(Boolean, default=False)
    cadastral_map = Column(Boolean, default=False)
    no_objection_certificate = Column(Boolean, default=False)
    
    # Status
    status = Column(Enum(ListingStatusEnum), default=ListingStatusEnum.ACTIVE)
    
    # Timestamps
    listed_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    transactions = relationship("Transaction", back_populates="land_listing")
    price_negotiations = relationship("PriceNegotiation", back_populates="land_listing")
    photos = relationship("LandPhoto", backref="land_listing", cascade="all, delete-orphan")

class Transaction(MySQLBase):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    
    # Relationships
    land_listing_id = Column(Integer, ForeignKey("land_listings.id"), nullable=False)
    land_listing = relationship("LandListing", back_populates="transactions")
    
    # Buyer Information
    buyer_name = Column(String(150), nullable=False)
    buyer_phone = Column(String(20), nullable=False)
    buyer_email = Column(String(150), nullable=False)
    buyer_address = Column(Text)
    
    # Transaction Details
    agreed_price = Column(Float, nullable=False)
    advance_payment = Column(Float, default=0)
    
    # Transaction Status
    status = Column(Enum(TransactionStatusEnum), default=TransactionStatusEnum.PENDING)
    
    # Legal Procedure Tracking
    ownership_verified = Column(Boolean, default=False)
    documents_verified = Column(Boolean, default=False)
    site_inspected = Column(Boolean, default=False)
    price_negotiated = Column(Boolean, default=False)
    sale_agreement_signed = Column(Boolean, default=False)
    payment_completed = Column(Boolean, default=False)
    registration_done = Column(Boolean, default=False)
    transfer_certificate_obtained = Column(Boolean, default=False)
    records_updated = Column(Boolean, default=False)
    tax_paid = Column(Boolean, default=False)
    
    # Notes
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))

class PriceNegotiation(MySQLBase):
    __tablename__ = "price_negotiations"

    id = Column(Integer, primary_key=True, index=True)
    
    # Relationships
    land_listing_id = Column(Integer, ForeignKey("land_listings.id"), nullable=False)
    land_listing = relationship("LandListing", back_populates="price_negotiations")
    
    # Negotiation Details
    offered_price = Column(Float, nullable=False)
    previous_price = Column(Float, nullable=False)
    adjustment_amount = Column(Float, nullable=False)
    
    # Negotiator Information (can be buyer or seller)
    negotiator_name = Column(String(150))
    negotiator_email = Column(String(150))
    negotiator_type = Column(String(20))  # 'buyer' or 'seller'
    
    # Status
    accepted = Column(Boolean, default=False)
    rejected = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SavedSearch(MySQLBase):
    __tablename__ = "saved_searches"

    id = Column(Integer, primary_key=True, index=True)
    
    # User Information
    user_email = Column(String(150), nullable=False, index=True)
    
    # Search Criteria
    search_name = Column(String(100), nullable=False)
    province = Column(String(100))
    district = Column(String(100))
    municipality = Column(String(150))
    min_price = Column(Float)
    max_price = Column(Float)
    min_area = Column(Float)
    max_area = Column(Float)
    road_access = Column(Boolean)
    water_supply = Column(Boolean)
    electricity = Column(Boolean)
    residential_zone = Column(Boolean)
    commercial_zone = Column(Boolean)
    agricultural_zone = Column(Boolean)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Favorite(MySQLBase):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    
    # User Information
    user_email = Column(String(150), nullable=False, index=True)
    
    # Land Listing
    land_listing_id = Column(Integer, ForeignKey("land_listings.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LandPhoto(MySQLBase):
    __tablename__ = "land_photos"

    id = Column(Integer, primary_key=True, index=True)
    
    # Land Listing
    land_listing_id = Column(Integer, ForeignKey("land_listings.id"), nullable=False)
    
    # Photo Data
    photo_data = Column(Text, nullable=False)  # Base64 encoded image
    photo_type = Column(String(20), nullable=False)  # e.g., 'image/jpeg', 'image/png'
    caption = Column(String(255))
    is_primary = Column(Boolean, default=False)
    
    # Timestamps
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
