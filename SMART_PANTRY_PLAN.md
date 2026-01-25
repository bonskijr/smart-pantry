# SmartPantry: Financial Wisdom Update Plan

## 🎯 Goal
**Be financially wise with the monthly budget.**
Transform SmartPantry from a simple inventory tracker into a financial management tool for household groceries and essentials.

---

## 🚀 Key Features

### 1. Budget Management
- **Monthly Budget Setting:** Allow users to set a spending limit for each month.
- **Real-time Spending Tracker:** Visualize current spending vs. the monthly budget.
- **Rollover Budgets:** Option to roll over remaining budget to the next month or reset.

### 2. Cost Tracking & Unit Prices
- **Price per Item:** Add a `price` field to the `PantryItem` model.
- **Unit Price Calculation:** automatically calculate price per unit (e.g., $ per oz, $ per count) to help users identify the best value.
- **Total Value of Inventory:** Display the total financial value of the current stock.

### 3. Shopping List & Forecasting
- **Smart Shopping List:** Generate lists based on low stock *and* budget availability.
- **Estimated Cost:** Predict the cost of the shopping list before the user goes to the store.
- **"Buy Now vs. Wait" Insights:** Suggest deferring non-essential purchases if the monthly budget is tight.

### 4. Waste & Loss Analysis
- **Expired Item Cost:** Track the monetary value of items that expired and were thrown away ("Financial Waste Report").
- **Consumption vs. Waste:** Compare the value of consumed items vs. wasted items to encourage better buying habits.

### 5. Spending Insights (Analytics)
- **Category Breakdown:** Pie chart showing spend by category (already visually implemented, now needs financial data).
- **Monthly Trends:** Bar chart comparing spending month-over-month.
- **Top Expenses:** List the most expensive items or categories.

---

## 🛠 Technical Implementation Plan

### Phase 1: Database Schema Updates
- Update `PantryItem` model:
  - Add `price Decimal @default(0)`
  - Add `unit String?` (e.g., "oz", "kg", "count")
- Create `Budget` model:
  - `month String` (YYYY-MM)
  - `amount Decimal`
- Create `Transaction` model (optional but recommended for accurate history):
  - Record purchase events to track spending over time, even if items are consumed.

### Phase 2: Backend API
- `POST /budget`: Set monthly limits.
- `GET /budget/status`: Return current spend vs. limit.
- Update `POST /items` and `PUT /items` to accept price data.
- New Endpoint: `GET /analytics/waste`: Aggregated cost of expired items.

### Phase 3: Frontend UI/UX
- **Dashboard:**
  - Add "Budget Progress Bar" (Green/Yellow/Red indicators).
  - Update "Add Item" modal to include Price input.
- **New "Financials" Tab/Page:**
  - Detailed charts (Spend vs. Budget).
  - Waste Report.
- **Inventory List:**
  - Show "Value" column ($ Price * Quantity).

### Phase 4: Logic & Alerts
- Calculate total monthly spend based on `createdAt` or specific purchase dates.
- Trigger "Budget Warning" toast/banner when spending exceeds 80% or 100%.

---

## 📝 Next Steps
1. **Review & Refine:** Confirm this feature set aligns with the vision.
2. **Schema Migration:** Write the Prisma schema changes.
3. **API Development:** Implement the budget logic.
4. **UI Updates:** Add the financial visualization components.
