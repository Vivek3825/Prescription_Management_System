# 🔗 PrescripCare API Documentation

## API Architecture Overview

The PrescripCare system would implement a RESTful API architecture with GraphQL support for complex queries. This document outlines the complete API structure that would integrate with the database blueprint.

## 🏗️ API Structure

### Base URL
```
Production: https://api.prescripcare.com/v1
Staging: https://staging-api.prescripcare.com/v1
Development: http://localhost:8000/api/v1
```

### Authentication
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 🔐 Authentication Endpoints

### POST /auth/register
Create a new user account with comprehensive profile data.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-05-15",
    "gender": "male",
    "phoneNumber": "+1234567890",
    "heightCm": 175,
    "weightKg": 74.5,
    "bloodType": "O+",
    "address": {
      "line1": "123 Main St",
      "city": "Boston",
      "state": "MA",
      "postalCode": "02101",
      "country": "US"
    },
    "emergencyContact": {
      "name": "Jane Doe",
      "phone": "+1234567891"
    }
  },
  "medicalConditions": [
    {
      "name": "Type 2 Diabetes",
      "severity": "moderate",
      "diagnosedDate": "2020-03-10"
    }
  ],
  "allergies": [
    {
      "allergen": "Penicillin",
      "type": "drug",
      "severity": "moderate",
      "symptoms": "Rash, itching"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid-here",
    "email": "user@example.com",
    "profile": { "..." },
    "tokens": {
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token",
      "expiresIn": 3600
    }
  }
}
```

### POST /auth/login
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "deviceInfo": {
    "deviceType": "mobile",
    "deviceName": "iPhone 14",
    "appVersion": "1.2.0"
  }
}
```

### POST /auth/logout
```json
{
  "sessionId": "session-uuid",
  "allDevices": false
}
```

---

## 👤 User Profile Endpoints

### GET /users/profile
Get complete user profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "age": 32,
      "bmi": 24.2,
      "bmiCategory": "Normal weight",
      "lastUpdated": "2025-10-13T10:30:00Z"
    },
    "medicalConditions": [...],
    "allergies": [...],
    "preferences": {
      "timezone": "America/New_York",
      "language": "en",
      "notifications": {...}
    }
  }
}
```

### PUT /users/profile
Update user profile information.

### GET /users/health-metrics
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "type": "weight",
        "value": 74.5,
        "unit": "kg",
        "recordedAt": "2025-10-13T08:00:00Z",
        "trend": "stable"
      },
      {
        "type": "blood_pressure_systolic",
        "value": 120,
        "unit": "mmHg",
        "recordedAt": "2025-10-13T08:00:00Z"
      }
    ],
    "summary": {
      "weightTrend": "stable",
      "bpTrend": "improving",
      "lastMeasurement": "2025-10-13T08:00:00Z"
    }
  }
}
```

### POST /users/health-metrics
Record new health metric.

---

## 💊 Medication Management Endpoints

### GET /medications
Get user's medication list with adherence data.

**Query Parameters:**
- `status`: active, completed, discontinued
- `include`: schedules, adherence, interactions

**Response:**
```json
{
  "success": true,
  "data": {
    "medications": [
      {
        "medicationId": "uuid",
        "drug": {
          "drugId": "uuid",
          "name": "Metformin",
          "genericName": "Metformin hydrochloride",
          "strength": "500mg",
          "dosageForm": "tablet"
        },
        "prescription": {
          "prescriber": "Dr. Smith",
          "prescriptionNumber": "RX123456",
          "startDate": "2025-01-01",
          "endDate": null,
          "refillsRemaining": 3
        },
        "schedule": [
          {
            "scheduleId": "uuid",
            "time": "08:00",
            "doseAmount": "1 tablet",
            "instructions": "Take with breakfast"
          },
          {
            "scheduleId": "uuid",
            "time": "20:00",
            "doseAmount": "1 tablet",
            "instructions": "Take with dinner"
          }
        ],
        "adherence": {
          "currentStreak": 15,
          "monthlyPercentage": 89.5,
          "lastTaken": "2025-10-13T08:15:00Z"
        },
        "status": "active"
      }
    ],
    "summary": {
      "totalActive": 4,
      "averageAdherence": 87.3,
      "nextDueTime": "2025-10-13T14:30:00Z"
    }
  }
}
```

