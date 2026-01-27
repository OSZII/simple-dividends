import os
import json
import time
import yfinance as yf
from pathlib import Path
import pandas as pd
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def json_serializer(obj):
    """Helper to serialize objects not supported by default json (like dates)"""
    if isinstance(obj, (time.struct_time, pd.Timestamp)):
        return str(obj)
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    return str(obj)

def fetch_stock_data():
    # Define paths relative to this script
    script_path = Path(__file__).resolve()
    # Path: src/lib/scripts/fetch.py
    # Root: src/
    project_root = script_path.parent.parent
    print(project_root)
    symbols_file = project_root / "data/metadata/datasimpleStockdata.json"
    output_base_dir = project_root / "data/companyData"
    
    # Ensure output directory exists
    output_base_dir.mkdir(parents=True, exist_ok=True)
    
    # Load symbols from JSON
    if not symbols_file.exists():
        logger.error(f"Symbols file not found at {symbols_file}")
        return

    try:
        with open(symbols_file, 'r') as f:
            stock_metadata = json.load(f)
    except Exception as e:
        logger.error(f"Failed to read symbols file: {e}")
        return

    # Extract symbols from the metadata list
    symbols = []
    for item in stock_metadata:
        if 'symbol' in item:
            symbols.append(item['symbol'])
            
    total_symbols = len(symbols)
    # Get list of already existing company folders to avoid redundant work
    existing_folders = set()
    if output_base_dir.exists():
        existing_folders = {d.name for d in output_base_dir.iterdir() if d.is_dir()}
    
    logger.info(f"Found {len(existing_folders)} already processed symbols.")

    # Process symbols
    for index, symbol in enumerate(symbols, 1):
        if symbol in existing_folders:
            logger.info(f"[{index}/{total_symbols}] Skipping {symbol}: Folder already exists.")
            continue

        logger.info(f"[{index}/{total_symbols}] Processing: {symbol}")
        
        symbol_dir = output_base_dir / symbol
        symbol_dir.mkdir(parents=True, exist_ok=True)
        
        start_time = time.time()
        
        try:
            ticker = yf.Ticker(symbol)
            
            # 1. Fetch Info
            logger.info(f"  Fetching info for {symbol}...")
            info = ticker.info
            with open(symbol_dir / "info.json", "w") as f:
                json.dump(info, f, indent=2, default=json_serializer)
            
            # 2. Fetch Calendar
            logger.info(f"  Fetching calendar for {symbol}...")
            try:
                calendar = ticker.calendar
                # Convert DataFrame to dict if necessary
                if isinstance(calendar, pd.DataFrame):
                    calendar_data = calendar.to_dict()
                elif isinstance(calendar, dict):
                    calendar_data = calendar
                else:
                    calendar_data = {"raw": str(calendar)}
                
                with open(symbol_dir / "calendar.json", "w") as f:
                    json.dump(calendar_data, f, indent=2, default=json_serializer)
            except Exception as e:
                logger.warning(f"  Could not fetch calendar for {symbol}: {e}")
                with open(symbol_dir / "calendar.json", "w") as f:
                    json.dump({"error": "No calendar data available"}, f)

            # 3. Fetch History (max)
            logger.info(f"  Fetching history for {symbol}...")
            try:
                history = ticker.history(period="max")
                if not history.empty:
                    # Reset index to get Date as a column
                    history = history.reset_index()
                    
                    # Strip time from Date (keep only YYYY-MM-DD)
                    history['Date'] = history['Date'].dt.strftime('%Y-%m-%d')
                    
                    # Round Open, High, Low, Close to 2 decimal places
                    history['Open'] = history['Open'].round(2)
                    history['High'] = history['High'].round(2)
                    history['Low'] = history['Low'].round(2)
                    history['Close'] = history['Close'].round(2)
                    
                    # Extract dividends (rows where Dividends > 0)
                    dividends_df = history[history['Dividends'] > 0][['Date', 'Close', 'Dividends']].copy()
                    if not dividends_df.empty:
                        dividends_df.to_csv(symbol_dir / "dividends.csv", index=False)
                        logger.info(f"    Found {len(dividends_df)} dividend entries.")
                    
                    # Extract stock splits (rows where Stock Splits > 0)
                    splits_df = history[history['Stock Splits'] > 0][['Date', 'Close', 'Stock Splits']].copy()
                    if not splits_df.empty:
                        splits_df.to_csv(symbol_dir / "stock_splits.csv", index=False)
                        logger.info(f"    Found {len(splits_df)} stock split entries.")
                    
                    # Remove Dividends and Stock Splits columns from history
                    history = history.drop(columns=['Dividends', 'Stock Splits'])
                    
                    # Save cleaned history
                    history.to_csv(symbol_dir / "history.csv", index=False)
                else:
                    logger.warning(f"  Empty history for {symbol}")
            except Exception as e:
                logger.error(f"  Failed to fetch history for {symbol}: {e}")

            end_time = time.time()
            elapsed = end_time - start_time
            logger.info(f"  Successfully processed {symbol} in {elapsed:.2f}s")

        except Exception as e:
            logger.error(f"  Unexpected error processing {symbol}: {e}")
        
        # Respect API limits (wait 5 second between tickers) because we make 3 requests
        time.sleep(5)

if __name__ == "__main__":
    fetch_stock_data()