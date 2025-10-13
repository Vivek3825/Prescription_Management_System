// Demo data and functionality for PrescripCare
// This file contains sample data and demo functions to showcase the application

// Sample user data for demo
const demoUsers = {
    'john.doe@email.com': {
        name: 'John Doe',
        email: 'john.doe@email.com',
        age: 32,
        gender: 'male',
        weight: 74,
        height: 175,
        contact: '+1 234 567 8900',
        bmi: 24.2,
        medicalCondition: 'Type 2 Diabetes, Hypertension',
        password: 'demo123'
    },
    'jane.smith@email.com': {
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        age: 28,
        gender: 'female',
        weight: 58,
        height: 165,
        contact: '+1 234 567 8901',
        bmi: 21.3,
        medicalCondition: 'Mild Anxiety, Vitamin D Deficiency',
        password: 'demo123'
    }
};

// Sample medications
const demoMedications = [
    {
        id: 1,
        name: 'Metformin',
        strength: '500mg',
        frequency: 'twice',
        instructions: 'Take with meals',
        category: 'Diabetes',
        sideEffects: ['Nausea', 'Diarrhea', 'Stomach upset'],
        interactions: ['Alcohol', 'Iodinated contrast agents']
    },
    {
        id: 2,
        name: 'Lisinopril',
        strength: '10mg',
        frequency: 'once',
        instructions: 'Take in the evening',
        category: 'Blood Pressure',
        sideEffects: ['Dry cough', 'Dizziness', 'Headache'],
        interactions: ['NSAIDs', 'Potassium supplements']
    },
    {
        id: 3,
        name: 'Vitamin D3',
        strength: '2000 IU',
        frequency: 'once',
        instructions: 'Take with fat-containing meal',
        category: 'Supplement',
        sideEffects: ['Rare: nausea if overdosed'],
        interactions: ['Thiazide diuretics']
    },
    {
        id: 4,
        name: 'Atorvastatin',
        strength: '20mg',
        frequency: 'once',
        instructions: 'Take at bedtime',
        category: 'Cholesterol',
        sideEffects: ['Muscle pain', 'Fatigue', 'Liver enzyme elevation'],
        interactions: ['Grapefruit juice', 'Warfarin']
    }
];

// Sample dose history for the current month
function generateDemoHistory() {
    const history = {};
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Generate history for the current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateKey = formatDateKey(date);
        
        // Skip future dates
        if (date > today) continue;
        
        // Generate random adherence pattern (mostly good with some missed doses)
        const adherenceRate = Math.random();
        let doses = [];
        
        // Morning dose (8 AM)
        doses.push({
            time: '08:00',
            medication: 'Metformin 500mg',
            status: adherenceRate > 0.1 ? 'taken' : 'missed'
        });
        
        // Lunch dose (12 PM)
        doses.push({
            time: '12:00',
            medication: 'Vitamin D3 2000 IU',
            status: adherenceRate > 0.05 ? 'taken' : 'missed'
        });
        
        // Afternoon dose (2:30 PM)
        if (Math.random() > 0.3) { // Not every day
            doses.push({
                time: '14:30',
                medication: 'Lisinopril 10mg',
                status: adherenceRate > 0.15 ? 'taken' : (Math.random() > 0.7 ? 'snoozed' : 'missed')
            });
        }
        
        // Evening dose (8 PM)
        doses.push({
            time: '20:00',
            medication: 'Metformin 500mg',
            status: adherenceRate > 0.2 ? 'taken' : 'missed'
        });
        
        // Bedtime dose (10 PM)
        if (Math.random() > 0.4) { // Not every day
            doses.push({
                time: '22:00',
                medication: 'Atorvastatin 20mg',
                status: adherenceRate > 0.1 ? 'taken' : 'missed'
            });
        }
        
        history[dateKey] = { doses };
    }
    
    return history;
}

// Enhanced calendar generation with demo data
function generateDemoCalendar() {
    const calendar = document.getElementById('doseCalendar');
    if (!calendar) return;
    
    calendar.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        header.style.cssText = `
            background: #f8fafc;
            padding: 1rem;
            text-align: center;
            font-weight: 600;
            color: #64748b;
            font-size: 0.875rem;
        `;
        calendar.appendChild(header);
    });
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthDisplay = document.getElementById('currentMonth');
    if (monthDisplay) {
        monthDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }
    
    // Generate demo history if not exists
    if (Object.keys(doseHistory).length === 0) {
        doseHistory = generateDemoHistory();
    }
    
    // Generate calendar days
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (date.getMonth() !== currentMonth) {
            dayElement.classList.add('other-month');
        }
        
        if (isToday(date)) {
            dayElement.classList.add('today');
        }
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayElement.appendChild(dayNumber);
        
        // Add dose indicators with demo data
        const indicators = createDemoIndicators(date);
        dayElement.appendChild(indicators);
        
        dayElement.addEventListener('click', () => showDemoDay(date));
        
        calendar.appendChild(dayElement);
    }
    
    // Update statistics
    updateAdherenceStats();
}

