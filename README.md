# Full Stack Developer Programming Skill Assessment

## Bidding Challenge

This repository contains my implementation of the Full Stack Developer Programming Skill Assessment – Bidding Challenge.

The application is a full-stack bidding system built with **Laravel, React, TypeScript, and MySQL**.

The implementation is divided into four assignments:

1. Build Something from Scratch
2. Live Bidding
3. Unit Testing
4. Automated Deployment Process

The application demonstrates the complete bidding flow, including bid validation, auction state management, multi-browser bidding, automated testing, and automated deployment.

---

# Tech Stack

## Frontend

* React
* TypeScript
* Vite
* CSS
* Vitest
* React Testing Library
* jsdom

## Backend

* PHP
* Laravel
* Laravel Eloquent ORM
* Laravel REST API
* PHPUnit
* Laravel Feature Tests

## Database

* MySQL

## Development & Deployment

* Node.js
* npm
* Composer
* Git
* GitHub
* Vercel
* Railway

---

# Project Structure

```text
bidding-assignment/

├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.test.tsx
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   ├── database/
│   ├── routes/
│   ├── tests/
│   ├── composer.json
│   └── ...
│
└── README.md
```

The frontend and backend are separated into independent applications. React communicates with Laravel through REST API endpoints.

---

# Assignment 1 – Build Something from Scratch

The first assignment implements the basic product bidding page.

## Features

* Display product information
* Display starting price
* Display current bid
* Display bid history
* Display bidder name
* Enter bidder name
* Enter bid amount
* Display bid increment
* Display current user's bid
* Display auction status
* Display countdown
* Display the winner when the auction ends

## Bid Validation

A bid is valid only when:

* A bidder name is provided
* A bid amount is provided
* The bid amount is a positive number
* The bid amount is higher than the current highest bid
* The auction has not ended

Frontend validation provides immediate feedback, while the backend performs the final validation before storing the bid.

This prevents the application from relying only on client-side validation.

---

# Assignment 2 – Live Bidding

The second assignment extends the bidding page to support multiple browser sessions participating in the same auction.

The backend acts as the **source of truth** for the auction state.

```text
Browser A
    │
    │ Submit Bid
    ▼
Laravel API
    │
    │ Validate & Store
    ▼
MySQL
    │
    │ Updated Auction State
    ▼
Browser B
```

The backend manages:

* Current highest bid
* Bid history
* Bidder information
* Auction start time
* Auction end time
* Auction status
* Winning bidder

When a bid is submitted, Laravel validates the request against the latest auction state and stores the valid bid in MySQL.

The frontend periodically requests the latest auction state so that multiple browser sessions can reflect updated bidding information.

## Auction Countdown

The auction lasts for one minute.

The countdown starts when the first valid bid is placed.

When the auction expires:

* The auction is marked as ended
* New bids are rejected
* The highest bid becomes the winning bid
* The winning bidder is displayed

---

# Assignment 3 – Unit Testing

The application includes automated tests for both the frontend and backend.

## Frontend Testing

The frontend uses:

* Vitest
* React Testing Library
* jsdom

The tests cover the main bidding user flows, including:

1. Displaying the product
2. Displaying the current bid and bid history
3. Disabling the BID button for invalid input
4. Enabling the BID button for a valid bid
5. Submitting a valid bid
6. Displaying the winner when the auction ends

### Run Frontend Tests

```bash
cd frontend
npx vitest run
```

Watch mode:

```bash
cd frontend
npx vitest
```

## Backend Testing

Laravel Feature Tests and PHPUnit are used to test API behaviour and bidding business rules.

The tests cover areas such as:

* Auction retrieval
* Bid creation
* Bid validation
* Rejecting bids below or equal to the current bid
* Auction state validation
* Rejecting bids after the auction ends
* Updating the current highest bid
* Storing bid history

### Run Backend Tests

```bash
cd backend
php artisan test
```

---

# Assignment 4 – Automated Deployment Process

The application uses **GitHub, Vercel, and Railway** for automated deployment.

## Deployment Architecture

* **Frontend:** React + TypeScript → Vercel
* **Backend:** Laravel + PHP → Railway
* **Database:** MySQL → Railway
* **Source Control:** GitHub

```text
GitHub
  │
  ├── React Frontend → Vercel
  │
  └── Laravel Backend → Railway → MySQL
```

Vercel and Railway are connected to the GitHub repository. New changes pushed or merged into the configured branch trigger new deployments.

The frontend and backend are deployed independently, while Laravel remains the source of truth for auction and bidding data.

## Testing with Reset

The application can be tested using multiple browser sessions to verify that bidding state is updated correctly.

A **Reset Auction** button is also provided as a testing utility.

It:

* Removes all bids
* Restores the current price to the starting price
* Changes the auction status back to `pending`
* Resets `started_at` to `null`
* Resets `ends_at` to `null`

This allows the auction flow to be tested repeatedly without manually modifying the database.

## Live Application

https://bidding-assignment.vercel.app/

## Future Improvements

For a production-scale implementation, I would introduce WebSockets or Laravel Broadcasting for real-time bid updates instead of periodic polling.

I would also expand automated test coverage for concurrent requests, auction expiration during bid requests, and additional API edge cases.

A dedicated CI/CD pipeline could also be introduced to run automated tests before production deployment.

---

# Local Development Setup

## Requirements

* PHP
* Composer
* Node.js
* npm
* MySQL

---

## Backend Setup

Go to the backend directory:

```bash
cd backend
```

Install PHP dependencies:

```bash
composer install
```

Create the environment file:

```bash
cp .env.example .env
```

Generate the Laravel application key:

```bash
php artisan key:generate
```

Configure the MySQL database in `.env`.

Example:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bidding
DB_USERNAME=root
DB_PASSWORD=
```

Run the migrations and seed the initial data:

```bash
php artisan migrate:fresh --seed
```

> `migrate:fresh --seed` is intended for local development/testing. It resets the local database and recreates the initial auction data.

Start the Laravel development server:

```bash
php artisan serve
```

The backend will normally be available at:

```text
http://127.0.0.1:8000
```

---

# Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

The frontend communicates with the Laravel backend through the configured API URL.

---

# Testing Workflow

## Frontend Tests

```bash
cd frontend
npm install
npx vitest run
```

## Backend Tests

```bash
cd backend
composer install
php artisan migrate:fresh --seed
php artisan test
```

## Run the Application

Backend:

```bash
cd backend
php artisan serve
```

Frontend:

```bash
cd frontend
npm run dev
```

Then open the frontend URL provided by Vite.
