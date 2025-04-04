import os
import json
import uuid
from typing import List, Dict, Any, Optional
from loguru import logger
import re
from pathlib import Path
import asyncio
from glob import glob
import time
from datetime import datetime

from config import settings
from schemas import Document, DocumentMetadata

# Constants for chunking
MAX_CHUNK_SIZE = 1024  # Maximum chunk size in characters
MIN_CHUNK_SIZE = 50    # Minimum chunk size in characters
OVERLAP_SIZE = 100     # Overlap between chunks in characters

async def load_raw_documents(raw_data_dir: str) -> List[Dict[str, Any]]:
    """
    Load raw documents from the data directory.
    
    Args:
        raw_data_dir: Directory containing raw JSON documents
        
    Returns:
        List of document dictionaries
    """
    documents = []
    
    # Get all JSON files
    json_files = glob(f"{raw_data_dir}/**/*.json", recursive=True)
    
    for file_path in json_files:
        try:
            # Skip files that start with underscore (config files)
            if os.path.basename(file_path).startswith('_'):
                continue
                
            with open(file_path, 'r', encoding='utf-8') as f:
                file_data = json.load(f)
                
                # Handle both single documents and arrays of documents
                if isinstance(file_data, list):
                    documents.extend(file_data)
                else:
                    documents.append(file_data)
                    
        except Exception as e:
            logger.error(f"Error loading document {file_path}: {e}")
    
    logger.info(f"Loaded {len(documents)} raw documents")
    return documents

def get_document_source(document: Dict[str, Any]) -> str:
    """Extract the source from a document."""
    # Try different possible source fields
    if 'source' in document:
        return document['source']
    elif 'metadata' in document and 'source' in document['metadata']:
        return document['metadata']['source']
    elif 'url' in document:
        return document['url']
    else:
        return "unknown"
        
def get_document_type(document: Dict[str, Any]) -> str:
    """Extract the type from a document."""
    # Try different possible type fields
    if 'type' in document:
        return document['type']
    elif 'metadata' in document and 'type' in document['metadata']:
        return document['metadata']['type']
    elif 'content_type' in document:
        return document['content_type']
    else:
        return "general"
        
def get_document_server(document: Dict[str, Any]) -> Optional[str]:
    """Extract the server context from a document if applicable."""
    # Try different possible server fields
    if 'server' in document:
        return document['server']
    elif 'metadata' in document and 'server' in document['metadata']:
        return document['metadata']['server']
    else:
        return None

def extract_text_content(document: Dict[str, Any]) -> str:
    """Extract text content from a document."""
    # Try different possible content fields
    if 'text' in document:
        return document['text']
    elif 'content' in document:
        return document['content']
    elif 'description' in document:
        return document['description']
    elif 'body' in document:
        return document['body']
    else:
        # Try to construct text from available metadata
        text_parts = []
        
        if 'name' in document:
            text_parts.append(f"Name: {document['name']}")
            
        if 'title' in document:
            text_parts.append(f"Title: {document['title']}")
            
        if 'description' in document:
            text_parts.append(f"Description: {document['description']}")
            
        # Add other properties as available
        for key, value in document.items():
            if key not in ['name', 'title', 'description', 'id', 'metadata', 'type', 'source', 'server'] and isinstance(value, str):
                text_parts.append(f"{key.capitalize()}: {value}")
        
        return "\n\n".join(text_parts) if text_parts else "No text content available."

