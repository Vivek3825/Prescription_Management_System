# 🗄️ PrescripCare Database Blueprint

## Database Architecture Overview

The PrescripCare system requires a robust relational database structure to handle user management, medication tracking, dose scheduling, notifications, and health analytics. This blueprint covers all aspects from user authentication to complex medication interactions.

## 📋 Database Schema Design

### 🏗️ Core Architecture Principles

- **Normalization**: 3NF compliance to reduce redundancy
- **Scalability**: Designed to handle millions of users and medications
- **Security**: Encrypted sensitive data with proper access controls
- **Performance**: Optimized indexes and query patterns
- **Audit Trail**: Complete tracking of all data changes
- **Data Integrity**: Foreign key constraints and validation rules

---

## 🗂️ Table Structures

### 1. 👥 User Management Tables

#### `users`
Primary user account information
```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(100) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    account_status ENUM('active', 'suspended', 'deactivated') DEFAULT 'active',
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP NULL,
    
    -- Indexes
    INDEX idx_email (email),
    INDEX idx_account_status (account_status),
    INDEX idx_created_at (created_at)
);
```

#### `user_profiles`
Detailed user personal and medical information
```sql
CREATE TABLE user_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NOT NULL,
    phone_number VARCHAR(20),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    
    -- Physical Information
    height_cm INTEGER CHECK (height_cm > 0 AND height_cm < 300),
    weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg < 1000),
    bmi DECIMAL(4,2) GENERATED ALWAYS AS (weight_kg / POWER(height_cm/100.0, 2)) STORED,
    blood_type ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'),
    
    -- Address Information
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Preferences
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferred_language VARCHAR(10) DEFAULT 'en',
    notification_preferences JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_full_name (first_name, last_name),
    INDEX idx_date_of_birth (date_of_birth)
);
```

#### `user_medical_conditions`
User's medical conditions and health history
```sql
CREATE TABLE user_medical_conditions (
    condition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    condition_name VARCHAR(200) NOT NULL,
    condition_code VARCHAR(20), -- ICD-10 codes
    severity ENUM('mild', 'moderate', 'severe') DEFAULT 'moderate',
    diagnosed_date DATE,
    status ENUM('active', 'resolved', 'managed') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_condition_name (condition_name),
    INDEX idx_status (status)
);
```

#### `user_allergies`
User allergies and adverse reactions
```sql
CREATE TABLE user_allergies (
    allergy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    allergen_name VARCHAR(200) NOT NULL,
    allergen_type ENUM('drug', 'food', 'environmental', 'other') NOT NULL,
    reaction_severity ENUM('mild', 'moderate', 'severe', 'life_threatening') NOT NULL,
    reaction_symptoms TEXT,
    verified_by_doctor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_allergen_type (allergen_type),
    INDEX idx_severity (reaction_severity)
);
```

---

### 2. 💊 Drug & Medication Master Data

#### `drugs_master`
Comprehensive drug database
```sql
CREATE TABLE drugs_master (
    drug_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    brand_names JSON, -- Array of brand names
    drug_class VARCHAR(100),
    therapeutic_category VARCHAR(100),
    
    -- Drug Information
    active_ingredients JSON, -- Array of active ingredients with strengths
    available_strengths JSON, -- Array of available strengths
    dosage_forms JSON, -- tablets, capsules, liquid, etc.
    route_of_administration JSON, -- oral, injection, topical, etc.
    
    -- Clinical Information
    indications TEXT,
    contraindications TEXT,
    side_effects JSON, -- Categorized by frequency
    warnings_precautions TEXT,
    pregnancy_category VARCHAR(10),
    controlled_substance_schedule VARCHAR(10),
    
    -- Storage and Handling
    storage_conditions VARCHAR(200),
    shelf_life_months INTEGER,
    
    -- Regulatory
    fda_approved BOOLEAN DEFAULT FALSE,
    approval_date DATE,
    manufacturer VARCHAR(200),
    ndc_codes JSON, -- National Drug Codes
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_drug_name (drug_name),
    INDEX idx_generic_name (generic_name),
    INDEX idx_drug_class (drug_class),
    INDEX idx_therapeutic_category (therapeutic_category),
    FULLTEXT idx_search (drug_name, generic_name, brand_names)
);
```

