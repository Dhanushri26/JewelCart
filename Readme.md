# 💎 JewelCart — Full-Stack Luxury Jewelry E-Commerce

JewelCart is a production-ready, cloud-native luxury jewelry e-commerce platform built on a **React + Vite** frontend backed by **AWS Lambda microservices** connected through a single **AWS API Gateway**, with authentication handled by **AWS Cognito**.

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              React + Vite Frontend               │
│   AWS Amplify (Cognito Auth) · axios · TailwindCSS │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS + JWT Bearer Token
                       │ + x-user-id / x-user-role headers
                       ▼
<<<<<<< HEAD
┌─────────────────────────────────────────────────┐
│         AWS API Gateway (Single Entry Point)     │
│  https://k5piu4f4k3.execute-api.ap-southeast-1  │
│            .amazonaws.com                        │
=======
┌─────────────────────────────────────────────────          ┐
│         AWS API Gateway (Single Entry Point)     │
│https://fpgg90w2y8.execute-api.ap-southeast-1.amazonaws.com│
>>>>>>> a1085ac3f907c76d2adb17501784107a85c1a905
└──┬──────────┬──────────┬───────────┬────────────┘
   │          │          │           │           │
   ▼          ▼          ▼           ▼           ▼
[product]  [cart]    [order]    [payment]  [inventory]
 Lambda    Lambda     Lambda      Lambda     Lambda
   │          │          │           │           │
   └──────────┴──────────┴───────────┴───────────┘
                         │
                  AWS DynamoDB (per-service tables)
                  AWS SQS (order events)
                  AWS SNS (payment notifications)
```

---

## 📂 Project Structure

```
JewelCart/
├── frontend/                    # React + Vite SPA
│   └── src/
│       ├── api/
│       │   ├── axios.js         # Axios instance + Cognito auth interceptor
│       │   ├── cart.js          # Cart service API calls
│       │   ├── products.js      # Product service API calls
│       │   ├── orders.js        # Order service API calls
│       │   ├── payments.js      # Payment service API calls
│       │   └── inventory.js     # Inventory service API calls
│       ├── context/
│       │   └── AppContext.jsx   # Global state + backend wiring
│       ├── pages/               # All route pages
│       ├── routes/              # React Router config
│       ├── amplifyConfig.js     # Cognito configuration
│       └── main.jsx             # Entry point
│
<<<<<<< HEAD
├── backend/
│   ├── cart-service/
│   ├── cart.js                  # AWS Lambda handler
│   └── shared.js                # DynamoDB client + utilities
│
│   ├── product-service/
│   ├── products.js              # AWS Lambda handler
│   └── shared.js
│
│   ├── order-service/
│   ├── orders.js                # AWS Lambda handler (+ SQS pub)
│   └── shared.js
│
│   ├── payment-service/
│   ├── payments.js              # AWS Lambda handler (+ SNS pub)
│   └── shared.js
│
│   └── inventory-service/
=======
├── cart-service/
│   ├── cart.js                  # AWS Lambda handler
│   └── shared.js                # DynamoDB client + utilities
│
├── product-service/
│   ├── products.js              # AWS Lambda handler
│   └── shared.js
│
├── order-service/
│   ├── orders.js                # AWS Lambda handler (+ SQS pub)
│   └── shared.js
│
├── payment-service/
│   ├── payments.js              # AWS Lambda handler (+ SNS pub)
│   └── shared.js
│
├── inventory-service/
>>>>>>> a1085ac3f907c76d2adb17501784107a85c1a905
│   ├── inventory.js             # AWS Lambda handler
│   └── shared.js
│
├── API_ENDPOINTS.md             # 📋 Full endpoint connection log
└── README.md                    # This file
```

---

## 🔐 Authentication — AWS Cognito

| Setting | Value |
|---------|-------|
| User Pool ID | `ap-southeast-1_zGjdn5K3U` |
| App Client ID | `cpppgh9rt7kj1t3i5paej5526` |
| Region | `ap-southeast-1` |
| Login method | Email + Password |
| SDK | `aws-amplify` v6 |

### How it works:
1. User logs in via `LoginTest.jsx` → `signIn()` from `aws-amplify/auth`
2. Cognito issues Access Token + ID Token (JWT)
3. `axios.js` request interceptor:
   - Attaches `Authorization: Bearer <accessToken>` for API Gateway
   - Decodes the **ID token** to extract `sub`, `email`, `cognito:groups`
   - Injects `x-user-id`, `x-user-role`, `x-business-id` headers for Lambda
4. Each Lambda reads these headers via `extractUserContext(event)` in `shared.js`

### User Roles (via Cognito Groups):
| Group | Role | Permissions |
|-------|------|-------------|
| `Admin` | Admin | Full access to all services |
| `Business` | Business | B2B pricing, bulk cart import, credit PO |
| _(none)_ | Customer | Standard shopping access |

> **Note:** Add users to Cognito Groups to grant Admin/Business roles.

---

## 🌐 API Endpoints

> See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for the full connection log.

<<<<<<< HEAD
**Base URL:** `https://k5piu4f4k3.execute-api.ap-southeast-1.amazonaws.com`
=======
**Base URL:** `https://fpgg90w2y8.execute-api.ap-southeast-1.amazonaws.com`
>>>>>>> a1085ac3f907c76d2adb17501784107a85c1a905

