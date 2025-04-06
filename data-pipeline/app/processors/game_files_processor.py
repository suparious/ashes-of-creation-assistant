import os
import json
import asyncio
from loguru import logger
from typing import List, Dict, Any, Optional
import time
from pathlib import Path
import glob
import re
from datetime import datetime

# Constants
DATA_DIR = "/data/raw/game_files"

async def parse_item_data(file_path: str) -> List[Dict[str, Any]]:
    """Parse item data from game files."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        items = []
        
        # Process items based on the structure of the game files
        # The exact structure will depend on the actual game files format
        if isinstance(data, list):
            for item_data in data:
                # Extract item properties
                item_id = item_data.get('id', str(time.time_ns()))
                
                item = {
                    "id": item_id,
                    "name": item_data.get('name', 'Unknown Item'),
                    "quality": item_data.get('quality', 'Common'),
                    "type": item_data.get('type', 'Miscellaneous'),
                    "subtype": item_data.get('subtype'),
                    "description": item_data.get('description', ''),
                    "level": item_data.get('level'),
                    "stats": item_data.get('stats', []),
                    "metadata": item_data,
                    "source": f"game_files:{file_path}",
                    "type": "item"
                }
                
                # Create a text representation for indexing
                stats_text = ""
                if item.get('stats'):
                    stats_list = []
                    for stat in item['stats']:
                        if isinstance(stat, dict) and 'name' in stat and 'value' in stat:
                            stats_list.append(f"{stat['name']}: {stat['value']}")
                        elif isinstance(stat, str):
                            stats_list.append(stat)
                    stats_text = ", ".join(stats_list)
                
                text_content = f"""
                Name: {item['name']}
                Quality: {item['quality']}
                Type: {item['type']}
                {f"Subtype: {item['subtype']}" if item.get('subtype') else ""}
                {f"Level: {item['level']}" if item.get('level') is not None else ""}
                {f"Description: {item['description']}" if item.get('description') else ""}
                {f"Stats: {stats_text}" if stats_text else ""}
                """
                
                document = {
                    "id": item_id,
                    "text": text_content.strip(),
                    "metadata": item,
                    "source": f"game_files:{os.path.basename(file_path)}",
                    "type": "item"
                }
                
                items.append(document)
        
        return items
    
    except Exception as e:
        logger.error(f"Error parsing item data from {file_path}: {e}")
        return []

async def parse_zone_data(file_path: str) -> List[Dict[str, Any]]:
    """Parse zone/map data from game files."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        zones = []
        
        # Process zones based on the structure of the game files
        if isinstance(data, list):
            for zone_data in data:
                # Extract zone properties
                zone_id = zone_data.get('id', str(time.time_ns()))
                
                zone = {
                    "id": zone_id,
                    "name": zone_data.get('name', 'Unknown Zone'),
                    "type": zone_data.get('type', 'Region'),
                    "region": zone_data.get('region', 'Unknown'),
                    "level_range": zone_data.get('level_range'),
                    "description": zone_data.get('description', ''),
                    "points_of_interest": zone_data.get('points_of_interest', []),
                    "resources": zone_data.get('resources', []),
                    "nodes": zone_data.get('nodes', []),
                    "metadata": zone_data,
                    "source": f"game_files:{file_path}",
                    "type": "zone"
                }
                
                # Create a text representation for indexing
                poi_text = ", ".join(zone.get('points_of_interest', [])) if zone.get('points_of_interest') else ""
                resources_text = ", ".join(zone.get('resources', [])) if zone.get('resources') else ""
                
                text_content = f"""
                Name: {zone['name']}
                Type: {zone['type']}
                Region: {zone['region']}
                {f"Level Range: {zone['level_range']}" if zone.get('level_range') else ""}
                {f"Description: {zone['description']}" if zone.get('description') else ""}
                {f"Points of Interest: {poi_text}" if poi_text else ""}
                {f"Resources: {resources_text}" if resources_text else ""}
                """
                
                document = {
                    "id": zone_id,
                    "text": text_content.strip(),
                    "metadata": zone,
                    "source": f"game_files:{os.path.basename(file_path)}",
                    "type": "zone"
                }
                
                zones.append(document)
        
        return zones
    
    except Exception as e:
        logger.error(f"Error parsing zone data from {file_path}: {e}")
        return []

