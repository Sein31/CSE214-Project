# DataPulse: E-Commerce Analytics Platform with AI Chatbot

**Course:** CSE 214 - Advanced Application Development
**Project:** E-Commerce Analytics Platform with Multi-Agent Text2SQL AI Chatbot

## 📌 Project Overview
DataPulse is a comprehensive, multi-tenant e-commerce and analytics platform designed to bridge the gap between complex raw data and actionable business insights. It features a modern web architecture with a **Spring Boot** backend, an **Angular** frontend, and a highly advanced **LangGraph-based Multi-Agent AI Chatbot** powered by **FastAPI** and Google Gemini.

The platform supports three distinct user roles with strict Role-Based Access Control (RBAC):
1. **Admin:** Platform-wide oversight, user/store management, and global analytics.
2. **Corporate (Store Owner):** Store-specific inventory, order management, and detailed revenue analytics.
3. **Individual (Customer):** Product browsing, purchasing, order tracking, and personal spending insights.

## ✨ Key Features
- **📊 Dynamic Dashboards:** Interactive Chart.js integration (Pie, Doughnut, Line, Bar) for all user roles.
- **🔐 Robust Security:** Stateless JWT-based authentication, refresh tokens, and Spring Security method-level authorization (`@PreAuthorize`).
- **🤖 Advanced AI Chatbot:** 
  - **Multi-Agent Architecture:** Features 5 specialized agents (Guardrails, SQL Generation, Analysis, Visualization, Error Recovery).
  - **Text-to-SQL:** Converts natural language questions into secure, optimized SQL queries.
  - **Data Privacy:** Role-based data scoping ensures users only query data they own.
  - **Prompt Injection Defense:** Regex-based guardrails to prevent malicious system overrides.
- **💳 Order & Inventory Management:** Complete lifecycle from cart to delivery with low-stock alerts.
- **🛡️ Global Exception Handling & Validation:** Centralized `@ControllerAdvice` for clean API error responses and `@Valid` data validation.

## 🏗️ System Architecture
The application is built using a microservices-inspired monolithic architecture consisting of three main modules:

1. **Backend API (`/aad`):** 
   - **Tech Stack:** Java 17, Spring Boot 3, Spring Data JPA, Spring Security, Hibernate, MySQL.
   - **Role:** Core business logic, secure data access, and RESTful API endpoints.
2. **Frontend UI (`/frontend-aad`):** 
   - **Tech Stack:** Angular 17, TypeScript, Chart.js.
   - **Role:** Responsive, modular Single Page Application (SPA) with dark-mode aesthetic.
3. **AI Chatbot Service (`/chatbot`):** 
   - **Tech Stack:** Python 3, FastAPI, LangGraph, LangChain, Google Gemini API.
   - **Role:** Natural language processing and database querying engine.

## 🚀 Installation & Setup

### Prerequisites
- Java 17+
- Node.js 18+ and Angular CLI
- Python 3.10+
- MySQL Server 8.0+

### 1. Database Setup
Ensure MySQL is running and create the database:
```sql
CREATE DATABASE aad_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend (Spring Boot)
```bash
cd aad
mvn clean install -DskipTests
java -jar target/aad-0.0.1-SNAPSHOT.jar
```
*The application will run on `http://localhost:8081`*

Before starting backend, set these environment variables with your own values:
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `AI_CHATBOT_API_KEY`
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` (optional if using defaults)

### 3. Frontend (Angular)
```bash
cd frontend-aad
npm install
npm run dev # or ng serve
```
*The application will run on `http://localhost:4200`*

### 4. AI Chatbot (FastAPI)
```bash
cd chatbot
pip install -r requirements.txt
# Make sure to set your Gemini API key in a .env file
# GEMINI_API_KEY=your_api_key_here
python main.py
```
*The chatbot service will run on `http://localhost:8000`*

Set `AI_CHATBOT_API_KEY` in chatbot runtime too, and keep it the same as backend.

## 📖 API Documentation
Once the Spring Boot backend is running, the OpenAPI/Swagger documentation can be accessed at:
- **Swagger UI:** `http://localhost:8081/swagger-ui.html`
- **OpenAPI JSON:** `http://localhost:8081/v3/api-docs`

## 👥 Contributors
- **Hüseyin Umut Yıldırım** - 
