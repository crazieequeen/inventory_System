#!/usr/bin/env python3
"""
Model Training Script
Trains a simple ML model for sales prediction using historical data
"""

import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os

def generate_sample_data():
    """Generate sample sales data for training"""
    products = [
        'P001', 'P002', 'P003', 'P004', 'P005',
        'P006', 'P007', 'P008', 'P009', 'P010'
    ]
    
    data = []
    start_date = datetime.now() - timedelta(days=90)
    
    for product_id in products:
        # Generate 90 days of sales data
        base_sales = np.random.randint(5, 20)
        
        for day in range(90):
            date = start_date + timedelta(days=day)
            
            # Add some variation and trends
            trend = day * 0.05  # Slight upward trend
            seasonal = 5 * np.sin(2 * np.pi * day / 7)  # Weekly pattern
            noise = np.random.normal(0, 2)
            
            quantity = max(0, base_sales + trend + seasonal + noise)
            
            data.append({
                'product_id': product_id,
                'date': date.strftime('%Y-%m-%d'),
                'quantity': round(quantity, 2)
            })
    
    return pd.DataFrame(data)

def train_simple_model(data):
    """Train a simple model (placeholder for actual ML model)"""
    # In a real scenario, you would train a proper ML model here
    # For now, we'll create a simple statistical model
    
    model = {
        'type': 'simple_average',
        'trained_date': datetime.now().isoformat(),
        'products': {},
        'version': '1.0'
    }
    
    # Calculate statistics for each product
    for product_id in data['product_id'].unique():
        product_data = data[data['product_id'] == product_id]
        
        model['products'][product_id] = {
            'mean': float(product_data['quantity'].mean()),
            'std': float(product_data['quantity'].std()),
            'min': float(product_data['quantity'].min()),
            'max': float(product_data['quantity'].max()),
            'total_records': len(product_data)
        }
    
    return model

def save_model(model, filename='shop_sales_model.pkl'):
    """Save the trained model"""
    model_path = os.path.join(os.path.dirname(__file__), filename)
    
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"✅ Model saved to: {model_path}")
    return model_path

def save_sample_data(data, filename='sample_data.csv'):
    """Save sample data to CSV"""
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    data_path = os.path.join(data_dir, filename)
    data.to_csv(data_path, index=False)
    
    print(f"✅ Sample data saved to: {data_path}")
    return data_path

def main():
    """Main training function"""
    print("🚀 Starting model training...")
    
    # Generate sample data
    print("📊 Generating sample sales data...")
    data = generate_sample_data()
    print(f"   Generated {len(data)} records for {data['product_id'].nunique()} products")
    
    # Save sample data
    save_sample_data(data)
    
    # Train model
    print("🤖 Training model...")
    model = train_simple_model(data)
    print(f"   Model trained with {len(model['products'])} products")
    
    # Save model
    model_path = save_model(model)
    
    # Display model info
    print("\n📈 Model Summary:")
    print(f"   Type: {model['type']}")
    print(f"   Version: {model['version']}")
    print(f"   Trained: {model['trained_date']}")
    print(f"   Products: {len(model['products'])}")
    
    print("\n✨ Training complete!")
    print("\n💡 Next steps:")
    print("   1. Start the Express backend: cd backend && npm start")
    print("   2. Test predictions: POST /api/predictions/forecast")
    print("   3. Add real sales data through the API")

if __name__ == '__main__':
    main()
