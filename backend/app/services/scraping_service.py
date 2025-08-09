import requests
from bs4 import BeautifulSoup
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def scrape_url(url: str) -> str:
    """
    Scrapes a single URL and returns the extracted text content.

    Args:
        url: The URL to scrape.

    Returns:
        The extracted text content, or an empty string if scraping fails.
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, timeout=15, headers=headers)
        response.raise_for_status()  # Raise an HTTPError for bad responses (4xx or 5xx)

        # Use html.parser for basic parsing
        soup = BeautifulSoup(response.content, 'html.parser')

        # Remove script, style, head, title, and meta tags
        for element in soup(["script", "style", "head", "title", "meta", "header", "footer", "nav", "aside"]):
            element.decompose()

        # Get text and clean it up
        text = soup.get_text(separator='\n', strip=True)

        logger.info(f"Successfully scraped URL: {url}")
        return text

    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching URL {url}: {e}")
        return ""
    except Exception as e:
        logger.error(f"An unexpected error occurred while scraping {url}: {e}")
        return ""
