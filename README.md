# 🎫 Ticket Ballot System

A modern, responsive web application for fair and transparent ticket allocation using randomized ballot draws.

![Status](https://img.shields.io/badge/Status-Complete-success)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-blue)

## ✨ Features

### 🎯 Core Functionality
- **User Registration**: Self-registration or admin-added participants
- **Group Formation**: Create groups of 1-3 members with single representative submission
- **Fair Ballot System**: Randomized drawing with transparent results
- **Admin Dashboard**: Complete management interface for all operations
- **Results Display**: Public results with search functionality

### 📱 User Experience
- **Mobile-First Design**: Fully responsive across all devices
- **Real-time Updates**: Live status updates and notifications
- **Error Handling**: Comprehensive validation and user feedback
- **Accessibility**: WCAG 2.1 AA compliant design
- **Modern UI**: Clean, professional interface with smooth animations

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm

### Installation & Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` to view the application.

### Testing with Demo Data
1. Click the **🧪 Load Demo Data** button (bottom right)
2. This creates sample participants and groups for testing
3. Switch to Admin mode to approve groups and run ballot
4. Test all user flows and features

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📖 User Guide

### For Participants

1. **Register Your Interest**
   - Visit the landing page
   - Enter your email address
   - Click "Register to Participate"

2. **Create or Join a Group**
   - Navigate to "Create Group" 
   - Add up to 2 additional members (3 total max)
   - Submit your group entry
   - Wait for admin approval

3. **Check Your Status**
   - Use "Check Status" to view your group information
   - See approval status and ballot position (after draw)

4. **View Results**
   - Public results available after ballot draw
   - Search for your group by email
   - Download results in CSV format

### For Administrators

1. **Access Admin Dashboard**
   - Click "⚙️ Admin" in the header
   - Access comprehensive management tools

2. **Manage Participants**
   - Add participants by email
   - View all registered users  
   - Remove participants if needed

3. **Review Groups**
   - Approve or reject group submissions
   - Validate all group members are eligible
   - Remove invalid groups

4. **Run Ballot**
   - Execute randomized ballot draw
   - Lock all approved groups
   - Export detailed results

## 🏗️ Technical Architecture

### Built With
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Full type safety and enhanced IDE support
- **Tailwind CSS** - Utility-first styling with custom design system
- **Vite** - Lightning-fast build tool and dev server
- **Local Storage** - Browser-based data persistence (no backend required)

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Header)
│   └── ui/             # UI utilities and demo tools
├── hooks/              # React hooks and context providers
├── pages/              # Page components for each route
├── services/           # Business logic and data management
├── types/              # TypeScript type definitions
└── App.tsx             # Main application component
```

### Key Design Decisions
- **No Backend Required**: Entirely browser-based with localStorage
- **Mobile-First**: Responsive design starting from 320px
- **Type Safety**: Full TypeScript coverage for reliability
- **Accessibility**: WCAG 2.1 AA compliance throughout
- **Performance**: Optimized bundle size and efficient updates

## 🎮 How to Test

### Quick Testing Flow
1. **Load Demo Data**: Click 🧪 button to populate sample data
2. **Test Participant Flow**: 
   - Register → Create Group → Check Status
3. **Test Admin Flow**:
   - Switch to Admin → Manage Participants → Approve Groups → Run Ballot
4. **Test Results**:
   - View public results → Search functionality → Download CSV

### Manual Testing Scenarios
- **Registration**: Valid/invalid emails, duplicate registrations
- **Group Formation**: 1-3 member groups, duplicate members, invalid emails
- **Admin Operations**: Participant management, group approval/rejection
- **Ballot System**: Random draw with different group sizes
- **Error Handling**: Network issues, invalid inputs, edge cases

## 🔧 Customization

### Styling
- Modify `tailwind.config.js` for theme customization
- Update CSS custom properties in `index.css`
- Component styles use Tailwind utility classes

### Business Logic
- Update `ballotService.ts` for rule modifications
- Modify types in `types/index.ts` for data structure changes
- Adjust validation rules in form components

### Features
- Add new pages in the `pages/` directory
- Create reusable components in `components/`
- Extend the service layer for new functionality

## 🔒 Privacy & Security

- **Local Data Only**: All data stored in user's browser
- **No External Dependencies**: Self-contained application
- **Input Validation**: Comprehensive client-side validation
- **No Personal Data**: Only email addresses for ballot participation

## 📊 Performance Features

- **Optimized Bundle**: Tree-shaking and code splitting
- **Fast Loading**: Minimal dependencies and efficient bundling
- **Smooth Animations**: 60fps animations with CSS transforms
- **Memory Efficient**: Proper cleanup and state management

## 🤝 Contributing

This is a complete, production-ready application. For modifications:

1. Maintain TypeScript strict mode compliance
2. Follow existing code patterns and structure
3. Ensure mobile responsiveness for all changes
4. Test thoroughly across different scenarios

---

**🎯 Built for fairness, transparency, and ease of use**