### Products
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/products` | Required | List all products |
| `GET` | `/products/{productId}` | Required | Get product by ID |
| `POST` | `/products` | Admin | Create product |
| `PUT` | `/products/{productId}` | Admin/Business | Update product |
| `DELETE` | `/products/{productId}` | Admin | Delete product |

### Cart
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/cart` | Required | Get user's cart |
| `GET` | `/cart/summary` | Required | Cart totals (subtotal, tax, grandTotal) |
| `POST` | `/cart/items` | Required | Add item to cart |
| `PUT` | `/cart/items/{productId}` | Required | Update item quantity |
| `DELETE` | `/cart/items/{productId}` | Required | Remove item |
| `DELETE` | `/cart/clear` | Required | Clear all items |
| `POST` | `/cart/bulk-import` | Business/Admin | Bulk add items |

### Orders
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/orders` | Required | List user's orders |
| `GET` | `/orders/{orderId}` | Required | Get order detail |
| `POST` | `/orders` | Required | Place order from cart |
| `PUT` | `/orders/{orderId}/cancel` | Required | Cancel order |
| `PUT` | `/orders/{orderId}` | Admin | Update order status |
| `DELETE` | `/orders/{orderId}` | Admin | Soft-delete order |

### Payments
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/payments` | Required | List payments |
| `POST` | `/payments` | Required | Create payment record |
| `POST` | `/payments/intent` | Required | Create payment intent |
| `POST` | `/payments/verify` | Required | Verify/authorize payment |
| `POST` | `/payments/capture` | Admin | Capture payment |
| `POST` | `/payments/refund` | Admin | Refund payment |
| `POST` | `/payments/cancel` | Admin | Cancel payment |
| `POST` | `/payments/po-verify` | Business/Admin | Verify purchase order |

