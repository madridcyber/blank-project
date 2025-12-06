# Architecture Overview

This document provides a high-level architectural view of the Smart University Microservices Platform using C4-style abstractions and highlights the key patterns in use.

## C1 – System Context

The Smart University Platform is a system used by students, teachers, and administrators to manage resources, exams, marketplace transactions, and live campus information.

```mermaid
C4Context
    title Smart University Platform - System Context

    Person(student, "Student")
    Person(teacher, "Teacher")
    Person(admin, "Administrator")

    System(spa, "Smart University SPA", "React + TypeScript")
    System_Ext(smtp, "Email / SMS Provider", "Future extension")

    Rel(student, spa, "Uses via browser")
    Rel(teacher, spa, "Uses via browser")
    Rel(admin, spa, "Uses via browser")
```

## C2 – Containers

The system is decomposed into an API Gateway, multiple Spring Boot microservices, a React SPA, PostgreSQL databases, and RabbitMQ.

```mermaid
C4Container
    title Smart University Platform - Container View

    Person(student, "Student")
    Person(teacher, "Teacher")
    Person(admin, "Administrator")

    System_Boundary(sup, "Smart University Platform") {
        Container(spa, "React SPA", "Vite/React/TS", "Single-page UI")
        Container(gateway, "API Gateway", "Spring Cloud Gateway", "Routing, JWT validation, RBAC")
        Container(auth, "Auth Service", "Spring Boot", "Users, JWT issuance")
        Container(booking, "Booking Service", "Spring Boot", "Rooms, labs, reservations")
        Container(market, "Marketplace Service", "Spring Boot", "Products, orders, Saga orchestrator")
        Container(payment, "Payment Service", "Spring Boot", "Payment authorisation (Saga participant)")
        Container(exam, "Exam Service", "Spring Boot", "Exams, submissions, State + Circuit Breaker")
        Container(notification, "Notification Service", "Spring Boot", "Observer for domain events")
        Container(dashboard, "Dashboard Service", "Spring Boot", "IoT-style sensors and shuttle simulation")
        ContainerDb(authdb, "Auth DB", "PostgreSQL", "Users / credentials")
        ContainerDb(bookdb, "Booking DB", "PostgreSQL")
        ContainerDb(marketdb, "Market DB", "PostgreSQL")
        ContainerDb(paydb, "Payment DB", "PostgreSQL")
        ContainerDb(examdb, "Exam DB", "PostgreSQL")
        ContainerDb(notifdb, "Notification DB", "PostgreSQL")
        Container(rabbit, "RabbitMQ", "AMQP", "Domain event bus")
    }

    Rel(student, spa, "Uses")
    Rel(teacher, spa, "Uses")
    Rel(admin, spa, "Uses")

    Rel(spa, gateway, "HTTP/JSON (JWT)")
    Rel(gateway, auth, "HTTP/JSON")
    Rel(gateway, booking, "HTTP/JSON")
    Rel(gateway, market, "HTTP/JSON")
    Rel(gateway, payment, "HTTP/JSON")
    Rel(gateway, exam, "HTTP/JSON")
    Rel(gateway, notification, "HTTP/JSON")
    Rel(gateway, dashboard, "HTTP/JSON")

    Rel(auth, authdb, "JPA")
    Rel(booking, bookdb, "JPA")
    Rel(market, marketdb, "JPA")
    Rel(payment, paydb, "JPA")
    Rel(exam, examdb, "JPA")
    Rel(notification, notifdb, "JPA")

    Rel(market, rabbit, "Publishes order.confirmed")
    Rel(exam, rabbit, "Publishes exam.started")
    Rel(notification, rabbit, "Subscribes to events")
```

## Key Cross-Cutting Concerns

### Security

- **JWT** tokens issued by `auth-service` are validated centrally in `gateway-service`.
- Roles (`STUDENT`, `TEACHER`, `ADMIN`) and tenant id are encoded in JWT and propagated via headers:
  - `X-User-Id`, `X-User-Role`, `X-Tenant-Id`.
- Backend services trust only gateway-injected headers and do not parse JWTs directly.

### Multi-Tenancy

- Each microservice maintains its own database schema with a `tenant_id` column on tenant-bound tables.
- Tenant id is taken from `X-Tenant-Id` and is mandatory for multi-tenant endpoints.
- No cross-tenant access is allowed; e.g. Marketplace forbids using a product from another tenant.