#### `drug_interactions`
Drug-to-drug interaction matrix
```sql
CREATE TABLE drug_interactions (
    interaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_a_id UUID NOT NULL,
    drug_b_id UUID NOT NULL,
    interaction_type ENUM('major', 'moderate', 'minor') NOT NULL,
    mechanism VARCHAR(500), -- How the interaction occurs
    clinical_effect TEXT, -- What happens clinically
    management_strategy TEXT, -- How to manage the interaction
    evidence_level ENUM('established', 'probable', 'possible', 'theoretical') DEFAULT 'established',
    severity_score INTEGER CHECK (severity_score >= 1 AND severity_score <= 10),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (drug_a_id) REFERENCES drugs_master(drug_id),
    FOREIGN KEY (drug_b_id) REFERENCES drugs_master(drug_id),
    
    -- Ensure no duplicate interactions
    UNIQUE KEY unique_interaction (drug_a_id, drug_b_id),
    
    -- Indexes
    INDEX idx_drug_a (drug_a_id),
    INDEX idx_drug_b (drug_b_id),
    INDEX idx_interaction_type (interaction_type),
    INDEX idx_severity (severity_score)
);
```

#### `drug_food_interactions`
Drug-food interaction information
```sql
CREATE TABLE drug_food_interactions (
    interaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_id UUID NOT NULL,
    food_item VARCHAR(200) NOT NULL,
    interaction_type ENUM('avoid', 'caution', 'timing_required') NOT NULL,
    description TEXT,
    recommendation TEXT,
    
    FOREIGN KEY (drug_id) REFERENCES drugs_master(drug_id),
    
    -- Indexes
    INDEX idx_drug_id (drug_id),
    INDEX idx_food_item (food_item)
);
```

---

### 3. 🏥 User Medications & Prescriptions

#### `user_medications`
User's active and historical medications
```sql
CREATE TABLE user_medications (
    medication_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    drug_id UUID NOT NULL,
    
    -- Prescription Details
    prescription_number VARCHAR(50),
    prescriber_name VARCHAR(200),
    prescriber_npi VARCHAR(20), -- National Provider Identifier
    pharmacy_name VARCHAR(200),
    pharmacy_phone VARCHAR(20),
    
    -- Medication Details
    strength VARCHAR(50) NOT NULL,
    dosage_form VARCHAR(50) NOT NULL,
    quantity_prescribed INTEGER,
    refills_remaining INTEGER DEFAULT 0,
    days_supply INTEGER,
    
    -- Dosing Instructions
    dosing_frequency VARCHAR(100), -- "twice daily", "every 8 hours", etc.
    dosing_schedule JSON, -- Specific times: ["08:00", "20:00"]
    instructions TEXT, -- "Take with food", "Do not crush", etc.
    
    -- Status and Dates
    start_date DATE NOT NULL,
    end_date DATE,
    status ENUM('active', 'completed', 'discontinued', 'paused') DEFAULT 'active',
    discontinuation_reason VARCHAR(200),
    
    -- Tracking
    adherence_target DECIMAL(5,2) DEFAULT 100.00, -- Target adherence percentage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (drug_id) REFERENCES drugs_master(drug_id),
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_drug_id (drug_id),
    INDEX idx_status (status),
    INDEX idx_date_range (start_date, end_date)
);
```

#### `medication_schedules`
Detailed dosing schedules for each medication
```sql
CREATE TABLE medication_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL,
    dose_time TIME NOT NULL,
    dose_amount VARCHAR(50), -- "1 tablet", "5ml", etc.
    special_instructions VARCHAR(300),
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (medication_id) REFERENCES user_medications(medication_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_medication_id (medication_id),
    INDEX idx_dose_time (dose_time),
    INDEX idx_active (is_active)
);
```

---

### 4. 📅 Dose Tracking & Adherence

