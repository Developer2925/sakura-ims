# Clinic System — Workflow

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │     │   Admin Panel   │
│  (Expo/RN)      │     │  (Vite + React) │
│  clinic staff   │     │  system admin   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └──────────┬────────────┘
                    ▼
         ┌─────────────────────┐
         │   Express API       │
         │   (Node.js :3001)   │
         └──────────┬──────────┘
                    ▼
         ┌─────────────────────┐
         │   MySQL Database    │
         │   (clinic_db)       │
         └─────────────────────┘
```

Two user roles share one API. Role is embedded in the JWT at login.

---

## User Roles

| Role | App | Access |
|------|-----|--------|
| `admin` | Admin Panel (web) | All clinics, restock management, analytics |
| `clinic` | Mobile App | Own inventory only |

---

## Authentication Flow

```
User enters username + password
        │
        ▼
POST /auth/login
        │
        ├─ Check users table (admin role)
        ├─ Check clinics table (clinic role)
        │
        ▼
JWT issued (7 day expiry)
  payload: { id, role, clinicId, username }
        │
        ▼
Token stored on client
All protected routes: Authorization: Bearer <token>
```

---

## Clinic Workflow (Mobile App)

### 1. Inventory Management

```
Dashboard
  │
  ├── View Inventory (/inventory)
  │     └── All items with quantity, batches, expiry dates
  │
  ├── Search by name
  ├── Scan barcode → find item
  └── View transaction history
```

### 2. Adding a New Item

```
Two entry methods:

(A) Manual Entry (/add-manual)
    Fill: name, category, price, quantity, expiry, barcode
    POST /items/manual
    → Creates item + inventory row + initial batch + transaction log

(B) Barcode Scan (/add-scan)
    Scan barcode
    GET /inventory/check/:barcode
    ├─ Item exists → go to Add Stock flow
    └─ Item not found → go to Manual Entry with barcode pre-filled
```

### 3. Using / Consuming Stock

```
Scan or select item (/scan-adjust or /inventory)
  │
  ▼
Enter quantity to use
POST /inventory/use
  │
  ├─ Checks sufficient stock
  ├─ FIFO batch deduction:
  │    earliest expiry first → nulls last
  │    deducts across batches until quantity met
  ├─ Updates inventory total
  └─ Logs transaction (type: 'use')
```

### 4. Adding Stock to Existing Item

```
Select item → Add Stock (/add-stock)
POST /inventory/add-stock
  │
  ├─ With matching batch (same price + expiry + condition)
  │    → increments that batch's quantity
  └─ No match
       → creates new batch
  │
  ├─ Updates inventory total + total_quantity_received
  └─ Logs transaction (type: 'add')
```

### 5. Restock Request Flow

```
Clinic                          Admin
  │                               │
  ├─ Low stock detected           │
  │                               │
  ▼                               │
POST /restock/request             │
  status: 'pending'               │
  │                               │
  │            ┌──────────────────┘
  │            ▼
  │    GET /admin/restock/requests
  │    Admin reviews pending requests
  │            │
  │     ┌──────┴──────┐
  │     ▼             ▼
  │  Approve        Reject
  │  POST /admin/   POST /admin/
  │  restock/       restock/
  │  approve        reject
  │     │             │
  │  status:       status:
  │  'approved'    'rejected'
  │     │             │
  │     │          Notification → clinic
  │     │
  │     ▼
  │  Admin ships items
  │  POST /admin/restock/deliver
  │  status: 'out_for_delivery'
  │  Notification → clinic: "Your order is on the way"
  │
  ▼
Clinic receives physical delivery
/confirm-delivery screen
POST /restock/confirm-delivery
  { requestId, price, expiryDate, conditionStatus }
  │
  ├─ status → 'delivered'
  ├─ Creates new item_batch with delivery details
  ├─ Updates inventory quantity + total_quantity_received
  └─ Logs transaction (type: 'add', notes: 'Restock delivery confirmed')
