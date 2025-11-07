"""
Initialize MySQL Database for Land Marketplace
Run this script to create the database and tables
"""
import pymysql
from sqlalchemy import create_engine
from app.db.mysql_session import MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
from app.db.mysql_models import MySQLBase
from app.db.mysql_session import mysql_engine

def create_database():
    """Create the database if it doesn't exist"""
    try:
        # Connect to MySQL without specifying database
        connection = pymysql.connect(
            host=MYSQL_HOST,
            port=int(MYSQL_PORT),
            user=MYSQL_USER,
            password=MYSQL_PASSWORD
        )
        
        cursor = connection.cursor()
        
        # Create database
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print(f"✅ Database '{MYSQL_DATABASE}' created successfully!")
        
        cursor.close()
        connection.close()
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        raise

def create_tables():
    """Create all tables"""
    try:
        MySQLBase.metadata.create_all(bind=mysql_engine)
        print("✅ All tables created successfully!")
        print("\nTables created:")
        print("  - land_listings")
        print("  - transactions")
        print("  - price_negotiations")
        print("  - saved_searches")
        print("  - favorites")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise

def insert_sample_data():
    """Insert sample land listings"""
    from sqlalchemy.orm import Session
    from app.db.mysql_models import LandListing, ListingStatusEnum
    from datetime import datetime
    
    session = Session(bind=mysql_engine)
    
    try:
        # Check if data already exists
        existing = session.query(LandListing).first()
        if existing:
            print("⚠️  Sample data already exists, skipping...")
            return
        
        sample_listings = [
            LandListing(
                title="Residential Land in Kathmandu",
                description="Prime residential land located in the heart of Kathmandu. Perfect for building your dream home.",
                province="Bagmati Pradesh",
                district="Kathmandu",
                municipality="Kathmandu Metropolitan",
                ward=5,
                area=5.0,
                area_unit="aana",
                price_per_unit=3300000.0,
                base_price=16500000.0,
                ml_suggested_price=16500000.0,
                current_price=16500000.0,
                kitta_number="123",
                plot_number="456",
                road_width=15.0,
                road_access=True,
                water_supply=True,
                electricity=True,
                residential_zone=True,
                commercial_zone=False,
                agricultural_zone=False,
                owner_name="Ram Sharma",
                owner_phone="9841234567",
                owner_email="ram.sharma@example.com",
                land_ownership_certificate=True,
                tax_clearance_certificate=True,
                character_certificate=True,
                cadastral_map=True,
                no_objection_certificate=True,
                status=ListingStatusEnum.ACTIVE
            ),
            LandListing(
                title="Commercial Land in Pokhara",
                description="Excellent commercial property in Pokhara's bustling business district. Ideal for hotels, restaurants, or offices.",
                province="Gandaki Pradesh",
                district="Kaski",
                municipality="Pokhara Metropolitan",
                ward=10,
                area=10.0,
                area_unit="aana",
                price_per_unit=2700000.0,
                base_price=27000000.0,
                ml_suggested_price=27000000.0,
                current_price=27000000.0,
                kitta_number="789",
                plot_number="012",
                road_width=20.0,
                road_access=True,
                water_supply=True,
                electricity=True,
                residential_zone=False,
                commercial_zone=True,
                agricultural_zone=False,
                owner_name="Sita Gurung",
                owner_phone="9856789012",
                owner_email="sita.gurung@example.com",
                land_ownership_certificate=True,
                tax_clearance_certificate=True,
                character_certificate=True,
                cadastral_map=True,
                no_objection_certificate=False,
                status=ListingStatusEnum.ACTIVE
            ),
            LandListing(
                title="Agricultural Land in Chitwan",
                description="Fertile agricultural land with irrigation facilities. Perfect for farming or future development.",
                province="Bagmati Pradesh",
                district="Chitwan",
                municipality="Bharatpur Metropolitan",
                ward=15,
                area=1.0,
                area_unit="bigha",
                price_per_unit=8500000.0,
                base_price=8500000.0,
                ml_suggested_price=8500000.0,
                current_price=8500000.0,
                kitta_number="345",
                plot_number="678",
                road_width=10.0,
                road_access=True,
                water_supply=True,
                electricity=True,
                residential_zone=False,
                commercial_zone=False,
                agricultural_zone=True,
                owner_name="Hari Thapa",
                owner_phone="9812345678",
                owner_email="hari.thapa@example.com",
                land_ownership_certificate=True,
                tax_clearance_certificate=True,
                character_certificate=False,
                cadastral_map=True,
                no_objection_certificate=True,
                status=ListingStatusEnum.ACTIVE
            )
        ]
        
        session.add_all(sample_listings)
        session.commit()
        print("✅ Sample data inserted successfully!")
        print(f"   Inserted {len(sample_listings)} sample listings")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error inserting sample data: {e}")
    finally:
        session.close()

def main():
    """Main initialization function"""
    print("=" * 60)
    print("🏡 Ropani AI - Land Marketplace Database Initialization")
    print("=" * 60)
    print()
    
    print("Step 1: Creating database...")
    create_database()
    print()
    
    print("Step 2: Creating tables...")
    create_tables()
    print()
    
    print("Step 3: Inserting sample data...")
    insert_sample_data()
    print()
    
    print("=" * 60)
    print("✅ Database initialization completed successfully!")
    print("=" * 60)
    print()
    print("Database Details:")
    print(f"  Host: {MYSQL_HOST}")
    print(f"  Port: {MYSQL_PORT}")
    print(f"  Database: {MYSQL_DATABASE}")
    print(f"  User: {MYSQL_USER}")
    print()
    print("You can now start using the Land Marketplace API!")
    print()

if __name__ == "__main__":
    main()
