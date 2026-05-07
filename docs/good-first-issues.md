# Good First Issue Backlog — InsightBoard

These are ready-to-create GitHub issues for the public contributor backlog. Apply the `good first issue` label to each one.

## Add Date-Range Filter to the Revenue Chart

The revenue bar chart currently shows a fixed last-6-months window. A date range picker would make it useful for ops during specific campaigns or periods.

Acceptance criteria:
- Add a start/end date picker above the revenue chart.
- Chart updates reactively when the range changes.
- Default view remains the last 6 months on load.
- Unit test for the date-filter logic in the analytics service.

## Export Bookings Table to CSV

Ops teams need to pull booking data into spreadsheets. A CSV export button on the bookings page would close this gap.

Acceptance criteria:
- "Export CSV" button appears in the bookings page header.
- Export includes all visible columns and respects the current search filter.
- File is named `bookings-YYYY-MM-DD.csv` using today's date.
- No external CSV library required — use native `Blob` and `URL.createObjectURL`.

## Improve Empty State on the Transactions Page

When there are no transactions yet (new accounts, filtered result set), the transactions page shows a blank area. An empty state with copy and a visual cue would be clearer.

Acceptance criteria:
- Show an icon or illustration and a short description when the transactions list is empty.
- Handle both "no data ever" and "no results for current filter" cases.
- Responsive on mobile.

## Add Keyboard Navigation to the Collapsible Sidebar

The sidebar can be toggled via click but is not keyboard-accessible. Tab and Enter/Space should toggle it correctly.

Acceptance criteria:
- Sidebar toggle button has a visible focus ring and correct `aria-expanded` attribute.
- Enter and Space keystrokes trigger the toggle.
- Focus management is correct when the sidebar collapses (focus does not get trapped).

## Write Unit Tests for Analytics Service Data Transformation

The analytics service maps raw API responses to chart-ready data structures. These transformations have no test coverage.

Acceptance criteria:
- At least one test per public transformation method.
- Tests cover both happy-path and empty/null API responses.
- No mocking of Chart.js — only service-level logic is tested.
