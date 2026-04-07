import pdfplumber
import re

def extract_text_from_pdf(file_path: str) -> str:
    """Opens a PDF and extracts all raw text from every page."""
    full_text = ""
    
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:  # Some pages might be empty or image-only
                full_text += page_text + "\n"
    
    return full_text


def clean_text(text: str) -> str:
    """Removes noise from extracted text."""
    
    # Remove extra whitespace and blank lines
    text = re.sub(r'\n\s*\n', '\n\n', text)  # collapse multiple blank lines
    text = re.sub(r'[ \t]+', ' ', text)       # collapse multiple spaces/tabs
    text = text.strip()
    
    return text


def parse_resume(file_path: str) -> dict:
    """Main function: extracts + cleans text, returns structured result."""
    
    raw_text = extract_text_from_pdf(file_path)
    cleaned_text = clean_text(raw_text)
    
    return {
        "raw_text": cleaned_text,
        "word_count": len(cleaned_text.split()),
        "char_count": len(cleaned_text),
    }