async def parse_skill_data(file_path: str) -> List[Dict[str, Any]]:
    """Parse skill data from game files."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        skills = []
        
        # Process skills based on the structure of the game files
        if isinstance(data, list):
            for skill_data in data:
                # Extract skill properties
                skill_id = skill_data.get('id', str(time.time_ns()))
                
                skill = {
                    "id": skill_id,
                    "name": skill_data.get('name', 'Unknown Skill'),
                    "description": skill_data.get('description', ''),
                    "level": skill_data.get('level', 1),
                    "category": skill_data.get('category', 'General'),
                    "class_name": skill_data.get('class_name'),
                    "cooldown": skill_data.get('cooldown'),
                    "cost": skill_data.get('cost'),
                    "effects": skill_data.get('effects', []),
                    "metadata": skill_data,
                    "source": f"game_files:{file_path}",
                    "type": "skill"
                }
                
                # Create a text representation for indexing
                effects_text = ""
                if skill.get('effects'):
                    effects_list = []
                    for effect in skill['effects']:
                        if isinstance(effect, dict) and 'description' in effect:
                            effects_list.append(effect['description'])
                        elif isinstance(effect, str):
                            effects_list.append(effect)
                    effects_text = ", ".join(effects_list)
                
                text_content = f"""
                Name: {skill['name']}
                Category: {skill['category']}
                Level: {skill['level']}
                {f"Class: {skill['class_name']}" if skill.get('class_name') else ""}
                {f"Cooldown: {skill['cooldown']}" if skill.get('cooldown') is not None else ""}
                {f"Cost: {skill['cost']}" if skill.get('cost') is not None else ""}
                {f"Description: {skill['description']}" if skill.get('description') else ""}
                {f"Effects: {effects_text}" if effects_text else ""}
                """
                
                document = {
                    "id": skill_id,
                    "text": text_content.strip(),
                    "metadata": skill,
                    "source": f"game_files:{os.path.basename(file_path)}",
                    "type": "skill"
                }
                
                skills.append(document)
        
        return skills
    
    except Exception as e:
        logger.error(f"Error parsing skill data from {file_path}: {e}")
        return []

async def parse_npc_data(file_path: str) -> List[Dict[str, Any]]:
    """Parse NPC data from game files."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        npcs = []
        
        # Process NPCs based on the structure of the game files
        if isinstance(data, list):
            for npc_data in data:
                # Extract NPC properties
                npc_id = npc_data.get('id', str(time.time_ns()))
                
                npc = {
                    "id": npc_id,
                    "name": npc_data.get('name', 'Unknown NPC'),
                    "type": npc_data.get('type', 'Generic'),
                    "level": npc_data.get('level'),
                    "faction": npc_data.get('faction'),
                    "location": npc_data.get('location'),
                    "description": npc_data.get('description', ''),
                    "drops": npc_data.get('drops', []),
                    "metadata": npc_data,
                    "source": f"game_files:{file_path}",
                    "type": "npc"
                }
                
                # Create a text representation for indexing
                drops_text = ""
                if npc.get('drops'):
                    drops_list = []
                    for drop in npc['drops']:
                        if isinstance(drop, dict) and 'name' in drop:
                            if 'chance' in drop:
                                drops_list.append(f"{drop['name']} ({drop['chance']}%)")
                            else:
                                drops_list.append(drop['name'])
                        elif isinstance(drop, str):
                            drops_list.append(drop)
                    drops_text = ", ".join(drops_list)
                
                text_content = f"""
                Name: {npc['name']}
                Type: {npc['type']}
                {f"Level: {npc['level']}" if npc.get('level') is not None else ""}
                {f"Faction: {npc['faction']}" if npc.get('faction') else ""}
                {f"Location: {npc['location']}" if npc.get('location') else ""}
                {f"Description: {npc['description']}" if npc.get('description') else ""}
                {f"Drops: {drops_text}" if drops_text else ""}
                """
                
                document = {
                    "id": npc_id,
                    "text": text_content.strip(),
                    "metadata": npc,
                    "source": f"game_files:{os.path.basename(file_path)}",
                    "type": "npc"
                }
                
                npcs.append(document)
        
        return npcs
    
    except Exception as e:
        logger.error(f"Error parsing NPC data from {file_path}: {e}")
        return []

async def save_json(data: List[Dict[str, Any]], filename: str, category: str):
    """Save data to a JSON file."""
    # Create directory if it doesn't exist
    os.makedirs(f"{DATA_DIR}/{category}", exist_ok=True)
    
    # Save the file
    file_path = f"{DATA_DIR}/{category}/{filename}.json"
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    logger.debug(f"Saved {file_path}")

async def process_game_files(game_files_path: str) -> List[Dict[str, Any]]:
    """
    Process game data files to extract structured information.
    
    Args:
        game_files_path: Path to the game files directory
        
    Returns:
        List of processed documents
    """
    logger.info(f"Processing game files from {game_files_path}")
    
    try:
        # Create base directory
        os.makedirs(DATA_DIR, exist_ok=True)
        
        all_documents = []
        
        # Process different types of game files
        if os.path.exists(game_files_path):
            # Find and process item data files
            item_files = glob.glob(f"{game_files_path}/items*.json")
            for file_path in item_files:
                logger.info(f"Processing item file: {file_path}")
                items = await parse_item_data(file_path)
                if items:
                    await save_json(items, f"items_{os.path.basename(file_path).split('.')[0]}", "items")
                    all_documents.extend(items)
            
            # Find and process zone data files
            zone_files = glob.glob(f"{game_files_path}/zones*.json") + glob.glob(f"{game_files_path}/map*.json")
            for file_path in zone_files:
                logger.info(f"Processing zone file: {file_path}")
                zones = await parse_zone_data(file_path)
                if zones:
                    await save_json(zones, f"zones_{os.path.basename(file_path).split('.')[0]}", "zones")
                    all_documents.extend(zones)
            
            # Find and process skill data files
            skill_files = glob.glob(f"{game_files_path}/skills*.json") + glob.glob(f"{game_files_path}/abilities*.json")
            for file_path in skill_files:
                logger.info(f"Processing skill file: {file_path}")
                skills = await parse_skill_data(file_path)
                if skills:
                    await save_json(skills, f"skills_{os.path.basename(file_path).split('.')[0]}", "skills")
                    all_documents.extend(skills)
            
            # Find and process NPC data files
            npc_files = glob.glob(f"{game_files_path}/npcs*.json") + glob.glob(f"{game_files_path}/monsters*.json")
            for file_path in npc_files:
                logger.info(f"Processing NPC file: {file_path}")
                npcs = await parse_npc_data(file_path)
                if npcs:
                    await save_json(npcs, f"npcs_{os.path.basename(file_path).split('.')[0]}", "npcs")
                    all_documents.extend(npcs)
            
            # Save all processed documents
            if all_documents:
                await save_json(all_documents, "all_game_data", "combined")
                
            logger.info(f"Processed {len(all_documents)} documents from game files")
            
        else:
            logger.warning(f"Game files path does not exist: {game_files_path}")
        
        return all_documents
        
    except Exception as e:
        logger.error(f"Error processing game files: {e}")
        return []