#### `dose_events`
Individual dose taking events
```sql
CREATE TABLE dose_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    medication_id UUID NOT NULL,
    schedule_id UUID NOT NULL,
    
    -- Event Details
    scheduled_datetime TIMESTAMP NOT NULL,
    actual_datetime TIMESTAMP,
    status ENUM('taken', 'missed', 'skipped', 'snoozed', 'partial') NOT NULL,
    dose_amount_taken VARCHAR(50), -- Actual amount taken if different from prescribed
    
    -- Additional Information
    taken_with_food BOOLEAN,
    side_effects_noted TEXT,
    notes TEXT,
    location VARCHAR(100), -- Where the dose was taken
    
    -- Tracking
    recorded_via ENUM('manual', 'reminder', 'auto', 'caregiver') DEFAULT 'manual',
    device_info JSON, -- Mobile device, browser info, etc.
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (medication_id) REFERENCES user_medications(medication_id) ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES medication_schedules(schedule_id),
    
    -- Ensure no duplicate events for same scheduled time
    UNIQUE KEY unique_dose_event (schedule_id, scheduled_datetime),
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_medication_id (medication_id),
    INDEX idx_scheduled_datetime (scheduled_datetime),
    INDEX idx_status (status),
    INDEX idx_date_range (DATE(scheduled_datetime))
);
```

#### `adherence_summaries`
Pre-calculated adherence statistics for performance
```sql
CREATE TABLE adherence_summaries (
    summary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    medication_id UUID,
    
    -- Time Period
    period_type ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Statistics
    total_scheduled_doses INTEGER NOT NULL DEFAULT 0,
    doses_taken INTEGER NOT NULL DEFAULT 0,
    doses_missed INTEGER NOT NULL DEFAULT 0,
    doses_snoozed INTEGER NOT NULL DEFAULT 0,
    doses_partial INTEGER NOT NULL DEFAULT 0,
    adherence_percentage DECIMAL(5,2) GENERATED ALWAYS AS 
        (CASE WHEN total_scheduled_doses > 0 
         THEN (doses_taken * 100.0 / total_scheduled_doses) 
         ELSE 0 END) STORED,
    
    -- Streaks
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (medication_id) REFERENCES user_medications(medication_id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicates
    UNIQUE KEY unique_summary (user_id, medication_id, period_type, period_start),
    
    -- Indexes
    INDEX idx_user_period (user_id, period_type, period_start),
    INDEX idx_medication_period (medication_id, period_type, period_start),
    INDEX idx_adherence_percentage (adherence_percentage)
);
```

---

### 5. 🔔 Notifications & Reminders

#### `notification_preferences`
User notification settings
```sql
CREATE TABLE notification_preferences (
    preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Notification Types
    medication_reminders BOOLEAN DEFAULT TRUE,
    missed_dose_alerts BOOLEAN DEFAULT TRUE,
    refill_reminders BOOLEAN DEFAULT TRUE,
    interaction_warnings BOOLEAN DEFAULT TRUE,
    health_tips BOOLEAN DEFAULT TRUE,
    appointment_reminders BOOLEAN DEFAULT TRUE,
    
    -- Delivery Methods
    push_notifications BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    in_app_notifications BOOLEAN DEFAULT TRUE,
    
    -- Timing Preferences
    reminder_advance_minutes INTEGER DEFAULT 15, -- Remind X minutes before dose time
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '07:00',
    
    -- Contact Information
    phone_number VARCHAR(20),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_id (user_id)
);
```

#### `notification_queue`
Scheduled and pending notifications
```sql
CREATE TABLE notification_queue (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Notification Details
    notification_type ENUM('medication_reminder', 'missed_dose', 'refill_due', 
                          'interaction_warning', 'health_tip', 'appointment') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Scheduling
    scheduled_for TIMESTAMP NOT NULL,
    delivery_method ENUM('push', 'email', 'sms', 'in_app') NOT NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    
    -- Status
    status ENUM('pending', 'sent', 'delivered', 'failed', 'cancelled') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    failure_reason VARCHAR(200),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Related Data
    related_medication_id UUID,
    related_event_id UUID,
    metadata JSON, -- Additional context data
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (related_medication_id) REFERENCES user_medications(medication_id),
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_scheduled_for (scheduled_for),
    INDEX idx_status (status),
    INDEX idx_notification_type (notification_type),
    INDEX idx_priority (priority)
);
```

#### `notification_history`
Historical record of all sent notifications
```sql
CREATE TABLE notification_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Delivery Details
    delivery_method ENUM('push', 'email', 'sms', 'in_app') NOT NULL,
    delivery_status ENUM('delivered', 'failed', 'bounced', 'opened', 'clicked') NOT NULL,
    delivered_at TIMESTAMP NOT NULL,
    
    -- Interaction
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    action_taken VARCHAR(100), -- "dismissed", "snoozed", "marked_taken", etc.
    
    -- Technical Details
    device_info JSON,
    user_agent VARCHAR(500),
    ip_address INET,
    
    FOREIGN KEY (notification_id) REFERENCES notification_queue(notification_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_notification_id (notification_id),
    INDEX idx_user_id (user_id),
    INDEX idx_delivered_at (delivered_at),
    INDEX idx_delivery_status (delivery_status)
);
```