### Inventory
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/inventory` | Required | List inventory |
| `GET` | `/inventory/{productId}` | Required | Get product stock |
| `POST` | `/inventory` | Admin | Create inventory record |
| `PATCH` | `/inventory/reserve` | Admin/Business | Reserve stock |

---

## 🗄 DynamoDB Tables

Each Lambda service uses dedicated environment variables to reference its DynamoDB tables:

| Env Variable | Table Purpose | Used By |
|---|---|---|
| `PRODUCT_TABLE` | Product catalog | product-service, cart-service, order-service |
| `CART_TABLE` | Shopping carts | cart-service, order-service |
| `ORDER_TABLE` | Orders + indices | order-service, payment-service |
| `PAYMENT_TABLE` | Payment records | payment-service |
| `INVENTORY_TABLE` | Stock levels | inventory-service, cart-service |
| `DYNAMODB_TABLE_NAME` | Idempotency locks | All services |
| `ORDER_QUEUE_URL` | SQS queue URL | order-service |

### DynamoDB Key Schema (single-table design patterns):
```
PRODUCT#<productId>  /  METADATA          → Product record
CART#<userId>        /  ITEM#<productId>  → Cart item
ORDER#<orderId>      /  METADATA          → Order record
USER#<userId>        /  ORDER#<orderId>   → Order index (per user)
INVENTORY#<productId> / STOCK            → Stock record
PAYMENT#<paymentId>  /  METADATA          → Payment record
IDEMPOTENCY#<key>   /  LOCK              → Idempotency lock
```

---

## 🚀 Running Locally

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

### Lambda services (local testing)
Each service is a standalone Lambda. To test locally:
```bash
<<<<<<< HEAD
cd backend/cart-service
=======
cd cart-service
>>>>>>> a1085ac3f907c76d2adb17501784107a85c1a905
npm install
# Use AWS SAM or serverless-offline for local Lambda invocation
```

---

<<<<<<< HEAD
## � CI/CD Pipeline

This repository now includes production-ready GitHub Actions workflows for continuous integration and deployment.

### CI workflow

The workflow in [.github/workflows/ci.yml](.github/workflows/ci.yml) runs on pushes and pull requests to main, develop, and feature branches.

It includes:
- Node.js 22 setup and dependency caching
- Frontend linting, formatting, TypeScript compilation, tests, and coverage enforcement
- Backend dependency installation for each Lambda service
- Snyk and Trivy security scanning with SARIF uploads
- Frontend build and Lambda ZIP packaging

### CD workflow

The workflow in [.github/workflows/cd.yml](.github/workflows/cd.yml) runs after a successful CI run and also supports manual execution.

It performs:
- AWS authentication with GitHub OIDC
- Lambda code deployment using aws lambda update-function-code
- Frontend deployment to S3 and CloudFront invalidation
- A deployment health verification step

### Required GitHub configuration

Repository secrets:
- AWS_ROLE_ARN
- AWS_REGION
- SNYK_TOKEN
- CLOUDFRONT_DISTRIBUTION_ID

Repository variables:
- S3_BUCKET

### Local scripts

The deployment helpers are located in [scripts](scripts):
- package-lambda.sh
- deploy-lambda.sh
- deploy-frontend.sh
- verify-deployment.sh

Use them locally with:
```bash
chmod +x scripts/package-lambda.sh scripts/deploy-lambda.sh scripts/deploy-frontend.sh scripts/verify-deployment.sh
./scripts/package-lambda.sh
./scripts/deploy-lambda.sh
./scripts/deploy-frontend.sh
./scripts/verify-deployment.sh
```

### Troubleshooting

- Ensure the OIDC IAM role trust policy allows this repository
- Verify the AWS Lambda function names match those in the deployment script
- Confirm the frontend build output exists in frontend/dist before deployment
- Review GitHub Actions logs for the failing step and the SARIF upload status

---

## �📦 Frontend Dependencies
=======
## 📦 Frontend Dependencies
>>>>>>> a1085ac3f907c76d2adb17501784107a85c1a905

| Package | Purpose |
|---------|---------|
| `aws-amplify` v6 | Cognito auth (signIn, fetchAuthSession) |
| `axios` | HTTP client with interceptors |
| `react-router-dom` v7 | Client-side routing |
| `@tanstack/react-query` | Server state management |
| `framer-motion` | Animations |
| `lucide-react` | Icon library |
| `tailwindcss` v4 | Utility-first CSS |
| `react-hook-form` + `zod` | Form validation |

---

## ⚠️ Error Response Reference

| Status | Meaning |
|--------|---------|
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request / missing parameters |
| `401` | No authentication credentials |
| `403` | Unauthorized / insufficient role |
| `404` | Resource not found |
| `409` | Conflict (duplicate order, insufficient stock) |
| `422` | Validation error |
| `500` | Internal Lambda execution error |

---

## 📋 Roadmap

- [x] Cognito JWT integration (Access + ID token)
- [x] User role injection via request headers
- [x] Product catalog with API pagination
- [x] Cart CRUD (add, update, remove, clear)
- [x] Order placement from cart (transactional)
- [x] Payment intent creation (internal)
- [x] Order history page (live API)
- [x] Profile page with Cognito user data
- [x] Admin dashboard with live stats
- [ ] Cognito `custom:role` and `custom:businessId` attributes
- [ ] Order cancellation UI
- [ ] Inventory availability on product pages
- [ ] Admin product management UI
- [ ] Payment capture/refund admin UI
- [ ] Email notifications via SES
- [ ] B2B bulk import UI
- [ ] Docker / SAM local development setup

---

## 👨‍💻 Author

Developed as part of the **JewelCart** project — a cloud-native luxury jewelry e-commerce platform using AWS serverless architecture.

## 📄 License

This project is intended for learning and development purposes.