### POST /medications
Add new medication.

**Request Body:**
```json
{
  "drugId": "uuid-from-drug-search",
  "strength": "500mg",
  "dosageForm": "tablet",
  "prescription": {
    "prescriber": "Dr. Smith",
    "prescriptionNumber": "RX123456",
    "pharmacy": "CVS Pharmacy",
    "startDate": "2025-10-13",
    "quantity": 60,
    "refills": 5
  },
  "schedule": [
    {
      "time": "08:00",
      "doseAmount": "1 tablet",
      "instructions": "Take with food"
    },
    {
      "time": "20:00",
      "doseAmount": "1 tablet",
      "instructions": "Take with food"
    }
  ],
  "specialInstructions": "Do not crush or chew"
}
```

### PUT /medications/{medicationId}
Update medication details.

### DELETE /medications/{medicationId}
Discontinue medication.

---

## 📅 Dose Tracking Endpoints

### GET /doses/calendar
Get dose calendar data for specified month.

**Query Parameters:**
- `year`: 2025
- `month`: 10
- `medicationId`: uuid (optional, for specific medication)

**Response:**
```json
{
  "success": true,
  "data": {
    "month": "2025-10",
    "calendar": [
      {
        "date": "2025-10-01",
        "doses": [
          {
            "scheduleId": "uuid",
            "medicationName": "Metformin 500mg",
            "scheduledTime": "08:00",
            "status": "taken",
            "actualTime": "08:15:00",
            "notes": null
          },
          {
            "scheduleId": "uuid",
            "medicationName": "Metformin 500mg",
            "scheduledTime": "20:00",
            "status": "missed",
            "actualTime": null,
            "notes": "Forgot during dinner"
          }
        ],
        "adherencePercentage": 50.0
      }
    ],
    "summary": {
      "totalScheduledDoses": 60,
      "takenDoses": 54,
      "missedDoses": 4,
      "snoozedDoses": 2,
      "monthlyAdherence": 90.0,
      "currentStreak": 15
    }
  }
}
```

### POST /doses/record
Record a dose event.

**Request Body:**
```json
{
  "scheduleId": "uuid",
  "scheduledDateTime": "2025-10-13T08:00:00Z",
  "status": "taken",
  "actualDateTime": "2025-10-13T08:15:00Z",
  "doseAmountTaken": "1 tablet",
  "takenWithFood": true,
  "location": "home",
  "notes": "Felt slightly nauseous after taking",
  "sideEffects": ["nausea"]
}
```

### GET /doses/upcoming
Get upcoming doses for today.

**Response:**
```json
{
  "success": true,
  "data": {
    "upcomingDoses": [
      {
        "scheduleId": "uuid",
        "medicationName": "Lisinopril 10mg",
        "scheduledTime": "14:30:00",
        "doseAmount": "1 tablet",
        "instructions": "Take with or without food",
        "timeUntilDue": "2 hours 15 minutes",
        "reminderSet": true
      }
    ],
    "overdueDoses": [
      {
        "scheduleId": "uuid",
        "medicationName": "Vitamin D3",
        "scheduledTime": "12:00:00",
        "overdueBy": "15 minutes"
      }
    ]
  }
}
```

---

## 🔔 Notification Endpoints

### GET /notifications/preferences
Get user notification preferences.

### PUT /notifications/preferences
Update notification preferences.

**Request Body:**
```json
{
  "medicationReminders": true,
  "missedDoseAlerts": true,
  "refillReminders": true,
  "interactionWarnings": true,
  "deliveryMethods": {
    "push": true,
    "email": true,
    "sms": false
  },
  "reminderAdvanceMinutes": 15,
  "quietHours": {
    "start": "22:00",
    "end": "07:00"
  }
}
```

