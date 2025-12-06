# Smart University Microservices Platform

A production-style **Smart University Management Platform** built as a set of Spring Boot microservices with a React + TypeScript SPA frontend.  
This project follows the specification of the _SAD-Project-V1(140401).pdf_ and implements:

- **Auth &amp; User Service** – registration, login, JWT.
- **Booking &amp; Resource Service** – room/lab resources and reservations with **no overbooking**.
- **Marketplace Service** – products and checkout with **Saga orchestration**.
- **Payment Service** – Saga participant with **Strategy** pattern for payment methods.
- **Exam &amp; E-Learning Service** – exams and submissions with **State** + **Circuit Breaker**.
- **Notification Service** – event-driven **Observer** for orders and exams.
- **Dashboard / IoT Service** – live sensors and shuttle tracking.
- **API Gateway** – Spring Cloud Gateway with central JWT validation and RBAC.
- **React SPA** – single-page application consuming the gateway.

This repository is organised as a **Maven multi-module monorepo** for backend services and a separate frontend project.

## Backend Modules

- `common-lib` – shared DTOs and event models (no shared persistence).
- `gateway-service` – Spring Cloud Gateway, JWT validation, routing, RBAC.
- `auth-service` – user registration and login.
- `booking-service` – resources and reservations.
- `marketplace-service` – catalog and order Saga orchestrator.
- `payment-service` – payment Saga participant with Strategy pattern.
- `exam-service` – exam lifecycle, submissions, Circuit Breaker.
- `notification-service` – event-driven notifications.
- `dashboard-service` – IoT-style sensors and shuttle tracking.

## Technology Stack

- **Backend**: Java 17, Spring Boot 3, Spring Cloud, Spring Security, Spring Data JPA, Spring AMQP, Resilience4j.
- **Databases**: PostgreSQL (one database per service).
- **Messaging**: RabbitMQ (topic exchanges, Observer-style events).
- **Frontend**: React, TypeScript, Vite, React Router, Axios.
- **Build &amp; Infra**: Maven, Docker, docker-compose.

## Running the Project (High Level)

Detailed instructions (including docker-compose orchestration and per-service notes) will be added as the implementation progresses.  
At a high level:

1. Ensure you have **JDK 17+, Node.js 18+, Docker, and docker-compose** installed.
2. Build the backend:

   ```bash
   mvn clean verify
   ```

3. (Later) Build and run the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. (Later) Start the full stack with Docker:

   ```bash
   docker-compose up --build
   ```

## Status

- **Phase 0–1** underway:
  - Maven multi-module skeleton created.
  - `common-lib` with shared event models.
  - `auth-service` implemented with registration, login, JWT, and tests.
  - `gateway-service` implemented with routing, JWT validation, and coarse RBAC.

Subsequent phases will add the remaining microservices, frontend SPA, tests, Docker orchestration, and full documentation (architecture docs, ADRs, API docs, AI interaction log, and learning report).