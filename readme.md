# Expense Management & CSV Import System

## Overview

This application imports expense data from a CSV file, validates the data, detects anomalies, stores clean records in the database, and generates an import report.

The goal is to ensure data quality while maintaining transparency about any issues found during import.

---

## Features

- CSV Upload
- Data Validation
- Anomaly Detection
- Duplicate Detection
- Expense Management
- Import Report Generation
- Database Storage
- Responsive User Interface

---

## Tech Stack

### Frontend
- React.js
- Tailwind CSS

### Backend
- Node.js
- Express.js

### Database
- MySQL

### Libraries
- csv-parser
- multer
- mysql2

---

## Project Structure

frontend/
├── src/
├── public/

backend/
├── routes/
├── controllers/
├── services/
├── uploads/

docs/
├── README.md
├── SCOPE.md
├── DECISIONS.md
├── AI_USAGE.md

---

## Installation

### Clone Repository

git clone <repository-url>

### Backend Setup

cd backend

npm install

Create .env file:

PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=expense_manager

Run Backend:

npm start

### Frontend Setup

cd frontend

npm install

npm run dev

---

## Import Process

1. User uploads CSV file
2. System validates rows
3. Anomalies are detected
4. Clean records are stored
5. Import report is generated

---

## AI Usage

AI tools were used only for:
- Debugging
- Code explanation
- Documentation assistance

All generated content was manually reviewed and verified before implementation.

---

## Deployment

Frontend:
Vercel

Backend:
Render

Database:
MySQL
