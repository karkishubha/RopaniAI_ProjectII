"""
OCR Service for extracting land document information
Supports both Nepali and English text extraction
"""
import pytesseract
from PIL import Image
import PyPDF2
import io
import re
from typing import Dict, Optional, List
import logging

logger = logging.getLogger(__name__)

# Configure Tesseract path (update if needed)
# For Windows: pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


class LandDocumentOCR:
    """OCR service for land documents in Nepali and English"""
    
    def __init__(self):
        self.supported_formats = ['pdf', 'jpg', 'jpeg', 'png']
        
    def extract_text_from_image(self, image: Image.Image) -> str:
        """
        Extract text from image using Tesseract OCR
        Supports both Nepali (nep) and English (eng)
        """
        try:
            # Use both Nepali and English language models
            text = pytesseract.image_to_string(
                image, 
                lang='nep+eng',
                config='--psm 6'  # Assume uniform block of text
            )
            return text.strip()
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            # Fallback to English only
            try:
                text = pytesseract.image_to_string(image, lang='eng')
                return text.strip()
            except:
                return ""
    
    def process_pdf(self, pdf_bytes: bytes) -> str:
        """Extract text from PDF file"""
        try:
            # Try extracting text directly from PDF
            pdf_file = io.BytesIO(pdf_bytes)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            if text.strip():
                return text.strip()
            
            # If no text extracted, PDF might be scanned image
            # Use pdf2image to convert and OCR
            try:
                from pdf2image import convert_from_bytes
                images = convert_from_bytes(pdf_bytes)
                ocr_text = ""
                for img in images:
                    ocr_text += self.extract_text_from_image(img) + "\n"
                return ocr_text.strip()
            except ImportError:
                logger.warning("pdf2image not available, install with: pip install pdf2image")
                return text.strip()
                
        except Exception as e:
            logger.error(f"PDF processing failed: {e}")
            return ""
    
    def process_image(self, image_bytes: bytes) -> str:
        """Extract text from image file"""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            return self.extract_text_from_image(image)
        except Exception as e:
            logger.error(f"Image processing failed: {e}")
            return ""
    
    def extract_field(self, text: str, patterns: List[str]) -> Optional[str]:
        """
        Extract field value using multiple regex patterns
        Returns first match found
        """
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                value = match.group(1).strip()
                # Clean up extracted value
                value = re.sub(r'\s+', ' ', value)
                return value
        return None
    
    def clean_extracted_name(self, name: str) -> str:
        """
        Clean extracted name by removing label text and standardizing format
        Takes only the text after colon if present, removes extra spaces
        """
        if not name:
            return name
        
        # If there's a colon (including Devanagari visarga), take everything after it
        if ':' in name or 'ः' in name:
            # Split on either Latin colon or Devanagari visarga
            if 'ः' in name:
                name = name.split('ः', 1)[1]
            elif ':' in name:
                name = name.split(':', 1)[1]
        
        # Remove common label text that might still be in the extracted value
        labels_to_remove = [
            r'को\s*नाम\s*थर\s*',  # को नाम थर
            r'को\s*नाम\s*',  # को नाम
            r'नाम\s*थर\s*',  # नाम थर
            r'^नाम\s+',  # नाम at start
            r'^थर\s+',  # थर at start
            r'^Name\s+',  # Name at start
            r'^Surname\s+',  # Surname at start
            r'^Full\s*Name\s+',  # Full Name at start
        ]
        
        cleaned = name
        for label in labels_to_remove:
            cleaned = re.sub(label, '', cleaned, flags=re.IGNORECASE)
        
        # Remove extra whitespace (multiple spaces, leading/trailing)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # Remove any remaining leading/trailing colons, visarga, hyphens, or special chars
        cleaned = cleaned.strip(':ः - ,.')
        
        return cleaned
    
    def extract_primary_owner(self, text: str) -> Optional[str]:
        """
        Extract the PRIMARY land owner's name, filtering out father/mother/spouse names
        Uses context clues and positioning to identify the actual owner
        """
        # Keywords that indicate the field is NOT the primary owner
        exclude_keywords = [
            'बाबु', 'बुवा', 'पिता', 'father', 'बुबा',  # Father
            'आमा', 'माता', 'mother', 'मातृ',  # Mother
            'पति', 'पत्नी', 'spouse', 'husband', 'wife', 'श्रीमती', 'श्रीमान',  # Spouse
            'छोरा', 'छोरी', 'son', 'daughter', 'पुत्र', 'पुत्री',  # Children
            'हजुरबुबा', 'grandfather', 'दादा', 'बाजे'  # Grandfather
        ]
        
        # Primary owner patterns - look for explicit land owner indicators
        primary_patterns = [
            # Land owner field (जग्गा धनी / जग्गाधनी)
            r'(?:जग्गा\s*धनी|जग्गाधनी)[:\s]*([A-Za-z\u0900-\u097F\s]+?)(?:\n|बाबु|पिता|जिल्ला|ठेगाना)',
            r'(?:Landowner|Land\s*Owner)[:\s]*([A-Za-z\u0900-\u097F\s]+?)(?:\n|Father|District|Address)',
            
            # Owner's name (मालिकको नाम)
            r'(?:मालिकको\s*नाम|मालिक)[:\s]*([A-Za-z\u0900-\u097F\s]+?)(?:\n|बाबु|पिता)',
            r'(?:Owner\'s?\s*Name)[:\s]*([A-Za-z\u0900-\u097F\s]+?)(?:\n|Father)',
            
            # Applicant/Person name if it appears before father's name
            r'(?:आवेदकको\s*नाम|व्यक्तिको\s*नाम)[:\s]*([A-Za-z\u0900-\u097F\s]+?)(?:\n|बाबु)',
            r'(?:Applicant\'s?\s*Name|Person\'s?\s*Name)[:\s]*([A-Za-z\u0900-\u097F\s]+?)(?:\n|Father)',
            
            # Name field that appears BEFORE father's name
            r'(?:नाम)[:\s]*([A-Za-z\u0900-\u097F\s]+?)(?:\n|बाबुको\s*नाम|पिताको\s*नाम|Father)',
            r'(?:Name)[:\s]*([A-Za-z\u0900-\u097F\s]+?)(?:\n|Father\'s?\s*Name)',
        ]
        
        for pattern in primary_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                owner_name = match.group(1).strip()
                owner_name = self.clean_extracted_name(owner_name)
                owner_name = re.sub(r'\s+', ' ', owner_name)
                
                # Double-check the extracted name doesn't contain exclude keywords
                if not any(keyword in owner_name.lower() for keyword in exclude_keywords):
                    if owner_name:  # Only return if not empty after cleaning
                        return owner_name
        
        # Fallback: Look for first name field that isn't preceded by exclude keywords
        name_patterns = [
            r'(?:नाम|Name)[:\s]*([A-Za-z\u0900-\u097F\s]+?)(?:\n|जिल्ला|District)'
        ]
        
        for pattern in name_patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE):
                # Get context before this match (50 chars)
                start_pos = max(0, match.start() - 50)
                context_before = text[start_pos:match.start()].lower()
                
                # Check if any exclude keyword appears right before this name
                if not any(keyword in context_before for keyword in exclude_keywords):
                    owner_name = match.group(1).strip()
                    owner_name = self.clean_extracted_name(owner_name)
                    owner_name = re.sub(r'\s+', ' ', owner_name)
                    if owner_name:
                        return owner_name
        
        return None
    
    def normalize_location_name(self, name: str) -> str:
        """
        Normalize location names by removing common suffixes and standardizing
        """
        if not name:
            return name
        
        # Remove common suffixes
        name = re.sub(r'\s*(जिल्ला|जिल्ला)$', '', name, flags=re.IGNORECASE)
        name = re.sub(r'\s*(नगरपालिका|गाउँपालिका|महानगरपालिका|उपमहानगरपालिका)$', '', name, flags=re.IGNORECASE)
        name = re.sub(r'\s*(Municipality|Rural Municipality|Metropolitan City|Sub-Metropolitan City)$', '', name, flags=re.IGNORECASE)
        
        # Normalize whitespace
        name = re.sub(r'\s+', ' ', name).strip()
        
        return name
    
    def parse_land_document(self, text: str) -> Dict[str, Optional[str]]:
        """
        Parse extracted text and map to land listing fields
        Supports both Nepali and English field names
        """
        fields = {}
        
        # Owner Name - use improved extraction
        fields['owner_name'] = self.extract_primary_owner(text)
        
        # Location/Address patterns
        location_patterns = [
            r'(?:Address|ठेगाना|Location|स्थान)[:\s]+([A-Za-z\u0900-\u097F\s,.-]+?)(?:\n|$)',
            r'(?:Place|स्थान)[:\s]+([A-Za-z\u0900-\u097F\s,.-]+?)(?:\n|$)',
            r'नगरपालिका[:\s]*([A-Za-z\u0900-\u097F\s]+?)(?:\n|वडा)',
        ]
        fields['location'] = self.extract_field(text, location_patterns)
        
        # District patterns
        district_patterns = [
            r'(?:District|जिल्ला)[:\s]+([A-Za-z\u0900-\u097F]+)',
            r'जिल्ला[:\s]*([A-Za-z\u0900-\u097F]+)',
        ]
        district = self.extract_field(text, district_patterns)
        if district:
            fields['district'] = self.normalize_location_name(district)
        
        # Municipality patterns
        municipality_patterns = [
            r'(?:Municipality|नगरपालिका|गाउँपालिका|महानगरपालिका)[:\s]+([A-Za-z\u0900-\u097F\s]+?)(?:\n|वडा|Ward)',
            r'(?:Nagarpalika|Gaunpalika)[:\s]+([A-Za-z\u0900-\u097F\s]+)',
            # Additional pattern for when municipality appears right after district
            r'जिल्ला[:\s]*[A-Za-z\u0900-\u097F]+[,\s]+([A-Za-z\u0900-\u097F\s]+?)(?:नगरपालिका|गाउँपालिका)',
        ]
        municipality = self.extract_field(text, municipality_patterns)
        if municipality:
            fields['municipality'] = self.normalize_location_name(municipality)
        
        # Ward Number patterns
        ward_patterns = [
            r'(?:Ward|वडा)[:\s]*(?:No\.?|नं\.?|नम्बर)?[:\s]*(\d+)',
            r'वडा\s*नं[:\s]*(\d+)',
        ]
        fields['ward_number'] = self.extract_field(text, ward_patterns)
        
        # Plot/Kitta Number patterns
        plot_patterns = [
            r'(?:Plot|Kitta|कित्ता)[:\s]*(?:No\.?|नं\.?|नम्बर)?[:\s]*(\d+)',
            r'कित्ता\s*नं[:\s]*(\d+)',
            r'Plot\s*#?[:\s]*(\d+)',
        ]
        fields['plot_number'] = self.extract_field(text, plot_patterns)
        
        # Area patterns (Ropani, Aana, Paisa, Dam or Sq. Ft.)
        area_patterns = [
            r'(?:Area|क्षेत्रफल)[:\s]*([\d\s-]+(?:Ropani|रोपनी|Aana|आना|Paisa|पैसा|Dam|दाम|Sq\.?\s*Ft\.?|वर्ग फिट)[\d\s-]*)',
            r'(\d+\s*[-–]\s*\d+\s*[-–]\s*\d+\s*[-–]\s*\d+)',  # Format: 0-2-1-3
            r'रोपनी[:\s]*([\d\s-]+)',
            r'(\d+\.?\d*\s*(?:Sq\.?\s*Ft\.?|वर्ग फिट))',
        ]
        fields['area'] = self.extract_field(text, area_patterns)
        
        # Ownership Type patterns
        ownership_patterns = [
            r'(?:Ownership|स्वामित्व)[:\s]+([A-Za-z\u0900-\u097F\s]+?)(?:\n|$)',
            r'(?:Type|प्रकार)[:\s]+([A-Za-z\u0900-\u097F\s]+?)(?:\n|$)',
        ]
        fields['ownership_type'] = self.extract_field(text, ownership_patterns)
        
        # Document Issue Date patterns
        date_patterns = [
            r'(?:Date|मिति|Issue Date)[:\s]*(\d{4}[-/]\d{1,2}[-/]\d{1,2})',
            r'(?:मिति)[:\s]*([\d\u0966-\u096F]{4}[-/][\d\u0966-\u096F]{1,2}[-/][\d\u0966-\u096F]{1,2})',
            r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})',
        ]
        fields['issue_date'] = self.extract_field(text, date_patterns)
        
        # Price patterns (optional, might be in document)
        price_patterns = [
            r'(?:Price|मूल्य)[:\s]*(?:Rs\.?|रु\.?)?[:\s]*([\d,]+)',
            r'रु[:\s]*([\d,]+)',
        ]
        fields['price'] = self.extract_field(text, price_patterns)
        
        return fields
    
    async def process_document(self, file_bytes: bytes, filename: str) -> Dict:
        """
        Main entry point for document processing
        Returns extracted fields and raw text
        """
        try:
            # Determine file type
            file_ext = filename.lower().split('.')[-1]
            
            if file_ext not in self.supported_formats:
                return {
                    'success': False,
                    'error': f'Unsupported file format. Please upload PDF, JPG, JPEG, or PNG files.',
                    'extracted_fields': {}
                }
            
            # Extract text based on file type
            if file_ext == 'pdf':
                raw_text = self.process_pdf(file_bytes)
            else:
                raw_text = self.process_image(file_bytes)
            
            if not raw_text:
                return {
                    'success': False,
                    'error': 'Could not extract text from document. Please ensure the document is clear and readable.',
                    'extracted_fields': {}
                }
            
            # Parse and extract fields
            extracted_fields = self.parse_land_document(raw_text)
            
            # Filter out None values
            extracted_fields = {k: v for k, v in extracted_fields.items() if v is not None}
            
            return {
                'success': True,
                'extracted_fields': extracted_fields,
                'raw_text': raw_text[:1000],  # Return first 1000 chars for preview
                'message': f'Successfully extracted {len(extracted_fields)} fields from your document.'
            }
            
        except Exception as e:
            logger.error(f"Document processing error: {e}")
            return {
                'success': False,
                'error': f'An error occurred while processing your document: {str(e)}',
                'extracted_fields': {}
            }


# Singleton instance
ocr_service = LandDocumentOCR()