```

### 6. Notifications

Clinics receive in-app notifications for restock events:

| Event | Notification type |
|-------|------------------|
| Request approved | `approved` |
| Request rejected | `rejected` + admin note |
| Order shipped | `shipped` |

Notifications fetched from `GET /notifications`, deleted individually or cleared all at once.

---

## Admin Workflow (Web Panel)

### Clinic Management

```
Clinics page
  │
  ├─ View all clinics with:
  │    item count, total inventory value, total quantity
  │
  ├─ Edit clinic: name, username, email, password
  │
  ├─ Send credentials by email
  │    POST /admin/clinics/:id/send-credentials
  │    Sends branded HTML email with username + password
  │
  └─ View clinic's inventory (read-only)
       GET /admin/clinics/:id/inventory
```

### Restock Management

```
Restock Requests page
  │
  ├─ View all requests (filterable by status / clinic)
  ├─ Approve → notify clinic
  ├─ Reject (with optional note) → notify clinic
  └─ Mark as shipped (out_for_delivery) → notify clinic
```

### Analytics

```
Analytics page
  │
  ├─ Per-clinic monthly view
  │    GET /admin/analytics/monthly?month=YYYY-MM&clinicId=X
  │
  └─ Overall all-time view
       GET /admin/analytics/monthly?overall=true

Metrics:
  - Total restock requests + deliveries
  - Qty and cost added / used (period + all-time)
  - Current live inventory value
  - Usage percentage (cost used / total cost added)
```

---

## Database Tables

```
clinics              — clinic accounts
users                — admin accounts
items                — product catalog (per clinic)
inventory            — current quantity per clinic+item
item_batches         — stock batches (price, expiry, condition, qty)
restock_requests     — restock lifecycle per request
restock_logs         — audit trail for restock actions
transactions         — all stock movements (add/use)
notifications        — in-app alerts for clinics
```

### Batch System

Each stock addition creates or merges into a **batch** with its own price, expiry date, and condition. When stock is consumed:
- FIFO order: earliest expiry date first, null expiry dates last
- Unit price for the transaction is taken from the first batch deducted

---

## API Route Summary

| Method | Route | Role | Description |
|--------|-------|------|-------------|
| POST | `/auth/login` | any | Login, get JWT |
| GET | `/inventory` | clinic | Full inventory with batches |
| GET | `/inventory/check/:barcode` | clinic | Lookup by barcode |
| GET | `/inventory/search?q=` | clinic | Search by name |
| POST | `/inventory/use` | clinic | Consume stock (FIFO) |
| POST | `/inventory/add-stock` | clinic | Add stock to existing item |
| GET | `/inventory/transactions` | clinic | Transaction history |
| POST | `/items/manual` | clinic | Create new item |
| POST | `/restock/request` | clinic | Submit restock request |
| GET | `/restock/status` | clinic | Own restock requests |
| POST | `/restock/confirm-delivery` | clinic | Confirm receipt of delivery |
| GET | `/notifications` | clinic | Fetch notifications |
| PUT | `/notifications/read` | clinic | Mark all read |
| GET | `/admin/clinics` | admin | List all clinics |
| PUT | `/admin/clinics/:id` | admin | Update clinic credentials |
| POST | `/admin/clinics/:id/send-credentials` | admin | Email login details |
| GET | `/admin/clinics/:id/inventory` | admin | View clinic inventory |
| DELETE | `/admin/clinics/:id/data` | admin | Wipe clinic inventory data |
| GET | `/admin/restock/requests` | admin | All restock requests |
| POST | `/admin/restock/approve` | admin | Approve request |
| POST | `/admin/restock/reject` | admin | Reject request |
| POST | `/admin/restock/deliver` | admin | Mark as shipped |
| GET | `/admin/analytics/monthly` | admin | Usage analytics |
