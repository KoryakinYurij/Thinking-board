# AI Surface And User Flows

## Purpose

This document defines the user-facing surfaces for capture, expansion, decomposition, review, and execution.

## Primary Surfaces

### Capture Surface

Purpose:
- let the user save rough intent quickly

Requirements:
- minimal friction
- supports short or messy input
- may create a `capture item` instead of forcing a full task immediately

### Inbox Or Triage Surface

Purpose:
- hold rough items before they become committed work

Requirements:
- show capture items clearly
- allow promotion into tasks
- allow `Expand with AI` before commitment

### Task Detail And AI Workspace

Purpose:
- central place for thinking and review

Requirements:
- show the selected capture item or task
- show pending AI suggestion sets
- provide explicit `Expand with AI`
- provide explicit `Decompose with AI`
- support partial acceptance and rejection

### List Or Focus Surface

Purpose:
- help users execute accepted work

Requirements:
- show actionable tasks clearly
- support status changes without requiring board gestures

### Board Surface

Purpose:
- help users review execution state

Requirements:
- show only committed top-level tasks
- remain secondary to capture and task detail
- preserve predictable reorder semantics

## Core User Flows

### Flow 1: Capture To Commit

1. user enters rough idea
2. system stores a capture item
3. user promotes it to task directly or runs AI first

### Flow 2: Expand Before Commit

1. user selects a capture item
2. user runs `Expand with AI`
3. system returns structured expansion output
4. user accepts selected improvements
5. user promotes the result into a committed task

### Flow 3: Expand A Task

1. user selects a committed task
2. user runs `Expand with AI`
3. system returns structured output such as clearer outcome, risks, or missing questions
4. user accepts selected fields into the task

### Flow 4: Decompose A Task

1. user selects a committed task
2. user runs `Decompose with AI`
3. system returns suggested subtasks or next actions
4. user accepts all or part of the suggestions
5. accepted items become subtasks or child work

### Flow 5: Execute Accepted Work

1. user works from list, focus, or board
2. user updates execution status
3. user completes, archives, or restores work

## Product Rules For Surfaces

- capture is for messy intent
- task detail is for review and AI-assisted thinking
- list or focus is for doing
- board is for committed-work visibility
- no surface should make pending AI output look like committed work