### GET /notifications/history
Get notification history.

### POST /notifications/test
Send test notification to verify delivery.

### POST /notifications/snooze
Snooze a specific notification.

---

## 🔍 Drug Information Endpoints

### GET /drugs/search
Search drug database.

**Query Parameters:**
- `q`: search term
- `type`: name, generic, brand
- `limit`: number of results (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "drugId": "uuid",
        "name": "Metformin",
        "genericName": "Metformin hydrochloride",
        "brandNames": ["Glucophage", "Fortamet"],
        "drugClass": "Biguanide",
        "therapeuticCategory": "Antidiabetic",
        "availableStrengths": ["500mg", "850mg", "1000mg"],
        "dosageForms": ["tablet", "extended-release tablet"]
      }
    ],
    "totalResults": 45,
    "searchTime": "0.023s"
  }
}
```

### GET /drugs/{drugId}
Get detailed drug information.

**Response:**
```json
{
  "success": true,
  "data": {
    "drugId": "uuid",
    "name": "Metformin",
    "genericName": "Metformin hydrochloride",
    "details": {
      "description": "Metformin is an oral antidiabetic drug...",
      "mechanism": "Decreases hepatic glucose production...",
      "indications": ["Type 2 diabetes mellitus"],
      "contraindications": ["Severe renal impairment", "Metabolic acidosis"],
      "sideEffects": {
        "common": ["Nausea", "Diarrhea", "Abdominal discomfort"],
        "serious": ["Lactic acidosis", "Vitamin B12 deficiency"],
        "rare": ["Skin reactions"]
      },
      "warnings": ["Risk of lactic acidosis", "Renal function monitoring"],
      "pregnancyCategory": "B",
      "storageConditions": "Store at room temperature"
    },
    "interactions": {
      "majorInteractions": 3,
      "moderateInteractions": 8,
      "minorInteractions": 12
    }
  }
}
```

### GET /drugs/{drugId}/interactions
Get drug interaction information.

### POST /drugs/interaction-check
Check interactions between multiple drugs.

**Request Body:**
```json
{
  "drugIds": ["uuid1", "uuid2", "uuid3"],
  "userAllergies": ["penicillin"],
  "medicalConditions": ["kidney_disease"]
}
```

---

## 📊 Analytics & Reports Endpoints

### GET /analytics/adherence
Get adherence analytics.

**Query Parameters:**
- `period`: daily, weekly, monthly, yearly
- `startDate`: ISO date
- `endDate`: ISO date
- `medicationId`: uuid (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "monthly",
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-10-13"
    },
    "adherenceData": [
      {
        "period": "2025-01",
        "adherencePercentage": 92.5,
        "dosesScheduled": 62,
        "dosesTaken": 57,
        "dosesMissed": 5
      }
    ],
    "trends": {
      "overall": "improving",
      "averageAdherence": 89.3,
      "bestMonth": "2025-09",
      "consistencyScore": 85.2
    },
    "recommendations": [
      "Consider setting additional reminders for evening doses",
      "Your adherence has improved 12% over the last 3 months"
    ]
  }
}
```

### GET /analytics/health-trends
Get health metrics trends.

### GET /analytics/medication-effectiveness
Analyze medication effectiveness based on health metrics.

---

## 🏥 Healthcare Provider Endpoints

### GET /providers
Get user's healthcare providers.

### POST /providers
Add new healthcare provider.

### GET /providers/search
Search healthcare provider directory.

---

## 🏪 Pharmacy Endpoints

### GET /pharmacies/search
Search nearby pharmacies.

**Query Parameters:**
- `lat`: latitude
- `lng`: longitude
- `radius`: search radius in miles
- `services`: delivery, consultation, immunization

### GET /pharmacies/{pharmacyId}
Get pharmacy details.

---

## 🎯 Lifestyle & Goals Endpoints

