# StudioSpace — Find Your Creative Space

A modern peer-to-peer creative studio rental marketplace where creators can discover and book studios, while studio owners can list, manage, and earn from their creative spaces.

StudioSpace connects photographers, filmmakers, content creators, and other creative professionals with studio owners through a simple and user-friendly platform.

## 🔗 Project Links

- **Live Website:** [Add Your Live Website URL]
- **GitHub Repository:** [Add Your GitHub Repository URL]

## 📌 About the Project

StudioSpace is a full-stack web application designed to make creative studio rentals easier and more accessible.

Finding a suitable photography or creative studio can be time-consuming. StudioSpace solves this problem by bringing studio owners and creators together on one platform.

Studio owners can publish their studio listings with photos, descriptions, pricing, capacity, amenities, and location details. Creators can explore available studios, save their favorites, submit booking requests, manage reservations, and communicate with studio owners.

The platform also includes an admin dashboard to manage users, studios, bookings, reviews, revenue, and customer inquiries.

## 🎯 Project Objectives

- Build a centralized marketplace for creative studio rentals.
- Make studio discovery and booking easier for creators.
- Help studio owners manage listings and bookings.
- Provide secure role-based access for different users.
- Improve communication between creators, hosts, and administrators.
- Create a transparent booking and review experience.

## ✨ Key Features

### 1. Authentication & User Management
- User registration and login.
- Google Sign-In integration.
- Role-based access control.
- Separate experiences for Admin, Host, and Creator.
- User profile management.
- Protected routes and authenticated API requests.

### 2. Studio Discovery
- Explore available creative studios.
- View studio images and detailed descriptions.
- Check studio location and category.
- View capacity and security deposit.
- Explore available amenities.
- View host information and studio ratings.

### 3. Host Dashboard
- Create and publish studio listings.
- Edit existing studio information.
- Manage studio images, descriptions, pricing, and amenities.
- View and manage bookings.
- Track studio revenue.
- View customer reviews and inquiries.

### 4. Booking Management
- Creators can book studios.
- Booking information includes selected dates and relevant details.
- Date validation helps prevent invalid booking requests.
- Hosts can manage booking statuses.
- Hosts can mark eligible bookings as completed.
- Creators can cancel eligible bookings.
- Booking status is reflected in the dashboard.

### 5. Wishlist
- Creators can save favorite studios.
- Add or remove studios from their wishlist.
- View saved studios from the Wishlist page.

### 6. Reviews & Ratings
- Creators can submit reviews after completing an eligible booking.
- Reviews include ratings and written feedback.
- Studio details display submitted reviews.
- Studios without reviews display a helpful empty state.

### 7. Two-Way Messaging & Contact System
- Creators can contact administrators through the Contact page.
- Creators can contact a host from a studio details page.
- Admins and hosts can view their respective inboxes.
- Admins and hosts can reply to incoming messages.
- Creators can reply to continue the conversation.
- Conversations and replies remain inside the application.
- Access to conversations is controlled by user roles and ownership.

### 8. Revenue & Invoice Management
- Hosts can view their studio revenue information.
- Administrators can access platform revenue information.
- Completed bookings support invoice access.
- Booking and payment-related information can be reviewed through the dashboard.

### 9. Admin Dashboard
- Manage platform users.
- Manage studio listings.
- Monitor bookings.
- Review creator feedback.
- View revenue information.
- Manage incoming contact messages.
- Reply to user inquiries.

### 10. Responsive UI & Theme Support
- Modern dark and light themes.
- Responsive layouts for different screen sizes.
- Consistent navigation and reusable interface components.
- Clear forms, buttons, cards, and dashboard sections.
- Toast notifications for user feedback.

## 👥 User Roles

| Role | Responsibilities |
|---|---|
| Creator | Explore studios, manage wishlist, book studios, contact hosts, and submit eligible reviews. |
| Host | Publish and manage studios, manage bookings, communicate with creators, and track revenue. |
| Admin | Manage users, studios, bookings, reviews, revenue, and platform inquiries. |

## 🛠️ Technology Stack

