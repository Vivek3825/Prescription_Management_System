// Global state management
let currentUser = null;
let currentStep = 1;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let medications = [];
let doseHistory = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    await initializeApp();
    generateCalendar();
    initializeEventListeners();
    await initializeNotifications();
});

async function initializeApp() {
    // Check if user is logged in
    const savedUser = localStorage.getItem('prescripcare_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
        
        // Load user data from database
        await loadUserData();
    } else {
        showLandingPage();
    }
}

function initializeEventListeners() {
    // Form validation listeners
    const weightInput = document.getElementById('weight');
    const heightInput = document.getElementById('height');
    
    if (weightInput && heightInput) {
        weightInput.addEventListener('input', calculateBMI);
        heightInput.addEventListener('input', calculateBMI);
    }
    
    // Tab navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Modal close on background click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    });
}

// Authentication functions
function showLogin() {
    closeModal();
    document.getElementById('loginModal').classList.add('active');
    setTimeout(() => {
        document.getElementById('loginEmail').focus();
    }, 300);
}

function showSignup() {
    closeModal();
    document.getElementById('signupModal').classList.add('active');
    currentStep = 1;
    updateStepIndicator();
    showStep(1);
    setTimeout(() => {
        document.getElementById('fullName').focus();
    }, 300);
}

function closeModal() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
    });
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('Please enter email and password', 'error');
        return;
    }
    
    showLoadingState('Signing in...');
    
    try {
        // Check for demo user first
        const demoUser = await enhanceLoginWithDemo(email, password);
        if (demoUser) {
            currentUser = {
                user_id: csvDB.generateUUID(),
                name: demoUser.name,
                email: demoUser.email,
                age: demoUser.age,
                gender: demoUser.gender,
                weight: demoUser.weight,
                height: demoUser.height,
                contact: demoUser.contact,
                bmi: demoUser.bmi,
                medicalCondition: demoUser.medicalCondition,
                account_status: 'active'
            };
            
            localStorage.setItem('prescripcare_user', JSON.stringify(currentUser));
            closeModal();
            showDashboard();
            showNotification('Welcome back!', 'success');
            hideLoadingState();
            return;
        }

        // Find user in database
        const users = await csvDB.findBy('users', { email: email });
        
        if (users.length === 0) {
            hideLoadingState();
            showNotification('User not found', 'error');
            return;
        }
        
        const user = users[0];
        
        // Get user profile data with error handling
        const userWithProfile = await csvDB.getUserWithProfile(user.user_id);
        
        if (!userWithProfile) {
            hideLoadingState();
            showNotification('User profile not found', 'error');
            return;
        }

        // Handle case where profile might be missing
        const profile = userWithProfile.profile || {
            first_name: 'Unknown',
            last_name: 'User',
            date_of_birth: '1990-01-01',
            gender: 'prefer_not_to_say',
            weight_kg: 70,
            height_cm: 170,
            phone_number: ''
        };
        
        // Create unified user object compatible with frontend
        currentUser = {
            user_id: user.user_id,
            name: `${profile.first_name} ${profile.last_name}`,
            email: user.email,
            age: calculateAge(profile.date_of_birth),
            gender: profile.gender,
            weight: profile.weight_kg || 70,
            height: profile.height_cm || 170,
            contact: profile.phone_number || '',
            bmi: calculateBMI(profile.weight_kg || 70, profile.height_cm || 170),
            medicalCondition: '', // Will be loaded separately
            account_status: user.account_status,
            created_at: user.created_at
        };
        
        // Load medical conditions with error handling
        try {
            const conditions = await csvDB.findBy('user_medical_conditions', { user_id: user.user_id });
            currentUser.medicalCondition = conditions.map(c => c.condition_name).join(', ') || 'No medical conditions reported';
        } catch (conditionError) {
            console.warn('Error loading medical conditions:', conditionError);
            currentUser.medicalCondition = 'No medical conditions reported';
        }
        
        localStorage.setItem('prescripcare_user', JSON.stringify(currentUser));
        closeModal();
        showDashboard();
        showNotification('Welcome back!', 'success');
        hideLoadingState();
        
    } catch (error) {
        console.error('Login error:', error);
        hideLoadingState();
        showNotification('Login failed. Please try again.', 'error');
    }
}

// Helper function to calculate age from date of birth with error handling
function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 0;
    
    try {
        const today = new Date();
        const birthDate = parseDatabaseDate(dateOfBirth) || new Date(dateOfBirth);
        
        if (isNaN(birthDate.getTime())) return 0;
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return Math.max(0, age);
    } catch (error) {
        console.warn('Error calculating age:', error);
        return 0;
    }
}

// Helper function to calculate BMI
function calculateBMI(weight, height) {
    if (!weight || !height) return 0;
    const heightInMeters = height / 100;
    return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

async function handleSignup(event) {
    event.preventDefault();
    
    if (!validateCurrentStep()) {
        return;
    }
    
    showLoadingState('Creating your account...');
    
    try {
        // Collect all form data
        const fullName = document.getElementById('fullName').value;
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const formData = {
            email: document.getElementById('email').value,
            age: parseInt(document.getElementById('age').value),
            gender: document.getElementById('gender').value,
            contact: document.getElementById('contactNo').value,
            weight: parseFloat(document.getElementById('weight').value),
            height: parseInt(document.getElementById('height').value),
            medicalCondition: document.getElementById('medicalCondition').value,
            password: document.getElementById('password').value
        };
        
        // Calculate BMI and date of birth
        const heightInMeters = formData.height / 100;
        const bmi = parseFloat((formData.weight / (heightInMeters * heightInMeters)).toFixed(1));
        const dateOfBirth = new Date();
        dateOfBirth.setFullYear(dateOfBirth.getFullYear() - formData.age);
        
        // Create user record
        const newUser = {
            email: formData.email,
            password_hash: `$2b$12$${btoa(formData.password).replace(/[=+/]/g, 'x')}`, // Simple hash for demo
            email_verified: true,
            account_status: 'active',
            two_factor_enabled: false
        };
        
        const addedUser = await csvDB.simulateAdd('users', newUser);
        
        // Create user profile
        const newProfile = {
            user_id: addedUser.user_id,
            first_name: firstName,
            last_name: lastName,
            date_of_birth: formatDatabaseDate(dateOfBirth),
            gender: formData.gender,
            phone_number: formData.contact,
            height_cm: formData.height,
            weight_kg: formData.weight,
            blood_type: 'unknown',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            preferred_language: 'en'
        };
        
        await csvDB.simulateAdd('user_profiles', newProfile);
        
        // Add medical condition if provided
        if (formData.medicalCondition.trim()) {
            const condition = {
                user_id: addedUser.user_id,
                condition_name: formData.medicalCondition,
                diagnosed_date: formatDatabaseDate(new Date()),
                severity: 'unknown',
                status: 'active'
            };
            
            await csvDB.simulateAdd('user_medical_conditions', condition);
        }
        
        // Create user object for frontend
        currentUser = {
            user_id: addedUser.user_id,
            name: fullName,
            email: formData.email,
            age: formData.age,
            gender: formData.gender,
            weight: formData.weight,
            height: formData.height,
            contact: formData.contact,
            bmi: bmi,
            medicalCondition: formData.medicalCondition || 'No medical conditions reported',
            account_status: 'active',
            created_at: addedUser.created_at
        };
        
        localStorage.setItem('prescripcare_user', JSON.stringify(currentUser));
        closeModal();
        showDashboard();
        showNotification('Account created successfully!', 'success');
        hideLoadingState();
        
        // Show welcome tour
        setTimeout(() => {
            showWelcomeTour();
        }, 1000);
        
    } catch (error) {
        console.error('Signup error:', error);
        hideLoadingState();
        showNotification('Failed to create account. Please try again.', 'error');
    }
}

function nextStep() {
    if (!validateCurrentStep()) {
        return;
    }
    
    if (currentStep < 3) {
        currentStep++;
        updateStepIndicator();
        showStep(currentStep);
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepIndicator();
        showStep(currentStep);
    }
}

function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(stepEl => {
        stepEl.classList.remove('active');
    });
    
    // Show current step
    document.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    prevBtn.style.display = step === 1 ? 'none' : 'block';
    nextBtn.style.display = step === 3 ? 'none' : 'block';
    submitBtn.style.display = step === 3 ? 'block' : 'none';
}

