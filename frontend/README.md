# Campus Exchange Frontend

A simple and minimal frontend for the Campus Exchange FastAPI backend. This frontend provides a complete user interface for buying, selling, and trading items among students.

## Features

- **User Authentication**: Login and signup functionality
- **Listings Management**: Create, view, and manage listings
- **Search & Filter**: Advanced search with filters for category, price, and keywords
- **Real-time Chat**: WebSocket-based chat system for buyers and sellers
- **Favorites**: Save and manage favorite listings
- **Notifications**: Real-time notifications for various events
- **User Profiles**: Complete profile management with image upload
- **Account Verification**: Multi-step verification process with OTP and ID upload
- **Admin Panel**: Comprehensive admin dashboard for managing users, listings, and verifications
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Setup Instructions

### Prerequisites

1. Make sure your FastAPI backend is running on `http://localhost:8000`
2. Ensure CORS is properly configured in your backend to allow requests from the frontend

### Installation

1. **Clone or download the frontend files** to your local machine
2. **Open the frontend directory** in your file explorer
3. **Open `index.html`** in your web browser

### Alternative: Using a Local Server

For better development experience, you can serve the files using a local server:

#### Using Python (if you have Python installed):
```bash
# Navigate to the frontend directory
cd frontend

# Python 3
python -m http.server 3000

# Python 2
python -m SimpleHTTPServer 3000
```

#### Using Node.js (if you have Node.js installed):
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the server
npm start
```

#### Using the included Python server:
```bash
# Navigate to the frontend directory
cd frontend

# Start the server
python server.py
```

Then open `http://localhost:3000` in your browser.

## Configuration

### API Base URL

The frontend is configured to connect to your FastAPI backend at `http://localhost:8000`. If your backend is running on a different URL, update the `API_BASE_URL` constant in `script.js`:

```javascript
const API_BASE_URL = 'http://your-backend-url:port/api/v1';
```

### CORS Configuration

Make sure your FastAPI backend has CORS properly configured to allow requests from the frontend domain. In your FastAPI app, you should have something like:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Usage Guide

### Getting Started

1. **Open the application** in your web browser
2. **Sign up** for a new account or **login** with existing credentials
3. **Browse listings** on the home page or listings section
4. **Create your own listings** using the "Create Listing" button

### Key Features

#### Authentication
- Click "Login" or "Sign Up" in the navigation bar
- Fill in the required information
- You'll be automatically logged in after successful registration

#### Creating Listings
1. Click "Create Listing" button (requires login)
2. Fill in the listing details:
   - Title
   - Description
   - Category
   - Price
   - Images (optional)
3. Submit the form

#### Searching Listings
1. Navigate to the "Search" section
2. Use the search filters:
   - Text search
   - Category filter
   - Price range
3. Click "Search" to see results

#### Chat System
1. Navigate to the "Chat" section (requires login)
2. Select a chat room from the sidebar
3. Type messages in the input field
4. Messages are sent in real-time via WebSocket

#### Managing Profile
1. Click on your profile icon in the navigation
2. Select "My Profile"
3. Update your information in the form
4. Upload a profile picture if desired

#### Account Verification
1. Click on your profile icon and select "Verification"
2. Enter your university email and student ID
3. Check your email for the OTP code
4. Enter the OTP code to verify
5. Upload a photo of your student ID
6. Wait for admin approval

#### Admin Panel (Admin users only)
1. Click on your profile icon and select "Admin Panel"
2. View dashboard statistics
3. Manage users, listings, and verifications
4. Approve or reject verification requests
5. Monitor system health and reports

#### Favorites
- Click the heart icon on any listing to add/remove from favorites
- View your favorites in the profile section

#### Notifications
- Click the bell icon to view notifications
- Unread notifications are highlighted
- Click "Mark All Read" to mark all notifications as read

## File Structure

```
frontend/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## API Endpoints Used

The frontend integrates with the following FastAPI endpoints:

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/signup` - User registration
- `GET /api/v1/auth/me` - Get current user info

### Listings
- `GET /api/v1/listings` - Get all listings (paginated)
- `POST /api/v1/listings` - Create new listing
- `GET /api/v1/listings/search` - Search listings
- `GET /api/v1/listings/my` - Get user's listings

### Chat
- `GET /api/v1/chat/rooms` - Get user's chat rooms
- `GET /api/v1/chat/rooms/{room_id}/messages` - Get chat messages
- `WebSocket /api/v1/chat/ws/{room_id}` - Real-time messaging

### Profile
- `GET /api/v1/profile/me` - Get user profile
- `PATCH /api/v1/profile/me` - Update user profile

### Verification
- `POST /api/v1/verification/request` - Request verification OTP
- `POST /api/v1/verification/verify-otp` - Verify OTP code
- `POST /api/v1/verification/upload-id` - Upload ID document
- `GET /api/v1/verification/status` - Get verification status
- `GET /api/v1/verification/pending` - Get pending verifications (admin)
- `POST /api/v1/verification/approve/{user_id}` - Approve verification (admin)
- `POST /api/v1/verification/reject/{user_id}` - Reject verification (admin)

### Admin
- `GET /api/v1/admin/stats` - Get admin dashboard statistics
- `GET /api/v1/admin/users` - Get paginated users list
- `GET /api/v1/admin/listings` - Get paginated listings list
- `GET /api/v1/admin/reports` - Get paginated reports list

### Favorites
- `GET /api/v1/favorites/` - Get user's favorites
- `POST /api/v1/favorites/{listing_id}` - Add to favorites
- `DELETE /api/v1/favorites/{listing_id}` - Remove from favorites

### Notifications
- `GET /api/v1/notifications` - Get user's notifications
- `PATCH /api/v1/notifications/{id}` - Mark notification as read
- `POST /api/v1/notifications/mark-all-read` - Mark all as read

## Browser Compatibility

This frontend works with all modern browsers:
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure your FastAPI backend has CORS properly configured
2. **API Connection Errors**: Verify your backend is running and the API_BASE_URL is correct
3. **WebSocket Connection Issues**: Ensure your backend supports WebSocket connections
4. **File Upload Issues**: Check that your backend is configured to handle file uploads

### Debug Mode

Open your browser's developer tools (F12) to see:
- Network requests and responses
- JavaScript console errors
- WebSocket connection status

## Customization

### Styling
- Modify `styles.css` to change the appearance
- The design uses CSS Grid and Flexbox for responsive layouts
- Color scheme can be easily changed by updating CSS variables

### Functionality
- Add new features by extending `script.js`
- Integrate additional API endpoints as needed
- Enhance the UI with additional JavaScript libraries

## Security Notes

- The frontend stores JWT tokens in localStorage
- All API requests include proper authentication headers
- File uploads are handled securely through FormData
- WebSocket connections are authenticated

## Contributing

To enhance this frontend:
1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This frontend is provided as-is for educational and development purposes.
