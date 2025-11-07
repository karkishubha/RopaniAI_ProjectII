"""
Land Marketplace API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
import base64
from app.db.mysql_session import get_mysql_db
from app.db.mysql_models import (
    LandListing, Transaction, PriceNegotiation, SavedSearch, Favorite, LandPhoto,
    ListingStatusEnum, TransactionStatusEnum, AreaUnitEnum
)

router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])

# Pydantic Schemas
class DocumentsSchema(BaseModel):
    land_ownership_certificate: bool = False
    tax_clearance_certificate: bool = False
    character_certificate: bool = False
    cadastral_map: bool = False
    no_objection_certificate: bool = False

class PhotoSchema(BaseModel):
    id: int
    photo_data: str
    photo_type: str
    caption: Optional[str] = None
    is_primary: bool = False
    uploaded_at: datetime

    class Config:
        from_attributes = True

class PhotoUploadResponse(BaseModel):
    id: int
    message: str
    photo_type: str
    is_primary: bool

class LandListingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    province: str
    district: str
    municipality: str
    ward: int
    area: float
    area_unit: str
    price_per_unit: float
    kitta_number: str
    plot_number: str
    road_width: Optional[float] = None
    road_access: bool = False
    water_supply: bool = False
    electricity: bool = False
    residential_zone: bool = False
    commercial_zone: bool = False
    agricultural_zone: bool = False
    owner_name: str
    owner_phone: str
    owner_email: EmailStr
    documents: DocumentsSchema

class LandListingResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    province: str
    district: str
    municipality: str
    ward: int
    area: float
    area_unit: str
    price_per_unit: float
    base_price: float
    ml_suggested_price: float
    current_price: float
    kitta_number: str
    plot_number: str
    road_width: Optional[float]
    road_access: bool
    water_supply: bool
    electricity: bool
    residential_zone: bool
    commercial_zone: bool
    agricultural_zone: bool
    owner_name: str
    owner_phone: str
    owner_email: str
    land_ownership_certificate: bool
    tax_clearance_certificate: bool
    character_certificate: bool
    cadastral_map: bool
    no_objection_certificate: bool
    status: str
    listed_date: datetime
    photos: List[PhotoSchema] = []

    class Config:
        from_attributes = True

class PriceAdjustmentRequest(BaseModel):
    adjustment_amount: float

class TransactionCreate(BaseModel):
    land_listing_id: int
    buyer_name: str
    buyer_phone: str
    buyer_email: EmailStr
    buyer_address: Optional[str] = None
    agreed_price: float
    advance_payment: float = 0
    notes: Optional[str] = None

class TransactionUpdate(BaseModel):
    ownership_verified: Optional[bool] = None
    documents_verified: Optional[bool] = None
    site_inspected: Optional[bool] = None
    price_negotiated: Optional[bool] = None
    sale_agreement_signed: Optional[bool] = None
    payment_completed: Optional[bool] = None
    registration_done: Optional[bool] = None
    transfer_certificate_obtained: Optional[bool] = None
    records_updated: Optional[bool] = None
    tax_paid: Optional[bool] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class TransactionResponse(BaseModel):
    id: int
    land_listing_id: int
    buyer_name: str
    buyer_phone: str
    buyer_email: str
    buyer_address: Optional[str]
    agreed_price: float
    advance_payment: float
    status: str
    ownership_verified: bool
    documents_verified: bool
    site_inspected: bool
    price_negotiated: bool
    sale_agreement_signed: bool
    payment_completed: bool
    registration_done: bool
    transfer_certificate_obtained: bool
    records_updated: bool
    tax_paid: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# Helper function to calculate ML price
def calculate_ml_price(listing_data: LandListingCreate) -> float:
    """Calculate ML suggested price based on features"""
    base_price = listing_data.area * listing_data.price_per_unit
    multiplier = 1.0
    
    if listing_data.road_access:
        multiplier += 0.1
    if listing_data.water_supply:
        multiplier += 0.05
    if listing_data.electricity:
        multiplier += 0.05
    if listing_data.commercial_zone:
        multiplier += 0.2
    elif listing_data.residential_zone:
        multiplier += 0.1
    if listing_data.road_width and listing_data.road_width >= 15:
        multiplier += 0.1
    
    return round(base_price * multiplier, 2)

# Endpoints
@router.post("/listings", response_model=LandListingResponse, status_code=status.HTTP_201_CREATED)
async def create_land_listing(
    listing: LandListingCreate,
    db: Session = Depends(get_mysql_db)
):
    """Create a new land listing"""
    try:
        # Calculate prices
        base_price = listing.area * listing.price_per_unit
        ml_suggested_price = calculate_ml_price(listing)
        
        # Create listing
        db_listing = LandListing(
            title=listing.title,
            description=listing.description,
            province=listing.province,
            district=listing.district,
            municipality=listing.municipality,
            ward=listing.ward,
            area=listing.area,
            area_unit=listing.area_unit,
            price_per_unit=listing.price_per_unit,
            base_price=base_price,
            ml_suggested_price=ml_suggested_price,
            current_price=ml_suggested_price,
            kitta_number=listing.kitta_number,
            plot_number=listing.plot_number,
            road_width=listing.road_width,
            road_access=listing.road_access,
            water_supply=listing.water_supply,
            electricity=listing.electricity,
            residential_zone=listing.residential_zone,
            commercial_zone=listing.commercial_zone,
            agricultural_zone=listing.agricultural_zone,
            owner_name=listing.owner_name,
            owner_phone=listing.owner_phone,
            owner_email=listing.owner_email,
            land_ownership_certificate=listing.documents.land_ownership_certificate,
            tax_clearance_certificate=listing.documents.tax_clearance_certificate,
            character_certificate=listing.documents.character_certificate,
            cadastral_map=listing.documents.cadastral_map,
            no_objection_certificate=listing.documents.no_objection_certificate,
            status=ListingStatusEnum.ACTIVE
        )
        
        db.add(db_listing)
        db.commit()
        db.refresh(db_listing)
        
        return db_listing
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating listing: {str(e)}")

@router.get("/listings", response_model=List[LandListingResponse])
async def get_land_listings(
    province: Optional[str] = None,
    district: Optional[str] = None,
    municipality: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_area: Optional[float] = None,
    max_area: Optional[float] = None,
    road_access: Optional[bool] = None,
    water_supply: Optional[bool] = None,
    electricity: Optional[bool] = None,
    residential_zone: Optional[bool] = None,
    commercial_zone: Optional[bool] = None,
    agricultural_zone: Optional[bool] = None,
    status: str = "active",
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_mysql_db)
):
    """Get all land listings with optional filters"""
    query = db.query(LandListing).filter(LandListing.status == status)
    
    if province:
        query = query.filter(LandListing.province == province)
    if district:
        query = query.filter(LandListing.district == district)
    if municipality:
        query = query.filter(LandListing.municipality == municipality)
    if min_price:
        query = query.filter(LandListing.current_price >= min_price)
    if max_price:
        query = query.filter(LandListing.current_price <= max_price)
    if min_area:
        query = query.filter(LandListing.area >= min_area)
    if max_area:
        query = query.filter(LandListing.area <= max_area)
    if road_access is not None:
        query = query.filter(LandListing.road_access == road_access)
    if water_supply is not None:
        query = query.filter(LandListing.water_supply == water_supply)
    if electricity is not None:
        query = query.filter(LandListing.electricity == electricity)
    if residential_zone is not None:
        query = query.filter(LandListing.residential_zone == residential_zone)
    if commercial_zone is not None:
        query = query.filter(LandListing.commercial_zone == commercial_zone)
    if agricultural_zone is not None:
        query = query.filter(LandListing.agricultural_zone == agricultural_zone)
    
    listings = query.offset(skip).limit(limit).all()
    return listings

@router.get("/listings/{listing_id}", response_model=LandListingResponse)
async def get_land_listing(
    listing_id: int,
    db: Session = Depends(get_mysql_db)
):
    """Get a specific land listing by ID"""
    listing = db.query(LandListing).filter(LandListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing

@router.patch("/listings/{listing_id}/price")
async def adjust_land_price(
    listing_id: int,
    adjustment: PriceAdjustmentRequest,
    db: Session = Depends(get_mysql_db)
):
    """Adjust the price of a land listing"""
    listing = db.query(LandListing).filter(LandListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Create price negotiation record
    negotiation = PriceNegotiation(
        land_listing_id=listing_id,
        offered_price=listing.current_price + adjustment.adjustment_amount,
        previous_price=listing.current_price,
        adjustment_amount=adjustment.adjustment_amount
    )
    db.add(negotiation)
    
    # Update listing price
    listing.current_price = max(0, listing.current_price + adjustment.adjustment_amount)
    
    db.commit()
    db.refresh(listing)
    
    return {
        "message": "Price adjusted successfully",
        "new_price": listing.current_price,
        "adjustment": adjustment.adjustment_amount
    }

@router.post("/transactions", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_mysql_db)
):
    """Create a new transaction for land purchase"""
    # Verify listing exists and is active
    listing = db.query(LandListing).filter(
        LandListing.id == transaction.land_listing_id,
        LandListing.status == ListingStatusEnum.ACTIVE
    ).first()
    
    if not listing:
        raise HTTPException(status_code=404, detail="Active listing not found")
    
    # Create transaction
    db_transaction = Transaction(
        land_listing_id=transaction.land_listing_id,
        buyer_name=transaction.buyer_name,
        buyer_phone=transaction.buyer_phone,
        buyer_email=transaction.buyer_email,
        buyer_address=transaction.buyer_address,
        agreed_price=transaction.agreed_price,
        advance_payment=transaction.advance_payment,
        notes=transaction.notes,
        status=TransactionStatusEnum.PENDING
    )
    
    db.add(db_transaction)
    
    # Update listing status to pending
    listing.status = ListingStatusEnum.PENDING
    
    db.commit()
    db.refresh(db_transaction)
    
    return db_transaction

@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_mysql_db)
):
    """Get transaction details"""
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@router.patch("/transactions/{transaction_id}")
async def update_transaction(
    transaction_id: int,
    transaction_update: TransactionUpdate,
    db: Session = Depends(get_mysql_db)
):
    """Update transaction progress"""
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Update fields
    update_data = transaction_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)
    
    # If all legal procedures are complete, mark as completed
    if all([
        transaction.ownership_verified,
        transaction.documents_verified,
        transaction.site_inspected,
        transaction.price_negotiated,
        transaction.sale_agreement_signed,
        transaction.payment_completed,
        transaction.registration_done,
        transaction.transfer_certificate_obtained,
        transaction.records_updated,
        transaction.tax_paid
    ]):
        transaction.status = TransactionStatusEnum.COMPLETED
        transaction.completed_at = datetime.utcnow()
        
        # Update listing status to sold
        listing = db.query(LandListing).filter(
            LandListing.id == transaction.land_listing_id
        ).first()
        if listing:
            listing.status = ListingStatusEnum.SOLD
    
    db.commit()
    db.refresh(transaction)
    
    return {"message": "Transaction updated successfully", "transaction": transaction}

@router.get("/listings/{listing_id}/transactions", response_model=List[TransactionResponse])
async def get_listing_transactions(
    listing_id: int,
    db: Session = Depends(get_mysql_db)
):
    """Get all transactions for a specific listing"""
    transactions = db.query(Transaction).filter(
        Transaction.land_listing_id == listing_id
    ).all()
    return transactions

@router.delete("/listings/{listing_id}")
async def delete_listing(
    listing_id: int,
    db: Session = Depends(get_mysql_db)
):
    """Delete (cancel) a land listing"""
    listing = db.query(LandListing).filter(LandListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Check if there are any active transactions
    active_transactions = db.query(Transaction).filter(
        Transaction.land_listing_id == listing_id,
        Transaction.status.in_([TransactionStatusEnum.PENDING, TransactionStatusEnum.IN_PROGRESS])
    ).first()
    
    if active_transactions:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete listing with active transactions"
        )
    
    listing.status = ListingStatusEnum.CANCELLED
    db.commit()
    
    return {"message": "Listing cancelled successfully"}

@router.get("/stats")
async def get_marketplace_stats(db: Session = Depends(get_mysql_db)):
    """Get marketplace statistics"""
    total_listings = db.query(LandListing).filter(
        LandListing.status == ListingStatusEnum.ACTIVE
    ).count()
    
    sold_properties = db.query(LandListing).filter(
        LandListing.status == ListingStatusEnum.SOLD
    ).count()
    
    active_transactions = db.query(Transaction).filter(
        Transaction.status.in_([TransactionStatusEnum.PENDING, TransactionStatusEnum.IN_PROGRESS])
    ).count()
    
    completed_transactions = db.query(Transaction).filter(
        Transaction.status == TransactionStatusEnum.COMPLETED
    ).count()
    
    return {
        "total_active_listings": total_listings,
        "sold_properties": sold_properties,
        "active_transactions": active_transactions,
        "completed_transactions": completed_transactions
    }

@router.post("/listings/{listing_id}/photos", response_model=PhotoUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_land_photo(
    listing_id: int,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    is_primary: bool = Form(False),
    db: Session = Depends(get_mysql_db)
):
    """Upload a photo for a land listing"""
    # Verify listing exists
    listing = db.query(LandListing).filter(LandListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size too large. Maximum 5MB allowed.")
    
    # Convert to base64
    photo_data = base64.b64encode(contents).decode('utf-8')
    
    # If this is set as primary, remove primary flag from other photos
    if is_primary:
        db.query(LandPhoto).filter(
            LandPhoto.land_listing_id == listing_id
        ).update({"is_primary": False})
    
    # Create photo record
    db_photo = LandPhoto(
        land_listing_id=listing_id,
        photo_data=photo_data,
        photo_type=file.content_type,
        caption=caption,
        is_primary=is_primary
    )
    
    db.add(db_photo)
    db.commit()
    db.refresh(db_photo)
    
    return PhotoUploadResponse(
        id=db_photo.id,
        message="Photo uploaded successfully",
        photo_type=db_photo.photo_type,
        is_primary=db_photo.is_primary
    )

@router.get("/listings/{listing_id}/photos", response_model=List[PhotoSchema])
async def get_listing_photos(
    listing_id: int,
    db: Session = Depends(get_mysql_db)
):
    """Get all photos for a specific listing"""
    listing = db.query(LandListing).filter(LandListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    photos = db.query(LandPhoto).filter(
        LandPhoto.land_listing_id == listing_id
    ).order_by(LandPhoto.is_primary.desc(), LandPhoto.uploaded_at).all()
    
    return photos

@router.delete("/listings/{listing_id}/photos/{photo_id}")
async def delete_land_photo(
    listing_id: int,
    photo_id: int,
    db: Session = Depends(get_mysql_db)
):
    """Delete a photo from a land listing"""
    photo = db.query(LandPhoto).filter(
        LandPhoto.id == photo_id,
        LandPhoto.land_listing_id == listing_id
    ).first()
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    db.delete(photo)
    db.commit()
    
    return {"message": "Photo deleted successfully"}

@router.patch("/listings/{listing_id}/photos/{photo_id}/primary")
async def set_primary_photo(
    listing_id: int,
    photo_id: int,
    db: Session = Depends(get_mysql_db)
):
    """Set a photo as the primary photo for a listing"""
    photo = db.query(LandPhoto).filter(
        LandPhoto.id == photo_id,
        LandPhoto.land_listing_id == listing_id
    ).first()
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    # Remove primary flag from all photos
    db.query(LandPhoto).filter(
        LandPhoto.land_listing_id == listing_id
    ).update({"is_primary": False})
    
    # Set this photo as primary
    photo.is_primary = True
    
    db.commit()
    
    return {"message": "Primary photo updated successfully"}


# OCR Document Extraction Endpoint
class DocumentExtractionResponse(BaseModel):
    success: bool
    extracted_fields: dict
    raw_text: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None


@router.post("/extract-document", response_model=DocumentExtractionResponse)
async def extract_document_data(
    file: UploadFile = File(..., description="Land document in PDF, JPG, JPEG, or PNG format")
):
    """
    Extract land information from uploaded document using OCR
    Supports both Nepali and English documents
    """
    try:
        from app.services.ocr import ocr_service
        
        # Validate file size (max 10MB)
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        file_bytes = await file.read()
        
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds 10MB limit"
            )
        
        # Validate file type
        allowed_types = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed types: PDF, JPG, JPEG, PNG"
            )
        
        # Process document with OCR
        result = await ocr_service.process_document(file_bytes, file.filename)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document processing failed: {str(e)}"
        )
