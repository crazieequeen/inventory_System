#!/usr/bin/env python3
"""
Sales Prediction Script
Receives JSON input from Express backend, loads ML model, and returns predictions
"""

import sys
import json
import pickle
import numpy as np
from datetime import datetime, timedelta
import os

def load_model():
    """Load the trained model"""
    model_path = os.path.join(os.path.dirname(__file__), 'shop_sales_model.pkl')
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")
    
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    return model

def calculate_average_daily_sales(historical_sales):
    """Calculate average daily sales from historical data"""
    if not historical_sales or len(historical_sales) == 0:
        return 0
    
    total_quantity = sum(sale['quantity'] for sale in historical_sales)
    
    # Calculate date range safely with mixed timestamps
    dates = []
    for sale in historical_sales:
        d_str = str(sale.get('date', ''))
        # Parse ISO strings safely and convert back to base format
        if 'T' in d_str:
            d_str = d_str.split('T')[0]
        if d_str:
            try:
                dates.append(datetime.strptime(d_str, '%Y-%m-%d'))
            except Exception:
                pass
                
    if not dates:
        date_range = 1
    else:
        date_range = (max(dates) - min(dates)).days + 1
    
    return total_quantity / date_range

def forecast_sales(product_id, days, historical_sales):
    """Forecast sales for the next N days"""
    try:
        # Calculate average daily sales
        avg_daily_sales = calculate_average_daily_sales(historical_sales)
        
        # Simple forecasting: use average with slight variation
        # In production, use the actual ML model
        forecasts = []
        today = datetime.now()
        
        for i in range(days):
            forecast_date = today + timedelta(days=i+1)
            # Add some variation (±10%)
            variation = np.random.uniform(0.9, 1.1)
            predicted_quantity = round(avg_daily_sales * variation, 2)
            
            forecasts.append({
                'date': forecast_date.strftime('%Y-%m-%d'),
                'predictedQuantity': max(0, predicted_quantity)
            })
        
        return {
            'productId': product_id,
            'averageDailySales': round(avg_daily_sales, 2),
            'forecastDays': days,
            'forecasts': forecasts,
            'totalPredictedSales': round(sum(f['predictedQuantity'] for f in forecasts), 2)
        }
    
    except Exception as e:
        raise Exception(f"Forecast error: {str(e)}")

def predict_stockout(product_id, current_stock, historical_sales):
    """Predict when stock will run out"""
    try:
        # Calculate average daily sales
        avg_daily_sales = calculate_average_daily_sales(historical_sales)
        
        if avg_daily_sales == 0:
            return {
                'productId': product_id,
                'currentStock': current_stock,
                'averageDailySales': 0,
                'daysUntilStockout': None,
                'stockoutDate': None,
                'status': 'no_sales_data',
                'message': 'No sales data available for prediction'
            }
        
        # Calculate days until stockout
        days_until_stockout = current_stock / avg_daily_sales
        stockout_date = datetime.now() + timedelta(days=days_until_stockout)
        
        # Determine status
        if days_until_stockout <= 3:
            status = 'critical'
        elif days_until_stockout <= 7:
            status = 'warning'
        else:
            status = 'safe'
        
        return {
            'productId': product_id,
            'currentStock': current_stock,
            'averageDailySales': round(avg_daily_sales, 2),
            'daysUntilStockout': round(days_until_stockout, 1),
            'stockoutDate': stockout_date.strftime('%Y-%m-%d'),
            'status': status,
            'recommendedReorderQuantity': round(avg_daily_sales * 14, 0)  # 2 weeks supply
        }
    
    except Exception as e:
        raise Exception(f"Stockout prediction error: {str(e)}")

def main():
    """Main function to process input and return predictions"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        action = input_data.get('action')
        product_id = input_data.get('productId')
        historical_sales = input_data.get('historicalSales', [])
        
        if not action or not product_id:
            raise ValueError("Missing required fields: action and productId")
        
        # Process based on action
        if action == 'forecast':
            days = input_data.get('days', 7)
            result = forecast_sales(product_id, days, historical_sales)
        
        elif action == 'stockout':
            current_stock = input_data.get('currentStock')
            if current_stock is None:
                raise ValueError("Missing required field: currentStock")
            result = predict_stockout(product_id, current_stock, historical_sales)
        
        else:
            raise ValueError(f"Unknown action: {action}")
        
        # Output result as JSON
        print(json.dumps(result))
        sys.exit(0)
    
    except Exception as e:
        error_result = {
            'error': True,
            'message': str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()
