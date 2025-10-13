// CSV Data Access Layer for Frontend
// Provides CRUD operations for CSV database files without backend

class CSVDataAccess {
    constructor(databasePath = '../database') {
        this.databasePath = databasePath;
        this.cache = new Map();
        this.schemas = null;
    }

    // Load CSV file and parse it (with fallback to hardcoded data)
    async loadCSV(tableName) {
        if (this.cache.has(tableName)) {
            return this.cache.get(tableName);
        }

        try {
            // Try localStorage first (simulated database)
            const localData = localStorage.getItem(`csv_${tableName}`);
            if (localData) {
                const data = JSON.parse(localData);
                this.cache.set(tableName, data);
                return data;
            }

            // Try to fetch CSV file
            const filePath = this.getTablePath(tableName);
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const csvText = await response.text();
            const data = this.parseCSV(csvText);
            this.cache.set(tableName, data);
            return data;
        } catch (error) {
            console.warn(`CSV fetch failed for ${tableName}, using fallback data:`, error);
            // Use hardcoded fallback data
            const fallbackData = this.getFallbackData(tableName);
            this.cache.set(tableName, fallbackData);
            return fallbackData;
        }
    }

    // Parse CSV text to JavaScript objects
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = this.parseValue(values[index]);
                });
                data.push(row);
            }
        }

        return data;
    }

    // Parse CSV line handling quotes and commas properly
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Handle escaped quotes ""
                    current += '"';
                    i += 2;
                    continue;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                values.push(current.trim());
                current = '';
                i++;
                continue;
            } else {
                current += char;
            }
            
            i++;
        }
        
        // Add the last value
        values.push(current.trim());
        return values;
    }

    // Parse individual values (handle JSON, dates, etc.) with better error handling
    parseValue(value) {
        if (!value || value === 'NULL' || value === 'null') return null;
        
        // Remove surrounding quotes
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
            // Handle escaped quotes inside
            value = value.replace(/""/g, '"');
        }

        // Empty string after quote removal
        if (value === '') return null;

        // Try to parse JSON arrays/objects
        if ((value.startsWith('[') && value.endsWith(']')) || 
            (value.startsWith('{') && value.endsWith('}'))) {
            try {
                return JSON.parse(value);
            } catch (e) {
                console.warn('Failed to parse JSON value:', value, e);
                return value;
            }
        }

        // Parse booleans
        const lowerValue = value.toLowerCase();
        if (lowerValue === 'true') return true;
        if (lowerValue === 'false') return false;

        // Parse numbers (but not if it starts with 0 and is not a decimal)
        if (!isNaN(value) && !isNaN(parseFloat(value))) {
            // Don't parse strings that start with 0 (like phone numbers, IDs)
            if (!value.startsWith('0') || value.includes('.')) {
                const num = parseFloat(value);
                return Number.isInteger(num) && !value.includes('.') ? parseInt(value) : num;
            }
        }

        return value;
    }

    // Get table file path
    getTablePath(tableName) {
        const tablePaths = {
            // Core tables
            'users': 'core_tables/users.csv',
            'user_profiles': 'core_tables/user_profiles.csv',
            'user_medical_conditions': 'core_tables/user_medical_conditions.csv',
            'user_allergies': 'core_tables/user_allergies.csv',
            'healthcare_providers': 'core_tables/healthcare_providers.csv',
            
            // Master data
            'drugs_master': 'master_data/drugs_master.csv',
            'drug_interactions': 'master_data/drug_interactions.csv',
            'drug_food_interactions': 'master_data/drug_food_interactions.csv',
            'pharmacies': 'master_data/pharmacies.csv',
            
            // User data
            'user_medications': 'user_data/user_medications.csv',
            'medication_schedules': 'user_data/medication_schedules.csv',
            'dose_events': 'user_data/dose_events.csv',
            'notification_preferences': 'user_data/notification_preferences.csv',
            'user_insurance': 'user_data/user_insurance.csv',
            
            // Analytics
            'adherence_summaries': 'analytics/adherence_summaries.csv',
            'health_metrics': 'analytics/health_metrics.csv',
            'lifestyle_goals': 'analytics/lifestyle_goals.csv',
            'audit_logs': 'analytics/audit_logs.csv'
        };

        return `${this.databasePath}/${tablePaths[tableName]}`;
    }

    // Load table schemas with fallback
    async loadSchemas() {
        if (this.schemas) return this.schemas;

        try {
            const response = await fetch(`${this.databasePath}/config/table_schemas.json`);
            if (response.ok) {
                this.schemas = await response.json();
                return this.schemas;
            }
        } catch (error) {
            console.warn('Error loading schemas, using fallback:', error);
        }
        
        // Fallback schema definitions
        this.schemas = {
            table_schemas: {
                users: { primary_key: 'user_id' },
                user_profiles: { primary_key: 'profile_id' },
                user_medications: { primary_key: 'medication_id' },
                drugs_master: { primary_key: 'drug_id' },
                user_medical_conditions: { primary_key: 'condition_id' },
                user_allergies: { primary_key: 'allergy_id' },
                healthcare_providers: { primary_key: 'provider_id' },
                drug_interactions: { primary_key: 'interaction_id' },
                drug_food_interactions: { primary_key: 'interaction_id' },
                pharmacies: { primary_key: 'pharmacy_id' },
                medication_schedules: { primary_key: 'schedule_id' },
                dose_events: { primary_key: 'event_id' },
                notification_preferences: { primary_key: 'preference_id' },
                user_insurance: { primary_key: 'insurance_id' },
                adherence_summaries: { primary_key: 'summary_id' },
                health_metrics: { primary_key: 'metric_id' },
                lifestyle_goals: { primary_key: 'goal_id' },
                audit_logs: { primary_key: 'log_id' }
            }
        };
        return this.schemas;
    }

    // Find record by ID with proper key handling
    async findById(tableName, id) {
        try {
            const data = await this.loadCSV(tableName);
            const schemas = await this.loadSchemas();
            const primaryKey = schemas.table_schemas?.[tableName]?.primary_key || `${tableName.slice(0, -1)}_id`;
            
            return data.find(record => record[primaryKey] === id);
        } catch (error) {
            console.error(`Error finding record by ID in ${tableName}:`, error);
            return null;
        }
    }

    // Find records by criteria
    async findBy(tableName, criteria) {
        const data = await this.loadCSV(tableName);
        
        return data.filter(record => {
            return Object.keys(criteria).every(key => {
                if (typeof criteria[key] === 'string') {
                    return String(record[key]).toLowerCase().includes(criteria[key].toLowerCase());
                }
                return record[key] === criteria[key];
            });
        });
    }

    // Get all records from table
    async getAll(tableName) {
        return await this.loadCSV(tableName);
    }

    // Join tables (simplified inner join)
    async joinTables(mainTable, joinTable, mainKey, joinKey) {
        const mainData = await this.loadCSV(mainTable);
        const joinData = await this.loadCSV(joinTable);
        
        return mainData.map(mainRecord => {
            const joinRecord = joinData.find(jr => jr[joinKey] === mainRecord[mainKey]);
            return { ...mainRecord, ...joinRecord };
        }).filter(record => record !== null);
    }

    // Get user with profile data
    async getUserWithProfile(userId) {
        const users = await this.loadCSV('users');
        const profiles = await this.loadCSV('user_profiles');
        
        const user = users.find(u => u.user_id === userId);
        if (!user) return null;
        
        const profile = profiles.find(p => p.user_id === userId);
        return { ...user, profile };
    }

    // Get user medications with drug details
    async getUserMedicationsWithDetails(userId) {
        const medications = await this.loadCSV('user_medications');
        const drugs = await this.loadCSV('drugs_master');
        
        const userMeds = medications.filter(m => m.user_id === userId && m.status === 'active');
        
        return userMeds.map(med => {
            const drug = drugs.find(d => d.drug_id === med.drug_id);
            return { ...med, drug_details: drug };
        });
    }

    // Get dose events for user
    async getUserDoseEvents(userId, startDate = null, endDate = null) {
        const doseEvents = await this.loadCSV('dose_events');
        let userEvents = doseEvents.filter(event => event.user_id === userId);
        
        if (startDate) {
            userEvents = userEvents.filter(event => 
                new Date(event.scheduled_datetime) >= new Date(startDate)
            );
        }
        
        if (endDate) {
            userEvents = userEvents.filter(event => 
                new Date(event.scheduled_datetime) <= new Date(endDate)
            );
        }
        
        return userEvents;
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Generate UUID (compatible with database format)
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Format date for database compatibility
    formatDate(date) {
        if (!date) return null;
        if (typeof date === 'string') date = new Date(date);
        
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }

    // Simulate CSV write operations (for demo - stores in localStorage)
    async simulateWrite(tableName, data) {
        const key = `csv_${tableName}`;
        localStorage.setItem(key, JSON.stringify(data));
        
        // Update cache
        this.cache.set(tableName, data);
        
        console.log(`Simulated write to ${tableName}: ${data.length} records`);
        return true;
    }

    // Simulate adding a record
    async simulateAdd(tableName, record) {
        const data = await this.loadCSV(tableName);
        const schemas = await this.loadSchemas();
        const primaryKey = schemas.table_schemas?.[tableName]?.primary_key || 'id';
        
        // Generate ID if not provided
        if (!record[primaryKey]) {
            record[primaryKey] = this.generateUUID();
        }
        
        // Add timestamps
        if (!record.created_at) {
            record.created_at = this.formatDate(new Date());
        }
        record.updated_at = this.formatDate(new Date());
        
        data.push(record);
        await this.simulateWrite(tableName, data);
        
        return record;
    }

    // Simulate updating a record
    async simulateUpdate(tableName, id, updates) {
        const data = await this.loadCSV(tableName);
        const schemas = await this.loadSchemas();
        const primaryKey = schemas.table_schemas?.[tableName]?.primary_key || 'id';
        
        const index = data.findIndex(record => record[primaryKey] === id);
        if (index === -1) return null;
        
        // Add updated timestamp
        updates.updated_at = this.formatDate(new Date());
        
        data[index] = { ...data[index], ...updates };
        await this.simulateWrite(tableName, data);
        
        return data[index];
    }

    // Simulate deleting a record
    async simulateDelete(tableName, id) {
        const data = await this.loadCSV(tableName);
        const schemas = await this.loadSchemas();
        const primaryKey = schemas.table_schemas?.[tableName]?.primary_key || 'id';
        
        const index = data.findIndex(record => record[primaryKey] === id);
        if (index === -1) return false;
        
        data.splice(index, 1);
        await this.simulateWrite(tableName, data);
        
        return true;
    }

    // Fallback data when CSV files can't be loaded
    getFallbackData(tableName) {
        const fallbackData = {
            users: [
                {
                    user_id: '550e8400-e29b-41d4-a716-446655440001',
                    email: 'john.doe@email.com',
                    password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXfs2opQYexa',
                    email_verified: true,
                    account_status: 'active',
                    two_factor_enabled: false,
                    created_at: '2024-01-15 10:30:00',
                    updated_at: '2024-10-12 08:45:00',
                    last_login: '2024-10-12 08:45:00',
                    login_attempts: 0,
                    locked_until: null
                },
                {
                    user_id: '550e8400-e29b-41d4-a716-446655440002',
                    email: 'jane.smith@email.com',
                    password_hash: '$2b$12$KPw4d2zrCXWIylf1MIBbBPY0w7UuyNRLscGH6VzxDfZqr1pRZYdyi',
                    email_verified: true,
                    account_status: 'active',
                    two_factor_enabled: true,
                    created_at: '2024-01-18 14:20:00',
                    updated_at: '2024-10-12 09:15:00',
                    last_login: '2024-10-12 09:15:00',
                    login_attempts: 0,
                    locked_until: null
                }
            ],
            user_profiles: [
                {
                    profile_id: '650e8400-e29b-41d4-a716-446655440001',
                    user_id: '550e8400-e29b-41d4-a716-446655440001',
                    first_name: 'John',
                    last_name: 'Doe',
                    date_of_birth: '1991-05-15',
                    gender: 'male',
                    phone_number: '+1 234 567 8900',
                    emergency_contact_name: 'Jane Doe',
                    emergency_contact_phone: '+1 234 567 8901',
                    height_cm: 175,
                    weight_kg: 74.5,
                    blood_type: 'O+',
                    address_line1: '123 Main St',
                    city: 'New York',
                    state_province: 'NY',
                    postal_code: '10001',
                    country: 'USA',
                    timezone: 'America/New_York',
                    preferred_language: 'en',
                    created_at: '2024-01-15 10:30:00',
                    updated_at: '2024-10-12 08:45:00'
                },
                {
                    profile_id: '650e8400-e29b-41d4-a716-446655440002',
                    user_id: '550e8400-e29b-41d4-a716-446655440002',
                    first_name: 'Jane',
                    last_name: 'Smith',
                    date_of_birth: '1995-08-22',
                    gender: 'female',
                    phone_number: '+1 234 567 8902',
                    emergency_contact_name: 'Mike Smith',
                    emergency_contact_phone: '+1 234 567 8903',
                    height_cm: 165,
                    weight_kg: 58.0,
                    blood_type: 'A+',
                    address_line1: '456 Oak Ave',
                    city: 'Los Angeles',
                    state_province: 'CA',
                    postal_code: '90001',
                    country: 'USA',
                    timezone: 'America/Los_Angeles',
                    preferred_language: 'en',
                    created_at: '2024-01-18 14:20:00',
                    updated_at: '2024-10-12 09:15:00'
                }
            ],
            drugs_master: [
                {
                    drug_id: '950e8400-e29b-41d4-a716-446655440001',
                    drug_name: 'Lisinopril',
                    generic_name: 'Lisinopril',
                    brand_names: ['Prinivil', 'Zestril'],
                    drug_class: 'ACE Inhibitor',
                    therapeutic_category: 'Cardiovascular',
                    active_ingredients: [{'ingredient': 'Lisinopril', 'strength': 'varies'}],
                    available_strengths: ['2.5mg', '5mg', '10mg', '20mg', '40mg'],
                    dosage_forms: ['Tablet'],
                    route_of_administration: ['Oral'],
                    indications: 'Hypertension and heart failure',
                    contraindications: 'Pregnancy; angioedema history',
                    side_effects: [{'frequency': 'common', 'effects': ['dry cough', 'dizziness', 'headache']}],
                    warnings_precautions: 'Monitor kidney function and potassium levels',
                    pregnancy_category: 'D',
                    storage_conditions: 'Room temperature 20-25°C',
                    shelf_life_months: 36,
                    fda_approved: true,
                    manufacturer: 'Generic Manufacturer',
                    created_at: '2024-01-01 08:00:00',
                    updated_at: '2024-10-12 08:00:00'
                },
                {
                    drug_id: '950e8400-e29b-41d4-a716-446655440002',
                    drug_name: 'Metformin',
                    generic_name: 'Metformin',
                    brand_names: ['Glucophage', 'Fortamet'],
                    drug_class: 'Biguanide',
                    therapeutic_category: 'Antidiabetic',
                    active_ingredients: [{'ingredient': 'Metformin HCl', 'strength': 'varies'}],
                    available_strengths: ['500mg', '850mg', '1000mg'],
                    dosage_forms: ['Tablet', 'Extended Release'],
                    route_of_administration: ['Oral'],
                    indications: 'Type 2 diabetes mellitus',
                    contraindications: 'Severe kidney disease; metabolic acidosis',
                    side_effects: [{'frequency': 'common', 'effects': ['nausea', 'diarrhea', 'metallic taste']}],
                    warnings_precautions: 'Monitor kidney function; risk of lactic acidosis',
                    pregnancy_category: 'B',
                    storage_conditions: 'Room temperature; protect from moisture',
                    shelf_life_months: 36,
                    fda_approved: true,
                    manufacturer: 'Bristol-Myers Squibb',
                    created_at: '2024-01-01 08:00:00',
                    updated_at: '2024-10-12 08:00:00'
                }
            ],
            user_medications: [],
            user_medical_conditions: [],
            user_allergies: [],
            healthcare_providers: [
                {
                    provider_id: '750e8400-e29b-41d4-a716-446655440001',
                    provider_name: 'Dr. Michael Chen',
                    specialty: 'Internal Medicine',
                    contact_phone: '+1 555 123 4567',
                    contact_email: 'mchen@medicalpractice.com',
                    clinic_address: '789 Medical Center Dr, New York, NY 10001',
                    license_number: 'NY123456',
                    years_experience: 15,
                    created_at: '2024-01-01 08:00:00',
                    updated_at: '2024-10-12 08:00:00'
                }
            ],
            drug_interactions: [],
            drug_food_interactions: [],
            pharmacies: [],
            medication_schedules: [],
            dose_events: [],
            notification_preferences: [],
            user_insurance: [],
            adherence_summaries: [],
            health_metrics: [],
            lifestyle_goals: [],
            audit_logs: []
        };

        return fallbackData[tableName] || [];
    }
}

// Create global instance
window.csvDB = new CSVDataAccess();

console.log('CSV Data Access Layer loaded successfully');