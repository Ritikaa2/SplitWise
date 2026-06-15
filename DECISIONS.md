# DECISIONS.md

## Decision 1: Use MySQL as the Primary Database

### Options Considered

* MySQL
* MongoDB

### Chosen

MySQL

### Reason

The imported expense data is highly structured and relational. Expenses, users, settlements, and import logs have clear relationships, making MySQL a better fit.

---

## Decision 2: Preserve Invalid Records in Import Logs

### Options Considered

* Reject invalid rows completely
* Store anomaly details in a dedicated import log

### Chosen

Store anomaly details in import logs

### Reason

This provides traceability and allows users to understand why a record was rejected or modified.

---

## Decision 3: Normalize User Names

### Options Considered

* Treat all names as separate users
* Normalize capitalization and spacing

### Chosen

Normalize user names

### Reason

The dataset contains variations such as "rohan", "Rohan", and "ROHAN". Normalization prevents duplicate user creation.

---

## Decision 4: Handle Missing Currency Values

### Options Considered

* Reject records
* Assign default currency

### Chosen

Assign default currency (INR)

### Reason

Most transactions are recorded in INR. Missing currency values were treated as INR and logged as warnings.

---

## Decision 5: Detect Duplicate Transactions

### Options Considered

* Import all records
* Flag potential duplicates

### Chosen

Flag duplicates

### Reason

Duplicate imports can distort balances and reporting. Potential duplicates are highlighted for review.

---

## Decision 6: Separate Settlements from Expenses

### Options Considered

* Store everything as expenses
* Maintain a separate settlements table

### Chosen

Separate settlements table

### Reason

Money transfers between users are not actual expenses and should not affect spending analytics.

---

## Decision 7: Generate Import Reports Automatically

### Options Considered

* Manual review
* Automated import reporting

### Chosen

Automated reporting

### Reason

Provides transparency and allows users to quickly understand import results.

---

## Decision 8: Preserve Original CSV Data

### Options Considered

* Overwrite imported data
* Preserve original values and store cleaned values

### Chosen

Preserve original values where possible

### Reason

Improves auditability and debugging.