function createDemoIndicators(date) {
    const indicators = document.createElement('div');
    indicators.className = 'dose-indicators';
    
    const dateKey = formatDateKey(date);
    const dayData = doseHistory[dateKey];
    
    if (dayData && dayData.doses) {
        dayData.doses.forEach(dose => {
            const dot = document.createElement('div');
            dot.className = `dose-dot ${dose.status}`;
            dot.title = `${dose.time} - ${dose.medication} (${dose.status})`;
            indicators.appendChild(dot);
        });
    }
    
    return indicators;
}

function showDemoDay(date) {
    const dateKey = formatDateKey(date);
    const dayData = doseHistory[dateKey];
    
    const dateStr = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    let content = `<h3>${dateStr}</h3>`;
    
    if (dayData && dayData.doses && dayData.doses.length > 0) {
        content += '<div class="day-doses">';
        dayData.doses.forEach(dose => {
            const statusIcon = getStatusIcon(dose.status);
            const statusColor = getStatusColor(dose.status);
            content += `
                <div class="dose-item" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; margin: 0.5rem 0; background: ${statusColor}20; border-radius: 8px; border-left: 3px solid ${statusColor};">
                    <span style="color: ${statusColor}; font-size: 1.125rem;">${statusIcon}</span>
                    <div>
                        <div style="font-weight: 500; color: #1f2937;">${dose.time}</div>
                        <div style="font-size: 0.875rem; color: #6b7280;">${dose.medication}</div>
                        <div style="font-size: 0.75rem; color: ${statusColor}; text-transform: capitalize;">${dose.status}</div>
                    </div>
                </div>
            `;
        });
        content += '</div>';
        
        // Calculate day adherence
        const takenDoses = dayData.doses.filter(d => d.status === 'taken').length;
        const totalDoses = dayData.doses.length;
        const adherence = Math.round((takenDoses / totalDoses) * 100);
        
        content += `
            <div style="margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px;">
                <h4 style="margin: 0 0 0.5rem 0; color: #374151;">Day Summary</h4>
                <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: #6b7280;">
                    <span>Doses taken: ${takenDoses}/${totalDoses}</span>
                    <span>Adherence: ${adherence}%</span>
                </div>
            </div>
        `;
    } else {
        content += '<p style="color: #6b7280; font-style: italic;">No doses scheduled for this day.</p>';
    }
    
    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-container">
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            <div class="modal-content">
                ${content}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function getStatusIcon(status) {
    const icons = {
        taken: '✓',
        missed: '✗',
        snoozed: '⏰',
        partial: '◐'
    };
    return icons[status] || '?';
}

function getStatusColor(status) {
    const colors = {
        taken: '#10b981',
        missed: '#ef4444',
        snoozed: '#f59e0b',
        partial: '#64748b'
    };
    return colors[status] || '#64748b';
}

function updateAdherenceStats() {
    // Calculate overall adherence for current month
    let totalDoses = 0;
    let takenDoses = 0;
    let streak = 0;
    
    Object.values(doseHistory).forEach(day => {
        if (day.doses) {
            totalDoses += day.doses.length;
            const dayTaken = day.doses.filter(d => d.status === 'taken').length;
            takenDoses += dayTaken;
            
            // Simple streak calculation (full day adherence)
            if (dayTaken === day.doses.length) {
                streak++;
            }
        }
    });
    
    const adherencePercentage = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;
    
    // Update counter displays
    const streakElement = document.querySelector('.counter-card .counter-number');
    if (streakElement) {
        streakElement.textContent = streak;
    }
    
    const adherenceElement = document.querySelectorAll('.counter-card .counter-number')[1];
    if (adherenceElement) {
        adherenceElement.textContent = `${adherencePercentage}%`;
    }
}

// Enhanced medication display
function displayDemoMedications() {
    const medicationsGrid = document.querySelector('.medications-grid');
    if (!medicationsGrid) return;
    
    medicationsGrid.innerHTML = '';
    
    demoMedications.forEach(med => {
        const medCard = document.createElement('div');
        medCard.className = 'medication-card';
        medCard.innerHTML = `
            <div class="med-header">
                <h3>${med.name}</h3>
                <span class="med-strength">${med.strength}</span>
            </div>
            <div class="med-info">
                <div class="med-detail">
                    <i class="fas fa-clock"></i>
                    <span>${getFrequencyText(med.frequency)}</span>
                </div>
                <div class="med-detail">
                    <i class="fas fa-info-circle"></i>
                    <span>${med.instructions}</span>
                </div>
                <div class="med-detail">
                    <i class="fas fa-tag"></i>
                    <span>${med.category}</span>
                </div>
            </div>
            <div class="med-actions">
                <button class="btn-icon" title="Edit" onclick="editMedication(${med.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" title="Drug Info" onclick="showDrugInfo(${med.id})">
                    <i class="fas fa-info-circle"></i>
                </button>
                <button class="btn-icon" title="Delete" onclick="deleteMedication(${med.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        medicationsGrid.appendChild(medCard);
    });
}

function getFrequencyText(frequency) {
    const frequencies = {
        once: 'Once daily',
        twice: 'Twice daily',
        thrice: 'Three times daily',
        four: 'Four times daily'
    };
    return frequencies[frequency] || frequency;
}

function showDrugInfo(medId) {
    const medication = demoMedications.find(m => m.id === medId);
    if (!medication) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 600px;">
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            <div class="modal-header">
                <h2>${medication.name} (${medication.strength})</h2>
                <p>Comprehensive drug information</p>
            </div>
            <div class="drug-info-content">
                <div class="info-section">
                    <h3><i class="fas fa-pills"></i> Basic Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <strong>Category:</strong> ${medication.category}
                        </div>
                        <div class="info-item">
                            <strong>Strength:</strong> ${medication.strength}
                        </div>
                        <div class="info-item">
                            <strong>Frequency:</strong> ${getFrequencyText(medication.frequency)}
                        </div>
                        <div class="info-item">
                            <strong>Instructions:</strong> ${medication.instructions}
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h3><i class="fas fa-exclamation-triangle"></i> Side Effects</h3>
                    <ul class="side-effects-list">
                        ${medication.sideEffects.map(effect => `<li>${effect}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="info-section">
                    <h3><i class="fas fa-shield-alt"></i> Drug Interactions</h3>
                    <div class="interactions-list">
                        ${medication.interactions.map(interaction => `
                            <div class="interaction-item">
                                <i class="fas fa-exclamation-circle" style="color: #f59e0b;"></i>
                                <span>${interaction}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add styles for the modal content
    const style = document.createElement('style');
    style.textContent = `
        .drug-info-content {
            max-height: 400px;
            overflow-y: auto;
        }
        .info-section {
            margin-bottom: 2rem;
        }
        .info-section h3 {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
            color: #374151;
            font-size: 1.125rem;
        }
        .info-grid {
            display: grid;
            gap: 0.75rem;
        }
        .info-item {
            padding: 0.75rem;
            background: #f8fafc;
            border-radius: 6px;
            font-size: 0.875rem;
        }
        .side-effects-list {
            list-style: none;
            padding: 0;
        }
        .side-effects-list li {
            padding: 0.5rem;
            background: #fef3c7;
            margin-bottom: 0.5rem;
            border-radius: 6px;
            border-left: 3px solid #f59e0b;
        }
        .interactions-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .interaction-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem;
            background: #fef2f2;
            border-radius: 6px;
            border-left: 3px solid #ef4444;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
}

function editMedication(medId) {
    showNotification('Edit medication feature will be implemented in the next version', 'info');
}

function deleteMedication(medId) {
    if (confirm('Are you sure you want to delete this medication?')) {
        showNotification('Medication deleted successfully', 'success');
        // In a real app, this would remove the medication and update the display
    }
}

// Initialize demo data when user logs in
function initializeDemoData() {
    if (currentUser) {
        // Set demo medications
        medications = [...demoMedications];
        
        // Generate demo history if empty
        if (Object.keys(doseHistory).length === 0) {
            doseHistory = generateDemoHistory();
        }
        
        // Display medications in the medications tab
        displayDemoMedications();
        
        // Update calendar with demo data
        generateDemoCalendar();
        
        console.log('Demo data initialized');
    }
}

// Enhanced calendar generation with demo data (no override)
function generateDemoCalendarIfNeeded() {
    if (currentUser && Object.keys(doseHistory).length > 0) {
        generateDemoCalendar();
    }
}

// Enhanced medication display (no override)
function displayDemoMedicationsIfNeeded() {
    if (currentUser) {
        displayDemoMedications();
    }
}

// Demo login enhancement (no override)
function enhanceLoginWithDemo(email, password) {
    // Check demo users first
    if (demoUsers[email] && demoUsers[email].password === password) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = { ...demoUsers[email] };
                delete user.password;
                resolve(user);
            }, 1000);
        });
    }
    return null;
}

console.log('Demo functionality loaded. Try logging in with:');
console.log('Email: john.doe@email.com, Password: demo123');
console.log('Email: jane.smith@email.com, Password: demo123');