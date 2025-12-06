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

### End-to-End Usage Walkthrough

Once `docker-compose up --build` is running:

1. Open the SPA at **http://localhost:3000**.

2. **Register a teacher user**

   - Go to **Register**.
   - Choose a username (e.g. `teacher1`).
   - Choose a password.
   - Set **Tenant / Faculty** to e.g. `engineering`.
   - Set **Role** to `TEACHER`.
   - Submit the form – you are automatically logged in after successful registration.

3. **Teacher: explore Dashboard**

   - Go to **Dashboard**.
   - Observe:
     - Live sensor cards (temperature, humidity, CO₂, energy).
     - Shuttle position moving within the pseudo-map.
   - Data is per-tenant (here: `engineering`), updated by scheduled jobs in the Dashboard service.

4. **Teacher: create a resource and book it**

   - Switch to **Booking**.
   - Initially, the list may be empty (or contain seeded resources if you added any).
   - As a TEACHER/ADMIN, you can add resources via backend, or pre-seed via DB; by default, the UI shows existing resources.
   - Select a resource from the list in the reservation form.
   - Pick a `Start time` and `End time` using the datetime inputs.
   - Click **Request reservation**.
   - Booking Service will:
     - Check for overlapping reservations within a transaction.
     - Reject overlapping requests with **409 Conflict** (no overbooking).
   - The UI shows a success or “slot already booked” message.

5. **Teacher: create marketplace products**

   - Go to **Marketplace**.
   - As TEACHER/ADMIN, a **Create product** form is visible at the top.
   - Fill in:
     - Product name (e.g. `Algorithms Textbook`).
     - Description (e.g. `CS fundamentals`).
     - Price and initial stock.
   - Submit:
     - The product is created via `POST /market/products`.
     - The product list is automatically updated and cached per tenant.

6. **Student: register and buy a product (Saga flow)**

   - Log out and register a new **STUDENT** user (e.g. `student1`) with the same tenant (`engineering`).
   - Log in as this student.
   - Go to **Marketplace**:
     - You see the products created by the teacher (tenant-scoped).
   - Click **Buy 1** on a product:
     - SPA sends `POST /market/orders/checkout`.
     - Saga orchestrator in Marketplace:
       - Creates a `PENDING` order.
       - Calls Payment Service to authorise.
       - Decrements stock with pessimistic locking.
       - Marks order `CONFIRMED` and publishes `order.confirmed` event.
   - The UI displays a success message or appropriate error (e.g. insufficient stock or simulated payment failure).
   - Notification Service consumes the `order.confirmed` event and logs a `NotificationLog` entry.

7. **Teacher: create and start an exam**

   - Log back in as `teacher1`.
   - Go to **Exams**.
   - Fill in the **Exam title** and a single **Question**.
   - Click **Create exam**:
     - Calls `POST /exam/exams`, creating a `SCHEDULED` exam.
     - The exam ID is shown below the form.
   - Click **Start exam**:
     - Exam Service uses the State pattern to move from `SCHEDULED` → `LIVE`.
     - It calls Notification Service via a **Resilience4j Circuit Breaker**:
       - On success: HTTP call logs a notification.
       - On failure: fallback logs an error, but the exam still starts.
     - Exam Service publishes `ExamStartedEvent` to RabbitMQ.
     - Notification Service also logs the event.

8. **Student: submit exam answers**

   - Log in as `student1`.
   - Go to **Exams**.
   - In the student section:
     - Paste the exam ID that the teacher created and started.
     - Enter your answer in the text area.
     - Click **Submit answers**.
   - Exam Service:
     - Verifies the exam is in `LIVE` state.
     - Creates a `Submission` tied to your student id and tenant.
     - Prevents duplicate submissions for the same exam/student.

9. **Dashboard: monitor ongoing activity**

   - With any logged-in user in the same tenant, return to **Dashboard**.
   - The SPA periodically polls:
     - `/dashboard/sensors` for live metrics.
     - `/dashboard/shuttle` for shuttle position.
   - The Dashboard service keeps these values in memory and updates them via scheduled jobs, so responses are fast and consistent.

> **Note on demo data**  
> When running via `docker-compose`, the `demo` profile seeds initial data for the `engineering` tenant:
> - Booking: `Room 101` and `Lab A` resources.
> - Marketplace: `Campus Notebook` and `Algorithms Textbook` products.
> - Exam: a `Sample Demo Exam` in `SCHEDULED` state.
> You can inspect the seeded exams via the Exam Service Swagger UI (`http://localhost:8085/swagger-ui.html`, `GET /exam/exams`) or by calling `GET /exam/exams` through the gateway.

This walkthrough exercises:

- Authentication & multi-tenancy (tenant-specific data everywhere).
- Booking with no overbooking and pessimistic locking.
- Marketplace Saga and compensation paths.
- Payment Strategy pattern behind the Payment Service.
- Exam lifecycle with State pattern and Circuit Breaker to Notification.
- Event-driven notifications via RabbitMQ.
- Dashboard/IoT simulation with periodic updates.

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