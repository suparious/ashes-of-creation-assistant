import os
import json
import logging
import hashlib
import time
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple, Set
import asyncio
import aiohttp
import aiofiles
from PIL import Image
from io import BytesIO
import re

from ..config import settings
from ..schemas import ItemData, ClassData, AbilityData, LocationData
from ..processors.validator import DataValidator

logger = logging.getLogger("game_client_extractor")

class GameClientExtractor:
    """
    Extracts data directly from the game client files.
    Supports both local game installation and patch server downloads.
    """
    
    def __init__(self, game_path: Optional[str] = None):
        self.game_path = game_path or settings.GAME_CLIENT_PATH
        self.output_path = Path(settings.DATA_OUTPUT_PATH) / "game_client"
        self.temp_path = Path(settings.TEMP_DIR) / "game_client"
        self.validator = DataValidator()
        
        # Create directories if they don't exist
        self.output_path.mkdir(parents=True, exist_ok=True)
        self.temp_path.mkdir(parents=True, exist_ok=True)
        
        # Track processed files to avoid duplicates
        self.processed_files: Set[str] = set()
        
        # Cache for extracted data
        self.cache_path = self.temp_path / "cache"
        self.cache_path.mkdir(exist_ok=True)
        
    async def extract_all(self) -> Tuple[int, int, List[str]]:
        """
        Extract all data from the game client.
        Returns (success_count, error_count, error_list)
        """
        logger.info("Starting game client data extraction")
        
        if not self.game_path or not os.path.exists(self.game_path):
            logger.warning(f"Game client path not found: {self.game_path}")
            
            # If local path is not available, try to download from patch server
            download_success = await self.download_from_patch_server()
            if not download_success:
                return 0, 1, ["Failed to access game client files"]
        
        success_count = 0
        error_count = 0
        error_messages = []
        
        # Run all extraction functions
        extraction_tasks = [
            self.extract_items(),
            self.extract_classes(),
            self.extract_abilities(),
            self.extract_locations(),
            self.extract_resources(),
            self.extract_npcs(),
            self.extract_quests()
        ]
        
        # Execute all tasks and collect results
        try:
            results = await asyncio.gather(*extraction_tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, Exception):
                    logger.error(f"Extraction error: {str(result)}")
                    error_count += 1
                    error_messages.append(str(result))
                elif isinstance(result, tuple) and len(result) == 3:
                    success, errors, msgs = result
                    success_count += success
                    error_count += errors
                    error_messages.extend(msgs)
        except Exception as e:
            logger.exception("Failed to run extraction tasks")
            error_count += 1
            error_messages.append(f"Global extraction error: {str(e)}")
        
        logger.info(f"Game client extraction complete: {success_count} successes, {error_count} errors")
        
        # Clean up temp files
        if settings.CLEANUP_TEMP_FILES:
            await self.cleanup_temp_files()
            
        return success_count, error_count, error_messages
    
    async def download_from_patch_server(self) -> bool:
        """
        Download necessary files from the patch server.
        Returns True if successful, False otherwise.
        """
        logger.info("Downloading files from patch server")
        
        patch_server_url = settings.PATCH_SERVER_URL
        if not patch_server_url:
            logger.error("Patch server URL not configured")
            return False
        
        # List of essential files to download
        essential_files = [
            "Data/items.json",
            "Data/classes.json",
            "Data/abilities.json",
            "Data/locations.json",
            "Data/resources.json",
            "Data/npcs.json",
            "Data/quests.json"
        ]
        
        async with aiohttp.ClientSession() as session:
            for file_path in essential_files:
                target_url = f"{patch_server_url}/{file_path}"
                local_path = self.temp_path / file_path
                
                # Create directory structure
                local_path.parent.mkdir(parents=True, exist_ok=True)
                
                try:
                    async with session.get(target_url) as response:
                        if response.status == 200:
                            content = await response.read()
                            async with aiofiles.open(local_path, 'wb') as f:
                                await f.write(content)
                            logger.info(f"Downloaded {file_path}")
                        else:
                            logger.warning(f"Failed to download {file_path}: HTTP {response.status}")
                            # Try fallback URL if available
                            if hasattr(settings, 'FALLBACK_PATCH_SERVER_URL') and settings.FALLBACK_PATCH_SERVER_URL:
                                fallback_url = f"{settings.FALLBACK_PATCH_SERVER_URL}/{file_path}"
                                try:
                                    async with session.get(fallback_url) as fallback_response:
                                        if fallback_response.status == 200:
                                            content = await fallback_response.read()
                                            async with aiofiles.open(local_path, 'wb') as f:
                                                await f.write(content)
                                            logger.info(f"Downloaded {file_path} from fallback server")
                                        else:
                                            logger.error(f"Failed to download {file_path} from fallback: HTTP {fallback_response.status}")
                                            return False
                                except Exception as e:
                                    logger.exception(f"Error downloading from fallback: {str(e)}")
                                    return False
                except Exception as e:
                    logger.exception(f"Error downloading {file_path}: {str(e)}")
                    return False
        
        return True
    
    async def extract_items(self) -> Tuple[int, int, List[str]]:
        """
        Extract item data from the game client.
        Returns (success_count, error_count, error_list)
        """
        logger.info("Extracting item data")
        success_count = 0
        error_count = 0
        error_messages = []
        
        # Find the items data file
        items_file = self._find_data_file("items.json")
        if not items_file:
            error_message = "Items data file not found"
            logger.error(error_message)
            return success_count, 1, [error_message]
        
        try:
            # Read and parse items data
            async with aiofiles.open(items_file, 'r', encoding='utf-8') as f:
                content = await f.read()
                items_data = json.loads(content)
            
            # Process each item
            all_items = []
            for raw_item in items_data:
                try:
                    # Convert to our schema
                    item = self._convert_item_data(raw_item)
                    
                    # Validate
                    validation_errors = self.validator.validate_item(item)
                    if validation_errors:
                        error_count += 1
                        error_message = f"Item validation failed for {item.get('id', 'unknown')}: {validation_errors}"
                        error_messages.append(error_message)
                        logger.warning(error_message)
                        continue
                    
                    # Add to our collection
                    all_items.append(item)
                    success_count += 1
                    
                except Exception as e:
                    error_count += 1
                    error_message = f"Failed to process item {raw_item.get('id', 'unknown')}: {str(e)}"
                    error_messages.append(error_message)
                    logger.exception(error_message)
            
            # Save processed data
            output_file = self.output_path / "processed_items.json"
            async with aiofiles.open(output_file, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(all_items, indent=2))
            
            logger.info(f"Extracted {success_count} items with {error_count} errors")
            
            # Download images if needed
            if settings.DOWNLOAD_ITEM_IMAGES:
                await self._download_item_images(all_items)
                
        except Exception as e:
            error_count += 1
            error_message = f"Failed to extract items: {str(e)}"
            error_messages.append(error_message)
            logger.exception(error_message)
        
        return success_count, error_count, error_messages
    
    async def extract_classes(self) -> Tuple[int, int, List[str]]:
        """
        Extract class data from the game client.
        Returns (success_count, error_count, error_list)
        """
        logger.info("Extracting class data")
        success_count = 0
        error_count = 0
        error_messages = []
        
        # Find the classes data file
        classes_file = self._find_data_file("classes.json")
        if not classes_file:
            error_message = "Classes data file not found"
            logger.error(error_message)
            return success_count, 1, [error_message]
        
        try:
            # Read and parse classes data
            async with aiofiles.open(classes_file, 'r', encoding='utf-8') as f:
                content = await f.read()
                classes_data = json.loads(content)
            
            # Process each class
            all_classes = []
            for raw_class in classes_data:
                try:
                    # Convert to our schema
                    class_data = self._convert_class_data(raw_class)
                    
                    # Validate
                    validation_errors = self.validator.validate_class(class_data)
                    if validation_errors:
                        error_count += 1
                        error_message = f"Class validation failed for {class_data.get('id', 'unknown')}: {validation_errors}"
                        error_messages.append(error_message)
                        logger.warning(error_message)
                        continue
                    
                    # Add to our collection
                    all_classes.append(class_data)
                    success_count += 1
                    
                except Exception as e:
                    error_count += 1
                    error_message = f"Failed to process class {raw_class.get('id', 'unknown')}: {str(e)}"
                    error_messages.append(error_message)
                    logger.exception(error_message)
            
            # Save processed data
            output_file = self.output_path / "processed_classes.json"
            async with aiofiles.open(output_file, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(all_classes, indent=2))
            
            logger.info(f"Extracted {success_count} classes with {error_count} errors")
                
        except Exception as e:
            error_count += 1
            error_message = f"Failed to extract classes: {str(e)}"
            error_messages.append(error_message)
            logger.exception(error_message)
        
        return success_count, error_count, error_messages
    
    async def extract_abilities(self) -> Tuple[int, int, List[str]]:
        """
        Extract ability data from the game client.
        Returns (success_count, error_count, error_list)
        """
        logger.info("Extracting ability data")
        success_count = 0
        error_count = 0
        error_messages = []
        
        # Similar implementation to extract_items and extract_classes
        # but for abilities data
        
        return success_count, error_count, error_messages
    
    async def extract_locations(self) -> Tuple[int, int, List[str]]:
        """
        Extract location data from the game client.
        Returns (success_count, error_count, error_list)
        """
        logger.info("Extracting location data")
        success_count = 0
        error_count = 0
        error_messages = []
        
        # Similar implementation to other extraction methods
        
        return success_count, error_count, error_messages
    
    async def extract_resources(self) -> Tuple[int, int, List[str]]:
        """
        Extract resource data from the game client.
        Returns (success_count, error_count, error_list)
        """
        logger.info("Extracting resource data")
        success_count = 0
        error_count = 0
        error_messages = []
        
        # Implementation for resources
        
        return success_count, error_count, error_messages
    
    async def extract_npcs(self) -> Tuple[int, int, List[str]]:
        """
        Extract NPC data from the game client.
        Returns (success_count, error_count, error_list)
        """
        logger.info("Extracting NPC data")
        success_count = 0
        error_count = 0
        error_messages = []
        
        # Implementation for NPCs
        
        return success_count, error_count, error_messages
    
    async def extract_quests(self) -> Tuple[int, int, List[str]]:
        """
        Extract quest data from the game client.
        Returns (success_count, error_count, error_list)
        """
        logger.info("Extracting quest data")
        success_count = 0
        error_count = 0
        error_messages = []
        
        # Implementation for quests
        
        return success_count, error_count, error_messages
    
    async def _download_item_images(self, items: List[Dict[str, Any]]) -> None:
        """
        Download images for items.
        """
        logger.info(f"Downloading images for {len(items)} items")
        
        # Create images directory
        images_dir = self.output_path / "images" / "items"
        images_dir.mkdir(parents=True, exist_ok=True)
        
        async with aiohttp.ClientSession() as session:
            tasks = []
            for item in items:
                if "icon_url" in item and item["icon_url"]:
                    file_name = f"{item['id']}.png"
                    local_path = images_dir / file_name
                    
                    # Skip if already downloaded
                    if local_path.exists():
                        continue
                    
                    task = self._download_image(session, item["icon_url"], local_path)
                    tasks.append(task)
            
            if tasks:
                # Download in batches to avoid overwhelming the server
                batch_size = 10
                for i in range(0, len(tasks), batch_size):
                    batch = tasks[i:i+batch_size]
                    await asyncio.gather(*batch)
                    # Small delay between batches
                    await asyncio.sleep(1)
    
    async def _download_image(self, session: aiohttp.ClientSession, url: str, path: Path) -> None:
        """
        Download a single image.
        """
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.read()
                    
                    # Resize and optimize the image
                    if settings.OPTIMIZE_IMAGES:
                        try:
                            img = Image.open(BytesIO(data))
                            img = self._optimize_image(img)
                            img.save(path, optimize=True)
                        except Exception as e:
                            logger.warning(f"Failed to optimize image {url}: {str(e)}")
                            # Save original if optimization fails
                            async with aiofiles.open(path, 'wb') as f:
                                await f.write(data)
                    else:
                        # Save without optimization
                        async with aiofiles.open(path, 'wb') as f:
                            await f.write(data)
                    
                    logger.debug(f"Downloaded image: {url}")
                else:
                    logger.warning(f"Failed to download image {url}: HTTP {response.status}")
        except Exception as e:
            logger.warning(f"Error downloading image {url}: {str(e)}")
    
    def _optimize_image(self, img: Image.Image) -> Image.Image:
        """
        Resize and optimize an image.
        """
        # Resize if larger than max dimensions
        max_size = settings.MAX_IMAGE_SIZE
        if img.width > max_size or img.height > max_size:
            img.thumbnail((max_size, max_size))
        
        # Convert to RGB if RGBA (remove alpha channel)
        if img.mode == 'RGBA':
            # Create a white background
            background = Image.new('RGB', img.size, (255, 255, 255))
            # Paste the image on the background
            background.paste(img, mask=img.split()[3])
            img = background
        
        return img
    
    def _find_data_file(self, filename: str) -> Optional[Path]:
        """
        Find a data file in either the game path or the temp dir.
        """
        # Check temp dir first (downloaded files)
        temp_file = self.temp_path / "Data" / filename
        if temp_file.exists():
            return temp_file
        
        # Check game client path
        if self.game_path:
            game_file = Path(self.game_path) / "Data" / filename
            if game_file.exists():
                return game_file
            
            # Try alternative paths within the game directory
            alt_paths = [
                Path(self.game_path) / "data" / filename,
                Path(self.game_path) / "gamedata" / filename,
                Path(self.game_path) / "game_data" / filename,
                Path(self.game_path) / "Content" / "Data" / filename,
            ]
            
            for path in alt_paths:
                if path.exists():
                    return path
        
        return None
    
    def _convert_item_data(self, raw_item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert raw item data to our schema.
        """
        # Map fields from game format to our format
        item = {
            "id": str(raw_item.get("id")),
            "name": raw_item.get("name", ""),
            "description": raw_item.get("description", ""),
            "type": raw_item.get("itemType", ""),
            "subtype": raw_item.get("subType", ""),
            "rarity": raw_item.get("rarity", "common").lower(),
            "level": int(raw_item.get("level", 1)),
            "icon_url": raw_item.get("iconUrl", ""),
            "stats": {},
            "effects": [],
            "source": raw_item.get("source", ""),
            "is_tradable": raw_item.get("isTradable", True),
            "is_unique": raw_item.get("isUnique", False),
            "metadata": {}
        }
        
        # Process stats
        if "stats" in raw_item and isinstance(raw_item["stats"], dict):
            for stat_name, value in raw_item["stats"].items():
                normalized_stat_name = self._normalize_stat_name(stat_name)
                item["stats"][normalized_stat_name] = value
        
        # Process effects
        if "effects" in raw_item and isinstance(raw_item["effects"], list):
            for effect in raw_item["effects"]:
                if isinstance(effect, dict):
                    item["effects"].append({
                        "name": effect.get("name", ""),
                        "description": effect.get("description", "")
                    })
        
        # Extract additional metadata that might be useful
        for key in ["bindType", "stackLimit", "sellPrice", "weight", "requiredLevel"]:
            if key in raw_item:
                item["metadata"][key] = raw_item[key]
        
        return item
    
    def _convert_class_data(self, raw_class: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert raw class data to our schema.
        """
        # Map fields from game format to our format
        class_data = {
            "id": str(raw_class.get("id")),
            "name": raw_class.get("name", ""),
            "description": raw_class.get("description", ""),
            "icon_url": raw_class.get("iconUrl", ""),
            "archetype": raw_class.get("archetype", ""),
            "abilities": [],
            "stat_modifiers": {},
            "metadata": {}
        }
        
        # Process abilities
        if "abilities" in raw_class and isinstance(raw_class["abilities"], list):
            for ability in raw_class["abilities"]:
                if isinstance(ability, dict):
                    class_data["abilities"].append(str(ability.get("id", "")))
        
        # Process stat modifiers
        if "statModifiers" in raw_class and isinstance(raw_class["statModifiers"], dict):
            for stat_name, value in raw_class["statModifiers"].items():
                normalized_stat_name = self._normalize_stat_name(stat_name)
                class_data["stat_modifiers"][normalized_stat_name] = value
        
        return class_data
    
    def _normalize_stat_name(self, stat_name: str) -> str:
        """
        Normalize stat names to a consistent format.
        """
        # Convert to lowercase and remove spaces
        normalized = stat_name.lower().strip()
        
        # Map common variations to standard names
        stat_map = {
            "str": "strength",
            "dex": "dexterity",
            "int": "intelligence",
            "con": "constitution",
            "wis": "wisdom",
            "cha": "charisma",
            "hp": "health",
            "mp": "mana",
            "ap": "attackPower",
            "sp": "spellPower",
            # Add more mappings as needed
        }
        
        # Check direct matches
        if normalized in stat_map:
            return stat_map[normalized]
        
        # Check if the stat contains any of the keys
        for key, value in stat_map.items():
            if key in normalized:
                return value
        
        # Remove special characters and spaces
        normalized = re.sub(r'[^a-zA-Z]', '', normalized)
        
        return normalized
    
    async def cleanup_temp_files(self) -> None:
        """
        Clean up temporary files.
        """
        logger.info("Cleaning up temporary files")
        
        try:
            # Keep cache but remove other temp files
            for item in self.temp_path.glob("**/*"):
                if item.is_file() and not str(item).startswith(str(self.cache_path)):
                    item.unlink()
            
            logger.info("Temporary files cleaned up")
        except Exception as e:
            logger.exception(f"Error cleaning up temporary files: {str(e)}")
