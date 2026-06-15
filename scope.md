# SCOPE.md

## Project Scope

The application imports expense data from a CSV file, validates records, detects anomalies, stores clean records in the database, and generates an import report.

---

# Dataset Overview

File: Expenses Export.csv

Total Rows: 42

Columns:

1. date
2. description
3. paid_by
4. amount
5. currency
6. split_type
7. split_with
8. split_details
9. notes

---

# Anomaly Log

## 1. Missing Payer

Issue:

Row contains no value in `paid_by`.

Example:

House cleaning supplies

Action Taken:

- Marked record as invalid.
- Added to anomaly report.
- Excluded from balance calculations until corrected.

Severity: High

---

## 2. Missing Currency

Issue:

Currency field is empty.

Example:

Groceries DMart (15-03-2026)

Action Taken:

- Defaulted currency to INR.
- Logged warning in import report.

Severity: Medium

---

## 3. Missing Split Type

Issue:

split_type field is empty.

Example:

Rohan paid Aisha back

Action Taken:

- Treated as settlement transaction.
- Stored separately from expense records.

Severity: High

---

## 4. Duplicate Expense Entries

Issue:

Possible duplicate records detected.

Examples:

Dinner at Marina Bites
dinner - marina bites

Action Taken:

- Flagged as potential duplicate.
- Requires user review before import confirmation.

Severity: High

---

## 5. Inconsistent User Names

Issue:

Same user appears under multiple names.

Examples:

Priya
priya
Priya S

Rohan
rohan

Action Taken:

- Normalized names.
- Mapped aliases to a single user record.

Severity: Medium

---

## 6. Mixed Date Formats

Issue:

Date formats are inconsistent.

Examples:

01-02-2026
Mar-14

Action Taken:

- Converted all dates to ISO format (YYYY-MM-DD).
- Invalid dates sent to anomaly report.

Severity: High

---

## 7. Amount Contains Formatting Characters

Issue:

Amount stored with comma separator.

Example:

1,200

Action Taken:

- Removed commas before numeric conversion.

Severity: Low

---

## 8. Excessive Decimal Precision

Issue:

Amount contains more than two decimal places.

Example:

899.995

Action Taken:

- Rounded to 900.00

Severity: Low

---

## 9. Negative Amount

Issue:

Negative transaction amount detected.

Example:

Parasailing refund (-30 USD)

Action Taken:

- Stored as refund transaction.
- Not treated as invalid.

Severity: Medium

---

## 10. Zero Amount Expense

Issue:

Expense amount equals zero.

Example:

Dinner order Swiggy

Action Taken:

- Flagged for review.
- Excluded from spending analytics.

Severity: Medium

---

## 11. Settlement Recorded as Expense

Issue:

Transaction appears to be money transfer rather than expense.

Example:

Rohan paid Aisha back

Action Taken:

- Classified as Settlement.
- Stored separately.

Severity: High

---

## 12. Unknown Group Member

Issue:

Split includes participant not present elsewhere.

Example:

Dev's friend Kabir

Action Taken:

- Added as temporary participant.
- Logged in anomaly report.

Severity: Medium

---

## 13. Membership Change Over Time

Issue:

Group members change during dataset.

Examples:

Meera leaves.
Sam joins.

Action Taken:

- Membership snapshots maintained by transaction date.

Severity: Medium

---

## 14. Multi-Currency Transactions

Issue:

Expenses recorded in INR and USD.

Examples:

Goa villa booking
Parasailing

Action Taken:

- Currency preserved.
- No automatic conversion performed.

Severity: Medium

---

# Database Schema

## users

| Field |
|---------|
| id |
| name |
| created_at |

---

## expenses

| Field |
|---------|
| id |
| expense_date |
| description |
| payer_id |
| amount |
| currency |
| split_type |
| notes |
| created_at |

---

## expense_participants

| Field |
|---------|
| id |
| expense_id |
| user_id |
| share_amount |

---

## settlements

| Field |
|---------|
| id |
| payer_id |
| receiver_id |
| amount |
| currency |
| settlement_date |

---

## import_logs

| Field |
|---------|
| id |
| row_number |
| anomaly_type |
| action_taken |
| severity |
| created_at |

---

# Summary

Total anomalies detected:

- Missing payer
- Missing currency
- Missing split type
- Duplicate records
- Mixed date formats
- Inconsistent names
- Settlement records
- Negative values
- Zero-value expenses
- Multi-currency entries
- Membership changes
- Unknown participants

The import pipeline records every anomaly and action taken in the generated import report.