### Frontend
- **Next.js** — React-based framework for building the application interface and routing.
- **React** — Component-based UI development.
- **TypeScript** — Type safety and improved code reliability.
- **CSS** — Styling, responsive layouts, and theme customization.

### Backend
- **Node.js** — JavaScript runtime for server-side execution.
- **Express.js** — REST API development and request handling.
- **TypeScript** — Type-safe backend development.

### Database
- **MongoDB** — Stores users, studios, bookings, reviews, wishlists, and conversations.

### Authentication & Integrations
- **Google Sign-In** — Google authentication support.
- **Cookie/Bearer-based authentication** — Authenticated API access.
- **Role-based middleware** — Restricts protected operations according to user roles.

### Development Tools
- Visual Studio Code
- Git & GitHub
- npm
- MongoDB Atlas / MongoDB
- Postman (for API testing)

## ⚙️ How the Application Works

### Creator Workflow
1. Register or sign in.
2. Explore available studios.
3. Open a studio details page.
4. Review studio information, amenities, and ratings.
5. Add studios to the wishlist if desired.
6. Submit a booking request.
7. Track and manage bookings from the dashboard.
8. Contact the host when necessary.
9. Submit a review after an eligible completed booking.

### Host Workflow
1. Register or sign in as a Host.
2. Open the Host Dashboard.
3. Create a new studio listing.
4. Add studio information, images, pricing, capacity, and amenities.
5. Manage incoming bookings.
6. Communicate with creators through the inbox.
7. Complete eligible bookings.
8. Monitor revenue and customer reviews.

### Admin Workflow
1. Sign in with an Admin account.
2. Access the Admin Dashboard.
3. Manage users and studio listings.
4. Monitor platform bookings.
5. Review submitted feedback.
6. Monitor revenue.
7. Manage contact messages and reply to users.

## 🚀 Getting Started

Follow these steps to run StudioSpace locally.

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- MongoDB Atlas account or a local MongoDB instance
- Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd StudioSpace
```

### 2. Configure the Backend

Open the backend directory:

```bash
cd studiospace-server
npm install
```

Create a `.env` file in the backend directory and configure the environment variables required by your backend application.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

Add any other authentication or application secrets required by your backend configuration.

### 3. Start the Backend

```bash
npm run dev
```

The backend API should run at:

```text
http://localhost:5000
```

### 4. Configure the Frontend

Open another terminal and navigate to the frontend directory:

```bash
cd studiospace-client
npm install
```

Create a `.env.local` file and configure the frontend API URL according to your API configuration.

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

If your application uses a different environment variable name, use the exact name defined in your frontend API configuration.

### 5. Start the Frontend

```bash
npm run dev
```

Open your browser and visit:

```text
http://localhost:3000
```

**Note:** Never commit `.env`, `.env.local`, database credentials, authentication secrets, or private API keys to GitHub.

## 🔐 Security & Access Control

StudioSpace uses authentication and role-based authorization to protect important application operations.

- Protected API endpoints require authentication.
- Admin-only operations are restricted to administrators.
- Host operations are limited to the appropriate host account.
- Creator-specific operations require creator access.
- Booking and messaging operations validate the relevant user permissions.
- Sensitive configuration values are managed through environment variables.

## 💡 Why StudioSpace?

StudioSpace is designed to simplify the relationship between creative professionals and studio owners.

Instead of searching across multiple platforms or relying entirely on manual communication, users can discover spaces, manage bookings, save favorites, share feedback, and communicate through one application.

The project demonstrates practical full-stack development concepts, including authentication, authorization, database operations, REST APIs, CRUD functionality, role-based dashboards, and real-world marketplace workflows.

## 🔮 Future Improvements

- Online payment gateway integration.
- Advanced studio search and filtering.
- Real-time messaging and notifications.
- Calendar-based studio availability.
- Email notifications for booking updates.
- More detailed analytics for hosts and administrators.
- Advanced booking conflict prevention.

## 👩‍💻 Developer

Developed as a full-stack marketplace project using Next.js, TypeScript, Express.js, and MongoDB.

## 📄 License

This project is developed for educational and portfolio purposes. Add a formal license if you intend to distribute or reuse the code under specific terms.
