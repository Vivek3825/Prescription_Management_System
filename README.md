# PrescripCare - Advanced Prescription Management System

A beautiful, modern web application for managing prescriptions with advanced features including drug interaction checking, dose tracking calendar, automatic reminders, and personalized lifestyle recommendations.

## 🌟 Features

### 🔐 User Authentication
- **New User Registration**: Comprehensive onboarding with step-by-step form
- **User Information Collection**:
  - Personal details (Name, Age, Gender, Contact, Email)
  - Physical measurements (Weight, Height with automatic BMI calculation)
  - Medical conditions and health history
- **Existing User Login**: Secure authentication system
- **Profile Management**: View and edit personal information

### 💊 Medication Management
- **Add/Edit/Remove Medications**: Complete medication database management
- **Drug Information**: Detailed information about each medication
- **Interaction Checking**: Automatic detection of potential drug interactions
- **Dosage Tracking**: Monitor medication adherence

### 📅 Advanced Dose Tracking Calendar
- **Visual Calendar Interface**: Monthly view with intuitive navigation
- **Dose Status Indicators**:
  - ✅ **Taken**: Green dots for completed doses
  - ❌ **Missed**: Red dots for missed doses
  - ⏰ **Snoozed**: Yellow dots for delayed doses
  - ⚪ **Partial**: Gray dots for partially taken doses
- **Day Counter**: Track adherence streaks and monthly statistics
- **Interactive Day Details**: Click on any date to view detailed dose information

### 🔔 Smart Notifications & Reminders
- **Automatic Reminders**: Browser notifications for medication times
- **Completion Tracking**: End-of-day summary notifications
- **Customizable Alerts**: Set personalized reminder preferences
- **Real-time Updates**: Live notification system

### 🏥 Health Management
- **BMI Calculator**: Automatic calculation and categorization
- **Medical History**: Track and manage health conditions
- **Progress Monitoring**: Visual progress tracking for health goals

### 🥗 Lifestyle Changes & Diet Plans
- **Personalized Recommendations**: Based on medical conditions and BMI
- **Dietary Guidelines**: Customized nutrition advice
- **Exercise Plans**: Weekly workout schedules
- **Wellness Tips**: Sleep, stress management, and hydration guidance
- **Progress Tracking**: Visual progress bars for health goals

### 📱 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Advanced Animations**: Smooth transitions and micro-interactions
- **Modern Typography**: Clean, readable fonts (Inter)
- **Color-coded System**: Intuitive color scheme for different statuses
- **Accessibility**: WCAG compliant design principles

## 🚀 Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Modern CSS with CSS Grid and Flexbox
- **Icons**: Font Awesome 6.4.0
- **Fonts**: Google Fonts (Inter)
- **Storage**: LocalStorage for data persistence
- **Animations**: CSS animations and transitions

## � Project Structure

```
Prescription_Management_System/
├── frontend/                 # Frontend application files
│   ├── index.html           # Main HTML file
│   ├── styles.css           # CSS styles and animations
│   ├── script.js            # Core JavaScript functionality
│   ├── demo.js              # Demo data and functionality
│   └── favicon.svg          # Application icon
├── futureplan/              # Future development documentation
│   ├── API_DOCUMENTATION.md        # Complete API blueprint
│   ├── DATABASE_BLUEPRINT.md       # Database schema design
│   ├── DATABASE_SCHEMA_DIAGRAM.md  # Visual database relationships
│   ├── DEPLOYMENT_GUIDE.md         # Production deployment guide
│   └── QUICKSTART.md               # Quick start guide
└── README.md                # This file
```

## �📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Vivek3825/Prescription_Management_System.git
   cd Prescription_Management_System
   ```

2. **Open the application**:
   - Simply open `frontend/index.html` in your web browser
   - Or use a local server for better performance:
     ```bash
     # Using Python (from project root)
     cd frontend
     python -m http.server 8000
     
     # Using Node.js (from project root)
     cd frontend
     npx serve .
     ```

3. **Access the application**:
   - Open your browser and navigate to `http://localhost:8000` (if using a server)
   - Or directly open the `frontend/index.html` file

## 🎯 Usage Guide

### Getting Started
1. **First Time Users**:
   - Click "Get Started" on the landing page
   - Complete the 3-step registration process
   - Provide personal, physical, and medical information
   - Automatic BMI calculation and health assessment

