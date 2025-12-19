# Chefaa Mobile App

A comprehensive React Native mobile application for the Chefaa health and pharmacy platform, built with Expo and TypeScript.

## Features

### 🏥 Core Healthcare Features
- **Product Catalog**: Browse medications, personal care items, and medical supplies
- **Prescription Management**: Upload and manage prescriptions with AI verification
- **Medical Records**: Secure storage and access to personal health records
- **Telehealth**: Book video consultations with healthcare professionals
- **Family Management**: Manage prescriptions and health records for family members

### 🛒 E-commerce Features
- **Smart Shopping**: AI-powered product recommendations and search
- **Shopping Cart**: Full-featured cart with quantity management
- **Secure Checkout**: Multiple payment options including biometric authentication
- **Order Tracking**: Real-time delivery tracking with notifications

### 📱 Mobile-Specific Features
- **Push Notifications**: Order updates, medication reminders, and health alerts
- **Biometric Authentication**: Face ID/Touch ID for secure access
- **Camera Integration**: Photo capture for prescriptions and ID verification
- **Location Services**: Find nearby pharmacies and delivery tracking
- **Offline Support**: Essential features work without internet connection

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router + React Navigation
- **State Management**: Redux Toolkit
- **Backend**: Supabase (Authentication, Database, Storage)
- **Push Notifications**: Expo Notifications
- **Authentication**: Supabase Auth + Biometric Authentication
- **Styling**: React Native StyleSheet with custom design system

## Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your device (for testing)
- iOS Simulator or Android Emulator (for development)
- Supabase project setup

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chefaa-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Configure Supabase**
   - Create tables for products, categories, orders, medical records, etc.
   - Set up RLS policies for security
   - Configure authentication providers
   - Enable push notifications

5. **Start the development server**
   ```bash
   npm start
   ```

## Project Structure

```
app/
├── (tabs)/              # Bottom tab navigation screens
│   ├── home.tsx         # Main dashboard with categories
│   ├── products.tsx     # Product catalog
│   ├── search.tsx       # Product search
│   ├── cart.tsx         # Shopping cart
│   └── profile.tsx      # User profile
├── (stacks)/            # Stack navigation screens
│   ├── product-detail.tsx
│   ├── checkout.tsx
│   └── ...
├── auth/                # Authentication screens
│   ├── login.tsx
│   └── signup.tsx
└── _layout.tsx          # Root layout

store/                   # Redux store
├── slices/              # Redux slices
│   ├── authSlice.ts
│   ├── cartSlice.ts
│   ├── productsSlice.ts
│   └── ...
└── store.ts

contexts/                # React contexts
├── AuthContext.tsx
└── NotificationContext.tsx

hooks/                   # Custom hooks
├── useNotifications.ts
└── useLocation.ts

lib/
└── supabase.ts          # Supabase client configuration
```

## Key Components

### State Management
- **Redux Toolkit**: Centralized state management
- **Slices**: Auth, Cart, Products, User, Medical Records, Orders
- **Async Operations**: Thunks for API calls

### Authentication
- **Supabase Auth**: Email/password and social login
- **Biometric**: Face ID/Touch ID integration
- **Session Management**: Secure token storage

### Push Notifications
- **Expo Notifications**: Local and remote notifications
- **Order Updates**: Real-time status changes
- **Medication Reminders**: Scheduled reminders

### Camera & Location
- **Prescription Upload**: Camera integration for prescriptions
- **Location Services**: Find nearby pharmacies
- **Delivery Tracking**: Real-time location updates

## Development

### Running on Device
1. Install Expo Go app
2. Scan QR code from `npm start`
3. Enable camera and location permissions

### Running on Simulator
```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android
```

### Building for Production
```bash
# Development build
eas build --platform android
eas build --platform ios

# Production build
eas build --platform android --profile production
eas build --platform ios --profile production
```

## Deployment

### Prerequisites for App Stores

#### iOS App Store
1. Apple Developer Account ($99/year)
2. iOS Distribution Certificate
3. App Store Provisioning Profile
4. App Store Connect setup

#### Google Play Store
1. Google Play Developer Account ($25 one-time)
2. App Signing by Google Play
3. Play Console setup

### EAS Build Configuration

Install EAS CLI:
```bash
npm install -g @expo/eas-cli
eas login
eas build:configure
```

Configure `eas.json`:
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

### Submit to App Stores

#### iOS App Store
```bash
eas build --platform ios --profile production
eas submit --platform ios
```

#### Google Play Store
```bash
eas build --platform android --profile production
eas submit --platform android
```

## Features Implementation Status

### ✅ Completed
- [x] Project setup with Expo and TypeScript
- [x] Navigation structure (Tabs + Stacks)
- [x] Redux store with all slices
- [x] Authentication (Login/Signup)
- [x] Product catalog and search
- [x] Shopping cart and checkout
- [x] User profile management
- [x] Push notifications setup
- [x] Location services
- [x] Biometric authentication
- [x] Medical records structure
- [x] Order management

### 🔄 In Progress
- [ ] Complete medical records UI
- [ ] Telehealth consultation interface
- [ ] Family member management
- [ ] Advanced search filters

### 📋 Planned
- [ ] Offline data synchronization
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Accessibility features

## Environment Variables

Required environment variables:
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

Optional variables:
- `EXPO_PUBLIC_ENVIRONMENT`: 'development' | 'staging' | 'production'

## Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npm start -- --clear
   ```

2. **iOS simulator not launching**
   ```bash
   xcrun simctl erase all
   npm run ios
   ```

3. **Android build failures**
   ```bash
   cd android && ./gradlew clean
   cd .. && npm run android
   ```

4. **Push notifications not working**
   - Check app.json permissions
   - Verify FCM/APNs configuration
   - Test on physical device

### Debug Mode
```bash
# Enable debugging
npm start -- --debug
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software owned by Chefaa. All rights reserved.

## Support

For technical support or questions:
- Email: support@chefaa.com
- Documentation: [docs.chefaa.com](https://docs.chefaa.com)
- Issue Tracker: [GitHub Issues](https://github.com/chefaa/mobile-app/issues)

## Changelog

### Version 1.0.0
- Initial release with core features
- E-commerce functionality
- Healthcare features
- Mobile-native experience
- Push notifications
- Biometric authentication