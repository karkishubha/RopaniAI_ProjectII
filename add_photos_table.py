"""
Add land_photos table to existing database
Run this script to add photo support to the marketplace
"""
import pymysql
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "ropani_marketplace")

def add_photos_table():
    """Add land_photos table"""
    try:
        # Connect to MySQL
        connection = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE
        )
        
        cursor = connection.cursor()
        
        # Check if table already exists
        cursor.execute("""
            SELECT COUNT(*)
            FROM information_schema.tables 
            WHERE table_schema = %s 
            AND table_name = 'land_photos'
        """, (MYSQL_DATABASE,))
        
        if cursor.fetchone()[0] > 0:
            print("✅ Table 'land_photos' already exists!")
            cursor.close()
            connection.close()
            return
        
        # Create land_photos table
        cursor.execute("""
            CREATE TABLE land_photos (
                id INTEGER NOT NULL AUTO_INCREMENT,
                land_listing_id INTEGER NOT NULL,
                photo_data TEXT NOT NULL,
                photo_type VARCHAR(20) NOT NULL,
                caption VARCHAR(255),
                is_primary BOOLEAN DEFAULT FALSE,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                FOREIGN KEY(land_listing_id) REFERENCES land_listings (id) ON DELETE CASCADE,
                INDEX idx_land_photos_listing_id (land_listing_id),
                INDEX idx_land_photos_id (id)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        """)
        
        print("✅ Table 'land_photos' created successfully!")
        
        cursor.close()
        connection.commit()
        connection.close()
        
        print("\n" + "="*60)
        print("✅ Migration completed successfully!")
        print("="*60)
        print("\nYou can now upload photos to land listings!")
        
    except Exception as e:
        print(f"❌ Error adding photos table: {str(e)}")
        raise

if __name__ == "__main__":
    print("="*60)
    print("🏡 Adding Photo Support to Land Marketplace")
    print("="*60)
    print()
    add_photos_table()
