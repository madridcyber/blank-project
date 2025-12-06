# AI Interaction & Learning Report

This document reflects on how AI assistance was used to design and implement the Smart University Microservices Platform, and what was learned in the process.

## 1. Scope of AI Involvement

The AI assistant contributed to:

- Designing the service decomposition and key architectural patterns.
- Implementing Spring Boot microservices for:
  - Auth, Booking, Marketplace, Payment, Exam, Notification, Dashboard.
- Implementing the API Gateway (Spring Cloud Gateway) with JWT and RBAC.
- Implementing a React + TypeScript SPA (Vite) and wiring it to the gateway.
- Introducing resilience and integration patterns:
  - Saga orchestration (Marketplace ↔ Payment).
  - Circuit Breaker (Exam → Notification).
  - Observer/event-driven architecture (RabbitMQ events → Notification).
- Setting up Dockerfiles and `docker-compose` for full-stack orchestration.
- Writing integration and unit tests for critical paths.
- Documenting the architecture (C4-style) and Architectural Decision Records (ADRs).

The system was built iteratively, with the AI adapting to the evolving codebase and user requirements.

## 2. Architectural Learning

### 2.1 Microservices and Bounded Contexts

**What was applied**

- Each core domain was given its own microservice and database:
  - Auth, Booking, Marketplace, Payment, Exam, Notification, Dashboard.
- The API Gateway centralises:
  - Authentication (JWT validation).
  - RBAC for particularly sensitive operations.
  - Routing and header injection.

**Key learnings**

- Keeping services cohesive (Auth vs Booking vs Exam) simplifies reasoning about invariants and failure modes.
- Separate databases per service avoid cross-service coupling and schema entanglement.
- An API Gateway is a natural place to enforce cross-cutting concerns such as authentication, RBAC, and multi-tenancy header propagation.

### 2.2 Multi-Tenancy via Tenant Discriminators

**What was applied**

- Each service (except Dashboard) uses a `tenant_id` column on tenant-bound tables.
- Tenant id flows from:
  - Auth → JWT claim → Gateway → `X-Tenant-Id` header.
- Repositories perform explicit `findBy...AndTenantId` / `findAllByTenantId` operations.

**Key learnings**

- Row-level multi-tenancy strikes a good balance between isolation and maintainability for this scope.
- Propagating tenant context via headers is simple and works well with HTTP and message-based patterns.
- Careful repository design is essential: forgetting tenant filters is the main risk.

### 2.3 Saga and Compensating Transactions

**What was applied**

- Marketplace orchestrates a Saga for order checkout:
  1. Create `PENDING` order.
  2. Call Payment Service to authorise.
  3. Decrement product stock with pessimistic locking.
  4. Confirm order and emit `OrderConfirmedEvent`.
  5. On failure, mark order as `CANCELED`, and call Payment Service to cancel if necessary.

**Key learnings**

- Sagas are well-suited to REST + message-broker microservices where distributed transactions are not desirable.
- Modeling explicit states (`PENDING`, `CONFIRMED`, `CANCELED`) in the domain makes workflows more transparent than trying to hide them behind “all-or-nothing” abstractions.
- Tests should explicitly cover:
  - Success path (no compensation).
  - Payment failure path (order canceled, no stock decremented).
  - Stock failure path after payment authorization (compensation should run).

### 2.4 Resilience with Circuit Breakers

**What was applied**

- Exam Service wraps its HTTP call to Notification Service in a Resilience4j Circuit Breaker (`notificationCb`).
- On failure or open circuit:
  - A fallback logs the issue, and the exam start flow still succeeds.
  - An `ExamStartedEvent` is still emitted on RabbitMQ.

**Key learnings**

- Critical operations (like starting an exam) should not be blocked by non-critical dependencies (like notifications).
- Circuit Breakers help contain failures and prevent cascading issues when downstream services misbehave.
- Resilience4j integrates cleanly with Spring Boot 3 and allows tuning via configuration.

### 2.5 Observer and Event-Driven Architecture