---

### 6. 👨‍⚕️ Healthcare Providers

#### `healthcare_providers`
Doctors, pharmacists, and other healthcare professionals
```sql
CREATE TABLE healthcare_providers (
    provider_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(50), -- Dr., PharmD, etc.
    specialty VARCHAR(100),
    
    -- Professional Information
    npi_number VARCHAR(20) UNIQUE, -- National Provider Identifier
    dea_number VARCHAR(20), -- DEA registration number
    license_number VARCHAR(50),
    license_state VARCHAR(50),
    
    -- Contact Information
    practice_name VARCHAR(200),
    phone_number VARCHAR(20),
    fax_number VARCHAR(20),
    email VARCHAR(255),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_npi_number (npi_number),
    INDEX idx_specialty (specialty),
    INDEX idx_full_name (first_name, last_name),
    INDEX idx_location (city, state_province)
);
```

#### `user_provider_relationships`
Link users to their healthcare providers
```sql
CREATE TABLE user_provider_relationships (
    relationship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    
    relationship_type ENUM('primary_care', 'specialist', 'pharmacist', 'other') NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    start_date DATE NOT NULL,
    end_date DATE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    
    -- Permissions
    can_view_medications BOOLEAN DEFAULT TRUE,
    can_prescribe BOOLEAN DEFAULT FALSE,
    can_modify_prescriptions BOOLEAN DEFAULT FALSE,
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES healthcare_providers(provider_id),
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_provider_id (provider_id),
    INDEX idx_relationship_type (relationship_type),
    INDEX idx_status (status)
);
```

---

### 7. 📊 Health Analytics & Insights

#### `health_metrics`
Track various health metrics over time
```sql
CREATE TABLE health_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Metric Details
    metric_type ENUM('weight', 'blood_pressure_systolic', 'blood_pressure_diastolic', 
                    'heart_rate', 'blood_sugar', 'cholesterol', 'temperature', 
                    'pain_level', 'mood', 'energy_level', 'sleep_hours', 'custom') NOT NULL,
    metric_value DECIMAL(10,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    
    -- Context
    recorded_at TIMESTAMP NOT NULL,
    notes TEXT,
    recorded_via ENUM('manual', 'device', 'provider') DEFAULT 'manual',
    device_name VARCHAR(100),
    
    -- Validation
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by_provider UUID,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by_provider) REFERENCES healthcare_providers(provider_id),
    
    -- Indexes
    INDEX idx_user_metric_type (user_id, metric_type),
    INDEX idx_recorded_at (recorded_at),
    INDEX idx_metric_type (metric_type)
);
```

#### `lifestyle_goals`
User-defined health and lifestyle goals
```sql
CREATE TABLE lifestyle_goals (
    goal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Goal Details
    goal_type ENUM('weight_loss', 'weight_gain', 'exercise_frequency', 'medication_adherence',
                  'blood_pressure', 'blood_sugar', 'cholesterol', 'smoking_cessation', 'custom') NOT NULL,
    goal_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Target Values
    target_value DECIMAL(10,3),
    target_unit VARCHAR(20),
    current_value DECIMAL(10,3),
    baseline_value DECIMAL(10,3),
    
    -- Timeline
    start_date DATE NOT NULL,
    target_date DATE,
    
    -- Status
    status ENUM('active', 'completed', 'paused', 'abandoned') DEFAULT 'active',
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Tracking
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_goal_type (goal_type),
    INDEX idx_status (status),
    INDEX idx_target_date (target_date)
);
```

---

### 8. 🏥 Pharmacy & Insurance

#### `pharmacies`
Pharmacy information
```sql
CREATE TABLE pharmacies (
    pharmacy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    pharmacy_name VARCHAR(200) NOT NULL,
    chain_name VARCHAR(100),
    pharmacy_type ENUM('retail', 'hospital', 'mail_order', 'specialty', 'independent') NOT NULL,
    
    -- Contact Information
    phone_number VARCHAR(20) NOT NULL,
    fax_number VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Address
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    
    -- Operating Hours
    hours_of_operation JSON, -- Store hours for each day
    
    -- Services
    services_offered JSON, -- delivery, consultation, immunizations, etc.
    accepts_insurance BOOLEAN DEFAULT TRUE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_pharmacy_name (pharmacy_name),
    INDEX idx_location (city, state_province, postal_code),
    INDEX idx_pharmacy_type (pharmacy_type),
    INDEX idx_chain_name (chain_name)
);
```

