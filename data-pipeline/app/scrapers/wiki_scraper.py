import os
import json
import asyncio
import aiohttp
from bs4 import BeautifulSoup
from loguru import logger
from typing import List, Dict, Any, Set
import re
from pathlib import Path
from playwright.async_api import async_playwright
from tqdm.asyncio import tqdm_asyncio
import time

# Constants
WIKI_BASE_URL = "https://ashesofcreation.wiki"
DATA_DIR = "/data/raw/wiki"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"

# Categories to scrape
CATEGORIES = {
    "gameplay": [
        "/Adventuring",
        "/Artisan",
        "/Augments",
        "/Caravans",
        "/Character",
        "/Classes",
        "/Combat",
        "/Crafting",
        "/Dungeons",
        "/Freehold",
        "/Gathering",
        "/Gear_progression",
        "/Guilds",
        "/Housing",
        "/Leveling",
        "/Mounts",
        "/Naval",
        "/Node_sieges",
        "/Nodes",
        "/Races",
        "/Raid_progression",
        "/Skills",
        "/Social",
        "/Weapon_progression",
    ],
    "world": [
        "/Alpha-1_starting_zone",
        "/Biomes",
        "/Dünir",
        "/Dünzenkell",
        "/Empyrean",
        "/Environment",
        "/Geography",
        "/Kaelar",
        "/Kevin_McPherson",
        "/Monsters",
        "/Mounts",
        "/NPCs",
        "/Pyrian",
        "/Resource_locations",
        "/Resources",
        "/Underrealm",
        "/Vaelune",
        "/Vek",
        "/Weather",
        "/World_map",
        "/Zones",
    ],
    "items": [
        "/Armor",
        "/Artisan_equipment",
        "/Crafting_materials",
        "/Currency",
        "/Furniture",
        "/Gathering_tools",
        "/Item_skins",
        "/Items",
        "/Loot_tables",
        "/Resources",
        "/Weapons",
    ],
    "systems": [
        "/Corruption",
        "/Corruption_system",
        "/Economy",
        "/Experience_points",
        "/Group_dynamics",
        "/Housing_benefits",
        "/Influence_points",
        "/Node_advancement",
        "/Node_benefits",
        "/Node_citizenship",
        "/Node_government",
        "/Node_sieges",
        "/Node_system",
        "/Node_taxation",
        "/Node_types",
        "/Progression",
        "/Risk_vs._reward",
        "/Servers",
        "/Social_organizations",
        "/Storage",
        "/Trading",
        "/Transportation",
    ]
}

async def save_json(data: Dict[str, Any], filename: str, category: str):
    """Save data to a JSON file."""
    # Create directory if it doesn't exist
    os.makedirs(f"{DATA_DIR}/{category}", exist_ok=True)
    
    # Save the file
    file_path = f"{DATA_DIR}/{category}/{filename}.json"
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    logger.debug(f"Saved {file_path}")

async def get_last_scrape_time(category: str) -> float:
    """Get the timestamp of the last scrape for a category."""
    timestamp_file = f"{DATA_DIR}/{category}/_last_scrape.txt"
    
    try:
        if os.path.exists(timestamp_file):
            with open(timestamp_file, 'r') as f:
                return float(f.read().strip())
    except Exception as e:
        logger.error(f"Error reading last scrape time: {e}")
    
    return 0  # Default to epoch start if no timestamp exists

async def update_last_scrape_time(category: str):
    """Update the timestamp of the last scrape for a category."""
    timestamp_file = f"{DATA_DIR}/{category}/_last_scrape.txt"
    
    # Create directory if it doesn't exist
    os.makedirs(f"{DATA_DIR}/{category}", exist_ok=True)
    
    # Update timestamp
    with open(timestamp_file, 'w') as f:
        f.write(str(time.time()))

async def scrape_wiki_page(url: str, browser=None) -> Dict[str, Any]:
    """Scrape content from a wiki page."""
    try:
        full_url = f"{WIKI_BASE_URL}{url}"
        page_obj = await browser.new_page()
        await page_obj.goto(full_url)
        await page_obj.wait_for_load_state("networkidle")
        
        # Get page content
        content = await page_obj.content()
        soup = BeautifulSoup(content, 'html.parser')
        
        # Extract page title
        title_element = soup.select_one("#firstHeading")
        title = title_element.text.strip() if title_element else url.split('/')[-1].replace('_', ' ')
        
        # Extract page content
        content_element = soup.select_one("#mw-content-text")
        if not content_element:
            # Close the page
            await page_obj.close()
            return None
        
        # Remove navigation, tables of contents, and citation elements
        for element in content_element.select('.navbox, #toc, .mw-editsection, .reference'):
            element.decompose()
        
        # Extract main content paragraphs
        paragraphs = []
        for p in content_element.select('p, h2, h3, h4, h5, h6, ul, ol'):
            # Skip empty paragraphs
            if p.text.strip():
                # Add headers with proper formatting
                if p.name and p.name.startswith('h'):
                    # Extract header text (remove span elements that might contain edit links)
                    header_text = p.text.strip()
                    level = int(p.name[1])
                    # Add appropriate markdown heading level
                    paragraphs.append('\n' + ('#' * level) + ' ' + header_text + '\n')
                # For lists, preserve the structure
                elif p.name in ['ul', 'ol']:
                    list_items = []
                    for li in p.select('li'):
                        if li.text.strip():
                            list_items.append('- ' + li.text.strip())
                    if list_items:
                        paragraphs.append('\n' + '\n'.join(list_items) + '\n')
                else:
                    paragraphs.append(p.text.strip())
        
        # Join paragraphs with proper spacing
        text_content = '\n\n'.join(paragraphs)
        
        # Extract images
        images = []
        for img in content_element.select('img.thumbimage'):
            src = img.get('src', '')
            if src and not src.startswith('data:'):
                # Make sure src is absolute
                if src.startswith('//'):
                    src = 'https:' + src
                alt = img.get('alt', '')
                images.append({
                    'src': src,
                    'alt': alt
                })
        
        # Extract infobox if present
        infobox = {}
        infobox_table = soup.select_one('.infobox')
        if infobox_table:
            for row in infobox_table.select('tr'):
                header = row.select_one('th')
                data = row.select_one('td')
                if header and data:
                    header_text = header.text.strip()
                    data_text = data.text.strip()
                    if header_text and data_text:
                        infobox[header_text] = data_text
        
        # Extract categories
        categories = []
        for category_link in soup.select('#mw-normal-catlinks ul li a'):
            category_name = category_link.text.strip()
            if category_name:
                categories.append(category_name)
        
        # Close the page
        await page_obj.close()
        
        # Create the document
        timestamp = time.time()
        doc_id = url.strip('/').replace('/', '_')
        
        document = {
            "id": doc_id,
            "url": url,
            "title": title,
            "content": text_content,
            "infobox": infobox,
            "categories": categories,
            "images": images,
            "timestamp": timestamp,
            "source_url": full_url
        }
        
        # Create a document structure for indexing
        indexable_document = {
            "id": doc_id,
            "text": f"""
                # {title}
                
                {text_content}
                
                Categories: {', '.join(categories)}
            """,
            "metadata": document,
            "source": full_url,
            "type": "wiki_page"
        }
        
        return indexable_document
        
    except Exception as e:
        logger.error(f"Error scraping wiki page {url}: {e}")
        return None

