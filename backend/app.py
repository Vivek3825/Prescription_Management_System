"""
Flask Backend API for Prescription Management System
Handles CSV file operations for authentication, info, prescription, progress, etc.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import csv
import os
import json
from datetime import datetime
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Base paths
BASE_DIR = Path(__file__).parent.parent
DATABASE_DIR = BASE_DIR / 'database'
CORE_TABLES_DIR = DATABASE_DIR / 'core_tables'
MASTER_DATA_DIR = DATABASE_DIR / 'master_data'

# Table paths mapping
TABLE_PATHS = {
    'authentication': CORE_TABLES_DIR / 'authentication.csv',
    'info': CORE_TABLES_DIR / 'info.csv',
    'prescription': CORE_TABLES_DIR / 'prescription.csv',
    'progress': CORE_TABLES_DIR / 'progress.csv',
    'lifestyle': CORE_TABLES_DIR / 'lifestyle.csv',
    'drugs': MASTER_DATA_DIR / 'drugs.csv',
}


def read_csv(table_name):
    """Read data from CSV file"""
    file_path = TABLE_PATHS.get(table_name)
    if not file_path or not file_path.exists():
        return []
    
    data = []
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    return data


def write_csv(table_name, data):
    """Write data to CSV file"""
    file_path = TABLE_PATHS.get(table_name)
    if not file_path:
        return False
    
    if not data:
        return True
    
    # Get headers from first row
    headers = list(data[0].keys())
    
    with open(file_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(data)
    
    return True


def append_to_csv(table_name, record):
    """Append a single record to CSV file"""
    file_path = TABLE_PATHS.get(table_name)
    if not file_path:
        return False
    
    # Read existing data
    data = read_csv(table_name)
    
    # Add timestamps if not present
    if 'created_at' not in record:
        record['created_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    if 'updated_at' not in record:
        record['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Append new record
    data.append(record)
    
    # Write back
    return write_csv(table_name, data)


@app.route('/api/tables/<table_name>', methods=['GET'])
def get_table(table_name):
    """Get all records from a table"""
    try:
        data = read_csv(table_name)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/tables/<table_name>/find', methods=['POST'])
def find_records(table_name):
    """Find records matching criteria"""
    try:
        criteria = request.json
        data = read_csv(table_name)
        
        # Filter data based on criteria
        filtered_data = []
        for record in data:
            match = True
            for key, value in criteria.items():
                if record.get(key) != value:
                    match = False
                    break
            if match:
                filtered_data.append(record)
        
        return jsonify({'success': True, 'data': filtered_data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/tables/<table_name>', methods=['POST'])
def add_record(table_name):
    """Add a new record to table"""
    try:
        record = request.json
        success = append_to_csv(table_name, record)
        
        if success:
            return jsonify({'success': True, 'data': record})
        else:
            return jsonify({'success': False, 'error': 'Failed to add record'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/tables/<table_name>/<user_id>', methods=['PUT'])
def update_record(table_name, user_id):
    """Update a record in table"""
    try:
        updates = request.json
        data = read_csv(table_name)
        
        # Find and update record
        updated = False
        for i, record in enumerate(data):
            if record.get('user_id') == user_id:
                # Update fields
                for key, value in updates.items():
                    record[key] = value
                record['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                data[i] = record
                updated = True
                break
        
        if updated:
            write_csv(table_name, data)
            return jsonify({'success': True, 'data': data})
        else:
            return jsonify({'success': False, 'error': 'Record not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/tables/<table_name>/<user_id>', methods=['DELETE'])
def delete_record(table_name, user_id):
    """Delete a record from table"""
    try:
        data = read_csv(table_name)
        
        # Filter out the record to delete
        new_data = [record for record in data if record.get('user_id') != user_id]
        
        if len(new_data) < len(data):
            write_csv(table_name, new_data)
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Record not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/import-from-localstorage', methods=['POST'])
def import_from_localstorage():
    """Import data from localStorage (sent from frontend)"""
    try:
        data = request.json
        results = {}
        
        for table_name, records in data.items():
            # Remove 'csv_' prefix if present
            table_name = table_name.replace('csv_', '')
            
            if table_name in TABLE_PATHS and records:
                # Write all records to CSV
                success = write_csv(table_name, records)
                results[table_name] = 'success' if success else 'failed'
        
        return jsonify({'success': True, 'results': results})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})


if __name__ == '__main__':
    # Ensure directories exist
    CORE_TABLES_DIR.mkdir(parents=True, exist_ok=True)
    MASTER_DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    print("=" * 60)
    print("🚀 Prescription Management System - Backend API")
    print("=" * 60)
    print(f"📁 Database Directory: {DATABASE_DIR}")
    print(f"📊 Core Tables: {CORE_TABLES_DIR}")
    print(f"📚 Master Data: {MASTER_DATA_DIR}")
    print("=" * 60)
    print("🌐 API Endpoints:")
    print("   GET    /api/tables/<table_name>")
    print("   POST   /api/tables/<table_name>/find")
    print("   POST   /api/tables/<table_name>")
    print("   PUT    /api/tables/<table_name>/<user_id>")
    print("   DELETE /api/tables/<table_name>/<user_id>")
    print("   POST   /api/import-from-localstorage")
    print("   GET    /api/health")
    print("=" * 60)
    print("🔥 Starting server on http://localhost:5000")
    print("=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
