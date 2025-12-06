# AI_Log

This log summarises how AI assistance was used during the design and implementation of the Smart University Microservices Platform.

## Overview

- **AI Role**: The AI acted as an architectural assistant and full-stack implementation partner.
- **Scope**: From requirements interpretation through architecture, coding, tests, and documentation.

## Key Interaction Milestones

1. **Requirements Understanding & Planning**
   - Parsed the course specification (SAD-Project-V1) and the extended instructions.
   - Produced a detailed plan for:
     - Service boundaries.
     - Core patterns (Saga, Circuit Breaker, Observer, State, Strategy).
     - Multi-tenancy strategy.
     - Frontend structure.
     - Infrastructure with Docker and docker-compose.

2. **Backend Skeleton & Core Services**
   - Created a Maven multi-module backend:
     - Parent POM with Spring Boot 3 and Spring Cloud BOM.
     - Modules for `auth-service`, `gateway-service`, `booking-service`, `marketplace-service`, `payment-service`, `exam-service`, `notification-service`, `dashboard-service`, and `common-lib`.
   - Implemented:
     - Auth (JWT issuance, BCrypt hashing).
     - Gateway (Spring Cloud Gateway, JWT filter, RBAC).
     - Booking (resources, reservations, concurrency-safe no-overbooking).
     - Marketplace & Payment (Saga orchestrator/participant with Strategy pattern).
     - Exam & Notification (State + Circuit Breaker + Observer via RabbitMQ).
     - Dashboard (IoT-style sensor and shuttle simulation).

3. **Event-Driven Integration**
   - Designed and implemented a RabbitMQ-based event bus:
     - `university.events` topic exchange.
     - `OrderConfirmedEvent` and `ExamStartedEvent` published by Marketplace and Exam services.
     - Notification service subscribed and persisted `NotificationLog` entries.

4. **Frontend SPA**
   - Set up React + TypeScript + Vite project.
   - Designed:
     - AuthContext for JWT, role, and tenant.
     - Routes and protected pages: Dashboard, Booking, Marketplace, Exams.
   - Implemented:
     - Login / Register flows against `/auth/**`.
     - Booking UI for resource listing and reservation creation.
     - Marketplace UI for product listing, quick Saga checkout, and product creation.
     - Exams UI for teacher exam creation/start and student submission.
     - Dashboard UI for live sensors and shuttle view.

5. **Testing**
   - Implemented backend integration tests:
     - Booking overbooking and concurrency test.
     - Marketplace Saga success and failure/compensation tests.
     - Exam lifecycle and Circuit Breaker fallback tests.
     - Notification event handling tests.
   - Implemented gateway filter tests:
     - 401 on missing token.
     - 403 for disallowed roles.
     - Header injection verification.
   - Set up Jest + React Testing Library + MSW in the frontend:
     - Basic tests for Login, Booking, Marketplace, Exams, and Dashboard pages.

6. **Infrastructure & Docker**
   - Added Dockerfiles for all services and frontend.
   - Created `docker-compose.yml` orchestrating:
     - All Postgres databases.
     - RabbitMQ + management UI.
     - All Spring Boot services.
     - API Gateway.
     - React SPA (served via Nginx).

7. **Documentation & ADRs**
   - Wrote:
     - `README.md` with overview and run instructions.
     - `docs/architecture.md` with C4 diagrams and NFR mapping.
     - ADRs for:
       - Service boundaries.
       - Multi-tenancy strategy.
       - Saga vs 2PC.
       - Circuit Breaker choice and placement.
       - Database-per-service strategy.
     - `docs/api-overview.md` summarising the main HTTP APIs.
     - `docs/Learning_Report.md` reflecting on patterns and NFR trade-offs.

## Interaction Style

- Iterative: responded to evolving instructions, filling in missing layers and refining features.
- Evidence-driven: cross-checked against specification items and updated code/docs to close gaps.
- Quality-focused: emphasised tests, multi-tenancy enforcement, and clear documentation rather than only “happy path” implementations.

This log complements the Learning Report by focusing on **how** the AI was used rather than what was learned from the architecture itself.