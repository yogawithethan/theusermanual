# USER MANUAL PROJECT BRIEF

## Project Overview

The User Manual is the first real product built within the Islands
architecture.

It is an **expression** inside the "Yoga with Ethan" island.

This project serves two purposes:

1.  Deliver a real educational experience for users.
2.  Act as a structural prototype for the Islands schema and renderer.

------------------------------------------------------------------------

## Core Idea

The User Manual is a structured learning experience composed of thematic
modules.

Example modules:

-   Gravity Yoga
-   Wake the F\*\*\* Up
-   Deeper, Slower, Easier

Each module contains:

-   a themed environment
-   lessons or pages
-   structured educational content

------------------------------------------------------------------------

## Architectural Goals

The project must:

-   follow the Islands schema
-   separate content from presentation
-   support themed modules (scenes)
-   support structured pages

The web application is only a **renderer** for the structured content.

------------------------------------------------------------------------

## Initial Feature Scope

Version 1 should include:

1.  Landing page for the User Manual
2.  Module selection page
3.  Individual module page
4.  Lesson page renderer

The first version does NOT need:

-   authentication
-   progress tracking
-   community features
-   payment systems

------------------------------------------------------------------------

## Expression Structure

User Manual → Modules → Pages

Example:

User Manual\
→ Gravity Yoga\
→ Intro Page\
→ Lesson 1

------------------------------------------------------------------------

## Scene Design

Each module can define its own visual environment.

Examples:

Gravity Yoga → cosmic / planetary scene\
Wake the F\*\*\* Up → ocean sunset\
Deeper Slower Easier → clouds / lightness

Scenes may control:

-   background visuals
-   color palette
-   ambient audio
-   typography overrides

------------------------------------------------------------------------

## Content Format

Use simple portable formats.

Recommended:

-   Markdown for lesson content
-   JSON for metadata
-   Media files for assets

Example structure:

expressions/user-manual/modules/gravity-yoga/

-   module.json
-   scene.json
-   pages/
-   assets/

------------------------------------------------------------------------

## UI Principles

The experience should feel:

-   calm
-   immersive
-   intentional

Avoid clutter or platform-style feed mechanics.

Navigation should emphasize learning progression.

------------------------------------------------------------------------

## First Screens

Build the following screens:

1.  User Manual Landing Page
2.  Module Selection Page
3.  Module Overview Page
4.  Lesson Page

------------------------------------------------------------------------

## Components

Start with a small design system:

-   Page layout
-   Navigation bar
-   Module card
-   Lesson block
-   Rich text block
-   Video block
-   Quote block
-   CTA button

Do not over‑engineer components early.

Refactor once patterns repeat.

------------------------------------------------------------------------

## Success Criteria

The first version succeeds if:

-   modules render from structured files
-   scenes can change visual atmosphere
-   pages render from markdown or JSON blocks
-   the project feels like a coherent learning environment

------------------------------------------------------------------------

## Long-Term Direction

The User Manual may eventually support:

-   user accounts
-   progress tracking
-   AI personalization
-   community discussion
-   paid access

But these features are intentionally excluded from the first build.

Focus first on **structure and rendering**.
