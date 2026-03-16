

# Plan: Sales Flow & Box Calculator Integration

## Problem Summary
1. **Box Calculator missing from sidebar** — removed from nav but route `/box` still exists; needs to appear in the Calculators product grid
2. **No Lead→Client→Order conversion flow** — leads exist in isolation, no systematic progression through business stages
3. **No interconnections** — leads, clients, orders, calculations are disconnected entities

## Changes

### 1. Add Box Calculator to Product Selector (CalculatorPage)

Add "Транспортировочный ящик" as a standalone product type in the `PRODUCTS` array in `src/lib/calculator.ts`. On the `CalculatorPage`, when "box" is selected, render the `BoxCalculatorPage` content inline (extract its core into a reusable component) instead of showing `CalculatorForm`. Remove the standalone `/box` route from `App.tsx`.

**Files**: `src/lib/calculator.ts`, `src/pages/CalculatorPage.tsx`, `src/pages/BoxCalculatorPage.tsx` (extract core component), `src/App.tsx`

### 2. Lead → Client Conversion

When a lead is marked "qualified" or "won", offer to create/link a Client record:
- **LeadDetailDialog**: Add "Создать клиента" button that auto-fills client form from lead data (name, phone, email)
- **Lead table**: Add `client_id` column (already exists in schema) — populate on conversion
- **useLeads**: Add `convertToClient` method that creates a client record and links it to the lead
- **Visual**: Show linked client badge in lead card when `client_id` is set

**Files**: `src/components/sales/LeadDetailDialog.tsx`, `src/hooks/useLeads.ts`, `src/components/sales/LeadsTab.tsx`

### 3. Lead → Order Conversion (with Client)

Complete the flow: Lead (won) → Create Order linked to both lead and client:
- **LeadDetailDialog**: "Создать заказ" button creates order with `lead_id`, `client_id`, pre-filled `total_amount` from lead
- **Update lead status** to "won" and set `converted_to_order_id`
- **OrderFormDialog**: Accept `presetLeadId` (already supported) + auto-fill from lead data
- **LeadsTab**: Pass `onConvertToOrder` callback that opens OrderFormDialog with pre-filled data

**Files**: `src/components/sales/LeadsTab.tsx`, `src/components/sales/LeadDetailDialog.tsx`, `src/components/sales/OrdersTab.tsx`, `src/pages/ClientsPage.tsx`

### 4. Cross-Entity Visibility

- **Client card**: Show linked leads and orders (query by `client_id`)
- **Order detail**: Show linked lead info and client info
- **Lead detail**: Show linked client and order if converted

**Files**: `src/components/crm/ClientDetailDialog.tsx`, `src/components/sales/LeadDetailDialog.tsx`

### 5. Lead Status Flow Enhancement

Update statuses to reflect the full business process:
```
New → Qualified → Proposal Sent → Negotiation → Won → [auto: client + order created]
                                                  Lost → [reason required]
```

Add visual timeline/progress bar in LeadDetailDialog showing the current stage.

**Files**: `src/components/sales/LeadDetailDialog.tsx`

### No Database Migrations Needed
- `leads` already has `client_id`, `converted_to_order_id` columns
- `orders` already has `lead_id`, `client_id` columns
- All required schema is in place

### Implementation Order
1. Extract BoxCalculator into inline component, add to product grid
2. Implement Lead→Client conversion logic and UI  
3. Implement Lead→Order conversion with linked client
4. Add cross-entity references in detail dialogs
5. Add status flow timeline in lead card

