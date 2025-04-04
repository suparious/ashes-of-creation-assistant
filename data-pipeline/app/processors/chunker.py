import re
import logging
import nltk
from typing import List, Dict, Any, Tuple, Optional, Callable
from nltk.tokenize import sent_tokenize, word_tokenize
import hashlib
import json

logger = logging.getLogger("chunker")

# Download necessary NLTK data if not already present
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

class SmartChunker:
    """
    Advanced text chunking for more efficient vector indexing.
    Uses semantic boundaries and intelligent overlap for better context retrieval.
    """
    
    def __init__(self, 
                target_chunk_size: int = 512, 
                min_chunk_size: int = 128,
                max_chunk_size: int = 1024,
                overlap_size: int = 50,
                smart_overlap: bool = True):
        """
        Initialize the chunker with customizable parameters.
        
        Args:
            target_chunk_size: Target size of each chunk in tokens
            min_chunk_size: Minimum acceptable chunk size
            max_chunk_size: Maximum acceptable chunk size
            overlap_size: Size of overlap between chunks
            smart_overlap: Whether to use semantic boundaries for overlap
        """
        self.target_chunk_size = target_chunk_size
        self.min_chunk_size = min_chunk_size
        self.max_chunk_size = max_chunk_size
        self.overlap_size = overlap_size
        self.smart_overlap = smart_overlap
        
        # Semantic boundary markers (in order of preference)
        self.boundary_markers = [
            # Strong boundaries
            r'\n\s*\n+',                # Multiple newlines
            r'(?<=[.!?])\s+(?=[A-Z])',  # End of sentence followed by capital
            r'(?<=:)\s+(?=[A-Z])',      # Colon followed by capital
            
            # Medium boundaries
            r'(?<=[.!?])\s+',           # End of sentence
            r'(?<=;)\s+',               # Semicolon
            r'\n+',                     # Single newline
            
            # Weak boundaries
            r'(?<=,)\s+',               # Comma
            r'(?<=:)\s+',               # Colon
            r'\s-\s',                   # Dash with spaces
            r'\s\s+',                   # Multiple spaces
        ]
    
    def chunk_text(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Split text into optimal chunks with context-aware boundaries.
        
        Args:
            text: The text to chunk
            metadata: Additional metadata to add to each chunk
            
        Returns:
            List of chunks with metadata
        """
        if not text or not text.strip():
            return []
        
        # Prepare text (normalize whitespace)
        text = self._preprocess_text(text)
        
        # Find all potential split points
        split_points = self._find_split_points(text)
        
        # Create chunks based on split points
        chunks = self._create_chunks(text, split_points)
        
        # Add metadata and IDs
        processed_chunks = []
        for i, chunk_text in enumerate(chunks):
            chunk_dict = {
                "text": chunk_text,
                "chunk_id": self._generate_chunk_id(chunk_text, i),
                "chunk_index": i,
                "total_chunks": len(chunks)
            }
            
            # Add metadata if provided
            if metadata:
                for k, v in metadata.items():
                    chunk_dict[k] = v
            
            processed_chunks.append(chunk_dict)
        
        return processed_chunks
    
    def chunk_document(self, document: Dict[str, Any], 
                      text_fields: List[str], 
                      metadata_fields: List[str] = []) -> List[Dict[str, Any]]:
        """
        Chunk a document by extracting and chunking text from specified fields.
        
        Args:
            document: The document to chunk
            text_fields: Fields containing text to chunk
            metadata_fields: Fields to include as metadata
            
        Returns:
            List of chunks with metadata
        """
        all_chunks = []
        
        # Extract metadata
        metadata = {}
        for field in metadata_fields:
            if field in document:
                metadata[field] = document[field]
        
        # Process each text field
        for field in text_fields:
            if field in document and document[field]:
                # Add field name to metadata
                field_metadata = {**metadata, "source_field": field}
                
                # Chunk the text
                field_chunks = self.chunk_text(document[field], field_metadata)
                
                # Add to result
                all_chunks.extend(field_chunks)
        
        return all_chunks
    
    def chunk_collection(self, 
                        documents: List[Dict[str, Any]], 
                        text_fields: List[str],
                        metadata_fields: List[str] = [],
                        progress_callback: Optional[Callable[[int, int], None]] = None) -> List[Dict[str, Any]]:
        """
        Process a collection of documents into chunks.
        
        Args:
            documents: List of documents to chunk
            text_fields: Fields containing text to chunk
            metadata_fields: Fields to include as metadata
            progress_callback: Function to call with progress updates
            
        Returns:
            List of all chunks with metadata
        """
        all_chunks = []
        total_docs = len(documents)
        
        for i, doc in enumerate(documents):
            # Chunk document
            doc_chunks = self.chunk_document(doc, text_fields, metadata_fields)
            all_chunks.extend(doc_chunks)
            
            # Report progress
            if progress_callback and i % 10 == 0:
                progress_callback(i, total_docs)
        
        # Final progress update
        if progress_callback:
            progress_callback(total_docs, total_docs)
        
        return all_chunks
    
    def _preprocess_text(self, text: str) -> str:
        """
        Normalize text for consistent chunking.
        """
        # Replace multiple whitespace with single space
        text = re.sub(r'\s+', ' ', text)
        
        # Normalize newlines
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        
        return text.strip()
    
    def _find_split_points(self, text: str) -> List[int]:
        """
        Find all potential split points in the text based on semantic boundaries.
        """
        split_points = set([0, len(text)])  # Start and end points
        
        # Add split points for each boundary marker
        for pattern in self.boundary_markers:
            for match in re.finditer(pattern, text):
                split_points.add(match.start())
        
        # Sort split points
        return sorted(list(split_points))
    
    def _create_chunks(self, text: str, split_points: List[int]) -> List[str]:
        """
        Create optimal chunks based on split points.
        """
        chunks = []
        current_start = 0
        
        while current_start < len(text):
            # Find the best end point
            best_end = self._find_best_end_point(text, current_start, split_points)
            
            # Create chunk
            chunk = text[current_start:best_end].strip()
            if chunk:  # Skip empty chunks
                chunks.append(chunk)
            
            # Calculate next start with overlap
            if self.smart_overlap:
                # Find a good boundary for the overlap
                overlap_start = max(current_start, best_end - self.overlap_size)
                next_start = self._find_good_boundary(text, overlap_start, best_end, forward=True)
            else:
                # Simple overlap
                next_start = max(current_start + 1, best_end - self.overlap_size)
            
            current_start = next_start
        
        return chunks
    
    def _find_best_end_point(self, text: str, start: int, split_points: List[int]) -> int:
        """
        Find the best end point for a chunk starting at 'start'.
        """
        # Filter potential end points
        valid_end_points = [p for p in split_points if p > start]
        
        if not valid_end_points:
            return len(text)
        
        # Count tokens for each candidate end point
        candidates = []
        for end in valid_end_points:
            chunk = text[start:end]
            token_count = self._count_tokens(chunk)
            
            if token_count >= self.min_chunk_size:
                # Calculate how close to target size
                size_score = 1.0 - abs(token_count - self.target_chunk_size) / self.target_chunk_size
                
                # Determine boundary quality
                boundary_score = self._calculate_boundary_score(text, end)
                
                # Combined score
                score = size_score * 0.7 + boundary_score * 0.3
                
                candidates.append((end, token_count, score))
                
                # If we've reached max size, stop looking
                if token_count >= self.max_chunk_size:
                    break
        
        if not candidates:
            # If no candidates found, use the next split point or the end
            next_point = next((p for p in valid_end_points), len(text))
            return min(next_point, start + self.max_chunk_size)
        
        # Sort by score and return the best end point
        candidates.sort(key=lambda x: x[2], reverse=True)
        return candidates[0][0]
    
    def _calculate_boundary_score(self, text: str, position: int) -> float:
        """
        Calculate how good a boundary position is based on semantic markers.
        """
        if position <= 0 or position >= len(text):
            return 1.0  # Document boundaries are perfect
        
        # Check each boundary marker
        for i, pattern in enumerate(self.boundary_markers):
            # Convert position to slice for the surrounding text
            context_start = max(0, position - 10)
            context_end = min(len(text), position + 10)
            context = text[context_start:context_end]
            
            # See if the pattern occurs at our position within the context
            for match in re.finditer(pattern, context):
                match_pos = context_start + match.start()
                if abs(match_pos - position) < 3:  # Allow small offset
                    # Score based on the strength of the boundary
                    # (earlier patterns in the list are stronger)
                    return 1.0 - (i / len(self.boundary_markers))
        
        return 0.1  # No good boundary found
    
    def _find_good_boundary(self, text: str, start: int, end: int, forward: bool = True) -> int:
        """
        Find a good semantic boundary within a range.
        """
        # Extract the relevant text section
        section = text[start:end]
        
        # For each boundary type
        for pattern in self.boundary_markers:
            matches = list(re.finditer(pattern, section))
            
            if matches:
                if forward:
                    # Get the first match
                    match_pos = start + matches[0].start()
                    return match_pos
                else:
                    # Get the last match
                    match_pos = start + matches[-1].start()
                    return match_pos
        
        # If no good boundary found
        return start if forward else end
    
    def _count_tokens(self, text: str) -> int:
        """
        Count the number of tokens in a text.
        """
        # Simple word-based tokenization - can be replaced with more sophisticated methods
        return len(word_tokenize(text))
    
    def _generate_chunk_id(self, text: str, index: int) -> str:
        """
        Generate a unique ID for a chunk.
        """
        # Create a hash of the text content
        text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
        return f"chunk_{index}_{text_hash[:8]}"


class HierarchicalChunker(SmartChunker):
    """
    Extension of SmartChunker that creates a hierarchical structure of chunks.
    This improves context retrieval by allowing both fine-grained and higher-level chunks.
    """
    
    def __init__(self, **kwargs):
        """
        Initialize the hierarchical chunker.
        """
        super().__init__(**kwargs)
        
        # Additional parameters for hierarchical chunking
        self.levels = kwargs.get('levels', 3)
        self.level_size_multiplier = kwargs.get('level_size_multiplier', 2.5)
    
    def chunk_text(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Create hierarchical chunks from text.
        """
        all_chunks = []
        
        # Generate chunks at multiple levels
        for level in range(self.levels):
            # Adjust chunk size based on level
            level_target_size = int(self.target_chunk_size * (self.level_size_multiplier ** level))
            level_max_size = int(self.max_chunk_size * (self.level_size_multiplier ** level))
            
            # Store original values
            original_target = self.target_chunk_size
            original_max = self.max_chunk_size
            
            # Set new values for this level
            self.target_chunk_size = level_target_size
            self.max_chunk_size = level_max_size
            
            # Generate chunks for this level
            level_chunks = super().chunk_text(text, metadata)
            
            # Add level information
            for chunk in level_chunks:
                chunk['level'] = level
                chunk['is_hierarchical'] = True
                
                # For higher levels, mark as summary chunks
                if level > 0:
                    chunk['is_summary'] = True
            
            # Add to result
            all_chunks.extend(level_chunks)
            
            # Restore original values
            self.target_chunk_size = original_target
            self.max_chunk_size = original_max
        
        return all_chunks


class StructuredChunker:
    """
    Chunker for structured documents that preserves the original structure.
    Works with nested fields and arrays while maintaining relationships.
    """
    
    def __init__(self, text_chunker: SmartChunker):
        """
        Initialize with a text chunker for handling text fields.
        """
        self.text_chunker = text_chunker
    
    def chunk_structured_document(self, 
                                document: Dict[str, Any], 
                                text_fields: List[str],
                                nested_text_fields: List[str] = [],
                                array_fields: List[str] = []) -> List[Dict[str, Any]]:
        """
        Chunk a structured document while preserving relationships.
        
        Args:
            document: The document to chunk
            text_fields: Top-level text fields to chunk
            nested_text_fields: Paths to nested text fields (dot notation)
            array_fields: Fields containing arrays of objects to process
            
        Returns:
            List of chunks with structure metadata
        """
        all_chunks = []
        
        # Process top-level text fields
        for field in text_fields:
            if field in document and document[field]:
                # Create metadata
                metadata = {
                    "doc_id": document.get("id", "unknown"),
                    "doc_type": document.get("type", "unknown"),
                    "field_path": field
                }
                
                # Add other metadata fields
                for meta_field in ["name", "title", "created_at", "updated_at", "author"]:
                    if meta_field in document:
                        metadata[meta_field] = document[meta_field]
                
                # Chunk the text
                chunks = self.text_chunker.chunk_text(document[field], metadata)
                all_chunks.extend(chunks)
        
        # Process nested fields
        for nested_path in nested_text_fields:
            # Extract value using path
            value = self._get_nested_value(document, nested_path)
            
            if value and isinstance(value, str):
                # Create metadata with path
                metadata = {
                    "doc_id": document.get("id", "unknown"),
                    "doc_type": document.get("type", "unknown"),
                    "field_path": nested_path
                }
                
                # Chunk the text
                chunks = self.text_chunker.chunk_text(value, metadata)
                all_chunks.extend(chunks)
        
        # Process array fields
        for array_field in array_fields:
            # Get the array
            array_value = self._get_nested_value(document, array_field)
            
            if array_value and isinstance(array_value, list):
                # Process each item in the array
                for i, item in enumerate(array_value):
                    if isinstance(item, dict):
                        # Create item path
                        item_path = f"{array_field}[{i}]"
                        
                        # Handle both text field and object
                        if isinstance(item, str):
                            # Direct text value
                            metadata = {
                                "doc_id": document.get("id", "unknown"),
                                "doc_type": document.get("type", "unknown"),
                                "field_path": item_path,
                                "array_index": i
                            }
                            chunks = self.text_chunker.chunk_text(item, metadata)
                            all_chunks.extend(chunks)
                        else:
                            # Object with fields
                            for subfield in text_fields:
                                if subfield in item and item[subfield]:
                                    metadata = {
                                        "doc_id": document.get("id", "unknown"),
                                        "doc_type": document.get("type", "unknown"),
                                        "field_path": f"{item_path}.{subfield}",
                                        "array_index": i
                                    }
                                    
                                    # Add any ID from the item
                                    if "id" in item:
                                        metadata["item_id"] = item["id"]
                                    
                                    chunks = self.text_chunker.chunk_text(item[subfield], metadata)
                                    all_chunks.extend(chunks)
        
        return all_chunks
    
    def _get_nested_value(self, obj: Dict[str, Any], path: str) -> Any:
        """
        Get a value from a nested object using dot notation.
        """
        if not path:
            return None
        
        parts = path.split('.')
        current = obj
        
        for part in parts:
            # Handle array indexing like "items[0]"
            if '[' in part and part.endswith(']'):
                field_name = part.split('[')[0]
                index_str = part.split('[')[1].rstrip(']')
                
                if field_name in current and isinstance(current[field_name], list):
                    try:
                        index = int(index_str)
                        if 0 <= index < len(current[field_name]):
                            current = current[field_name][index]
                        else:
                            return None
                    except ValueError:
                        return None
                else:
                    return None
            else:
                # Regular field access
                if isinstance(current, dict) and part in current:
                    current = current[part]
                else:
                    return None
        
        return current