### Reliability and Patterns

- **Saga pattern**  
  Marketplace orchestrates a Saga for checkout:
  1. Create `PENDING` order.
  2. Call Payment Service to authorise.
  3. Decrement stock with pessimistic locking and confirm order.
  4. On payment failure or stock issues, cancel order and compensate payment.

- **State pattern**  
  Exam lifecycle is modeled as:
  - `DRAFT`, `SCHEDULED`, `LIVE`, `CLOSED`
  - State objects encapsulate behaviour:
    - e.g. `ScheduledExamState.start()` transitions exam to `LIVE`.
    - Only `LIVE` accepts submissions.

- **Circuit Breaker (Resilience4j)**  
  Exam Service wraps HTTP calls to Notification Service in a `notificationCb` circuit breaker:
  - If notifications fail or the circuit is open, exam start still succeeds.
  - Failures are logged, and an `ExamStartedEvent` is still produced.

- **Observer / Event-Driven**  
  Services emit events to RabbitMQ:
  - `market.order.confirmed` (from Marketplace)
  - `exam.exam.started` (from Exam Service)
  - Notification Service subscribes and persists `NotificationLog` entries.

---

## C3 – Component Sketches

### Auth Service (auth-service)

Main components:

- `User` entity and `UserRepository`.
- `AuthService` for register/login.
- `JwtService` for JWT creation and validation.
- `AuthController` exposing `/auth/register` and `/auth/login`.

### Marketplace & Payment (Saga)

- Marketplace:
  - `Product`, `Order`, `OrderItem` entities.
  - `OrderSagaService` orchestrating:
    - Order creation.
    - Payment via `PaymentClient`.
    - Stock decrement with optimistic business checks and pessimistic DB locks.
    - Compensation on failure.
  - `MarketplaceController` for `/market/products` and `/market/orders/checkout`.

- Payment:
  - `Payment` entity, `PaymentRepository`.
  - `PaymentStrategy` interface + `MockPaymentStrategy`.
  - `PaymentService` + `PaymentController` for authorisation and cancellation.

### Exam & Notification (State + Circuit Breaker + Observer)

- Exam:
  - `Exam`, `Question`, `Submission` entities.
  - `ExamState` interface and `DraftExamState`, `ScheduledExamState`, `LiveExamState`, `ClosedExamState`.
  - `ExamStateFactory` to obtain behaviour from `ExamStateType`.
  - `NotificationClient` using Resilience4j Circuit Breaker.
  - `ExamService` orchestrates lifecycle, submissions, and event publication.
  - `ExamController` handling `/exam/exams` and `/exam/exams/{id}/start|submit`.

- Notification:
  - `NotificationLog` entity, `NotificationLogRepository`.
  - `NotificationService` persisting logs.
  - `NotificationMessagingConfig` + `NotificationListeners` to bind queues and handle incoming events.
  - `NotificationController` for direct HTTP-based notifications.

---

## Frontend SPA

- **React + TypeScript + Vite** SPA consuming the API Gateway:
  - AuthContext manages JWT and tenant id, syncing with localStorage.
  - Axios client automatically injects `Authorization` and `X-Tenant-Id` headers.
  - Pages:
    - **Login / Register** – flows against Auth Service.
    - **Dashboard** – polling `dashboard-service` sensors and shuttle data.
    - **Booking** – lists resources and allows ad-hoc reservation creation.
    - **Marketplace** – lists products and performs a “quick checkout” against the Saga.
    - **Exams** – teacher demo to create and start exams (triggering CB + Observer flows).

---

## Non-Functional Requirements Mapping

- **Scalability**:
  - Stateless services behind the API Gateway.
  - Separate databases allow independent scaling and data isolation.
- **Reliability**:
  - Saga patterns for cross-service consistency.
  - Circuit Breakers to isolate failures.
  - Pessimistic locking and transactional checks for overbooking and stock.
- **Security**:
  - Central JWT validation; strict header-based trust.
  - RBAC enforced at gateway and service layers.
- **Maintainability**:
  - Clear service boundaries with ADRs.
  - State, Strategy, and Observer patterns reduce conditional complexity.
  - Integration tests for key workflows (checkout, bookings, exams).

For deeper decision context, see the ADRs under `docs/adrs/`.