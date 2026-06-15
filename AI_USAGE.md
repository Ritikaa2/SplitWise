# AI_USAGE.md

## AI Tools Used

1. ChatGPT
2. GitHub Copilot
3. Claude (for documentation review)

---

## Purpose of AI Usage

AI tools were used for:

* Understanding CSV parsing approaches
* Reviewing database schema ideas
* Debugging backend issues
* Documentation assistance

All generated content was manually reviewed and modified before use.

---

# Key Prompts Used

### Prompt 1

How can I efficiently parse a CSV file in Node.js and detect invalid rows?

### Prompt 2

Suggest a database schema for an expense sharing application that supports settlements and expense participants.

### Prompt 3

How should duplicate transactions be detected during CSV imports?

---

# Case 1: Incorrect Date Handling

## AI Suggestion

AI suggested directly using JavaScript Date() for all values.

## Problem

Some dates in the dataset used inconsistent formats.

## How I Detected It

Imported records produced incorrect dates.

## Fix Applied

Added explicit date validation and normalization before database insertion.

---

# Case 2: Duplicate Detection Logic

## AI Suggestion

AI suggested checking only transaction descriptions.

## Problem

Different expenses can share the same description.

## How I Detected It

Several valid transactions were incorrectly marked as duplicates.

## Fix Applied

Duplicate detection was updated to use:

* Description
* Amount
* Date
* Payer

combined together.

---

# Case 3: Missing Currency Values

## AI Suggestion

AI recommended rejecting all records with missing currency values.

## Problem

Most dataset transactions were clearly INR-based.

## How I Detected It

Large numbers of otherwise valid transactions were being rejected.

## Fix Applied

Assigned INR as the default currency and recorded a warning in the import report.

---

# Human Verification

All AI-generated suggestions were reviewed before implementation.

No AI-generated code was accepted without testing and validation.

The final architecture, anomaly handling rules, and database schema decisions were manually reviewed and adjusted based on project requirements.
