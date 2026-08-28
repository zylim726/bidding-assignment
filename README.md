# Full Stack Developer Programming Skill Assessment

## Bidding Challenge

This repository contains my implementation of the Full Stack Developer Programming Skill Assessment – Bidding Challenge.

The challenge is implemented as a full-stack web application using Laravel, React, TypeScript and MySQL.

The implementation is divided into four assignments:

1. Build Something from Scratch
2. Live Bidding
3. Unit Testing
4. Automated Deployment Process

The application demonstrates a complete bidding flow from the frontend to the backend, including bid validation, auction state management, live bidding between multiple browser sessions, and automated testing.

---

# Tech Stack

## Frontend

- React
- TypeScript
- Vite
- CSS
- Vitest
- React Testing Library
- jsdom

## Backend

- PHP
- Laravel
- Laravel Eloquent ORM
- Laravel REST API
- PHPUnit
- Laravel Feature Tests

## Database

- MySQL

## Development Tools

- Node.js
- npm
- Composer
- Git

---

# Project Structure

```text
bidding-assignment/
│
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

The frontend and backend are separated so that the React application communicates with Laravel through API endpoints.

---

# Assignment 1 – Build Something from Scratch

The first assignment implements the basic product bidding page.

The application displays a single product and provides a bidding interface where users can enter their name and bid amount.

## Features

- Display the product information
- Display the starting price
- Display the current bid
- Display bid history
- Display bidder name
- Allow users to enter their name
- Allow users to enter a bid amount
- Display the bid increment
- Display the current user's bid
- Display the auction status
- Display the countdown
- Display the winner when the auction ends

## Bid Validation

A bid is only considered valid when:

- A bidder name is provided
- A bid amount is provided
- The bid amount is a positive number
- The bid amount is higher than the current highest bid
- The auction is still active

The frontend provides immediate feedback by enabling or disabling the BID button based on the current input.

The backend also validates the bid before storing it in the database.

This prevents the application from relying only on client-side validation.

---

# Assignment 2 – Live Bidding

The second assignment extends the basic bidding page into a live bidding experience.

The main requirement is that multiple users should be able to participate in the same auction.

For example, two different browser sessions can open the same auction:

```text
Browser A
    |
    | Submit Bid
    v
Laravel Backend
    |
    | Validate & Store Bid
    v
MySQL
    |
    | Updated Auction State
    v
Browser B
```

The backend acts as the source of truth for the auction.

This means different browser sessions do not maintain independent auction states.

## Live Bidding Behaviour

The backend is responsible for maintaining:

- Current highest bid
- Bid history
- Bidder information
- Auction start time
- Auction end time
- Auction status
- Winning bidder

When a new bid is submitted:

1. The backend checks whether the auction is still active.
2. The backend retrieves the latest auction state.
3. The bid amount is validated against the current highest bid.
4. The valid bid is stored in MySQL.
5. The latest auction state is returned to the frontend.
6. Other browser sessions can retrieve the updated state.

This ensures that the frontend does not become the source of truth for the auction.

## Auction Countdown

The auction has a one-minute bidding period.

The countdown starts when the first valid bid is placed.

The frontend displays the remaining time and updates the countdown while the auction is active.

When the countdown reaches zero:

- The auction is marked as ended.
- New bids are rejected.
- The final highest bid becomes the winning bid.
- The winning bidder is displayed.
- The frontend changes to the ended state.

## Concurrent Bidding

The backend performs the important bid validation instead of trusting the frontend.

For example, if the current bid is RM 150:

```text
Browser A                Backend                 Browser B

Bid RM 180  ---------->  Validate
                              |
                              v
                         Store RM 180
                              |
                              v
                      Current Bid = RM 180
                              |
                              +-----------------> Updated Bid
```

This approach helps prevent a browser from submitting a bid based on outdated client-side data.

---

# Assignment 3 – Unit Testing

The third assignment focuses on automated testing for both the frontend and backend.

The purpose of the tests is to verify the application's main functionality and business rules without depending only on manual testing.

---

## Frontend Testing

The frontend uses:

- Vitest
- React Testing Library
- jsdom

The frontend test suite covers the main bidding user flows.

### Current Frontend Tests

The following scenarios are covered:

1. Displays the product when loaded
2. Displays the current bid and bid history
3. Disables the BID button when name and amount are empty
4. Disables the BID button when the bid is not higher than the current price
5. Enables the BID button for a valid bid
6. Submits a valid bid
7. Displays the winner when the auction has ended

All current frontend tests are passing.

### Run Frontend Tests

From the project root:

```bash
cd frontend
npx vitest run
```

Expected result:

```text
Test Files  1 passed
Tests       7 passed
```

### Run Frontend Tests in Watch Mode

During development, tests can also be run in watch mode:

```bash
cd frontend
npx vitest
```

---

## Backend Testing

The backend uses Laravel's testing framework with PHPUnit.

Backend tests are used to verify API behaviour and bidding business rules.

The backend tests cover areas such as:

- Auction retrieval
- Bid creation
- Bid validation
- Preventing invalid bids
- Preventing bids below or equal to the current highest bid
- Auction state validation
- Preventing bids after the auction has ended
- Correctly updating the current highest bid
- Correctly storing bid history

### Run Backend Tests

From the project root:

```bash
cd backend
php artisan test
```

Laravel will execute the backend test suite and report the number of passing and failing tests.

---

# Local Development Setup

## Requirements

Before running the project, make sure the following are installed:

- PHP
- Composer
- Node.js
- npm
- MySQL

---

# Backend Setup

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

Run the database migrations and seed the initial data:

```bash
php artisan migrate:fresh --seed
```

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

Open another terminal and go to the frontend directory:

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

The frontend communicates with the Laravel backend API.

---

# Testing Workflow

The project can be tested separately for frontend and backend.

## Frontend

```bash
cd frontend
npm install
npx vitest run
```

## Backend

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

Then open the frontend URL provided by Vite in the browser.

---