#### `user_insurance`
User insurance information
```sql
CREATE TABLE user_insurance (
    insurance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Insurance Details
    insurance_company VARCHAR(200) NOT NULL,
    plan_name VARCHAR(200),
    policy_number VARCHAR(100) NOT NULL,
    group_number VARCHAR(100),
    
    -- Coverage Information
    prescription_coverage BOOLEAN DEFAULT TRUE,
    copay_amount DECIMAL(8,2),
    deductible_amount DECIMAL(10,2),
    out_of_pocket_max DECIMAL(10,2),
    
    -- Dates
    effective_date DATE NOT NULL,
    expiration_date DATE,
    
    -- Status
    is_primary BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_policy_number (policy_number),
    INDEX idx_insurance_company (insurance_company)
);
```

---

### 9. 🔐 Security & Audit

#### `audit_logs`
Complete audit trail of all system activities
```sql
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who
    user_id UUID,
    provider_id UUID,
    session_id VARCHAR(100),
    
    -- What
    action_type ENUM('create', 'read', 'update', 'delete', 'login', 'logout', 
                    'password_change', 'medication_taken', 'reminder_sent') NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    
    -- Details
    old_values JSON,
    new_values JSON,
    description TEXT,
    
    -- When/Where
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent VARCHAR(500),
    device_info JSON,
    
    -- Security
    risk_level ENUM('low', 'medium', 'high') DEFAULT 'low',
    flagged_for_review BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (provider_id) REFERENCES healthcare_providers(provider_id),
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_performed_at (performed_at),
    INDEX idx_action_type (action_type),
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_risk_level (risk_level)
);
```

#### `session_management`
User session tracking for security
```sql
CREATE TABLE session_management (
    session_id VARCHAR(100) PRIMARY KEY,
    user_id UUID NOT NULL,
    
    -- Session Details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    -- Device/Location
    ip_address INET NOT NULL,
    user_agent VARCHAR(500),
    device_fingerprint VARCHAR(200),
    location_info JSON,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    logout_reason ENUM('user_logout', 'timeout', 'admin_logout', 'security_logout'),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_last_activity (last_activity),
    INDEX idx_is_active (is_active)
);
```

---

## 📈 Performance Optimization Strategies

### Indexing Strategy
```sql
-- Composite indexes for common queries
CREATE INDEX idx_user_medication_status ON user_medications(user_id, status, start_date);
CREATE INDEX idx_dose_events_summary ON dose_events(user_id, DATE(scheduled_datetime), status);
CREATE INDEX idx_notification_delivery ON notification_queue(user_id, scheduled_for, status);

-- Partial indexes for active records only
CREATE INDEX idx_active_medications ON user_medications(user_id, drug_id) WHERE status = 'active';
CREATE INDEX idx_pending_notifications ON notification_queue(scheduled_for) WHERE status = 'pending';
```

### Partitioning Strategy
```sql
-- Partition large tables by date for better performance
-- Example: Partition dose_events by month
ALTER TABLE dose_events PARTITION BY RANGE (YEAR(scheduled_datetime), MONTH(scheduled_datetime));

-- Create monthly partitions
CREATE TABLE dose_events_2025_01 PARTITION OF dose_events 
FOR VALUES FROM (2025, 1) TO (2025, 2);
```

---

## 🔍 Key Database Views

### User Medication Summary View
```sql
CREATE VIEW user_medication_summary AS
SELECT 
    um.user_id,
    um.medication_id,
    dm.drug_name,
    dm.generic_name,
    um.strength,
    um.status,
    um.start_date,
    um.end_date,
    COUNT(ms.schedule_id) as daily_doses,
    COALESCE(as_monthly.adherence_percentage, 0) as current_adherence
FROM user_medications um
JOIN drugs_master dm ON um.drug_id = dm.drug_id
LEFT JOIN medication_schedules ms ON um.medication_id = ms.medication_id AND ms.is_active = TRUE
LEFT JOIN adherence_summaries as_monthly ON um.medication_id = as_monthly.medication_id 
    AND as_monthly.period_type = 'monthly' 
    AND as_monthly.period_start = DATE_FORMAT(CURDATE(), '%Y-%m-01')
WHERE um.status = 'active'
GROUP BY um.medication_id;
```

