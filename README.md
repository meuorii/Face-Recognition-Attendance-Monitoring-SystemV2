# Face Recognition Attendance Monitoring System

## Overview

A full-stack attendance system that uses face recognition to automatically record attendance. It is built using Flask for both backend services and React (Vite) for the frontend. The system connects an AI microservice with a backend server and a client interface.

---

## Tech Stack

* AI Microservice: Flask (Face Recognition)
* Backend Server: Flask (API + MongoDB)
* Frontend: React + Vite
* Database: MongoDB

---

## Requirements

* Python 3.10+
* Node.js 18+
* MongoDB database
* npm

---

## AI Microservice Setup

### Install and run

```bash
cd AI-Microservice
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
python app.py
```

Runs on:

```
http://localhost:5001
```

---

## Backend Server Setup

### Install and run

```bash
cd Server
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
```

### Environment variables

Create `.env` file:

```
MONGO_URI=your_mongodb_connection_string
```

### Start server

```bash
python app.py
```

Runs on:

```
http://localhost:5000
```

---

## Frontend Setup

### Install and run

```bash
cd Client
npm install
npm run dev
```

### Environment variables

Create `.env` file:

```
VITE_API_BASE_URL=http://localhost:5000
```

Runs on:

```
http://localhost:5173
```

---

## How it works

1. User captures or uploads a face image in the frontend
2. Frontend sends request to backend API
3. Backend forwards image to AI microservice
4. AI microservice identifies the user
5. Backend stores attendance in MongoDB
6. Frontend displays attendance result

---

## Notes

* Run all 3 services at the same time
* Ensure MongoDB is running and accessible
* Check that ports 5000, 5001, and 5173 are free
* Backend depends on AI microservice for recognition

---