2. **Returning Users**:
   - Click "Login" and enter your credentials
   - Access your personalized dashboard

### Dashboard Navigation
- **Overview**: Health summary and today's medication schedule
- **Medications**: Manage your medication list and view drug information
- **Dose Calendar**: Track your medication adherence visually
- **Drug Interactions**: Check for potential medication conflicts
- **Lifestyle & Diet**: Access personalized health recommendations
- **Profile**: View and edit your personal information

### Calendar Features
- **Monthly Navigation**: Use arrow buttons to navigate between months
- **Dose Status**: Visual indicators show your medication adherence
- **Day Details**: Click on any date to see detailed information
- **Streak Counter**: Monitor your consistency with the adherence counter

## 🎨 Design Philosophy

### Color Scheme
- **Primary**: Blue (#3b82f6) - Trust and medical professionalism
- **Success**: Green (#10b981) - Completed actions and positive outcomes
- **Warning**: Yellow (#f59e0b) - Attention and caution
- **Danger**: Red (#ef4444) - Missed doses and critical alerts
- **Accent**: Teal (#06d6a0) - Interactive elements and highlights

### Typography
- **Font Family**: Inter - Modern, highly legible sans-serif
- **Hierarchy**: Clear distinction between headings, body text, and labels
- **Accessibility**: High contrast ratios and appropriate font sizes

### Layout
- **Grid-based Design**: Consistent spacing and alignment
- **Card Components**: Information grouped in digestible sections
- **Responsive Breakpoints**: Optimized for all screen sizes

## 🔒 Data Privacy & Security

- **Local Storage**: All data stored locally on user's device
- **No Server Communication**: Complete privacy, no data transmitted
- **Secure Forms**: Input validation and sanitization
- **Session Management**: Secure user session handling

## 🌟 Advanced Features

### BMI Integration
- **Automatic Calculation**: Real-time BMI computation
- **Health Categories**: Underweight, Normal, Overweight, Obese
- **Visual Feedback**: Color-coded BMI status
- **Health Recommendations**: BMI-based lifestyle suggestions

### Notification System
- **Browser Notifications**: Native browser notification support
- **In-app Alerts**: Toast notifications for user actions
- **Reminder System**: Periodic medication reminders
- **Permission Handling**: Graceful permission request handling

### Calendar Intelligence
- **Pattern Recognition**: Identify adherence patterns
- **Visual Analytics**: Color-coded dose tracking
- **Historical Data**: Long-term adherence trends
- **Interactive Details**: Detailed day-by-day information

## 📱 Responsive Design

### Mobile First
- **Touch-friendly Interface**: Large tap targets and intuitive gestures
- **Optimized Navigation**: Collapsible sidebar for mobile
- **Readable Typography**: Scalable fonts and spacing
- **Fast Loading**: Optimized images and minimal dependencies

### Tablet & Desktop
- **Grid Layouts**: Multi-column layouts for larger screens
- **Hover Effects**: Enhanced interactivity on desktop
- **Keyboard Navigation**: Full keyboard accessibility
- **Multi-tasking**: Side-by-side information viewing

## 🔧 Customization

### Themes
The application supports easy theme customization through CSS variables:

```css
:root {
    --primary-color: #3b82f6;
    --secondary-color: #64748b;
    --accent-color: #06d6a0;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --danger-color: #ef4444;
}
```

### Adding New Features
The modular JavaScript architecture makes it easy to add new features:

1. Add new tab in HTML
2. Create corresponding CSS styles
3. Implement JavaScript functionality
4. Update navigation system

## 🚀 Future Enhancements

- **Backend Integration**: Connect to a secure medical database
- **Doctor Portal**: Healthcare provider access and management
- **Medication Database**: Integration with comprehensive drug databases
- **Insurance Integration**: Insurance coverage and cost tracking
- **Wearable Integration**: Sync with fitness trackers and smartwatches
- **AI Recommendations**: Machine learning-based health insights
- **Multi-language Support**: International accessibility
- **Offline Support**: Progressive Web App capabilities

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📞 Support

For support, email support@prescripcare.com or open an issue on GitHub.

## 🙏 Acknowledgments

- Font Awesome for the beautiful icons
- Google Fonts for the Inter font family
- The open-source community for inspiration and best practices

---

**PrescripCare** - Taking care of your health, one dose at a time. 💊✨