**What was applied**

- Marketplace and Exam Service publish events (`OrderConfirmedEvent`, `ExamStartedEvent`) to a shared topic exchange (`university.events`).
- Notification Service subscribes to those events and persists `NotificationLog` entries.

**Key learnings**

- Separating event producers (Marketplace / Exam) from consumers (Notification) decouples concerns and allows additional observers in the future.
- Including `tenantId` and key identifiers in event payloads supports multi-tenancy and auditability.
- The event layer is an ideal place to implement cross-cutting behaviours like notifications, auditing, or analytics.

## 3. Testing and Quality

**What was added and refined**

- Integration tests for:
  - Booking reservations (ensuring overlapping reservations yield `409 Conflict`).
  - **Concurrent** booking attempts to demonstrate that pessimistic locking prevents overbooking.
  - Marketplace checkout Saga (success, payment failure, stock insufficiency with compensation).
  - Exam lifecycle: creating and starting exams, and student submissions.
- Unit/behavioural tests for:
  - Exam State pattern (DRAFT/SCHEDULED/LIVE/CLOSED behaviour).
  - Gateway JWT filter:
    - 401 when missing token.
    - 403 when a `STUDENT` tries to create a product.
    - Correct header injection for TEACHER/ADMIN roles.

**Key learnings**

- Behaviour-focused tests (e.g. concurrency tests, Saga compensation tests) are more valuable than purely structural tests.
- Testing edge cases around failure paths is essential for distributed systems, not just the happy path.
- Even in a small demo system, using realistic tests makes the architecture more credible and helps catch subtle bugs.

## 4. Frontend Integration Learnings

**What was applied**

- React + TypeScript SPA with:
  - Auth context and JWT storage in `localStorage`.
  - A shared Axios client that injects Authorization and tenant headers.
  - Pages that exercise backend flows:
    - Booking (resource list + reservation form).
    - Marketplace (quick “Buy 1” checkout).
    - Exams (teacher flow: create and start exam).
    - Dashboard (sensor and shuttle visualisation).

**Key learnings**

- Centralising auth state and HTTP header injection simplifies the SPA and avoids duplication.
- Thin, purpose-driven pages (e.g. “quick checkout” or “simple exam start”) are effective for demonstrating backend patterns without overwhelming the UI.
- Visualising live data (sensors, shuttle) makes the IoT/Dashboard service more tangible and showcases multi-tenancy (per-tenant data sets) in a user-friendly way.

## 5. Trade-offs and Limitations

- The system favours **clarity and didactic value** over completeness:
  - Payment is simulated, not integrated with a real gateway.
  - Notification uses logging and DB logs rather than email/SMS integration.
- Multi-tenancy is implemented at the row level rather than via per-tenant databases, trading stronger isolation for simpler operations.
- Some patterns (Saga, Circuit Breaker, Observer) are implemented in a “minimal complete” way to keep the codebase readable.

## 6. Future Enhancements

Potential improvements identified during this AI-guided development:

- Introduce a standard observability stack (centralised logging, metrics, dashboards) to monitor Sagas, Circuit Breakers, and event flows.
- Expand the Notification domain to support user preferences and multiple channels (email, push, SMS).
- Add richer frontend flows:
  - Full booking calendar and availability views.
  - Multi-product cart for marketplace.
  - Student exam-taking UI linked to submissions and grading.
- Introduce contract tests between services (e.g. using Spring Cloud Contract) to guard against interface drift.

## 7. Conclusion

The AI-assisted process was particularly effective at:

- Applying established architectural patterns (Saga, State, Circuit Breaker, Observer) consistently across services.
- Keeping a coherent multi-tenant model throughout all layers (JWT → Gateway → Services → Events).
- Producing not just code, but also tests and documentation (ADRs, architecture, API docs) that make the system understandable and maintainable.

The resulting platform is a realistic, pedagogically useful example of a modern microservices architecture using Java, Spring, React, and Docker, with clear points where students and engineers can extend or modify it.