# 🚀 Database Integration Guide

This guide shows how to integrate the PrescripCare local database with your frontend and future backend systems.

## 📁 Database Structure Overview

```
database/
├── README.md                    # Main database documentation
├── simple_loader.py            # Simple Python data loader (no dependencies)
├── database_utils.py           # Advanced Python utilities (requires pandas)
├── config/                     # Configuration files
│   ├── database_config.json   # Database settings
│   ├── table_schemas.json     # Table structure definitions
│   └── data_validation.json   # Validation rules
├── core_tables/               # Essential system tables (5 files)
├── master_data/              # Reference data (4 files)
├── user_data/               # User-specific data (5 files)
└── analytics/              # Analytics and reporting (4 files)
```

## 🔧 Quick Start

### 1. Test the Database
```bash
# Navigate to database directory
cd database

# Run the simple loader to see overview
python3 simple_loader.py

# List all tables
python3 simple_loader.py --list

# Show database statistics
python3 simple_loader.py --stats

# Run demo queries
python3 simple_loader.py --demo
```

### 2. Explore Specific Tables
```bash
# Show users table structure and sample data
python3 simple_loader.py --table users

# Show medications data
python3 simple_loader.py --table user_medications

# Search for active users
python3 simple_loader.py --search users account_status active
```

## 💻 Frontend Integration

### JavaScript/React Integration

```javascript
// Load user data
async function loadUsers() {
    const response = await fetch('./database/core_tables/users.csv');
    const csvText = await response.text();
    const users = parseCSV(csvText);
    return users;
}

// CSV Parser function
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',');
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = values[index]?.trim() || '';
            });
            data.push(row);
        }
    }
    return data;
}

// Load medications for a user
async function loadUserMedications(userId) {
    const medications = await loadTable('user_medications');
    return medications.filter(med => med.user_id === userId && med.status === 'active');
}

// Load drug interactions
async function checkDrugInteractions(drugIds) {
    const interactions = await loadTable('drug_interactions');
    return interactions.filter(interaction => 
        drugIds.includes(interaction.drug_a_id) || 
        drugIds.includes(interaction.drug_b_id)
    );
}
```

### Using Fetch API with JSON Export
```javascript
// Export to JSON first, then load
// Run: python3 simple_loader.py --export users
// This creates users_export_TIMESTAMP.json

async function loadUsersFromJSON() {
    const response = await fetch('./database/users_export.json');
    const users = await response.json();
    return users;
}
```

## 🐍 Python Backend Integration

### Flask Integration Example
```python
import csv
import json
from pathlib import Path
from flask import Flask, jsonify, request

app = Flask(__name__)
DB_PATH = Path('./database')

def load_table(table_name):
    """Load table from CSV"""
    # Find table file
    for folder in ['core_tables', 'master_data', 'user_data', 'analytics']:
        file_path = DB_PATH / folder / f"{table_name}.csv"
        if file_path.exists():
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                return list(reader)
    return []

@app.route('/api/users')
def get_users():
    users = load_table('users')
    # Filter out sensitive data
    safe_users = []
    for user in users:
        safe_user = {
            'user_id': user['user_id'],
            'email': user['email'],
            'account_status': user['account_status'],
            'created_at': user['created_at']
        }
        safe_users.append(safe_user)
    return jsonify(safe_users)

@app.route('/api/medications/<user_id>')
def get_user_medications(user_id):
    medications = load_table('user_medications')
    user_meds = [med for med in medications if med['user_id'] == user_id]
    return jsonify(user_meds)

@app.route('/api/adherence/<user_id>')
def get_user_adherence(user_id):
    adherence = load_table('adherence_summaries')
    user_adherence = [a for a in adherence if a['user_id'] == user_id]
    return jsonify(user_adherence)
```

### Django Integration Example
```python
# models.py - Create Django models that match CSV structure
from django.db import models
import uuid

class User(models.Model):
    user_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    account_status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'users'

# management/commands/import_csv_data.py
from django.core.management.base import BaseCommand
import csv
from myapp.models import User

class Command(BaseCommand):
    def handle(self, *args, **options):
        with open('database/core_tables/users.csv', 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                User.objects.create(
                    user_id=row['user_id'],
                    email=row['email'],
                    password_hash=row['password_hash'],
                    account_status=row['account_status']
                )
```

## 🗄️ Database Migration to Production