function updateStepIndicator() {
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        
        if (index + 1 < currentStep) {
            step.classList.add('completed');
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
        }
    });
}

async function validateCurrentStep() {
    const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const requiredFields = currentStepElement.querySelectorAll('[required]');
    let isValid = true;
    
    // Basic required field validation
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#ef4444';
            const label = field.previousElementSibling?.textContent || field.id;
            showNotification(`Please fill in ${label}`, 'error');
            isValid = false;
        } else {
            field.style.borderColor = '#e2e8f0';
        }
    });
    
    if (!isValid) return false;
    
    // Step-specific validation
    try {
        if (currentStep === 1) {
            // Validate basic information
            const age = parseInt(document.getElementById('age').value);
            if (age < 1 || age > 120) {
                showNotification('Age must be between 1 and 120', 'error');
                return false;
            }
            
            const email = document.getElementById('email').value;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showNotification('Please enter a valid email address', 'error');
                return false;
            }
            
            // Check if email already exists
            try {
                const existingUsers = await csvDB.findBy('users', { email: email });
                if (existingUsers.length > 0) {
                    showNotification('Email already exists. Please use a different email.', 'error');
                    return false;
                }
            } catch (error) {
                console.warn('Could not check email uniqueness:', error);
            }
            
        } else if (currentStep === 2) {
            // Validate physical information
            const weight = parseFloat(document.getElementById('weight').value);
            const height = parseInt(document.getElementById('height').value);
            
            if (weight < 0.1 || weight > 999.99) {
                showNotification('Weight must be between 0.1 and 999.99 kg', 'error');
                return false;
            }
            
            if (height < 50 || height > 300) {
                showNotification('Height must be between 50 and 300 cm', 'error');
                return false;
            }
            
        } else if (currentStep === 3) {
            // Validate medical information and password
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return false;
            }
            
            if (password.length < 6) {
                showNotification('Password must be at least 6 characters long', 'error');
                return false;
            }
            
            // Password strength validation
            const hasUpperCase = /[A-Z]/.test(password);
            const hasLowerCase = /[a-z]/.test(password);
            const hasNumbers = /\d/.test(password);
            
            if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
                showNotification('Password must contain uppercase, lowercase, and numbers', 'warning');
                // Don't block, just warn
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('Error during validation:', error);
        return isValid; // Fall back to basic validation
    }
}

function calculateBMI() {
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseInt(document.getElementById('height').value);
    
    if (weight && height) {
        const heightInMeters = height / 100;
        const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
        
        let category = '';
        if (bmi < 18.5) category = 'Underweight';
        else if (bmi < 25) category = 'Normal weight';
        else if (bmi < 30) category = 'Overweight';
        else category = 'Obese';
        
        document.querySelector('.bmi-value').textContent = bmi;
        document.querySelector('.bmi-category').textContent = category;
        
        // Add color coding
        const bmiValueEl = document.querySelector('.bmi-value');
        bmiValueEl.style.color = getBMIColor(parseFloat(bmi));
    }
}

function getBMIColor(bmi) {
    if (bmi < 18.5) return '#f59e0b';
    else if (bmi < 25) return '#10b981';
    else if (bmi < 30) return '#f59e0b';
    else return '#ef4444';
}

// Dashboard functions
function showLandingPage() {
    document.getElementById('landingPage').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

async function showDashboard() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    if (currentUser) {
        await updateUserInterface();
        await switchTab('overview');
        await initializeNotifications(); // Reinitialize notifications with user data
    }
}

async function updateUserInterface() {
    if (!currentUser) return;
    
    // Update user name in navbar
    document.getElementById('userName').textContent = currentUser.name;
    
    // Update profile information
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileAge').textContent = `${currentUser.age} years`;
    document.getElementById('profileGender').textContent = currentUser.gender.charAt(0).toUpperCase() + currentUser.gender.slice(1);
    document.getElementById('profileContact').textContent = currentUser.contact || 'Not provided';
    document.getElementById('profileHeight').textContent = `${currentUser.height} cm`;
    document.getElementById('profileWeight').textContent = `${currentUser.weight} kg`;
    document.getElementById('profileBMI').textContent = `${currentUser.bmi} (${getBMICategory(currentUser.bmi)})`;
    document.getElementById('profileMedical').querySelector('p').textContent = currentUser.medicalCondition || 'No medical conditions reported';
    
    // Load and display additional profile data from database
    if (currentUser.user_id) {
        try {
            const allergies = await csvDB.findBy('user_allergies', { user_id: currentUser.user_id });
            if (allergies.length > 0) {
                const allergiesText = allergies.map(a => a.allergen_name).join(', ');
                const medicalSection = document.getElementById('profileMedical').parentElement;
                
                // Add allergies section if not exists
                let allergiesSection = medicalSection.querySelector('.allergies-section');
                if (!allergiesSection) {
                    allergiesSection = document.createElement('div');
                    allergiesSection.className = 'allergies-section';
                    allergiesSection.innerHTML = `
                        <h4 style="margin: 1rem 0 0.5rem 0; color: #374151;">Known Allergies</h4>
                        <p style="color: #ef4444; font-weight: 500;">${allergiesText}</p>
                    `;
                    medicalSection.appendChild(allergiesSection);
                } else {
                    allergiesSection.querySelector('p').textContent = allergiesText;
                }
            }
            
            // Load insurance information
            const insurance = await csvDB.findBy('user_insurance', { user_id: currentUser.user_id });
            if (insurance.length > 0) {
                const insuranceData = insurance[0];
                const detailsSection = document.querySelector('.profile-details');
                
                let insuranceSection = detailsSection.querySelector('.insurance-section');
                if (!insuranceSection) {
                    insuranceSection = document.createElement('div');
                    insuranceSection.className = 'detail-section insurance-section';
                    insuranceSection.innerHTML = `
                        <h3>Insurance Information</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Provider</label>
                                <span>${insuranceData.insurance_provider}</span>
                            </div>
                            <div class="detail-item">
                                <label>Plan Type</label>
                                <span>${insuranceData.plan_type}</span>
                            </div>
                            <div class="detail-item">
                                <label>Member ID</label>
                                <span>${insuranceData.member_id}</span>
                            </div>
                            <div class="detail-item">
                                <label>Group Number</label>
                                <span>${insuranceData.group_number || 'N/A'}</span>
                            </div>
                        </div>
                    `;
                    detailsSection.appendChild(insuranceSection);
                }
            }
            
        } catch (error) {
            console.error('Error loading additional profile data:', error);
        }
    }
}

function getBMICategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    else if (bmi < 25) return 'Normal';
    else if (bmi < 30) return 'Overweight';
    else return 'Obese';
}

async function switchTab(tabName) {
    // Update menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    // Special handling for different tabs
    if (tabName === 'calendar') {
        generateCalendar();
    } else if (tabName === 'medications') {
        await refreshMedicationsDisplay();
    } else if (tabName === 'overview') {
        await updateOverviewStats();
    } else if (tabName === 'lifestyle') {
        await updateLifestyleData();
    }
}

async function updateOverviewStats() {
    if (!currentUser || !currentUser.user_id) return;
    
    try {
        // Update medication count
        const medications = await csvDB.getUserMedicationsWithDetails(currentUser.user_id);
        const activeMeds = medications.filter(m => m.status === 'active');
        
        const activeMedsStat = document.querySelector('.stat-card .stat-number');
        if (activeMedsStat) {
            activeMedsStat.textContent = activeMeds.length;
        }
        
        // Update adherence statistics
        const adherenceData = await csvDB.findBy('adherence_summaries', { user_id: currentUser.user_id });
        if (adherenceData.length > 0) {
            const latestAdherence = adherenceData[adherenceData.length - 1];
            
            const adherenceStats = document.querySelectorAll('.stat-card .stat-number');
            if (adherenceStats[2]) { // Streak days
                adherenceStats[2].textContent = latestAdherence.streak_days || 0;
            }
        }
        
        // Update today's schedule from database
        await updateTodaysSchedule();
        
    } catch (error) {
        console.error('Error updating overview stats:', error);
    }
}

async function updateTodaysSchedule() {
    const scheduleContainer = document.querySelector('.medication-schedule');
    if (!scheduleContainer || !currentUser) return;
    
    try {
        const medications = await csvDB.getUserMedicationsWithDetails(currentUser.user_id);
        const today = new Date();
        const todayKey = formatDateKey(today);
        
        scheduleContainer.innerHTML = '';
        
        medications.forEach(med => {
            if (med.dosing_schedule) {
                let schedule = [];
                try {
                    schedule = JSON.parse(med.dosing_schedule);
                } catch (e) {
                    schedule = [];
                }
                
                schedule.forEach(time => {
                    const scheduleItem = document.createElement('div');
                    
                    // Check if dose was taken (from dose history)
                    const wasTaken = doseHistory[todayKey]?.doses?.some(dose => 
                        dose.time === time && dose.medication.includes(med.drug_details?.drug_name || '')
                    );
                    
                    const currentTime = new Date();
                    const [hours, minutes] = time.split(':');
                    const scheduleTime = new Date(today);
                    scheduleTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    
                    let status = 'upcoming';
                    let icon = '<i class="fas fa-clock"></i>';
                    
                    if (wasTaken) {
                        status = 'taken';
                        icon = '<i class="fas fa-check-circle"></i>';
                    } else if (scheduleTime < currentTime) {
                        status = 'missed';
                        icon = '<i class="fas fa-times-circle"></i>';
                    }
                    
                    scheduleItem.className = `schedule-item ${status}`;
                    scheduleItem.innerHTML = `
                        <div class="schedule-time">${time}</div>
                        <div class="schedule-med">${med.drug_details?.drug_name || 'Unknown'} ${med.strength}</div>
                        <div class="schedule-status">${icon}</div>
                    `;
                    
                    scheduleContainer.appendChild(scheduleItem);
                });
            }
        });
        
    } catch (error) {
        console.error('Error updating today\'s schedule:', error);
    }
}

async function updateLifestyleData() {
    if (!currentUser || !currentUser.user_id) return;
    
    try {
        // Load lifestyle goals from database
        const goals = await csvDB.findBy('lifestyle_goals', { user_id: currentUser.user_id });
        
        if (goals.length > 0) {
            const bmiGoal = goals.find(g => g.goal_type === 'bmi');
            const exerciseGoal = goals.find(g => g.goal_type === 'exercise');
            
            // Update BMI progress
            if (bmiGoal) {
                const bmiProgress = document.querySelector('.metric .progress-fill');
                if (bmiProgress) {
                    const progress = Math.min((currentUser.bmi / parseFloat(bmiGoal.target_value)) * 100, 100);
                    bmiProgress.style.width = `${progress}%`;
                }
                
                const bmiValue = document.querySelector('.metric .metric-value');
                if (bmiValue) {
                    bmiValue.textContent = `${currentUser.bmi} / ${bmiGoal.target_value} target`;
                }
            }
            
            // Update exercise progress
            if (exerciseGoal) {
                const exerciseProgress = document.querySelectorAll('.metric .progress-fill')[1];
                if (exerciseProgress) {
                    const progress = Math.min((parseFloat(exerciseGoal.current_value || 0) / parseFloat(exerciseGoal.target_value)) * 100, 100);
                    exerciseProgress.style.width = `${progress}%`;
                }
                
                const exerciseValue = document.querySelectorAll('.metric .metric-value')[1];
                if (exerciseValue) {
                    exerciseValue.textContent = `${exerciseGoal.current_value || 0}/${exerciseGoal.target_value} sessions completed`;
                }
            }
        }
        
    } catch (error) {
        console.error('Error updating lifestyle data:', error);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('prescripcare_user');
        localStorage.removeItem('prescripcare_medications');
        localStorage.removeItem('prescripcare_dose_history');
        currentUser = null;
        showLandingPage();
        showNotification('Logged out successfully', 'info');
    }
}

