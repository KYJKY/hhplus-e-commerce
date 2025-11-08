# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an e-commerce backend system built with NestJS that implements core e-commerce functionality including product management, order processing, payment, coupon system, and inventory management. The system is designed for a clothing retail e-commerce platform.

**Target Database**: MySQL 8.0
**Package Manager**: pnpm

## Common Commands

### Development
```bash
# Install dependencies
pnpm install

# Start development server with watch mode
pnpm run start:dev

# Start development server
pnpm run start

# Start with debug mode
pnpm run start:debug

# Build for production
pnpm run build

# Run production build
pnpm run start:prod
```

### Testing
```bash
# Run all unit tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run specific test file
pnpm run test <filename>

# Run tests with coverage
pnpm run test:cov

# Run e2e tests
pnpm run test:e2e

# Debug tests
pnpm run test:debug
```

### Code Quality
```bash
# Format code
pnpm run format

# Run linter with auto-fix
pnpm run lint
```

## Documentation Structure
Comprehensive domain requirements are located in `docs/requirements/`:
- `README.md` - Project overview and stakeholders
- `user.md` - User profile and address management specifications
- `product.md` - Product catalog and inventory specifications
- `cart.md` - Shopping cart specifications
- `order.md` - Order processing specifications
- `payment.md` - Point management and payment processing specifications
- `coupon.md` - Coupon system specifications

Each domain document includes:
- Detailed functional requirements (FR-X-###)
- Business rules and validation logic
- Error codes and exception handling
- Input/output specifications

## Architecture Overview

### Domain-Driven Design Structure

The project follows a domain-driven design approach with six core domains:

1. **User Domain** - User profile and shipping address management
2. **Product Domain** - Product CRUD, inventory management, and popular product statistics
3. **Cart Domain** - Shopping cart item management
4. **Order Domain** - Order creation and status management
5. **Payment Domain** - Point management and payment processing (substitutes PG integration)
6. **Coupon Domain** - Coupon issuance, usage, and validation

### Point System (Payment Substitute)

The system uses a point-based payment system instead of PG integration:

- **Point Management**: Users charge and use points for purchases
- **Charging Rules**:
  - Amount: 1,000 ~ 1,000,000 KRW per charge
  - Unit: 1,000 KRW increments only
  - Max balance: 10,000,000 KRW
- **Transaction Types**: CHARGE (deposit), USE (payment), REFUND (refund, phase 1 excluded)
- **Concurrency Control**: Atomic operations required for point deduction/charging

### Order Processing Flow

The critical business flow follows this sequence:

1. **Order Creation** (PENDING status)
   - Validate cart items and check inventory availability
   - Create order with price and shipping address snapshot
   - Apply coupon if provided (1 coupon per order)

2. **Payment Processing** (PENDING → PAID)
   - Deduct user point balance
   - Deduct inventory atomically
   - Mark coupon as used (if applied)
   - Update order status to PAID
   - Remove cart items
   - Send data to external platform asynchronously

3. **Order Completion** (PAID → COMPLETED)
   - Final status after delivery completion

**Important**: Transaction rollback occurs if payment or inventory deduction fails. External data transmission failures do NOT affect order completion.

### Inventory Management

- Inventory is managed at the **ProductOption** level (size, color variants)
- Inventory deduction occurs at **payment completion**, not order creation
- Concurrent access requires atomic operations using one of:
  - Pessimistic locking: `SELECT ... FOR UPDATE`
  - Optimistic locking: Version column
  - Atomic update: `UPDATE ... SET stock_quantity = stock_quantity - ? WHERE stock_quantity >= ?`

### Coupon System

- First-come-first-served limited quantity coupons
- 1 coupon per user per coupon type
- 1 coupon per order
- Validation includes: expiration date, usage status, user ownership

### State Management

**Order States** (unidirectional):
- Normal flow: PENDING → PAID → COMPLETED
- Payment failure: PENDING → FAILED
- Cancellation: PENDING → CANCELLED (phase 1 excluded)

Final states (COMPLETED, FAILED, CANCELLED) cannot transition further.

### External Integration

- Asynchronous data transmission to external data platform after payment
- Retry logic: Maximum 3 attempts on failure
- Transmission failure does not block order completion

## Key Business Rules

### Critical Constraints
- All inventory operations must be atomic to prevent over-deduction in concurrent scenarios
- All point operations must be atomic to prevent balance inconsistency
- Order prices and shipping addresses are snapshot at order creation time
- Payment uses point system (substitutes PG integration)
- Inventory restoration on payment failure is immediate
- Point restoration on payment failure is immediate
- External API failures must not affect core order/payment flow

### Performance Requirements
- Product query API: Average 200ms or less
- Order processing: Average 1 second or less
- Concurrent users: Minimum 1,000

### Data Consistency
- Inventory deduction must guarantee atomicity
- Point deduction/charging must guarantee atomicity
- Order and payment data processed in transactions
- Coupon issuance quantity must be strictly controlled

## TypeScript Configuration

- Module system: NodeNext with ES2023 target
- Decorators enabled for NestJS
- Strict null checks enabled
- Path aliases configured via `tsconfig.json` baseUrl

## Test Configuration

- **Unit tests**: Located in `src/`, pattern `*.spec.ts`
- **E2E tests**: Located in `test/`, pattern `*.e2e-spec.ts`
- Test runner: Jest with ts-jest transformer
- Coverage output: `coverage/` directory
