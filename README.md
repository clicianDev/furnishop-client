# E-Commerce Frontend

React.js frontend application for the e-commerce platform.

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm run build`
Builds the app for production to the `build` folder.

### `npm test`
Launches the test runner.

## Pages

- **HomePage** (`/`) - Landing page with hero section and features
- **ShopPage** (`/shop`) - Browse all products with filters
- **ProductPage** (`/product/:id`) - Product details page
- **CheckoutPage** (`/checkout`) - Shopping cart and checkout
- **LoginPage** (`/login`) - User authentication
- **UserDashboard** (`/user-dashboard`) - User order history
- **AdminDashboard** (`/admin-dashboard`) - Admin panel

## Components

- **Navbar** - Navigation component with authentication state

## Environment

The app proxies API requests to `http://localhost:5000` (configured in package.json).

## State Management

- Uses React hooks (useState, useEffect)
- LocalStorage for cart and authentication tokens

## Styling

Custom CSS with responsive design for mobile and desktop.