// Calendar functions
function generateCalendar() {
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
    document.getElementById('currentMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
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
        
        // Add dose indicators
        const indicators = createDoseIndicators(date);
        dayElement.appendChild(indicators);
        
        dayElement.addEventListener('click', () => showDayDetails(date));
        
        calendar.appendChild(dayElement);
    }
}

function createDoseIndicators(date) {
    const indicators = document.createElement('div');
    indicators.className = 'dose-indicators';
    
    const dateKey = formatDateKey(date);
    const dayData = doseHistory[dateKey];
    
    if (dayData && dayData.doses && dayData.doses.length > 0) {
        // Use real dose data from database
        dayData.doses.forEach(dose => {
            const dot = document.createElement('div');
            dot.className = `dose-dot ${dose.status}`;
            dot.title = `${dose.time} - ${dose.medication} (${dose.status})`;
            indicators.appendChild(dot);
        });
    } else {
        // Show placeholder dots for dates without data
        const today = new Date();
        if (date <= today && date.getMonth() === today.getMonth()) {
            // Generate sample doses for past dates in current month
            const sampleCount = Math.floor(Math.random() * 4) + 1;
            for (let i = 0; i < sampleCount; i++) {
                const dot = document.createElement('div');
                const status = Math.random() > 0.15 ? 'taken' : (Math.random() > 0.5 ? 'missed' : 'snoozed');
                dot.className = `dose-dot ${status}`;
                indicators.appendChild(dot);
            }
        }
    }
    
    return indicators;
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

function formatDateKey(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Database compatible date formatting
function formatDatabaseDate(date) {
    if (!date) return null;
    if (typeof date === 'string') {
        date = new Date(date);
    }
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

// Parse database date format with error handling
function parseDatabaseDate(dateString) {
    if (!dateString || dateString === 'NULL') return null;
    
    try {
        // Handle different date formats
        let dateObj;
        if (dateString.includes(' ')) {
            // Format: "2024-01-15 10:30:00"
            dateObj = new Date(dateString.replace(' ', 'T') + 'Z');
        } else if (dateString.includes('T')) {
            // ISO format: "2024-01-15T10:30:00Z"
            dateObj = new Date(dateString);
        } else {
            // Date only: "2024-01-15"
            dateObj = new Date(dateString + 'T00:00:00Z');
        }
        
        return isNaN(dateObj.getTime()) ? null : dateObj;
    } catch (error) {
        console.warn('Error parsing date:', dateString, error);
        return null;
    }
}

function previousMonth() {
    if (currentMonth === 0) {
        currentMonth = 11;
        currentYear--;
    } else {
        currentMonth--;
    }
    generateCalendar();
}

function nextMonth() {
    if (currentMonth === 11) {
        currentMonth = 0;
        currentYear++;
    } else {
        currentMonth++;
    }
    generateCalendar();
}

function showDayDetails(date) {
    const dateStr = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Show a modal or side panel with day details
    showNotification(`Day details for ${dateStr}`, 'info');
}

// Medication management with database integration
async function showAddMedication() {
    // Load available drugs from database
    const drugs = await csvDB.getAll('drugs_master');
    
    // Create a modal with drug selection
    const modal = createMedicationModal(drugs);
    document.body.appendChild(modal);
    modal.classList.add('active');
}

function createMedicationModal(drugs = []) {
    const drugOptions = drugs.map(drug => 
        `<option value="${drug.drug_id}">${drug.drug_name} (${drug.generic_name})</option>`
    ).join('');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container">
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            <div class="modal-header">
                <h2>Add New Medication</h2>
                <p>Select medication from database</p>
            </div>
            <form onsubmit="addMedication(event)">
                <div class="form-group">
                    <label for="medDrugSelect">Select Medication</label>
                    <select id="medDrugSelect" required onchange="updateMedicationDetails()">
                        <option value="">Choose a medication...</option>
                        ${drugOptions}
                    </select>
                </div>
                <div id="drugDetails" style="display: none; background: #f8fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                    <h4>Drug Information</h4>
                    <div id="drugInfo"></div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="medStrength">Strength</label>
                        <select id="medStrength" required>
                            <option value="">Select strength...</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="medFrequency">Frequency</label>
                        <select id="medFrequency" required>
                            <option value="">Select frequency</option>
                            <option value="once daily">Once daily</option>
                            <option value="twice daily">Twice daily</option>
                            <option value="three times daily">Three times daily</option>
                            <option value="four times daily">Four times daily</option>
                            <option value="as needed">As needed</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="medDosageForm">Dosage Form</label>
                    <select id="medDosageForm" required>
                        <option value="">Select form...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="medInstructions">Instructions</label>
                    <textarea id="medInstructions" rows="3" placeholder="e.g., Take with meals"></textarea>
                </div>
                <div class="form-group">
                    <label for="medPrescriber">Prescriber Name</label>
                    <input type="text" id="medPrescriber" placeholder="e.g., Dr. Smith">
                </div>
                <button type="submit" class="btn-primary full-width">Add Medication</button>
            </form>
        </div>
    `;
    return modal;
}

// Update medication details when drug is selected
async function updateMedicationDetails() {
    const drugSelect = document.getElementById('medDrugSelect');
    const drugId = drugSelect.value;
    
    if (!drugId) {
        document.getElementById('drugDetails').style.display = 'none';
        return;
    }
    
    try {
        const drug = await csvDB.findById('drugs_master', drugId);
        if (!drug) {
            showNotification('Drug information not found', 'warning');
            return;
        }
        
        // Show drug information
        const drugInfo = document.getElementById('drugInfo');
        drugInfo.innerHTML = `
            <p><strong>Generic Name:</strong> ${drug.generic_name}</p>
            <p><strong>Drug Class:</strong> ${drug.drug_class}</p>
            <p><strong>Category:</strong> ${drug.therapeutic_category}</p>
            <p><strong>Indications:</strong> ${drug.indications}</p>
        `;
        document.getElementById('drugDetails').style.display = 'block';
        
        // Update strength options
        const strengthSelect = document.getElementById('medStrength');
        strengthSelect.innerHTML = '<option value="">Select strength...</option>';
        if (drug.available_strengths) {
            const strengths = Array.isArray(drug.available_strengths) 
                ? drug.available_strengths 
                : JSON.parse(drug.available_strengths || '[]');
            
            strengths.forEach(strength => {
                strengthSelect.innerHTML += `<option value="${strength}">${strength}</option>`;
            });
        }
        
        // Update dosage form options
        const formSelect = document.getElementById('medDosageForm');
        formSelect.innerHTML = '<option value="">Select form...</option>';
        if (drug.dosage_forms) {
            const forms = Array.isArray(drug.dosage_forms) 
                ? drug.dosage_forms 
                : JSON.parse(drug.dosage_forms || '[]');
            
            forms.forEach(form => {
                formSelect.innerHTML += `<option value="${form}">${form}</option>`; 
            });
        }
        
    } catch (error) {
        console.error('Error updating medication details:', error);
        showNotification('Error loading drug information', 'error');
        document.getElementById('drugDetails').style.display = 'none';
    }
}

async function addMedication(event) {
    event.preventDefault();
    
    if (!currentUser || !currentUser.user_id) {
        showNotification('Please log in first', 'error');
        return;
    }
    
    const drugId = document.getElementById('medDrugSelect').value;
    const strength = document.getElementById('medStrength').value;
    const frequency = document.getElementById('medFrequency').value;
    const dosageForm = document.getElementById('medDosageForm').value;
    const instructions = document.getElementById('medInstructions').value;
    const prescriberName = document.getElementById('medPrescriber').value;
    
    // Create medication record compatible with database
    const medication = {
        user_id: currentUser.user_id,
        drug_id: drugId,
        prescription_number: `RX${Date.now()}`, // Generate prescription number
        prescriber_name: prescriberName || 'Self-reported',
        pharmacy_name: 'Not specified',
        strength: strength,
        dosage_form: dosageForm,
        quantity_prescribed: 30, // Default
        refills_remaining: 0,
        dosing_frequency: frequency,
        dosing_schedule: generateDosingSchedule(frequency),
        instructions: instructions,
        start_date: csvDB.formatDate(new Date()),
        end_date: null,
        status: 'active'
    };
    
    try {
        // Add medication to database (simulated)
        const addedMed = await csvDB.simulateAdd('user_medications', medication);
        
        // Add to local medications array
        medications.push(addedMed);
        saveMedications();
        
        // Close modal
        event.target.closest('.modal-overlay').remove();
        
        // Refresh medications display
        refreshMedicationsDisplay();
        
        showNotification('Medication added successfully!', 'success');
        
    } catch (error) {
        console.error('Error adding medication:', error);
        showNotification('Failed to add medication', 'error');
    }
}

// Generate dosing schedule based on frequency
function generateDosingSchedule(frequency) {
    const schedules = {
        'once daily': ['08:00'],
        'twice daily': ['08:00', '20:00'],
        'three times daily': ['08:00', '14:00', '20:00'],
        'four times daily': ['08:00', '12:00', '16:00', '20:00'],
        'as needed': []
    };
    
    return JSON.stringify(schedules[frequency] || []);
}

async function refreshMedicationsDisplay() {
    const medicationsGrid = document.querySelector('.medications-grid');
    if (!medicationsGrid) return;
    
    medicationsGrid.innerHTML = '';
    
    if (!currentUser || !currentUser.user_id) {
        medicationsGrid.innerHTML = '<p>Please log in to view medications.</p>';
        return;
    }
    
    try {
        const userMedications = await csvDB.getUserMedicationsWithDetails(currentUser.user_id);
        
        if (userMedications.length === 0) {
            medicationsGrid.innerHTML = '<p>No medications found. Click "Add Medication" to get started.</p>';
            return;
        }
        
        userMedications.forEach(med => {
            const medCard = document.createElement('div');
            medCard.className = 'medication-card';
            medCard.innerHTML = `
                <div class="med-header">
                    <h3>${med.drug_details?.drug_name || 'Unknown'}</h3>
                    <span class="med-strength">${med.strength}</span>
                </div>
                <div class="med-info">
                    <div class="med-detail">
                        <i class="fas fa-clock"></i>
                        <span>${med.dosing_frequency}</span>
                    </div>
                    <div class="med-detail">
                        <i class="fas fa-pills"></i>
                        <span>${med.dosage_form}</span>
                    </div>
                    <div class="med-detail">
                        <i class="fas fa-info-circle"></i>
                        <span>${med.instructions || 'No special instructions'}</span>
                    </div>
                    ${med.prescriber_name ? `
                    <div class="med-detail">
                        <i class="fas fa-user-md"></i>
                        <span>${med.prescriber_name}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="med-actions">
                    <button class="btn-icon" title="Edit" onclick="editMedicationFromDB('${med.medication_id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" title="Drug Info" onclick="showFullDrugInfo('${med.drug_id}')">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="btn-icon" title="Delete" onclick="deleteMedicationFromDB('${med.medication_id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            medicationsGrid.appendChild(medCard);
        });
        
    } catch (error) {
        console.error('Error refreshing medications display:', error);
        medicationsGrid.innerHTML = '<p>Error loading medications. Please try again.</p>';
    }
}

async function editMedicationFromDB(medicationId) {
    showNotification('Edit medication feature will be implemented in the next version', 'info');
}

async function deleteMedicationFromDB(medicationId) {
    if (!confirm('Are you sure you want to delete this medication?')) {
        return;
    }
    
    try {
        const success = await csvDB.simulateDelete('user_medications', medicationId);
        if (success) {
            showNotification('Medication deleted successfully', 'success');
            await refreshMedicationsDisplay();
        } else {
            showNotification('Failed to delete medication', 'error');
        }
    } catch (error) {
        console.error('Error deleting medication:', error);
        showNotification('Failed to delete medication', 'error');
    }
}

// Drug search functionality
async function searchDrugs() {
    const searchTerm = document.getElementById('drugSearchInput').value.trim();
    if (!searchTerm) {
        clearDrugSearchResults();
        return;
    }
    
    try {
        const drugs = await csvDB.findBy('drugs_master', { drug_name: searchTerm });
        displayDrugSearchResults(drugs);
    } catch (error) {
        console.error('Drug search error:', error);
        showNotification('Search failed', 'error');
    }
}

function displayDrugSearchResults(drugs) {
    const drugInfoGrid = document.querySelector('.drug-info-grid');
    if (!drugInfoGrid) return;
    
    drugInfoGrid.innerHTML = '';
    
    if (drugs.length === 0) {
        drugInfoGrid.innerHTML = '<p>No drugs found matching your search.</p>';
        return;
    }
    
    drugs.forEach(drug => {
        const drugCard = document.createElement('div');
        drugCard.className = 'drug-info-card';
        drugCard.innerHTML = `
            <h3>${drug.drug_name}</h3>
            <div class="drug-details">
                <div class="drug-detail">
                    <strong>Generic Name:</strong> ${drug.generic_name}
                </div>
                <div class="drug-detail">
                    <strong>Class:</strong> ${drug.drug_class}
                </div>
                <div class="drug-detail">
                    <strong>Category:</strong> ${drug.therapeutic_category}
                </div>
                <div class="drug-detail">
                    <strong>Indications:</strong> ${drug.indications}
                </div>
            </div>
            <button class="btn-text" onclick="showFullDrugInfo('${drug.drug_id}')">View Full Information</button>
        `;
        drugInfoGrid.appendChild(drugCard);
    });
}

function clearDrugSearchResults() {
    const drugInfoGrid = document.querySelector('.drug-info-grid');
    if (drugInfoGrid) {
        drugInfoGrid.innerHTML = '';
    }
}

async function showFullDrugInfo(drugId) {
    const drug = await csvDB.findById('drugs_master', drugId);
    if (!drug) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 700px;">
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            <div class="modal-header">
                <h2>${drug.drug_name}</h2>
                <p>Complete drug information</p>
            </div>
            <div class="drug-info-content" style="max-height: 500px; overflow-y: auto;">
                <div class="info-section">
                    <h3><i class="fas fa-pills"></i> Basic Information</h3>
                    <div class="info-grid">
                        <div class="info-item"><strong>Generic Name:</strong> ${drug.generic_name}</div>
                        <div class="info-item"><strong>Brand Names:</strong> ${Array.isArray(drug.brand_names) ? drug.brand_names.join(', ') : drug.brand_names}</div>
                        <div class="info-item"><strong>Drug Class:</strong> ${drug.drug_class}</div>
                        <div class="info-item"><strong>Category:</strong> ${drug.therapeutic_category}</div>
                        <div class="info-item"><strong>Manufacturer:</strong> ${drug.manufacturer}</div>
                        <div class="info-item"><strong>FDA Approved:</strong> ${drug.fda_approved ? 'Yes' : 'No'}</div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h3><i class="fas fa-capsules"></i> Dosage Information</h3>
                    <div class="info-grid">
                        <div class="info-item"><strong>Available Strengths:</strong> ${Array.isArray(drug.available_strengths) ? drug.available_strengths.join(', ') : drug.available_strengths}</div>
                        <div class="info-item"><strong>Dosage Forms:</strong> ${Array.isArray(drug.dosage_forms) ? drug.dosage_forms.join(', ') : drug.dosage_forms}</div>
                        <div class="info-item"><strong>Route:</strong> ${Array.isArray(drug.route_of_administration) ? drug.route_of_administration.join(', ') : drug.route_of_administration}</div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h3><i class="fas fa-stethoscope"></i> Medical Information</h3>
                    <div class="info-item"><strong>Indications:</strong> ${drug.indications}</div>
                    <div class="info-item"><strong>Contraindications:</strong> ${drug.contraindications}</div>
                    <div class="info-item"><strong>Warnings:</strong> ${drug.warnings_precautions}</div>
                </div>
                
                <div class="info-section">
                    <h3><i class="fas fa-exclamation-triangle"></i> Storage & Safety</h3>
                    <div class="info-grid">
                        <div class="info-item"><strong>Storage:</strong> ${drug.storage_conditions}</div>
                        <div class="info-item"><strong>Shelf Life:</strong> ${drug.shelf_life_months} months</div>
                        <div class="info-item"><strong>Pregnancy Category:</strong> ${drug.pregnancy_category}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Updated drug interaction checking with database
async function checkInteractions() {
    if (!currentUser || !currentUser.user_id) {
        showNotification('Please log in to check interactions', 'error');
        return;
    }
    
    showLoadingState('Checking drug interactions...');
    
    try {
        const userMedications = await csvDB.getUserMedicationsWithDetails(currentUser.user_id);
        const interactions = await csvDB.getAll('drug_interactions');
        
        const foundInteractions = [];
        
        // Check each pair of user medications for interactions
        for (let i = 0; i < userMedications.length; i++) {
            for (let j = i + 1; j < userMedications.length; j++) {
                const med1 = userMedications[i];
                const med2 = userMedications[j];
                
                const interaction = interactions.find(int => 
                    (int.drug1_id === med1.drug_id && int.drug2_id === med2.drug_id) ||
                    (int.drug1_id === med2.drug_id && int.drug2_id === med1.drug_id)
                );
                
                if (interaction) {
                    foundInteractions.push({
                        drug1: med1.drug_details?.drug_name || 'Unknown',
                        drug2: med2.drug_details?.drug_name || 'Unknown',
                        severity: interaction.severity_level,
                        description: interaction.interaction_description
                    });
                }
            }
        }
        
        hideLoadingState();
        
        if (foundInteractions.length > 0) {
            displayInteractionResults(foundInteractions);
        } else {
            showNotification('No drug interactions found!', 'success');
        }
        
    } catch (error) {
        console.error('Error checking interactions:', error);
        hideLoadingState();
        showNotification('Failed to check interactions', 'error');
    }
}

function displayInteractionResults(interactions) {
    const alertsContainer = document.querySelector('.interaction-alerts');
    if (!alertsContainer) return;
    
    alertsContainer.innerHTML = '';
    
    interactions.forEach(interaction => {
        const alertCard = document.createElement('div');
        const severityClass = interaction.severity.toLowerCase();
        alertCard.className = `alert-card ${severityClass}`;
        alertCard.innerHTML = `
            <div class="alert-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="alert-content">
                <h3>${interaction.severity} Interaction Detected</h3>
                <p><strong>${interaction.drug1}</strong> and <strong>${interaction.drug2}</strong></p>
                <p>${interaction.description}</p>
                <div class="alert-actions">
                    <button class="btn-text">Consult Doctor</button>
                    <button class="btn-text" onclick="this.closest('.alert-card').remove()">Dismiss</button>
                </div>
            </div>
        `;
        alertsContainer.appendChild(alertCard);
    });
}

// Notification system
async function initializeNotifications() {
    // Set up periodic reminders
    setInterval(checkMedicationReminders, 60000); // Check every minute
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Load user notification preferences
    if (currentUser && currentUser.user_id) {
        try {
            const preferences = await csvDB.findBy('notification_preferences', { user_id: currentUser.user_id });
            if (preferences.length > 0) {
                window.userNotificationPreferences = preferences[0];
            }
        } catch (error) {
            console.error('Error loading notification preferences:', error);
        }
    }
}

async function checkMedicationReminders() {
    if (!currentUser || !currentUser.user_id) return;
    
    // Check if notifications are enabled
    if (window.userNotificationPreferences && !window.userNotificationPreferences.dose_reminders_enabled) {
        return;
    }
    
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    try {
        // Get user's medication schedules
        const userMeds = await csvDB.getUserMedicationsWithDetails(currentUser.user_id);
        
        userMeds.forEach(med => {
            if (med.dosing_schedule) {
                let schedule = [];
                try {
                    schedule = JSON.parse(med.dosing_schedule);
                } catch (e) {
                    schedule = [];
                }
                
                if (schedule.includes(currentTime)) {
                    showMedicationReminder(med.drug_details?.drug_name || 'Unknown', med.strength);
                }
            }
        });
        
    } catch (error) {
        console.error('Error checking medication reminders:', error);
    }
}

function showMedicationReminder(medicationName = 'your medication', strength = '') {
    const medicationText = strength ? `${medicationName} ${strength}` : medicationName;
    
    const notification = {
        title: 'Medication Reminder',
        body: `Time to take ${medicationText}!`,
        icon: 'favicon.svg'
    };
    
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
            body: notification.body,
            icon: notification.icon
        });
    }
    
    showNotification(`Time to take ${medicationText}!`, 'info');
}

// Notification display
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        border-left: 4px solid ${getNotificationColor(type)};
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

function getNotificationColor(type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    return colors[type] || colors.info;
}

// Loading state
function showLoadingState(message) {
    const loader = document.createElement('div');
    loader.id = 'globalLoader';
    loader.innerHTML = `
        <div class="loader-backdrop">
            <div class="loader-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        </div>
    `;
    
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .loader-backdrop {
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .loader-content {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f4f6;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .loader-content p {
            margin: 0;
            color: #64748b;
            font-weight: 500;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(loader);
    
    // Auto remove after 10 seconds (safety measure)
    setTimeout(() => {
        const existingLoader = document.getElementById('globalLoader');
        if (existingLoader) {
            existingLoader.remove();
            style.remove();
        }
    }, 10000);
}

function hideLoadingState() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.remove();
        // Remove the associated style
        document.querySelectorAll('style').forEach(style => {
            if (style.textContent.includes('.spinner')) {
                style.remove();
            }
        });
    }
}

// Welcome tour
function showWelcomeTour() {
    const tourSteps = [
        {
            element: '.menu-item[data-tab="overview"]',
            title: 'Welcome to PrescripCare!',
            content: 'This is your health overview where you can see all your medication stats and today\'s schedule.'
        },
        {
            element: '.menu-item[data-tab="medications"]',
            title: 'Manage Medications',
            content: 'Add and manage all your medications here. You can also view detailed drug information.'
        },
        {
            element: '.menu-item[data-tab="calendar"]',
            title: 'Dose Tracking Calendar',
            content: 'Track your medication adherence with our visual calendar showing taken, missed, and snoozed doses.'
        },
        {
            element: '.menu-item[data-tab="lifestyle"]',
            title: 'Lifestyle & Diet',
            content: 'Get personalized recommendations for diet, exercise, and lifestyle changes to improve your health.'
        }
    ];
    
    let currentTourStep = 0;
    
    function showTourStep(stepIndex) {
        if (stepIndex >= tourSteps.length) {
            showNotification('Welcome tour completed! Start managing your medications now.', 'success');
            return;
        }
        
        const step = tourSteps[stepIndex];
        const element = document.querySelector(step.element);
        
        if (element) {
            // Highlight element
            element.style.position = 'relative';
            element.style.zIndex = '10002';
            element.style.background = 'rgba(59, 130, 246, 0.1)';
            element.style.borderRadius = '8px';
            
            // Show tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'tour-tooltip';
            tooltip.innerHTML = `
                <h4>${step.title}</h4>
                <p>${step.content}</p>
                <div class="tour-buttons">
                    <button onclick="skipTour()" class="btn-text">Skip Tour</button>
                    <button onclick="nextTourStep()" class="btn-primary">Next</button>
                </div>
            `;
            
            tooltip.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                background: white;
                padding: 1.5rem;
                border-radius: 8px;
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
                border: 1px solid #e2e8f0;
                max-width: 300px;
                z-index: 10003;
                margin-top: 0.5rem;
            `;
            
            element.appendChild(tooltip);
            
            // Store for cleanup
            window.currentTourTooltip = tooltip;
            window.currentTourElement = element;
        }
    }
    
    window.nextTourStep = function() {
        cleanupTourStep();
        currentTourStep++;
        showTourStep(currentTourStep);
    };
    
    window.skipTour = function() {
        cleanupTourStep();
        showNotification('Tour skipped. You can always explore the features on your own!', 'info');
    };
    
    function cleanupTourStep() {
        if (window.currentTourTooltip) {
            window.currentTourTooltip.remove();
        }
        if (window.currentTourElement) {
            window.currentTourElement.style.position = '';
            window.currentTourElement.style.zIndex = '';
            window.currentTourElement.style.background = '';
            window.currentTourElement.style.borderRadius = '';
        }
    }
    
    // Start tour
    showTourStep(0);
}

// Data persistence with database integration
async function loadUserData() {
    if (!currentUser || !currentUser.user_id) {
        // Fallback to localStorage
        try {
            const savedMedications = localStorage.getItem('prescripcare_medications');
            if (savedMedications) {
                medications = JSON.parse(savedMedications);
            }
            
            const savedDoseHistory = localStorage.getItem('prescripcare_dose_history');
            if (savedDoseHistory) {
                doseHistory = JSON.parse(savedDoseHistory);
            }
        } catch (storageError) {
            console.warn('Error loading from localStorage:', storageError);
            medications = [];
            doseHistory = {};
        }
        return;
    }
    
    try {
        // Load medications from database with error handling
        let userMedications = [];
        try {
            userMedications = await csvDB.getUserMedicationsWithDetails(currentUser.user_id);
        } catch (medError) {
            console.warn('Error loading user medications:', medError);
            userMedications = [];
        }
        
        medications = userMedications.map(med => ({
            id: med.medication_id,
            medication_id: med.medication_id,
            name: med.drug_details?.drug_name || 'Unknown',
            generic_name: med.drug_details?.generic_name || '',
            strength: med.strength || '',
            frequency: med.dosing_frequency || 'as needed',
            instructions: med.instructions || 'No instructions',
            dateAdded: med.created_at || formatDatabaseDate(new Date()),
            status: med.status || 'active',
            drug_details: med.drug_details
        }));
        
        // Load dose history from database with error handling
        doseHistory = {};
        try {
            const doseEvents = await csvDB.getUserDoseEvents(currentUser.user_id);
            
            doseEvents.forEach(event => {
                try {
                    const date = parseDatabaseDate(event.scheduled_datetime) || new Date();
                    const dateKey = formatDateKey(date);
                    
                    if (!doseHistory[dateKey]) {
                        doseHistory[dateKey] = { doses: [] };
                    }
                    
                    doseHistory[dateKey].doses.push({
                        time: date.toTimeString().slice(0, 5), // HH:MM format
                        medication: `${event.medication_name || 'Unknown'} ${event.strength || ''}`,
                        status: event.status || 'unknown'
                    });
                } catch (eventError) {
                    console.warn('Error processing dose event:', event, eventError);
                }
            });
        } catch (doseError) {
            console.warn('Error loading dose events:', doseError);
        }
        
        console.log(`Loaded ${medications.length} medications and dose history for user ${currentUser.user_id}`);
        
    } catch (error) {
        console.error('Error loading user data from database:', error);
        
        // Fallback to localStorage with error handling
        try {
            const savedMedications = localStorage.getItem('prescripcare_medications');
            if (savedMedications) {
                medications = JSON.parse(savedMedications);
            } else {
                medications = [];
            }
            
            const savedDoseHistory = localStorage.getItem('prescripcare_dose_history');
            if (savedDoseHistory) {
                doseHistory = JSON.parse(savedDoseHistory);
            } else {
                doseHistory = {};
            }
        } catch (fallbackError) {
            console.error('Error with localStorage fallback:', fallbackError);
            medications = [];
            doseHistory = {};
        }
    }
}

function saveMedications() {
    localStorage.setItem('prescripcare_medications', JSON.stringify(medications));
}

function saveDoseHistory() {
    localStorage.setItem('prescripcare_dose_history', JSON.stringify(doseHistory));
}

// Profile editing with healthcare provider integration
async function editProfile() {
    if (!currentUser || !currentUser.user_id) {
        showNotification('Please log in first', 'error');
        return;
    }
    
    // Load healthcare providers for selection
    const providers = await csvDB.getAll('healthcare_providers');
    
    const modal = createProfileEditModal(providers);
    document.body.appendChild(modal);
    modal.classList.add('active');
}

function createProfileEditModal(providers = []) {
    const providerOptions = providers.map(provider => 
        `<option value="${provider.provider_id}">${provider.provider_name} - ${provider.specialty}</option>`
    ).join('');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 600px;">
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            <div class="modal-header">
                <h2>Edit Profile</h2>
                <p>Update your personal information</p>
            </div>
            <form onsubmit="updateProfile(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label for="editHeight">Height (cm)</label>
                        <input type="number" id="editHeight" value="${currentUser.height}" min="50" max="300">
                    </div>
                    <div class="form-group">
                        <label for="editWeight">Weight (kg)</label>
                        <input type="number" id="editWeight" value="${currentUser.weight}" step="0.1" min="1">
                    </div>
                </div>
                <div class="form-group">
                    <label for="editContact">Contact Number</label>
                    <input type="tel" id="editContact" value="${currentUser.contact || ''}">
                </div>
                <div class="form-group">
                    <label for="editProvider">Primary Healthcare Provider</label>
                    <select id="editProvider">
                        <option value="">Select a provider...</option>
                        ${providerOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="editMedicalCondition">Medical Conditions</label>
                    <textarea id="editMedicalCondition" rows="3">${currentUser.medicalCondition || ''}</textarea>
                </div>
                <div class="form-row">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn-primary">Update Profile</button>
                </div>
            </form>
        </div>
    `;
    return modal;
}

async function updateProfile(event) {
    event.preventDefault();
    
    const height = parseInt(document.getElementById('editHeight').value);
    const weight = parseFloat(document.getElementById('editWeight').value);
    const contact = document.getElementById('editContact').value;
    const providerId = document.getElementById('editProvider').value;
    const medicalCondition = document.getElementById('editMedicalCondition').value;
    
    try {
        // Update user profile in database
        const profileUpdates = {
            height_cm: height,
            weight_kg: weight,
            phone_number: contact
        };
        
        await csvDB.simulateUpdate('user_profiles', currentUser.user_id, profileUpdates);
        
        // Update medical conditions if changed
        if (medicalCondition.trim() && medicalCondition !== currentUser.medicalCondition) {
            // Remove old conditions
            const oldConditions = await csvDB.findBy('user_medical_conditions', { user_id: currentUser.user_id });
            for (const condition of oldConditions) {
                await csvDB.simulateDelete('user_medical_conditions', condition.condition_id);
            }
            
            // Add new condition
            const newCondition = {
                user_id: currentUser.user_id,
                condition_name: medicalCondition,
                diagnosed_date: formatDatabaseDate(new Date()),
                severity: 'unknown',
                status: 'active'
            };
            await csvDB.simulateAdd('user_medical_conditions', newCondition);
        }
        
        // Update current user object
        const newBMI = calculateBMI(weight, height);
        currentUser.height = height;
        currentUser.weight = weight;
        currentUser.contact = contact;
        currentUser.bmi = newBMI;
        currentUser.medicalCondition = medicalCondition || 'No medical conditions reported';
        
        localStorage.setItem('prescripcare_user', JSON.stringify(currentUser));
        
        // Close modal and refresh UI
        event.target.closest('.modal-overlay').remove();
        await updateUserInterface();
        
        showNotification('Profile updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Failed to update profile', 'error');
    }
}

// Add healthcare provider management
async function viewHealthcareProviders() {
    if (!currentUser || !currentUser.user_id) {
        showNotification('Please log in first', 'error');
        return;
    }
    
    try {
        const providers = await csvDB.getAll('healthcare_providers');
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-container" style="max-width: 800px;">
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                <div class="modal-header">
                    <h2>Healthcare Providers</h2>
                    <p>Available healthcare professionals</p>
                </div>
                <div class="providers-grid" style="display: grid; gap: 1rem; max-height: 400px; overflow-y: auto;">
                    ${providers.map(provider => `
                        <div class="provider-card" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem;">
                            <h4>${provider.provider_name}</h4>
                            <p><strong>Specialty:</strong> ${provider.specialty}</p>
                            <p><strong>Phone:</strong> ${provider.contact_phone}</p>
                            <p><strong>Email:</strong> ${provider.contact_email}</p>
                            <p><strong>Address:</strong> ${provider.clinic_address}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Error loading healthcare providers:', error);
        showNotification('Failed to load providers', 'error');
    }
}

// Add some additional CSS animations
document.head.insertAdjacentHTML('beforeend', `
<style>
@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(100%);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes slideOutRight {
    from {
        opacity: 1;
        transform: translateX(0);
    }
    to {
        opacity: 0;
        transform: translateX(100%);
    }
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.notification-close {
    background: none;
    border: none;
    cursor: pointer;
    color: #64748b;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.notification-close:hover {
    background: #f3f4f6;
    color: #374151;
}

.tour-tooltip h4 {
    margin: 0 0 0.5rem 0;
    color: #1f2937;
    font-weight: 600;
}

.tour-tooltip p {
    margin: 0 0 1rem 0;
    color: #6b7280;
    line-height: 1.5;
}

.tour-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}
</style>
`);

// Initialize periodic data saving
setInterval(() => {
    if (currentUser) {
        saveMedications();
        saveDoseHistory();
    }
}, 30000); // Save every 30 seconds

console.log('PrescripCare application initialized successfully!');