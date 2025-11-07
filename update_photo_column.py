#!/usr/bin/env python3
"""
Migration script to update photo_data column from TEXT to LONGTEXT
to support larger images (up to 4GB instead of 64KB)
"""
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection settings
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': os.getenv('MYSQL_PASSWORD', 'root'),
    'database': 'ropani_marketplace'
}

def update_column():
    """Update photo_data column to LONGTEXT"""
    connection = None
    try:
        # Connect to MySQL
        print(f"Connecting to MySQL at {DB_CONFIG['host']}:{DB_CONFIG['port']}...")
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # Update column type
        print("\nUpdating photo_data column from TEXT to LONGTEXT...")
        alter_query = """
        ALTER TABLE land_photos 
        MODIFY COLUMN photo_data LONGTEXT NOT NULL
        """
        cursor.execute(alter_query)
        connection.commit()
        print("✓ Column updated successfully!")
        
        # Verify the change
        print("\nVerifying column type...")
        cursor.execute("""
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'ropani_marketplace' 
            AND TABLE_NAME = 'land_photos' 
            AND COLUMN_NAME = 'photo_data'
        """)
        result = cursor.fetchone()
        if result:
            col_name, data_type, max_length = result
            print(f"✓ Column: {col_name}, Type: {data_type}, Max Length: {max_length or 'unlimited'}")
        
        print("\n✅ Migration completed successfully!")
        print("LONGTEXT can store up to 4GB of data (much larger than TEXT's 64KB)")
        
    except pymysql.Error as e:
        print(f"\n❌ MySQL Error: {e}")
        if connection:
            connection.rollback()
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        if connection:
            cursor.close()
            connection.close()
            print("\nDatabase connection closed.")

if __name__ == "__main__":
    print("=" * 60)
    print("Photo Column Migration Script")
    print("=" * 60)
    update_column()