### GET /lifestyle/recommendations
Get personalized lifestyle recommendations.

**Response:**
```json
{
  "success": true,
  "data": {
    "dietary": {
      "recommendations": [
        {
          "category": "carbohydrates",
          "recommendation": "Focus on complex carbohydrates",
          "reason": "Better blood sugar control with diabetes",
          "examples": ["oatmeal", "quinoa", "sweet potatoes"]
        }
      ],
      "restrictions": [
        {
          "item": "alcohol",
          "reason": "Potential interaction with Metformin",
          "severity": "moderate"
        }
      ]
    },
    "exercise": {
      "weeklyPlan": [
        {
          "day": "monday",
          "activity": "30-minute walk",
          "intensity": "moderate",
          "duration": 30
        }
      ],
      "restrictions": ["avoid high-intensity exercise 2 hours after medication"]
    },
    "wellness": {
      "sleepTarget": "7-9 hours",
      "hydrationTarget": "8-10 glasses daily",
      "stressManagement": ["meditation", "deep breathing exercises"]
    }
  }
}
```

### GET /goals
Get user's health goals.

### POST /goals
Create new health goal.

### PUT /goals/{goalId}
Update health goal.

---

## 🚨 Emergency Endpoints

### POST /emergency/alert
Send emergency alert to healthcare providers.

### GET /emergency/contacts
Get emergency contact information.

### POST /emergency/medication-override
Override medication schedule in emergency situations.

---

## 📱 Device Integration Endpoints

### POST /devices/register
Register mobile device for push notifications.

### GET /devices
Get registered devices.

### DELETE /devices/{deviceId}
Unregister device.

---

## 🔐 Security Endpoints

### POST /security/change-password
Change user password.

### POST /security/enable-2fa
Enable two-factor authentication.

### GET /security/audit-log
Get user activity audit log.

### POST /security/report-incident
Report security incident or concern.

---

## 📊 Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email format is invalid"
      }
    ],
    "timestamp": "2025-10-13T10:30:00Z",
    "requestId": "req-uuid"
  }
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED` (401)
- `INSUFFICIENT_PERMISSIONS` (403)
- `RESOURCE_NOT_FOUND` (404)
- `VALIDATION_ERROR` (422)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_SERVER_ERROR` (500)

---

## 🔄 WebSocket Events

### Real-time Medication Reminders
```javascript
// Connect to WebSocket
const ws = new WebSocket('wss://api.prescripcare.com/ws');

// Listen for medication reminders
ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  
  if (data.type === 'medication_reminder') {
    // Show reminder notification
  }
  
  if (data.type === 'interaction_alert') {
    // Show interaction warning
  }
};
```

### Event Types
- `medication_reminder`
- `interaction_alert`
- `adherence_milestone`
- `refill_reminder`
- `appointment_reminder`

---

## 📈 Rate Limiting

### Rate Limits by Endpoint Category
- **Authentication**: 5 requests per minute
- **User Profile**: 100 requests per hour
- **Medications**: 200 requests per hour
- **Dose Recording**: 500 requests per hour
- **Search**: 1000 requests per hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634123456
```

---

## 🔍 GraphQL Schema (Optional)

For complex queries, a GraphQL endpoint would be available:

```graphql
type Query {
  user: User
  medications(status: MedicationStatus): [Medication]
  doseCalendar(year: Int!, month: Int!): DoseCalendar
  drugSearch(query: String!, limit: Int): DrugSearchResult
  adherenceAnalytics(period: Period!, startDate: Date, endDate: Date): AdherenceAnalytics
}

type Mutation {
  recordDose(input: DoseRecordInput!): DoseEvent
  addMedication(input: MedicationInput!): Medication
  updateProfile(input: ProfileInput!): User
}

type Subscription {
  medicationReminders: MedicationReminder
  interactionAlerts: InteractionAlert
}
```

This comprehensive API documentation provides a complete integration blueprint for the PrescripCare frontend with a robust backend system.