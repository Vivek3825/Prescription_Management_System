#!/usr/bin/env python3
"""
PrescripCare Local Database Utilities

This script provides utilities for working with the local CSV-based database.
It can be used to load, validate, query, and export data from the database files.

Usage:
    python database_utils.py --help
    python database_utils.py load --table users
    python database_utils.py validate --all
    python database_utils.py query --table users --filter "account_status=active"
    python database_utils.py export --table medications --format json
"""

import csv
import json
import os
import sys
import argparse
import pandas as pd
from datetime import datetime
from pathlib import Path

class PrescripCareDB:
    def __init__(self, db_path="./database"):
        self.db_path = Path(db_path)
        self.config_path = self.db_path / "config"
        self.core_tables_path = self.db_path / "core_tables"
        self.master_data_path = self.db_path / "master_data"
        self.user_data_path = self.db_path / "user_data"
        self.analytics_path = self.db_path / "analytics"
        
        # Load configuration
        self.config = self.load_config()
        
    def load_config(self):
        """Load database configuration from JSON files"""
        try:
            with open(self.config_path / "database_config.json", 'r') as f:
                config = json.load(f)
            
            with open(self.config_path / "table_schemas.json", 'r') as f:
                config['schemas'] = json.load(f)
                
            with open(self.config_path / "data_validation.json", 'r') as f:
                config['validation'] = json.load(f)
                
            return config
        except Exception as e:
            print(f"Error loading configuration: {e}")
            return {}
    
    def get_table_path(self, table_name):
        """Get the full path to a table CSV file"""
        # Check in different directories
        for path in [self.core_tables_path, self.master_data_path, 
                     self.user_data_path, self.analytics_path]:
            file_path = path / f"{table_name}.csv"
            if file_path.exists():
                return file_path
        return None
    
    def load_table(self, table_name):
        """Load a table from CSV file into a pandas DataFrame"""
        file_path = self.get_table_path(table_name)
        if not file_path:
            raise FileNotFoundError(f"Table '{table_name}' not found")
        
        try:
            df = pd.read_csv(file_path)
            print(f"Loaded {len(df)} records from {table_name}")
            return df
        except Exception as e:
            print(f"Error loading table {table_name}: {e}")
            return None
    
    def list_tables(self):
        """List all available tables in the database"""
        tables = []
        for path in [self.core_tables_path, self.master_data_path, 
                     self.user_data_path, self.analytics_path]:
            if path.exists():
                for file_path in path.glob("*.csv"):
                    table_name = file_path.stem
                    table_category = path.name
                    tables.append({
                        'name': table_name,
                        'category': table_category,
                        'path': str(file_path),
                        'size': file_path.stat().st_size
                    })
        return tables
    
    def validate_table(self, table_name):
        """Validate a table against its schema"""
        df = self.load_table(table_name)
        if df is None:
            return False
        
        print(f"Validating {table_name}...")
        
        # Basic validation
        validation_results = {
            'total_records': len(df),
            'columns': list(df.columns),
            'null_counts': df.isnull().sum().to_dict(),
            'data_types': df.dtypes.to_dict(),
            'duplicates': df.duplicated().sum(),
            'errors': []
        }
        
        # Check for required fields if schema exists
        if 'schemas' in self.config and table_name in self.config['schemas']['table_schemas']:
            schema = self.config['schemas']['table_schemas'][table_name]
            required_columns = [col for col, props in schema['columns'].items() 
                              if props.get('required', False)]
            
            for col in required_columns:
                if col in df.columns:
                    null_count = df[col].isnull().sum()
                    if null_count > 0:
                        validation_results['errors'].append(
                            f"Required column '{col}' has {null_count} null values"
                        )
                else:
                    validation_results['errors'].append(
                        f"Required column '{col}' is missing"
                    )
        
        # Print validation summary
        print(f"  Total records: {validation_results['total_records']}")
        print(f"  Columns: {len(validation_results['columns'])}")
        print(f"  Duplicates: {validation_results['duplicates']}")
        
        if validation_results['errors']:
            print(f"  Errors: {len(validation_results['errors'])}")
            for error in validation_results['errors']:
                print(f"    - {error}")
        else:
            print("  ✅ Validation passed")
        
        return validation_results
    
    def query_table(self, table_name, filters=None, limit=None):
        """Query a table with optional filters"""
        df = self.load_table(table_name)
        if df is None:
            return None
        
        # Apply filters
        if filters:
            for filter_expr in filters:
                try:
                    # Simple filter format: column=value
                    if '=' in filter_expr:
                        column, value = filter_expr.split('=', 1)
                        df = df[df[column.strip()] == value.strip()]
                    print(f"Applied filter: {filter_expr}")
                except Exception as e:
                    print(f"Error applying filter '{filter_expr}': {e}")
        
        # Apply limit
        if limit:
            df = df.head(limit)
        
        return df
    
    def export_table(self, table_name, format='csv', output_file=None):
        """Export a table to different formats"""
        df = self.load_table(table_name)
        if df is None:
            return False
        
        if not output_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"{table_name}_export_{timestamp}.{format}"
        
        try:
            if format.lower() == 'json':
                df.to_json(output_file, orient='records', indent=2)
            elif format.lower() == 'xlsx':
                df.to_excel(output_file, index=False)
            elif format.lower() == 'csv':
                df.to_csv(output_file, index=False)
            else:
                print(f"Unsupported format: {format}")
                return False
            
            print(f"Exported {len(df)} records to {output_file}")
            return True
        except Exception as e:
            print(f"Error exporting table: {e}")
            return False
    
    def get_statistics(self):
        """Get overall database statistics"""
        tables = self.list_tables()
        stats = {
            'total_tables': len(tables),
            'categories': {},
            'total_size': 0,
            'table_details': []
        }
        
        for table in tables:
            category = table['category']
            if category not in stats['categories']:
                stats['categories'][category] = 0
            stats['categories'][category] += 1
            stats['total_size'] += table['size']
            
            # Get record count
            try:
                df = pd.read_csv(table['path'])
                record_count = len(df)
            except:
                record_count = 0
            
            stats['table_details'].append({
                'name': table['name'],
                'category': category,
                'records': record_count,
                'size_bytes': table['size']
            })
        
        return stats

