# 6. Entity Relationship Diagram

The database structure adheres to relational normalization principles optimized for Neon PostgreSQL. The primary entities include Users, Subscriptions, and ImageLogs interactions capturing billing, security, and payload lifecycle metrics.

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar email
        varchar password_hash
        timestamp created_at
        enum tier "Free, Pro, Business"
    }

    SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        varchar stripe_customer_id
        varchar status
        timestamp valid_until
    }

    IMAGELOGS {
        uuid id PK
        uuid user_id FK
        varchar original_url
        varchar upscaled_url
        int processing_time_ms
        varchar requested_model
        timestamp processed_at
    }

    USERS ||--o| SUBSCRIPTIONS : "has"
    USERS ||--o{ IMAGELOGS : "generates"
```
