# Mewify - AI Face Rating & Mewing Coach

## What Is This App?

Mewify is an AI-powered face analysis and mewing coaching app that helps users track their facial aesthetics journey. The app provides detailed face ratings, personalized glow-up recommendations, and daily mewing habit tracking.

## Core Features

1. **AI Face Scanner** - Take a selfie, get detailed face analysis with scores for symmetry, jawline, skin, eyes, nose, lips, and overall harmony
2. **Glow Plan** - Personalized improvement recommendations based on analysis results
3. **Mewing Tracker** - Daily habit tracking for mewing practice with streaks and reminders
4. **Progress Gallery** - Before/after comparisons and score trend visualization

## Tech Stack

- **Backend**: Go-Fiber v2 + GORM + PostgreSQL
- **Mobile**: Expo SDK 54 + React Native 0.81 + NativeWind v4 + Expo Router v6
- **Module Path**: `github.com/ahmetcoskunkizilkaya/mewify/backend`

## Key Patterns

### Backend (Go)
- Service pattern: `NewXxxService(db *gorm.DB)` returns service struct
- Handler pattern: `NewXxxHandler(service)` returns handler struct
- UUID primary keys with `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
- Soft delete: All models use `gorm.DeletedAt`

### Mobile (TypeScript/React Native)
- File-based routing with Expo Router v6
- NativeWind v4 for styling (`className="..."`)
- **CRITICAL**: Use relative imports (`../../../lib/haptics`) NOT `@/` path aliases
- **CRITICAL**: Only use packages listed in package.json
- Haptics: `hapticSuccess()`, `hapticError()`, `hapticSelection()` on user actions
- API client: `lib/api.ts` with Axios

## Available Packages (mobile/package.json)

```
expo, expo-image-picker, expo-clipboard, expo-sharing, expo-haptics,
expo-local-authentication, expo-secure-store, expo-apple-authentication,
axios, nativewind, react-native-safe-area-context, react-native-screens,
@expo/vector-icons, clsx, tailwind-merge
```

## Models

### FaceAnalysis
- Stores face scan results with detailed scores
- Fields: overall_score, symmetry_score, jawline_score, skin_score, eye_score, nose_score, lips_score, harmony_score, strengths[], improvements[]

### MewingProgress
- Daily mewing habit tracking
- Fields: date, mewing_minutes, completed, notes, jawline_photo_url

### MewingGoal
- User's mewing settings
- Fields: daily_minutes_goal, reminder_enabled, reminder_time, current_streak, longest_streak

### GlowPlan
- Personalized recommendations
- Fields: category, title, description, priority, difficulty, timeframe_weeks, is_completed

## API Endpoints

### Face Analysis
- POST /api/analyses - Create new analysis
- GET /api/analyses - List user's analyses
- GET /api/analyses/:id - Get single analysis
- GET /api/analyses/latest - Get latest analysis
- GET /api/analyses/stats - Score trends

### Mewing
- POST /api/mewing/log - Log session
- GET /api/mewing/today - Today's progress
- GET /api/mewing/history - Last 30 days
- GET /api/mewing/streaks - Streak info
- PUT /api/mewing/goal - Update goal
- GET /api/mewing/goal - Get goal

### Glow Plan
- GET /api/glow-plan - Get recommendations
- POST /api/glow-plan/generate - Generate new plan
- PUT /api/glow-plan/:id/complete - Mark complete
- GET /api/glow-plan/progress - Completion stats
