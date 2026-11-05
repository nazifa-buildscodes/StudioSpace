# StudioSpace — Creative Studio Discovery & Booking Platform

<p align="center">

**Discover Spaces. Book with Confidence. Create Without Limits.**

</p>

<p align="center">

[🌐 Live Website](https://studio-space-gamma.vercel.app/) ·
[💻 GitHub Repository](https://github.com/nazifa-buildscodes/StudioSpace) ·
[⚙️ Backend API](https://studiospace-api-one.vercel.app/)

</p>

---

## 📖 About StudioSpace

**StudioSpace** is a full-stack creative studio discovery and booking platform that connects creators looking for professional creative spaces with hosts who want to list and rent out their studios.

From photography studios and podcast rooms to music studios and film production spaces, users can discover suitable creative environments, explore studio details, and book spaces through one platform.

StudioSpace provides separate experiences for Creators, Hosts, and Admins, making studio discovery, booking management, and communication more organized and convenient.

### 🎯 Why Use StudioSpace?

- Discover different creative studios in one place.
- Explore studio images, descriptions, locations, categories, and hourly prices.
- Request bookings and track booking progress.
- Save favorite studios to a personal wishlist.
- Communicate with hosts through the messaging system.
- Share feedback after completed bookings.
- Manage studio listings and booking requests through dedicated dashboards.

---

## 👥 User Roles

### 1. Creator

- Browse and explore creative studios.
- View individual studio details and pricing.
- Explore studios by category.
- Add and remove studios from wishlist.
- Request bookings and track booking status.
- Cancel eligible bookings.
- Contact hosts and exchange messages.
- Submit reviews after completed bookings.
- View booking information and download PDF invoices where available.
- Manage personal profile.
- Access a dedicated Creator dashboard.

### 2. Host

- Add, edit, and delete studio listings.
- Manage studio information, images, and pricing.
- View incoming booking requests.
- Confirm or reject booking requests.
- Manage booking progress.
- Communicate with creators.
- View booking and revenue summaries.
- View studio reviews.
- Access a dedicated Host dashboard.

### 3. Admin

- Access a separate Admin dashboard.
- Manage studio listings through the Admin management area.
- Access the Admin inbox.
- Handle platform communications.
- Access protected Admin functionality.

Each role has its own navigation, dashboard, and access permissions.

---

## ✨ Main Features

- **Authentication:** Registration, login, Google authentication integration, and role-based access.
- **Studio Discovery:** Featured studios, category-based exploration, and individual studio details.
- **Booking Management:** Booking requests, confirmation, rejection, cancellation, completion, and status tracking.
- **Reviews & Feedback:** Review submission after completed bookings and Host review viewing.
- **Role-Based Dashboards:** Separate Admin, Host, and Creator dashboards with relevant statistics and actions.
- **Responsive Design:** Layout optimized for desktop and mobile devices.

---

## 🌟 Extra Features & Additional Enhancements

Beyond the core project requirements, I added several additional features and improvements to make StudioSpace more functional, interactive, and user-friendly.

### 💬 Communication & Engagement

- **Two-Way Messaging System:** Direct communication between Creators and Hosts, as well as Creators and Admins.
- **Dedicated Inbox:** Separate messaging experiences for different user roles.
- **Creator Wishlist:** Save, view, and remove favorite studios.

### 💰 Booking & Business Management

- **PDF Invoice Generation:** Generate and download booking invoices.
- **Host Revenue Overview:** View revenue summaries through the Host dashboard.
- **Additional Booking Controls:** Booking cancellation, completion, and status management flows.

### 🎨 UI/UX & User Experience

- **Light, Dark & System Themes:** Multiple theme preferences for a comfortable browsing experience.
- **Skeleton Loading UI:** Display loading placeholders while studio data is being fetched.
- **Custom 404 Page:** A dedicated and user-friendly Not Found page.
- **Enhanced Empty States:** Helpful visual feedback when no data is available.
- **Toast Notifications:** Instant success and error feedback for user actions.
- **Confirmation Modals:** Additional confirmation before important actions.
- **Homepage Hero Slider:** An interactive hero section to improve the homepage experience.
- **Active Navigation Indicators:** Clear visual indication of the currently active section.

These enhancements helped me go beyond the basic requirements and focus on building a more polished and practical platform.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | Next.js, React.js, TypeScript |
| Styling | Tailwind CSS |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB |
| UI & Libraries | Swiper.js, next-themes, Sonner |
| Authentication | Google authentication integration, role-based authorization |
| API Communication | REST API |
| Deployment | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- Node.js
- npm
- Git
- MongoDB or MongoDB Atlas

### 1. Clone the Repository

```bash
git clone https://github.com/nazifa-buildscodes/StudioSpace.git
cd StudioSpace
```

### 2. Backend Setup

```bash
cd studiospace-server
npm install
npm run dev
```

Configure the required backend environment variables according to the backend configuration or `.env.example` file. Add your MongoDB connection details and authentication secrets.

### 3. Frontend Setup

Open another terminal:

```bash
cd studiospace-client
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=google_client_id
```

Start the frontend:

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

> The frontend normally runs on port `3000`, and the backend normally runs on port `5000`. Check the current `package.json` and `.env.example` files for exact scripts and environment variable names. Never commit real credentials or secrets to GitHub.

---

## 🔑 Demo Access

A separate demo account can be provided for reviewers to explore the Admin dashboard.

| Credential | Value |
|---|---|
| Admin Email | `nazifanowsin2021@gmail.com` |
| Admin Password | `Admin12` |

> Use a dedicated demo account instead of the owner's real Admin credentials. Prefer restricted permissions and sample data. Disable or rotate the demo credentials when no longer needed.

---

## 💡 My Learning Journey

StudioSpace has taught me much more than I initially expected. It has been one of the most valuable experiences in my development journey.

While building this project, I faced many bugs, errors, unexpected behaviors, and technical challenges. Some parts were completely new to me, and I could not implement everything perfectly at the beginning.

Instead of giving up, I researched unfamiliar topics, studied documentation and examples, explored different approaches, and used AI tools as a learning and problem-solving assistant.

AI helped me understand unfamiliar concepts, troubleshoot errors, explore implementation ideas, and improve different parts of the project. I also tried to understand, test, and adapt the solutions to my own codebase.

Every bug I fixed taught me something new. Every error helped me understand the project better. Working through these challenges improved my debugging skills, problem-solving ability, technical understanding, and confidence.

**I genuinely feel that StudioSpace has helped me become a better developer.**

I know I still have a lot to learn, but I gave this project my best effort with the knowledge and resources available to me. I am proud of the progress I have made, and I plan to keep learning, researching, and improving this project.

---

## 🔮 Future Improvements

- Advanced studio search, filtering, and sorting.
- Calendar-based availability management.
- Stronger booking-conflict prevention.
- Improved studio image galleries.
- More detailed Host and Admin analytics.
- Enhanced booking and messaging notifications.
- Further security, accessibility, and performance improvements.
- Automated testing and additional functionality.

StudioSpace is a work in progress, and I look forward to making it better with every iteration.

---

## 👩‍💻 Author

**Nazifa Nowsin**

- **GitHub:** [nazifa-buildscodes](https://github.com/nazifa-buildscodes)
- **Portfolio:** [nazifa-nowsin-portfolio.vercel.app](https://nazifa-nowsin-portfolio.vercel.app/)
- **LinkedIn:** [Nazifa Nowsin](https://www.linkedin.com/in/nazifa-nowsin-7b7459243/)

---

<p align="center">

**Made with learning, research, persistence, and creativity. 💚**

</p>

<p align="center">

Thank you for visiting StudioSpace!

</p>