### SQLite Migration
```python
import sqlite3
import csv
from pathlib import Path

def create_sqlite_db():
    conn = sqlite3.connect('prescripcare.db')
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE users (
            user_id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            account_status TEXT DEFAULT 'active',
            created_at TIMESTAMP
        )
    ''')
    
    # Import CSV data
    with open('database/core_tables/users.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cursor.execute('''
                INSERT INTO users (user_id, email, password_hash, account_status, created_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (row['user_id'], row['email'], row['password_hash'], 
                  row['account_status'], row['created_at']))
    
    conn.commit()
    conn.close()
```

### PostgreSQL Migration
```sql
-- Create tables
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    account_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Import CSV data
COPY users FROM '/path/to/database/core_tables/users.csv' 
WITH (FORMAT csv, HEADER true);
```

## 📊 Data Analysis Examples

### Python Data Analysis
```python
import csv
from collections import Counter
from datetime import datetime

def analyze_adherence():
    """Analyze medication adherence patterns"""
    with open('database/analytics/adherence_summaries.csv', 'r') as f:
        reader = csv.DictReader(f)
        adherence_data = list(reader)
    
    # Calculate average adherence
    adherence_values = [float(row['adherence_percentage']) for row in adherence_data 
                       if row['adherence_percentage']]
    avg_adherence = sum(adherence_values) / len(adherence_values)
    
    print(f"Average adherence: {avg_adherence:.2f}%")
    
    # Find users with low adherence
    low_adherence = [row for row in adherence_data 
                    if float(row['adherence_percentage']) < 80]
    print(f"Users with <80% adherence: {len(low_adherence)}")

def medication_usage_stats():
    """Analyze most prescribed medications"""
    with open('database/user_data/user_medications.csv', 'r') as f:
        reader = csv.DictReader(f)
        medications = list(reader)
    
    # Count by drug_id
    drug_counts = Counter(med['drug_id'] for med in medications 
                         if med['status'] == 'active')
    
    print("Top 5 prescribed medications:")
    for drug_id, count in drug_counts.most_common(5):
        print(f"  {drug_id}: {count} prescriptions")
```

## 🔗 API Endpoints Design

Based on the database structure, here are recommended API endpoints:

### User Management
- `GET /api/users` - List users
- `GET /api/users/{id}` - Get user details
- `GET /api/users/{id}/profile` - Get user profile
- `GET /api/users/{id}/conditions` - Get medical conditions
- `GET /api/users/{id}/allergies` - Get allergies

### Medication Management
- `GET /api/medications` - List all medications
- `GET /api/users/{id}/medications` - Get user medications
- `GET /api/medications/{id}/interactions` - Get drug interactions
- `POST /api/users/{id}/medications` - Add new medication

### Adherence Tracking
- `GET /api/users/{id}/adherence` - Get adherence summary
- `GET /api/users/{id}/dose-events` - Get dose history
- `POST /api/users/{id}/dose-events` - Record dose taken

### Analytics
- `GET /api/analytics/adherence` - System-wide adherence stats
- `GET /api/analytics/medications` - Medication usage stats
- `GET /api/users/{id}/health-metrics` - User health metrics

## 🛠️ Development Tools

### Validation Scripts
```bash
# Validate all tables
python3 simple_loader.py --stats

# Check for data consistency
python3 -c "
import csv
users = list(csv.DictReader(open('core_tables/users.csv')))
medications = list(csv.DictReader(open('user_data/user_medications.csv')))
user_ids = {u['user_id'] for u in users}
med_user_ids = {m['user_id'] for m in medications}
orphaned = med_user_ids - user_ids
print(f'Orphaned medication records: {len(orphaned)}')
"
```

### Data Export for Testing
```bash
# Export specific tables to JSON for frontend testing
python3 simple_loader.py --export users
python3 simple_loader.py --export drugs_master
python3 simple_loader.py --export user_medications
```

## 🎯 Next Steps

1. **Choose Your Stack**: Decide on frontend (React/Vue/Angular) and backend (Flask/Django/Node.js)
2. **Set Up Environment**: Install dependencies and set up development environment
3. **Create API Layer**: Build REST API endpoints using the database structure
4. **Implement Authentication**: Use the user table for authentication (hash passwords properly)
5. **Build Frontend Components**: Create components for medication tracking, adherence, etc.
6. **Test with Sample Data**: Use the provided CSV data for development and testing
7. **Plan Migration**: Prepare to migrate to production database when ready

## 📝 Important Notes

- **Password Security**: The demo passwords are hashed, but implement proper authentication
- **Data Privacy**: Remove or anonymize personal data before production
- **Validation**: Implement proper data validation based on the schemas provided
- **Backup**: Always backup your data before any migrations
- **Testing**: Use the sample data for comprehensive testing scenarios

The database is ready for integration! Start with the simple_loader.py to explore the data structure and build from there.