def main():
    parser = argparse.ArgumentParser(description='PrescripCare Database Utilities')
    parser.add_argument('--db-path', default='./database', help='Path to database directory')
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # List command
    list_parser = subparsers.add_parser('list', help='List all tables')
    list_parser.add_argument('--category', help='Filter by category')
    
    # Load command
    load_parser = subparsers.add_parser('load', help='Load and display a table')
    load_parser.add_argument('--table', required=True, help='Table name to load')
    load_parser.add_argument('--limit', type=int, help='Limit number of rows to display')
    
    # Validate command
    validate_parser = subparsers.add_parser('validate', help='Validate tables')
    validate_parser.add_argument('--table', help='Specific table to validate')
    validate_parser.add_argument('--all', action='store_true', help='Validate all tables')
    
    # Query command
    query_parser = subparsers.add_parser('query', help='Query a table')
    query_parser.add_argument('--table', required=True, help='Table name to query')
    query_parser.add_argument('--filter', action='append', help='Filter conditions (column=value)')
    query_parser.add_argument('--limit', type=int, help='Limit results')
    
    # Export command
    export_parser = subparsers.add_parser('export', help='Export a table')
    export_parser.add_argument('--table', required=True, help='Table name to export')
    export_parser.add_argument('--format', choices=['csv', 'json', 'xlsx'], default='csv', help='Export format')
    export_parser.add_argument('--output', help='Output file name')
    
    # Stats command
    stats_parser = subparsers.add_parser('stats', help='Show database statistics')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Initialize database
    db = PrescripCareDB(args.db_path)
    
    # Execute commands
    if args.command == 'list':
        tables = db.list_tables()
        if args.category:
            tables = [t for t in tables if t['category'] == args.category]
        
        print(f"Found {len(tables)} tables:")
        for table in tables:
            print(f"  {table['name']} ({table['category']}) - {table['size']} bytes")
    
    elif args.command == 'load':
        df = db.load_table(args.table)
        if df is not None:
            if args.limit:
                df = df.head(args.limit)
            print(f"\nTable: {args.table}")
            print(f"Shape: {df.shape}")
            print(f"Columns: {list(df.columns)}")
            print("\nFirst few rows:")
            print(df.head())
    
    elif args.command == 'validate':
        if args.all:
            tables = db.list_tables()
            for table in tables:
                db.validate_table(table['name'])
                print()
        elif args.table:
            db.validate_table(args.table)
    
    elif args.command == 'query':
        df = db.query_table(args.table, args.filter, args.limit)
        if df is not None:
            print(f"\nQuery results for {args.table}:")
            print(f"Found {len(df)} records")
            print(df.to_string(index=False))
    
    elif args.command == 'export':
        success = db.export_table(args.table, args.format, args.output)
        if success:
            print("Export completed successfully")
    
    elif args.command == 'stats':
        stats = db.get_statistics()
        print("Database Statistics:")
        print(f"  Total tables: {stats['total_tables']}")
        print(f"  Total size: {stats['total_size']:,} bytes")
        print(f"  Categories: {dict(stats['categories'])}")
        print("\nTable Details:")
        for table in stats['table_details']:
            print(f"  {table['name']}: {table['records']:,} records ({table['size_bytes']:,} bytes)")

if __name__ == '__main__':
    main()