def chunk_text(text: str, metadata: Dict[str, Any], source: str, doc_type: str, server: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Split text into chunks with overlap.
    
    Args:
        text: Text to chunk
        metadata: Metadata for the document
        source: Source of the document
        doc_type: Type of the document
        server: Server-specific information (if applicable)
        
    Returns:
        List of chunk dictionaries
    """
    chunks = []
    
    # If text is too short for chunking, return as a single chunk
    if len(text) <= MAX_CHUNK_SIZE:
        return [{
            "id": str(uuid.uuid4()),
            "text": text,
            "metadata": {**metadata, "chunk_index": 0},
            "source": source,
            "type": doc_type,
            "server": server
        }]
    
    # Split by paragraphs first to preserve context
    paragraphs = re.split(r'\n\s*\n', text)
    
    current_chunk = []
    current_size = 0
    chunk_index = 0
    
    for para in paragraphs:
        para_size = len(para)
        
        # If a single paragraph is too large, split it by sentences
        if para_size > MAX_CHUNK_SIZE:
            sentences = re.split(r'(?<=[.!?])\s+', para)
            for sentence in sentences:
                sentence_size = len(sentence)
                
                # If this sentence would exceed max size, create a chunk and start a new one
                if current_size + sentence_size > MAX_CHUNK_SIZE and current_size > MIN_CHUNK_SIZE:
                    chunk_text = "\n\n".join(current_chunk)
                    chunks.append({
                        "id": str(uuid.uuid4()),
                        "text": chunk_text,
                        "metadata": {**metadata, "chunk_index": chunk_index},
                        "source": source,
                        "type": doc_type,
                        "server": server
                    })
                    
                    # Start a new chunk with overlap
                    overlap_text = current_chunk[-1] if current_chunk else ""
                    current_chunk = [overlap_text] if overlap_text else []
                    current_size = len(overlap_text) if overlap_text else 0
                    chunk_index += 1
                
                current_chunk.append(sentence)
                current_size += sentence_size
        else:
            # If adding this paragraph would exceed max size, create a chunk and start a new one
            if current_size + para_size > MAX_CHUNK_SIZE and current_size > MIN_CHUNK_SIZE:
                chunk_text = "\n\n".join(current_chunk)
                chunks.append({
                    "id": str(uuid.uuid4()),
                    "text": chunk_text,
                    "metadata": {**metadata, "chunk_index": chunk_index},
                    "source": source,
                    "type": doc_type,
                    "server": server
                })
                
                # Start a new chunk with overlap
                overlap_text = current_chunk[-1] if current_chunk else ""
                current_chunk = [overlap_text] if overlap_text else []
                current_size = len(overlap_text) if overlap_text else 0
                chunk_index += 1
            
            current_chunk.append(para)
            current_size += para_size
    
    # Add the final chunk if there's content left
    if current_chunk:
        chunk_text = "\n\n".join(current_chunk)
        chunks.append({
            "id": str(uuid.uuid4()),
            "text": chunk_text,
            "metadata": {**metadata, "chunk_index": chunk_index},
            "source": source,
            "type": doc_type,
            "server": server
        })
    
    return chunks

async def chunk_documents(raw_data_dir: str, processed_data_dir: str) -> List[Document]:
    """
    Process and chunk raw documents into smaller pieces for efficient indexing.
    
    Args:
        raw_data_dir: Directory containing raw documents
        processed_data_dir: Directory to store processed chunks
        
    Returns:
        List of processed Document objects ready for indexing
    """
    # Load raw documents
    raw_documents = await load_raw_documents(raw_data_dir)
    
    # Create processed directory if it doesn't exist
    os.makedirs(processed_data_dir, exist_ok=True)
    
    # Track all chunks and process each document
    all_chunks = []
    
    logger.info(f"Processing {len(raw_documents)} documents for chunking")
    
    for doc in raw_documents:
        # Extract document properties
        source = get_document_source(doc)
        doc_type = get_document_type(doc)
        server = get_document_server(doc)
        
        # Get text content from the document
        text = extract_text_content(doc)
        
        # Skip if no text content
        if not text:
            continue
            
        # Get appropriate metadata
        metadata = doc.get('metadata', {})
        if not isinstance(metadata, dict):
            metadata = {}
            
        # Add document ID to metadata if available
        if 'id' in doc:
            metadata['document_id'] = doc['id']
            
        # Add original properties to metadata
        for key, value in doc.items():
            if key not in ['text', 'content', 'metadata'] and isinstance(value, (str, int, float, bool)):
                metadata[key] = value
        
        # Chunk the document
        doc_chunks = chunk_text(text, metadata, source, doc_type, server)
        
        # Convert chunks to Document objects
        for chunk in doc_chunks:
            document = Document(
                id=chunk["id"],
                text=chunk["text"],
                metadata=DocumentMetadata(
                    id=chunk["id"],
                    type=chunk["type"],
                    source=chunk["source"],
                    server=chunk["server"],
                    timestamp=datetime.now().isoformat()
                )
            )
            all_chunks.append(document)
    
    # Group chunks by type for organization
    chunks_by_type = {}
    for chunk in all_chunks:
        chunk_type = chunk.metadata.type
        if chunk_type not in chunks_by_type:
            chunks_by_type[chunk_type] = []
        chunks_by_type[chunk_type].append(chunk)
    
    # Save each type to a separate file
    for chunk_type, chunks in chunks_by_type.items():
        output_path = os.path.join(processed_data_dir, f"{chunk_type}_chunks.json")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump([chunk.dict() for chunk in chunks], f, ensure_ascii=False, indent=2)
    
    logger.info(f"Processed {len(raw_documents)} documents into {len(all_chunks)} chunks")
    
    # Save a combined file with all chunks
    all_chunks_path = os.path.join(processed_data_dir, "all_chunks.json")
    with open(all_chunks_path, 'w', encoding='utf-8') as f:
        json.dump([chunk.dict() for chunk in all_chunks], f, ensure_ascii=False, indent=2)
    
    return all_chunks
