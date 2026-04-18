# Auth & Layout System Documentation

This document explains the complete authentication and layout system for the Office Management System.

## Architecture Overview

```
src/
├── auth/                    # Authentication logic
│   ├── api.ts             # Axios configuration with interceptors
│   ├── AuthContext.tsx     # Auth state management and providers
│   ├── tokenStore.ts       # Token & user storage helpers
│   ├── types.ts            # TypeScript type definitions
│   └── index.ts            # Module exports
├── layout/                  # Layout components
│   ├── Layout.tsx          # Main layout wrapper
│   ├── Layout.css          # Layout styles
│   ├── Sidebar.tsx         # Role-based sidebar navigation
│   └── Sidebar.css         # Sidebar styles
├── routes/                  # Routing components
│   └── ProtectedRoute.tsx   # Protected route wrapper
├── pages/
│   └── login/
│       ├── LoginPage.tsx    # Login form component
│       └── LoginPage.css    # Login styles
└── App.tsx                  # Main app with route definitions
```

## Core Components

### 1. **AuthContext.tsx** - State Management
- Manages user authentication state (user, token)
- Provides login/logout methods
- Persists authentication across page refreshes
- Error handling for login failures
- Loading states during authentication

**Usage:**
```tsx
import { useAuth } from './auth/AuthContext';

function MyComponent() {
  const { user, token, login, logout, isLoading, error } = useAuth();
  
  // Use auth state and methods
}
```

### 2. **LoginPage.tsx** - Authentication UI
- Email and password form
- Calls POST `/api/auth/login`
- Handles loading and error states
- Redirects to dashboard on success
- Clean, professional UI with gradient styling

**Expected API Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "employee|project_manager|super_admin"
  }
}
```

### 3. **ProtectedRoute.tsx** - Route Protection
- Wraps protected routes
- Checks for valid JWT token
- Redirects to `/login` if unauthorized
- Prevents unauthenticated access

**Usage:**
```tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### 4. **api.ts** - API Configuration
- Centralizes Axios configuration
- Auto-attaches JWT token to requests
- Handles 401 responses (token expired)
- Base URL from environment variable

**Configuration:**
```env
VITE_API_URL=http://localhost:3000/api
```

### 5. **Layout.tsx** - Main Application Layout
- Wraps authenticated pages
- Displays topbar with app name and user info
- Displays sidebar with role-based navigation
- Main content area with padding

**Structure:**
```
┌─────────────────────────────────────┐
│       Topbar (App Name + User)      │
├──────────────┬──────────────────────┤
│              │                      │
│   Sidebar    │    Main Content      │
│ (Role Menu)  │                      │
│              │                      │
└──────────────┴──────────────────────┘
```

### 6. **Sidebar.tsx** - Role-Based Navigation
Displays different menu items based on user role:

**Employee Menu:**
- Tasks (✓)
- Daily Updates (📝)

**Project Manager Menu:**
- Projects (📊)
- Tasks (✓)

**Super Admin Menu:**
- Dashboard (📈)
- Reports (📋)
- AI Wiki (🤖)

Navigation is handled dynamically based on user role.

## Token Storage

### Storage Helpers (tokenStore.ts)
```tsx
import { getToken, setToken, clearToken, getUser, setUser } from '@/auth';

// Get JWT token
const token = getToken(); // returns string | null

// Set JWT token
setToken('jwt_token_here');

// Clear token and user data
clearToken();

// Get user object
const user = getUser(); // returns User | null

// Set user object
setUser(userData);
```

## Authentication Flow

### Login Flow
1. User enters email and password on LoginPage
2. Form submits to POST `/api/auth/login`
3. Backend returns token and user object
4. Token and user are stored in localStorage
5. React state is updated
6. User is redirected to `/dashboard`
7. Layout wraps the page with Topbar and Sidebar

### Refresh Persistence
1. On app load, AuthContext checks localStorage
2. If token exists, it restores user and token to state
3. User remains logged in across page refreshes

### Logout Flow
1. User clicks logout button in topbar
2. `clearToken()` removes token and user from localStorage
3. Auth state is cleared
4. User is redirected to `/login`

### Protected Routes
1. User tries to access `/dashboard` without token
2. ProtectedRoute component checks for token
3. If no token, user is redirected to `/login`
4. If token exists, protected component renders normally

## Type Definitions

```tsx
export type UserRole = 'employee' | 'project_manager' | 'super_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}
```

## Usage Examples

### Example 1: Using useAuth Hook
```tsx
import { useAuth } from '@/auth';

function ProfileComponent() {
  const { user, logout } = useAuth();
  
  return (
    <div>
      <p>Welcome, {user?.name}!</p>
      <p>Role: {user?.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Example 2: Role-Based Conditional Rendering
```tsx
import { useAuth } from '@/auth';

function DashboardComponent() {
  const { user } = useAuth();
  
  return (
    <div>
      {user?.role === 'super_admin' && (
        <div>Admin Panel Content</div>
      )}
      
      {user?.role === 'project_manager' && (
        <div>Project Manager Content</div>
      )}
      
      {user?.role === 'employee' && (
        <div>Employee Content</div>
      )}
    </div>
  );
}
```

### Example 3: Making Authenticated API Calls
```tsx
import { api } from '@/auth';

async function fetchUserData() {
  try {
    const response = await api.get('/user/profile');
    // Token is automatically attached to request
    console.log(response.data);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
}
```

## Environment Configuration

Create a `.env` file in the project root:

```env
# .env
VITE_API_URL=http://localhost:3000/api
```

For development:
```env
VITE_API_URL=http://localhost:3000/api
```

For production:
```env
VITE_API_URL=https://api.production.com/api
```

## Styling

All components use CSS modules and are styled with:
- Modern CSS Grid and Flexbox
- Responsive design (mobile-friendly)
- Gradient colors (purple theme)
- Smooth transitions and hover effects

### Color Scheme
- Primary: #667eea (Purple)
- Secondary: #764ba2 (Dark Purple)
- Text: #333 / #666
- Background: #f5f5f5
- Sidebar: #2c3e50 (Dark Blue-Gray)

## Security Features

1. **JWT Token Storage**: Tokens stored in localStorage
2. **Automatic Token Injection**: Token added to all API requests
3. **401 Handling**: Automatic redirect to login on token expiration
4. **Protected Routes**: Unauthorized access redirected to login
5. **Error Messages**: User-friendly error display on login failure

## Next Steps & Integration

After login implementation, you can add:

1. **User Management Pages**
   - /tasks - Task management
   - /projects - Project management
   - /reports - Report generation
   - /ai-wiki - AI knowledge base

2. **API Integration**
   - Replace placeholder routes with real endpoints
   - Implement data fetching with useEffect
   - Add loading and error states per page

3. **User Profile**
   - Edit profile page
   - Change password functionality
   - Profile picture upload

4. **Additional Auth**
   - Forgot password flow
   - Email verification
   - Two-factor authentication (optional)

## Troubleshooting

### Token Not Persisting?
- Check browser localStorage is enabled
- Verify VITE_API_URL is correct
- Check network tab in DevTools for API response

### Infinite Login Loop?
- Ensure AuthProvider wraps entire app
- Check ProtectedRoute implementation
- Verify token structure in response

### API Calls Failing with 401?
- Token may be expired
- Check Authorization header in network tab
- Verify backend accepts Bearer token format

### Sidebar Not Showing Correct Menu?
- Check user.role value in localStorage
- Verify role matches one of: 'employee', 'project_manager', 'super_admin'
- Check ROLE_MENU_MAP in Sidebar.tsx

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```