### Daily Adherence Dashboard View
```sql
CREATE VIEW daily_adherence_dashboard AS
SELECT 
    u.user_id,
    up.first_name,
    up.last_name,
    COUNT(CASE WHEN de.status = 'taken' THEN 1 END) as doses_taken_today,
    COUNT(de.event_id) as total_doses_today,
    ROUND(
        COUNT(CASE WHEN de.status = 'taken' THEN 1 END) * 100.0 / 
        NULLIF(COUNT(de.event_id), 0), 2
    ) as today_adherence_percentage,
    MAX(de.actual_datetime) as last_dose_time
FROM users u
JOIN user_profiles up ON u.user_id = up.user_id
LEFT JOIN dose_events de ON u.user_id = de.user_id 
    AND DATE(de.scheduled_datetime) = CURDATE()
WHERE u.account_status = 'active'
GROUP BY u.user_id, up.first_name, up.last_name;
```

---

## 🚀 API Integration Points

### External API Connections
```sql
-- Table to store API integration configurations
CREATE TABLE api_integrations (
    integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_name VARCHAR(100) NOT NULL,
    api_endpoint VARCHAR(500) NOT NULL,
    api_key_encrypted TEXT,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drug information APIs (RxNorm, FDA Orange Book, etc.)
-- Insurance verification APIs
-- Pharmacy networks APIs
-- Healthcare provider directories
```

---

## 📋 Data Migration & Backup Strategy

### Backup Tables Structure
```sql
-- Historical data archival
CREATE TABLE dose_events_archive LIKE dose_events;
CREATE TABLE notification_history_archive LIKE notification_history;
CREATE TABLE audit_logs_archive LIKE audit_logs;

-- Regular archival procedure (monthly)
DELIMITER //
CREATE PROCEDURE ArchiveOldData()
BEGIN
    -- Archive dose events older than 2 years
    INSERT INTO dose_events_archive 
    SELECT * FROM dose_events 
    WHERE scheduled_datetime < DATE_SUB(NOW(), INTERVAL 2 YEAR);
    
    DELETE FROM dose_events 
    WHERE scheduled_datetime < DATE_SUB(NOW(), INTERVAL 2 YEAR);
    
    -- Similar for other tables...
END //
DELIMITER ;
```

---

## 🔧 Database Configuration

### Recommended MySQL Settings
```ini
# my.cnf optimizations for PrescripCare
[mysqld]
innodb_buffer_pool_size = 4G
innodb_log_file_size = 512M
innodb_flush_log_at_trx_commit = 2
innodb_thread_concurrency = 16

# For better JSON handling
innodb_default_row_format = DYNAMIC

# For full-text search
ft_min_word_len = 3
ft_stopword_file = ''

# Timezone handling
default_time_zone = '+00:00'
```

---

## 📊 Reporting & Analytics Queries

### Common Analytics Queries
```sql
-- User adherence trends
SELECT 
    DATE_FORMAT(period_start, '%Y-%m') as month,
    AVG(adherence_percentage) as avg_adherence,
    COUNT(DISTINCT user_id) as active_users
FROM adherence_summaries 
WHERE period_type = 'monthly' 
    AND period_start >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(period_start, '%Y-%m')
ORDER BY month;

-- Most prescribed medications
SELECT 
    dm.drug_name,
    dm.generic_name,
    COUNT(*) as prescription_count,
    AVG(adherence_percentage) as avg_adherence
FROM user_medications um
JOIN drugs_master dm ON um.drug_id = dm.drug_id
LEFT JOIN (
    SELECT medication_id, AVG(adherence_percentage) as adherence_percentage
    FROM adherence_summaries 
    WHERE period_type = 'monthly'
    GROUP BY medication_id
) as_avg ON um.medication_id = as_avg.medication_id
WHERE um.status = 'active'
GROUP BY dm.drug_id, dm.drug_name, dm.generic_name
ORDER BY prescription_count DESC
LIMIT 20;
```

This comprehensive database blueprint provides a solid foundation for the PrescripCare system, ensuring scalability, security, and comprehensive healthcare data management.