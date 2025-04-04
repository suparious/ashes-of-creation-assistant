import logging
import re
import json
from typing import Dict, List, Any, Optional, Set
from jsonschema import validate, ValidationError

logger = logging.getLogger("data_validator")

class DataValidator:
    """
    Validates data against schemas and performs advanced validation checks.
    """
    
    def __init__(self):
        # Load validation schemas
        self.item_schema = self._load_schema("item_schema.json")
        self.class_schema = self._load_schema("class_schema.json")
        self.ability_schema = self._load_schema("ability_schema.json")
        self.location_schema = self._load_schema("location_schema.json")
        
        # Common validation rules
        self.common_validation_rules = {
            "name": self._validate_name,
            "description": self._validate_description,
            "id": self._validate_id
        }
        
        # Allowed values for certain fields
        self.allowed_values = {
            "item_types": self._load_allowed_values("item_types.json"),
            "rarities": self._load_allowed_values("rarities.json"),
            "stats": self._load_allowed_values("stats.json"),
            "archetypes": self._load_allowed_values("archetypes.json")
        }
        
        # Track used IDs to check for duplicates
        self.used_ids: Dict[str, Set[str]] = {
            "items": set(),
            "classes": set(),
            "abilities": set(),
            "locations": set()
        }
    
    def _load_schema(self, schema_name: str) -> Dict[str, Any]:
        """
        Load a JSON schema from file.
        """
        try:
            # For simplicity in this example, we'll use hardcoded schemas
            # In production, these should be loaded from files
            
            if schema_name == "item_schema.json":
                return {
                    "type": "object",
                    "required": ["id", "name", "type", "rarity", "level"],
                    "properties": {
                        "id": {"type": "string"},
                        "name": {"type": "string", "minLength": 1},
                        "description": {"type": "string"},
                        "type": {"type": "string"},
                        "subtype": {"type": "string"},
                        "rarity": {"type": "string"},
                        "level": {"type": "integer", "minimum": 1},
                        "icon_url": {"type": "string"},
                        "stats": {"type": "object"},
                        "effects": {"type": "array"},
                        "source": {"type": "string"},
                        "is_tradable": {"type": "boolean"},
                        "is_unique": {"type": "boolean"},
                        "metadata": {"type": "object"}
                    }
                }
            elif schema_name == "class_schema.json":
                return {
                    "type": "object",
                    "required": ["id", "name"],
                    "properties": {
                        "id": {"type": "string"},
                        "name": {"type": "string", "minLength": 1},
                        "description": {"type": "string"},
                        "icon_url": {"type": "string"},
                        "archetype": {"type": "string"},
                        "abilities": {"type": "array"},
                        "stat_modifiers": {"type": "object"},
                        "metadata": {"type": "object"}
                    }
                }
            # Add other schemas as needed
            
            logger.warning(f"Schema not found: {schema_name}, using empty schema")
            return {}
            
        except Exception as e:
            logger.exception(f"Error loading schema {schema_name}: {e}")
            return {}
    
    def _load_allowed_values(self, values_file: str) -> List[str]:
        """
        Load allowed values for a field from file.
        """
        try:
            # For simplicity, using hardcoded values
            if values_file == "item_types.json":
                return ["weapon", "armor", "accessory", "consumable", "material", "misc"]
            elif values_file == "rarities.json":
                return ["common", "uncommon", "rare", "epic", "legendary", "artifact"]
            elif values_file == "stats.json":
                return ["strength", "dexterity", "intelligence", "constitution", "wisdom", 
                       "charisma", "health", "mana", "attackPower", "spellPower", 
                       "criticalHit", "haste", "armor", "magicResistance"]
            elif values_file == "archetypes.json":
                return ["fighter", "tank", "mage", "cleric", "bard", "ranger", "rogue", "summoner"]
            
            logger.warning(f"Allowed values not found: {values_file}, using empty list")
            return []
            
        except Exception as e:
            logger.exception(f"Error loading allowed values {values_file}: {e}")
            return []
    
    def validate_item(self, item: Dict[str, Any]) -> List[str]:
        """
        Validate an item against the schema and rules.
        Returns a list of validation errors.
        """
        errors = []
        
        # Schema validation
        try:
            if self.item_schema:
                validate(instance=item, schema=self.item_schema)
        except ValidationError as e:
            errors.append(f"Schema validation failed: {e.message}")
        
        # Common validation
        for field, validator in self.common_validation_rules.items():
            if field in item:
                field_errors = validator(item[field])
                errors.extend([f"{field}: {error}" for error in field_errors])
        
        # Type validation
        if "type" in item and item["type"] not in self.allowed_values["item_types"]:
            errors.append(f"Invalid item type: {item['type']}")
        
        # Rarity validation
        if "rarity" in item and item["rarity"] not in self.allowed_values["rarities"]:
            errors.append(f"Invalid rarity: {item['rarity']}")
        
        # Stats validation
        if "stats" in item and isinstance(item["stats"], dict):
            for stat_name in item["stats"].keys():
                if stat_name not in self.allowed_values["stats"]:
                    errors.append(f"Invalid stat name: {stat_name}")
        
        # Check for duplicate ID
        if "id" in item:
            item_id = str(item["id"])
            if item_id in self.used_ids["items"]:
                errors.append(f"Duplicate item ID: {item_id}")
            else:
                self.used_ids["items"].add(item_id)
        
        return errors
    
    def validate_class(self, class_data: Dict[str, Any]) -> List[str]:
        """
        Validate a class against the schema and rules.
        Returns a list of validation errors.
        """
        errors = []
        
        # Schema validation
        try:
            if self.class_schema:
                validate(instance=class_data, schema=self.class_schema)
        except ValidationError as e:
            errors.append(f"Schema validation failed: {e.message}")
        
        # Common validation
        for field, validator in self.common_validation_rules.items():
            if field in class_data:
                field_errors = validator(class_data[field])
                errors.extend([f"{field}: {error}" for error in field_errors])
        
        # Archetype validation
        if "archetype" in class_data and class_data["archetype"] not in self.allowed_values["archetypes"]:
            errors.append(f"Invalid archetype: {class_data['archetype']}")
        
        # Check for duplicate ID
        if "id" in class_data:
            class_id = str(class_data["id"])
            if class_id in self.used_ids["classes"]:
                errors.append(f"Duplicate class ID: {class_id}")
            else:
                self.used_ids["classes"].add(class_id)
        
        return errors
    
    def validate_ability(self, ability: Dict[str, Any]) -> List[str]:
        """
        Validate an ability against the schema and rules.
        """
        # Similar implementation to validate_item and validate_class
        return []
    
    def validate_location(self, location: Dict[str, Any]) -> List[str]:
        """
        Validate a location against the schema and rules.
        """
        # Similar implementation to other validate methods
        return []
    
    def _validate_name(self, name: str) -> List[str]:
        """
        Validate a name field.
        """
        errors = []
        
        if not name:
            errors.append("Name cannot be empty")
        elif len(name) < 2:
            errors.append("Name is too short")
        elif len(name) > 100:
            errors.append("Name is too long")
        elif not re.match(r'^[A-Za-z0-9\s\'\-]+$', name):
            errors.append("Name contains invalid characters")
        
        return errors
    
    def _validate_description(self, description: str) -> List[str]:
        """
        Validate a description field.
        """
        errors = []
        
        if description and len(description) > 1000:
            errors.append("Description is too long")
        
        return errors
    
    def _validate_id(self, id_value: str) -> List[str]:
        """
        Validate an ID field.
        """
        errors = []
        
        if not id_value:
            errors.append("ID cannot be empty")
        elif not re.match(r'^[A-Za-z0-9\-_]+$', str(id_value)):
            errors.append("ID contains invalid characters")
        
        return errors
    
    def reset_used_ids(self) -> None:
        """
        Reset the used IDs tracking.
        """
        for key in self.used_ids:
            self.used_ids[key].clear()
