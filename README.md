
# Service Review Website

## Description

This is a full-stack web application designed for users to review various services. The site allows users to submit reviews, view them, and rate different services. The website is built using a combination of **React.js** for the frontend and **Node.js** (Express) for the backend. The server is deployed on **Vercel**, and the frontend is hosted on **Netlify**. Firebase is used for user authentication and real-time data storage.

## Features

- User Authentication with Firebase (Signup, Login, Logout)
- Add service reviews (Title, Description, Rating)
- Display reviews for services
- Search and filter reviews based on ratings
- Responsive and modern UI built with **React.js** and **Tailwind CSS**
- Data stored in **Firebase** *MongoDB* database
- Server deployed on **Vercel**, client deployed on **Netlify**

## Installation

### Backend (Server-side)

1. Clone the repository:
   ```bash
   git clone <.....>
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file and configure your Firebase credentials and other necessary keys.

4. Start the server:
   ```bash
   npm start
   ```

   The backend will run on `http://localhost:5000`.

 ##  Backend Dependencies
 
The following NPM packages are used in the backend of this project:

cookie-parser: ^1.4.7
Middleware for parsing cookies attached to the client request object.
cors: ^2.8.5
Middleware to enable Cross-Origin Resource Sharing.
dotenv: ^16.4.7
Loads environment variables from a .env file into process.env.
express: ^4.21.2
A minimal and flexible Node.js web application framework.
jsonwebtoken: ^9.0.2
For creating and verifying JSON Web Tokens (JWT).
mongodb: ^6.12.0
Official MongoDB driver for Node.js.

### Frontend (Client-side)

1. Clone the repository:
   ```bash
   git clone <.......>
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase configuration and other environment variables.

4. Start the frontend:
   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:5173`.

## Deployment

- **Backend** is deployed on [Vercel](https://service-review-system-server-mauve.vercel.app).
- **Frontend** is deployed on [Netlify](https://fascinating-chebakia-6bd25e.netlify.app).
- **Frontend** is deployed on [Firebase](https://service-review-b0708.web.app).
- Firebase handles authentication and real-time database storage.

## Technologies Used

- **Frontend**: React.js, Tailwind CSS, daisyUi
- **Backend**: Node.js, Express, Mongodb
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Hosting**: Vercel (Backend), Netlify (Frontend)

## Contributing

Feel free to fork the repository and make improvements. If you encounter any issues or have suggestions, please submit an issue or a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Client
"NPM Packeges": {
    "axios": "^1.7.9",
    "date-fns": "^4.1.0",
    "lottie-react": "^2.4.0",
    "motion": "^11.15.0",
    "react": "^18.3.1",
    "react-countup": "^6.5.3",
    "react-hook-form": "^7.54.2",
    "react-hot-toast": "^2.4.1",
    "react-icons": "^5.4.0",
    "react-loader-spinner": "^6.1.6",
    "react-modal": "^3.16.3",
    "react-router-dom": "^7.1.0",
    "sweetalert2": "^11.15.3",
    "swiper": "^11.1.15"
}

