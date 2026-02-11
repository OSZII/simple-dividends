# Implementation Plan - Fix Recession Returns Calculation

The goal is to fix logical errors in `src/lib/server/scripts/calculateRecessionReturns.ts` and address user feedback regarding missing data and dividend logic.

## User Review Required

> [!IMPORTANT]
> **Logic Updates**:
> - **Total Return**: The calculation will be changed to `((endPrice - startPrice) / startPrice) * 100` to avoid double-counting dividends (since `adjclose` is used).
> - **Dividend Cuts**: Any decrease in dividend amount compared to the previous payment will now be flagged as a `cut`. (Previously, only dropping to zero was considered a cut).
> - **Missing Data**:
>   - Missing Price History: `totalRecessionReturn: -9999`, `recessionDividendPerformance: 'no_data'`.
>   - Missing Dividend History: `recessionDividendPerformance: 'no_data'`.

## Proposed Changes

### Logic Fixes

#### [MODIFY] [calculateRecessionReturns.ts](file:///Users/stefanostojic/Documents/GitHub/simple-dividends/src/lib/server/scripts/calculateRecessionReturns.ts)
- **Fix Total Return**:
    - Calculate `totalReturn` as `((endPrice - startPrice) / startPrice) * 100` (removing `allDivsSum`).
- **Fix Dividend Cut Logic**:
    - Iterate through dividend history chronologically.
    - If `amount[i] < amount[i-1]`, mark as `cut`.
    - If no cuts occurred:
        - If `finalAmount > initialAmount`, mark as `increased`.
        - Else mark as `maintained`.
    - If `dividendHistory` is empty, set `recessionDividendPerformance` to `'no_data'`.
- **Handle Missing Price History**:
    - In the block handling `priceHistory.length < 2`:
        - Set `totalRecessionReturn: -9999`.
        - **Add**: `recessionDividendPerformance: 'no_data'`.
- **Fix Counter**:
    - Add `updatedCount++` inside the loop where updates happen (after `await db.update(...)`).
    - *Reason*: Currently, `updatedCount` is initialized to 0 but never incremented, so the final log always says "Updated: 0". This fixes the reporting.

## Verification Plan

### Manual Verification
- Review the logic changes.
- Ensure type safety is maintained.
- Verify through code walk-through that `no_data` is set correctly for missing history/dividends.
