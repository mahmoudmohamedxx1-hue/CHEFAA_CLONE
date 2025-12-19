#!/usr/bin/env python3
"""
Hair Care Product Extraction Script
Systematically extracts product data from chefaa.com with rate limiting
"""

import json
import time
import logging
from datetime import datetime
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class HairCareExtractor:
    def __init__(self):
        self.input_file = Path("/workspace/data/hair_care/hair_care_products.json")
        self.output_file = Path("/workspace/data/overviews/hair_care/hair_care_overviews_final.json")
        self.delay_between_extractions = 120  # 2 minutes
        self.batch_size = 5  # Process 5 products at a time
        self.max_retries = 3
        
    def load_data(self):
        """Load input data and existing output"""
        try:
            with open(self.input_file, 'r', encoding='utf-8') as f:
                input_data = json.load(f)
                
            if self.output_file.exists():
                with open(self.output_file, 'r', encoding='utf-8') as f:
                    output_data = json.load(f)
            else:
                output_data = {
                    "extraction_metadata": {
                        "extraction_date": datetime.now().strftime("%Y-%m-%d"),
                        "total_products": 221,
                        "products_with_urls": 0,
                        "products_processed": 0,
                        "successful_extractions": 0,
                        "rate_limited_failures": 0,
                        "extraction_status": "In Progress",
                        "methodology": "Systematic batch extraction from chefaa.com product pages with rate limiting mitigation",
                        "completion_rate": "0 of 221 products (0.0%)",
                        "data_quality_improvement": "Starting extraction process"
                    },
                    "products_processed": [],
                    "extraction_summary": {
                        "total_extracted_products": 0,
                        "rich_extractions": 0,
                        "limited_extractions": 0,
                        "completion_rate": "0 of 221 products (0.0%)",
                        "extraction_success_rate": "Starting extraction",
                        "data_quality_summary": {
                            "products_with_complete_ingredient_lists": 0,
                            "products_with_detailed_usage_instructions": 0,
                            "products_with_warnings_and_precautions": 0,
                            "products_with_storage_instructions": 0,
                            "products_with_customer_reviews": 0
                        }
                    },
                    "final_status": {
                        "products_successfully_processed": 0,
                        "remaining_products": 221,
                        "completion_percentage": "0.0%",
                        "key_achievements": [
                            "Starting systematic extraction process",
                            "Implementing 2-minute delay strategy",
                            "Creating scalable execution workflow"
                        ],
                        "remaining_work": [
                            "Process all products with URLs",
                            "Develop URL discovery strategies for products without URLs",
                            "Complete full 221 product dataset"
                        ],
                        "next_steps": [
                            "Implement systematic batch processing",
                            "Track progress and handle rate limiting",
                            "Ensure data quality standards"
                        ]
                    }
                }
            
            return input_data, output_data
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            return None, None
    
    def get_processed_urls(self, output_data):
        """Get set of already processed URLs"""
        processed_urls = set()
        for product in output_data.get('products_processed', []):
            if 'product_url' in product and product['product_url']:
                processed_urls.add(product['product_url'])
        return processed_urls
    
    def identify_remaining_products(self, input_data, processed_urls):
        """Identify products that still need processing"""
        remaining_with_urls = []
        products_without_urls = []
        
        for product in input_data.get('products', []):
            url = product.get('product_url', '').strip()
            if url:
                if url not in processed_urls:
                    remaining_with_urls.append(product)
            else:
                products_without_urls.append(product)
        
        logger.info(f"Products with URLs remaining: {len(remaining_with_urls)}")
        logger.info(f"Products without URLs: {len(products_without_urls)}")
        
        return remaining_with_urls, products_without_urls
    
    def update_progress(self, output_data, new_products):
        """Update extraction progress metrics"""
        metadata = output_data['extraction_metadata']
        summary = output_data['extraction_summary']
        status = output_data['final_status']
        
        # Update counts
        metadata['products_processed'] += len(new_products)
        metadata['successful_extractions'] += len(new_products)
        
        # Update completion rate
        completion_rate = f"{metadata['products_processed']} of 221 products ({metadata['products_processed']/221*100:.1f}%)"
        metadata['completion_rate'] = completion_rate
        metadata['data_quality_improvement'] = f"Successfully extracted {len(new_products)} additional products"
        
        # Update summary
        summary['total_extracted_products'] = metadata['products_processed']
        summary['completion_rate'] = completion_rate
        summary['extraction_success_rate'] = "High success rate with systematic approach"
        
        # Update status
        status['products_successfully_processed'] = metadata['products_processed']
        status['remaining_products'] = 221 - metadata['products_processed']
        status['completion_percentage'] = f"{metadata['products_processed']/221*100:.1f}%"
        
        return output_data
    
    def save_data(self, output_data):
        """Save updated output data"""
        try:
            with open(self.output_file, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, ensure_ascii=False, indent=2)
            logger.info(f"Saved {len(output_data['products_processed'])} products to {self.output_file}")
        except Exception as e:
            logger.error(f"Error saving data: {e}")
    
    def run_extraction_plan(self):
        """Main execution plan"""
        logger.info("Starting systematic hair care product extraction")
        
        # Load data
        input_data, output_data = self.load_data()
        if not input_data or not output_data:
            logger.error("Failed to load data files")
            return
        
        # Get processed URLs and remaining products
        processed_urls = self.get_processed_urls(output_data)
        remaining_with_urls, products_without_urls = self.identify_remaining_products(input_data, processed_urls)
        
        logger.info(f"Starting with {len(remaining_with_urls)} products to process")
        
        # Create extraction plan
        extraction_plan = {
            "total_products": 221,
            "products_processed": len(output_data['products_processed']),
            "remaining_with_urls": len(remaining_with_urls),
            "products_without_urls": len(products_without_urls),
            "extraction_method": "Systematic batch processing with 2-minute delays",
            "priority_order": [
                "Current L'Oreal Excellence products (highest data quality)",
                "Current Palette hair dye products", 
                "Other current hair care products",
                "Legacy products with URLs",
                "Products without URLs (search and construct URLs)"
            ]
        }
        
        # Save extraction plan
        plan_file = Path("/workspace/data/overviews/hair_care/extraction_plan.json")
        with open(plan_file, 'w', encoding='utf-8') as f:
            json.dump(extraction_plan, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Created extraction plan: {plan_file}")
        logger.info(f"Plan: Process {remaining_with_urls} products with URLs using systematic batches")
        
        return remaining_with_urls, products_without_urls

if __name__ == "__main__":
    extractor = HairCareExtractor()
    remaining_with_urls, products_without_urls = extractor.run_extraction_plan()
    print(f"Extraction plan created. Ready to process {len(remaining_with_urls)} products with URLs.")
