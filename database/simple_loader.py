#!/usr/bin/env python3
"""
Simple Database Loader for PrescripCare Local Database

A lightweight data loader that works with standard Python libraries only.
No external dependencies required.

Usage:
    python simple_loader.py
    python simple_loader.py --table users
    python simple_loader.py --stats
"""

import csv
import json
import os
import sys
import argparse
from datetime import datetime
from pathlib import Path

class SimpleDBLoader:
    def __init__(self, db_path="./database"):
        self.db_path = Path(db_path)
        self.config_path = self.db_path / "config"
        self.core_tables_path = self.db_path / "core_tables"
        self.master_data_path = self.db_path / "master_data"
        self.user_data_path = self.db_path / "user_data"
        self.analytics_path = self.db_path / "analytics"
        
    def get_table_path(self, table_name):
        """Get the full path to a table CSV file"""
        for path in [self.core_tables_path, self.master_data_path, 
                     self.user_data_path, self.analytics_path]:
            file_path = path / f"{table_name}.csv"
            if file_path.exists():
                return file_path
        return None
    
    def load_csv(self, file_path, limit=None):
        """Load CSV file and return as list of dictionaries"""
        records = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for i, row in enumerate(reader):
                    if limit and i >= limit:
                        break
                    records.append(row)
            return records
        except Exception as e:
            print(f"Error loading CSV: {e}")
            return []
    
    def load_table(self, table_name, limit=None):
        """Load a table and return records"""
        file_path = self.get_table_path(table_name)
        if not file_path:
            print(f"Table '{table_name}' not found")
            return []
        
        records = self.load_csv(file_path, limit)
        print(f"Loaded {len(records)} records from {table_name}")
        return records
    
    def list_tables(self):
        """List all available tables"""
        tables = []
        for path in [self.core_tables_path, self.master_data_path, 
                     self.user_data_path, self.analytics_path]:
            if path.exists():
                for file_path in path.glob("*.csv"):
                    table_name = file_path.stem
                    table_category = path.name
                    record_count = sum(1 for _ in open(file_path)) - 1  # Subtract header
                    tables.append({
                        'name': table_name,
                        'category': table_category,
                        'records': record_count,
                        'size': file_path.stat().st_size
                    })
        return tables
    
    def show_table_info(self, table_name):
        """Show detailed information about a table"""
        records = self.load_table(table_name, limit=1)
        if not records:
            return
        
        file_path = self.get_table_path(table_name)
        total_records = sum(1 for _ in open(file_path)) - 1
        
        print(f"\nTable: {table_name}")
        print(f"Total records: {total_records}")
        print(f"Columns ({len(records[0])}):")
        for i, column in enumerate(records[0].keys(), 1):
            print(f"  {i:2d}. {column}")
        
        print(f"\nSample record:")
        for key, value in records[0].items():
            print(f"  {key}: {value}")
    
    def search_table(self, table_name, column, value, limit=10):
        """Search for records in a table"""
        records = self.load_table(table_name)
        if not records:
            return []
        
        matches = []
        for record in records:
            if column in record and str(record[column]).lower() == str(value).lower():
                matches.append(record)
                if len(matches) >= limit:
                    break
        
        print(f"Found {len(matches)} matches for {column}='{value}' in {table_name}")
        return matches
    
    def export_to_json(self, table_name, output_file=None):
        """Export table to JSON format"""
        records = self.load_table(table_name)
        if not records:
            return False
        
        if not output_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"{table_name}_export_{timestamp}.json"
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(records, f, indent=2, default=str)
            print(f"Exported {len(records)} records to {output_file}")
            return True
        except Exception as e:
            print(f"Error exporting to JSON: {e}")
            return False
    
    def get_database_stats(self):
        """Get overall database statistics"""
        tables = self.list_tables()
        stats = {
            'total_tables': len(tables),
            'total_records': sum(t['records'] for t in tables),
            'total_size': sum(t['size'] for t in tables),
            'categories': {}
        }
        
        for table in tables:
            category = table['category']
            if category not in stats['categories']:
                stats['categories'][category] = {'tables': 0, 'records': 0}
            stats['categories'][category]['tables'] += 1
            stats['categories'][category]['records'] += table['records']
        
        return stats, tables
    
    def demo_queries(self):
        """Run some demo queries to show database functionality"""
        print("=== Database Demo Queries ===\n")
        
        # Show active users
        print("1. Active Users:")
        users = self.search_table('users', 'account_status', 'active', limit=3)
        for user in users:
            print(f"   {user['email']} (created: {user['created_at']})")
        
        print("\n2. Recent Dose Events:")
        dose_events = self.load_table('dose_events', limit=5)
        for event in dose_events:
            print(f"   {event['status']} - {event['scheduled_datetime']}")
        
        print("\n3. Drug Classes:")
        drugs = self.load_table('drugs_master', limit=5)
        for drug in drugs:
            print(f"   {drug['drug_name']} ({drug['drug_class']})")
        
        print("\n4. High Adherence Users:")
        adherence = self.load_table('adherence_summaries', limit=3)
        for record in adherence:
            if 'adherence_percentage' in record:
                print(f"   User {record['user_id']}: {record.get('adherence_percentage', 'N/A')}% adherence")

def main():
    parser = argparse.ArgumentParser(description='Simple Database Loader for PrescripCare')
    parser.add_argument('--db-path', default='./database', help='Path to database directory')
    parser.add_argument('--table', help='Show information about a specific table')
    parser.add_argument('--list', action='store_true', help='List all tables')
    parser.add_argument('--stats', action='store_true', help='Show database statistics')
    parser.add_argument('--demo', action='store_true', help='Run demo queries')
    parser.add_argument('--export', help='Export table to JSON')
    parser.add_argument('--search', nargs=3, metavar=('TABLE', 'COLUMN', 'VALUE'), 
                       help='Search for records: TABLE COLUMN VALUE')
    
    args = parser.parse_args()
    
    loader = SimpleDBLoader(args.db_path)
    
    if args.list:
        tables = loader.list_tables()
        print(f"Available tables ({len(tables)}):")
        current_category = None
        for table in sorted(tables, key=lambda x: (x['category'], x['name'])):
            if table['category'] != current_category:
                print(f"\n{table['category'].upper()}:")
                current_category = table['category']
            print(f"  {table['name']:<25} ({table['records']:,} records)")
    
    elif args.table:
        loader.show_table_info(args.table)
    
    elif args.stats:
        stats, tables = loader.get_database_stats()
        print("Database Statistics:")
        print(f"  Total tables: {stats['total_tables']}")
        print(f"  Total records: {stats['total_records']:,}")
        print(f"  Total size: {stats['total_size']:,} bytes")
        print(f"\nBy category:")
        for category, data in stats['categories'].items():
            print(f"  {category}: {data['tables']} tables, {data['records']:,} records")
    
    elif args.export:
        loader.export_to_json(args.export)
    
    elif args.search:
        table, column, value = args.search
        matches = loader.search_table(table, column, value)
        for i, match in enumerate(matches, 1):
            print(f"\n{i}. Record:")
            for key, val in match.items():
                print(f"   {key}: {val}")
    
    elif args.demo:
        loader.demo_queries()
    
    else:
        # Default: show overview
        stats, tables = loader.get_database_stats()
        print("🗄️  PrescripCare Local Database")
        print("=" * 40)
        print(f"Tables: {stats['total_tables']}")
        print(f"Records: {stats['total_records']:,}")
        print(f"Size: {stats['total_size']:,} bytes")
        print("\nUse --help for more options")
        print("Quick start: python simple_loader.py --demo")

if __name__ == '__main__':
    main()