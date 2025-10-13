# 🗄️ PrescripCare Local Demo Database

This directory contains CSV files and JSON configurations that serve as a local demo database for the Prescription Management System. These files can be used for development, testing, and demonstration purposes without requiring a full database server setup.

## 📁 Directory Structure

```
database/
├── README.md                 # This file
├── config/                   # Database configuration files
│   ├── database_config.json  # Database connection settings
│   ├── table_schemas.json    # Table structure definitions
│   └── data_validation.json  # Data validation rules
├── core_tables/             # Essential system tables
│   ├── users.csv            # User accounts
│   ├── user_profiles.csv    # User personal information
│   ├── user_medical_conditions.csv
│   ├── user_allergies.csv
│   └── healthcare_providers.csv
├── master_data/             # Reference/lookup data
│   ├── drugs_master.csv     # Complete drug database
│   ├── drug_interactions.csv
│   ├── drug_food_interactions.csv
│   └── pharmacies.csv
├── user_data/               # User-specific data
│   ├── user_medications.csv
│   ├── medication_schedules.csv
│   ├── dose_events.csv
│   ├── notification_preferences.csv
│   └── user_insurance.csv
└── analytics/               # Analytics and reporting data
    ├── adherence_summaries.csv
    ├── health_metrics.csv
    ├── lifestyle_goals.csv
    └── audit_logs.csv
```

## 🚀 Getting Started

### File Formats Used
- **CSV**: Primary data storage format for easy importing/exporting
- **JSON**: Configuration files and complex nested data
- **TXT**: Simple lookup tables and reference data

### Data Relationships
All CSV files maintain referential integrity through ID fields:
- `user_id`: Links user-related data across tables
- `drug_id`: Links medication data to the drugs master table
- `medication_id`: Links schedules and dose events to user medications
- `provider_id`: Links healthcare providers to users

### Sample Data
All files contain realistic sample data for demonstration:
- 50+ sample users with complete profiles
- 500+ medications from common drug database
- Realistic dosing schedules and adherence data
- Sample notifications and health metrics

## 🔧 Integration Notes

### For Frontend Development
- Files can be loaded directly into JavaScript applications
- JSON configuration provides schema information
- CSV files can be converted to JavaScript objects easily

### For Backend Development
- CSV files can be imported into any SQL/NoSQL database
- Table schemas provided in JSON format
- Foreign key relationships documented

### For Testing
- Realistic data for comprehensive testing scenarios
- Edge cases included (missed doses, drug interactions, etc.)
- Complete user journeys represented in data

## 📊 Data Statistics

- **Users**: 50 sample users with complete profiles
- **Medications**: 500+ drugs with detailed information
- **Dose Events**: 10,000+ historical dose tracking records
- **Health Metrics**: Comprehensive health tracking data
- **Notifications**: Sample notification history and preferences

## 🔐 Security Notes

- All sensitive data (passwords, etc.) is dummy/hashed data
- Personal information is fictional for demo purposes
- No real patient or medical data is included

## 🛠️ Usage Examples

### Loading Users Data (JavaScript)
```javascript
// Load users from CSV
fetch('./database/core_tables/users.csv')
  .then(response => response.text())
  .then(csvData => {
    const users = parseCSV(csvData);
    // Use users data in your application
  });
```

### Querying Data (Python/Pandas)
```python
import pandas as pd

# Load and query user medications
medications = pd.read_csv('database/user_data/user_medications.csv')
active_medications = medications[medications['status'] == 'active']
```

## 📝 File Descriptions

### Core Tables
- `users.csv`: Basic user account information and authentication data
- `user_profiles.csv`: Personal information, demographics, and preferences
- `user_medical_conditions.csv`: Medical history and current conditions
- `user_allergies.csv`: Known allergies and adverse reactions
- `healthcare_providers.csv`: Doctors, pharmacists, and medical professionals

### Master Data
- `drugs_master.csv`: Comprehensive drug database with all medication information
- `drug_interactions.csv`: Drug-to-drug interaction warnings and severity
- `drug_food_interactions.csv`: Food interaction warnings and recommendations
- `pharmacies.csv`: Pharmacy locations and contact information

### User Data
- `user_medications.csv`: Current and historical medication prescriptions
- `medication_schedules.csv`: Detailed dosing schedules for each medication
- `dose_events.csv`: Individual dose-taking events and adherence tracking
- `notification_preferences.csv`: User notification settings and preferences
- `user_insurance.csv`: Insurance information and coverage details

### Analytics
- `adherence_summaries.csv`: Pre-calculated adherence statistics
- `health_metrics.csv`: Health measurements and tracking data
- `lifestyle_goals.csv`: User-defined health goals and progress
- `audit_logs.csv`: System activity logs and security tracking

## 🔄 Data Updates

To update the demo data:
1. Edit CSV files directly in any spreadsheet application
2. Maintain ID relationships between related tables
3. Follow the data types and formats shown in existing records
4. Validate data using the validation rules in `config/data_validation.json`

## 📈 Performance Considerations

- CSV files are optimized for quick loading (< 50MB each)
- Indexed by primary keys for efficient lookups
- Normalized structure reduces data redundancy
- Sample data represents realistic production volumes