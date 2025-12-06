# Smart University Microservices Platform

A production-style **Smart University Management Platform** built as a set of Spring Boot microservices with a React + TypeScript SPA frontend.  
This project follows the specification of the _SAD-Project-V1(140401).pdf_ and implements:

- **Auth & User Service** – registration, login, JWT.
- **Booking & Resource Service** – room/lab resources and reservations with **no overbooking**.
- **Marketplace Service** – products and checkout with **Saga orchestration**.
- **Payment Service** – Saga participant with **Strategy** pattern for payment methods.
- **Exam & E-Learning Service** – exams and submissions with **State** + **Circuit Breaker**.
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
- **Messaging**: RabbitMQ (topic exchange, Observer-style events).
- **Frontend**: React, TypeScript, Vite, React Router, Axios.
- **Build & Infra**: Maven, Docker, docker-compose.

## Running the Backend (Local Dev)

1. Ensure you have **JDK 17+**, **PostgreSQL**, and **RabbitMQ** available, or use `docker-compose` (see below).
2. Build all backend modules:

   ```bash
   mvn clean verify
   ```

3. Run individual services from your IDE or via Maven, for example:

   ```bash
   # in separate terminals
   mvn -pl gateway-service spring-boot:run
   mvn -pl auth-service spring-boot:run
   mvn -pl booking-service spring-boot:run
   mvn -pl marketplace-service spring-boot:run
   mvn -pl payment-service spring-boot:run
   mvn -pl exam-service spring-boot:run
   mvn -pl notification-service spring-boot:run
   mvn -pl dashboard-service spring-boot:run
   ```

   Make sure each service has access to its PostgreSQL database and RabbitMQ instance as configured in its `application.yml`.

## Running the Frontend (Local Dev)

1. Install Node.js (18+ recommended).
2. Install dependencies and start the dev server:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. By default, the frontend assumes the API Gateway is reachable at `http://localhost:8080`.
   - You can override this by setting `VITE_API_BASE_URL` (e.g. `VITE_API_BASE_URL=http://localhost:8080`).

## Running the Full Stack with Docker

This repository provides a `docker-compose.yml` that starts:

- RabbitMQ (with management UI).
- A PostgreSQL database per service (auth, booking, market, payment, exam, notification).
- All backend microservices.
- The API Gateway.
- The React SPA served via Nginx.

### Prerequisites

- Docker and docker-compose installed.
- Built backend JARs (each service Dockerfile expects its fat JAR in `target/`).

Build the backend:

```bash
mvn clean package
```

This will produce JARs under each module's `target/` directory (e.g. `auth-service/target/auth-service-0.0.1-SNAPSHOT.jar`).

### Start everything

From the repository root:

```bash
docker-compose up --build
```

Key endpoints:

- API Gateway: http://localhost:8080
- Frontend SPA: http://localhost:3000
- RabbitMQ management UI: http://localhost:15672 (guest/guest)

### Example Flow

1. Open the frontend at http://localhost:3000.
2. Register a new user (choose tenant, e.g. `engineering`, and role STUDENT or TEACHER).
3. Log in and explore:
   - **Dashboard**: live sensors and shuttle simulation.
   - **Booking**: view available resources.
   - **Marketplace**: view products (teachers/admins can create products via API).
   - **Exams**: create and start a demo exam (teacher) and observe the behavior with the Circuit Breaker and notifications.

## Status

- **Backend services implemented**:
  - `common-lib` with shared event models.
  - `auth-service` with registration, login, JWT, and tests.
  - `gateway-service` with routing, JWT validation, and coarse RBAC.
  - `booking-service` with transactional no-overbooking and tests.
  - `marketplace-service` with Saga orchestration and RabbitMQ events.
  - `payment-service` with Strategy pattern and tests.
  - `exam-service` with State pattern, Circuit Breaker, and tests.
  - `notification-service` with HTTP + RabbitMQ Observer behavior and tests.
  - `dashboard-service` with simulated IoT data and tests.

- **Frontend**:
  - Vite React + TypeScript SPA with auth, dashboard, booking, marketplace, and exams pages.

Next steps include enriching tests, adding ADRs and architecture diagrams, and polishing documentation (API docs, AI interaction log, and learning report).