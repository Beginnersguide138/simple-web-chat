import os
import re
import logging
from pymilvus import (
    connections,
    utility,
    FieldSchema,
    CollectionSchema,
    DataType,
    Collection,
)
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MILVUS_HOST = os.getenv("MILVUS_HOST", "localhost")
MILVUS_PORT = os.getenv("MILVUS_PORT", "19530")
COLLECTION_NAME = "web_content_partitioned"
EMBEDDING_DIM = 1024  # Dimension for mxbai-embed-large

class MilvusService:
    def __init__(self, host=MILVUS_HOST, port=MILVUS_PORT):
        self.host = host
        self.port = port
        self.collection = None
        try:
            logger.info(f"Connecting to Milvus at {self.host}:{self.port}")
            connections.connect("default", host=self.host, port=self.port)
            logger.info("Successfully connected to Milvus.")
            self._initialize_collection()
        except Exception as e:
            logger.error(f"Failed to connect to Milvus: {e}", exc_info=True)
            raise RuntimeError("Could not connect to Milvus. Is it running?") from e

    def _initialize_collection(self):
        """Checks if the collection exists and creates it if it doesn't."""
        if utility.has_collection(COLLECTION_NAME):
            logger.info(f"Collection '{COLLECTION_NAME}' already exists.")
            self.collection = Collection(COLLECTION_NAME)
        else:
            logger.info(f"Collection '{COLLECTION_NAME}' not found. Creating it now.")
            fields = [
                FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
                FieldSchema(name="url", dtype=DataType.VARCHAR, max_length=2048),
                FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=65535),
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=EMBEDDING_DIM)
            ]
            # A collection can have at most one partition key field.
            schema = CollectionSchema(
                fields,
                description="Collection for partitioned web page content",
                partition_key_field="url"
            )
            self.collection = Collection(COLLECTION_NAME, schema, num_partitions=64) # Pre-allocate partitions

            logger.info("Creating index for the embedding field...")
            index_params = {
                "metric_type": "L2",
                "index_type": "IVF_FLAT",
                "params": {"nlist": 128}
            }
            self.collection.create_index(field_name="embedding", index_params=index_params)
            logger.info("Index created successfully.")

        self.collection.load()
        logger.info(f"Collection '{COLLECTION_NAME}' loaded into memory.")

    def list_contexts(self) -> List[str]:
        """Lists all unique URLs (contexts) that have been ingested."""
        try:
            # Query for distinct url values
            # Note: This might be slow on very large datasets without proper indexing on the 'url' field.
            # For this app's scale, it's acceptable.
            results = self.collection.query(expr="id >= 0", output_fields=["url"])
            unique_urls = sorted(list(set([res['url'] for res in results])))
            logger.info(f"Found {len(unique_urls)} unique contexts.")
            return unique_urls
        except Exception as e:
            logger.error(f"Failed to list contexts from Milvus: {e}", exc_info=True)
            return []

    def insert_data(self, url: str, text: str, embedding: list[float]) -> int:
        """Inserts scraped data and its embedding into the correct partition."""
        if not self.collection:
            logger.error("Collection is not initialized. Cannot insert data.")
            return 0

        # Data is automatically routed to the partition corresponding to the 'url' value.
        data = [[url], [text], [embedding]]
        try:
            mr = self.collection.insert(data)
            self.collection.flush()
            logger.info(f"Successfully inserted data for URL: {url} into its partition. Primary keys: {mr.primary_keys}")
            return mr.insert_count
        except Exception as e:
            logger.error(f"Failed to insert data into Milvus: {e}", exc_info=True)
            return 0

    def search(self, query_embedding: List[float], context_url: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Searches for similar vectors within a specific URL's partition."""
        if not self.collection:
            logger.error("Collection is not initialized. Cannot perform search.")
            return []

        search_params = {
            "metric_type": "L2",
            "params": {"nprobe": 10},
        }

        # Use an expression to filter by the partition key field 'url'
        expr = f'url == "{context_url}"'

        try:
            results = self.collection.search(
                data=[query_embedding],
                anns_field="embedding",
                param=search_params,
                limit=top_k,
                expr=expr,
                output_fields=["text", "url"]
            )

            hits = results[0]
            logger.info(f"Search in context '{context_url}' found {len(hits)} results.")

            return [
                {
                    "distance": hit.distance,
                    "text": hit.entity.get('text'),
                    "url": hit.entity.get('url')
                }
                for hit in hits
            ]
        except Exception as e:
            logger.error(f"Failed to search in Milvus with context '{context_url}': {e}", exc_info=True)
            return []

    def delete_context(self, context_url: str) -> bool:
        """Deletes all data for a specific URL (context) from the collection."""
        if not self.collection:
            logger.error("Collection is not initialized. Cannot delete context.")
            return False

        try:
            # Delete all entities with the specified URL
            expr = f'url == "{context_url}"'
            result = self.collection.delete(expr)
            self.collection.flush()
            logger.info(f"Successfully deleted context '{context_url}'. Deleted count: {result.delete_count}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete context '{context_url}' from Milvus: {e}", exc_info=True)
            return False

# Dependency injection functions
def get_milvus_service():
    if not milvus_service:
        raise RuntimeError("Milvus service is not available.")
    return milvus_service

# Singleton instance
try:
    milvus_service = MilvusService()
except RuntimeError as e:
    logger.error(f"Could not create MilvusService instance: {e}")
    milvus_service = None