async def scrape_category_links(category_url: str, browser=None) -> List[str]:
    """Scrape links from a category page."""
    try:
        full_url = f"{WIKI_BASE_URL}{category_url}"
        page_obj = await browser.new_page()
        await page_obj.goto(full_url)
        await page_obj.wait_for_load_state("networkidle")
        
        # Get page content
        content = await page_obj.content()
        soup = BeautifulSoup(content, 'html.parser')
        
        # Extract links from the category page
        links = []
        for link in soup.select('#mw-pages .mw-category a'):
            href = link.get('href', '')
            if href and href.startswith('/'):
                links.append(href)
        
        # Close the page
        await page_obj.close()
        
        return links
        
    except Exception as e:
        logger.error(f"Error scraping category links from {category_url}: {e}")
        return []

async def get_all_wiki_links(browser=None) -> List[str]:
    """Get all wiki page links by exploring categories."""
    all_links = set()
    
    try:
        # Start with the category index
        category_pages = [
            "/Category:Gameplay",
            "/Category:World",
            "/Category:Items",
            "/Category:Systems"
        ]
        
        for category_page in category_pages:
            # Get links from the category page
            links = await scrape_category_links(category_page, browser)
            for link in links:
                all_links.add(link)
        
        # Add our predefined important pages
        for category, pages in CATEGORIES.items():
            for page in pages:
                all_links.add(page)
        
        logger.info(f"Found {len(all_links)} unique wiki pages to scrape")
        return list(all_links)
        
    except Exception as e:
        logger.error(f"Error getting wiki links: {e}")
        return list(all_links)  # Return what we have so far

async def process_category(category: str, urls: List[str], browser=None, force_full: bool = False):
    """Process a category of wiki pages."""
    try:
        # Create category directory
        os.makedirs(f"{DATA_DIR}/{category}", exist_ok=True)
        
        # Check last scrape time
        last_scrape = await get_last_scrape_time(category)
        current_time = time.time()
        
        # Skip if scraped recently and not forcing a full scrape
        if not force_full and current_time - last_scrape < 86400:  # 24 hours
            logger.info(f"Skipping {category} - scraped recently")
            return []
        
        documents = []
        
        # Process each URL
        for url in urls:
            document = await scrape_wiki_page(url, browser)
            if document:
                # Save individual document
                doc_id = url.strip('/').replace('/', '_')
                await save_json(document, doc_id, category)
                documents.append(document)
        
        # Save all documents for the category
        if documents:
            await save_json(documents, f"all_{category}", category)
        
        # Update last scrape time
        await update_last_scrape_time(category)
        
        logger.info(f"Scraped {len(documents)} documents from {category}")
        return documents
        
    except Exception as e:
        logger.error(f"Error processing category {category}: {e}")
        return []

async def scrape_ashes_wiki(force_full: bool = False):
    """Scrape data from Ashes of Creation Wiki."""
    logger.info("Starting Ashes of Creation Wiki scraper")
    
    try:
        # Create base directory
        os.makedirs(DATA_DIR, exist_ok=True)
        
        # Initialize playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            # Get all wiki links
            # For a more targeted approach, we'll use our predefined categories
            # all_links = await get_all_wiki_links(browser)
            
            all_documents = []
            
            # Process each category
            for category, urls in CATEGORIES.items():
                category_docs = await process_category(category, urls, browser, force_full)
                all_documents.extend(category_docs)
            
            # Close browser
            await browser.close()
            
            logger.info(f"Completed Ashes of Creation Wiki scraping - {len(all_documents)} documents total")
            return all_documents
            
    except Exception as e:
        logger.error(f"Error in Ashes of Creation Wiki scraper: {e}")
        return []

# For testing
if __name__ == "__main__":
    logger.info("Running wiki scraper standalone")
    asyncio.run(scrape_ashes_wiki(force_full=True))
