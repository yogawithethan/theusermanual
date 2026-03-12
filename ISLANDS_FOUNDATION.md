# ISLANDS FOUNDATION

## Purpose

Islands is a long-term platform vision for a network of sovereign
digital spaces. Each person or entity can own spaces, publish creative
work, build programs, communities, services, and experiences, and
eventually participate in a larger self-governing network.

This document defines the foundational architecture and philosophy that
all early projects should align with.

This is not yet the full product. It is the conceptual and structural
backbone.

------------------------------------------------------------------------

## Core Vision

Modern creators and communities are trapped inside platforms that own
their identity, audience, data, and presentation layer.

Islands aims to reverse that.

Long‑term goals:

-   Users own their content and data
-   Spaces are portable
-   Identity persists across spaces
-   A shared network connects those spaces
-   Creators can build expressive environments
-   The system encourages intentional use instead of infinite-scroll
    engagement

Islands is not just a website builder, not just a social network, and
not just a CMS.\
It is a runtime for expressive digital spaces connected by shared
identity and discovery.

------------------------------------------------------------------------

## Foundational Principles

### 1. Content and presentation must be separate

Separate:

-   structured content
-   metadata
-   presentation
-   interaction logic

The long‑term goal is that a space can be rendered by different
frontends.

### 2. The schema matters

Use a clear object model. Avoid burying meaning inside arbitrary page
components.

### 3. Spaces should be portable

Content should use readable formats:

-   JSON for structure
-   Markdown for text
-   standard media formats

### 4. Build from real specimens

Design the system by building real projects, not theoretical
abstractions.

### 5. Structured but extensible

Provide strong defaults but allow deeper customization later.

### 6. Intentional use

Avoid infinite scroll. Favor deliberate navigation.

### 7. Decentralization later

Use normal infrastructure early but design ownership and permissions
cleanly.

------------------------------------------------------------------------

## Core Concepts

### Person

A human identity in the system.

A person may: - own islands - follow islands - participate in islands

### Island

A distinct destination.

Examples: - Ethan Hill - Yoga with Ethan - Healing with MM

An island can contain multiple expressions.

### Expression

A body of creative work within an island.

Examples:

-   The User Manual
-   Train of Thought
-   Imagine Interviews

Expressions may contain internal structures like modules, albums, or
essays.

### Page

A renderable unit.

Examples:

-   landing page
-   lesson page
-   essay page

### Block

A page component.

Examples:

-   rich text
-   video
-   testimonial
-   CTA

### Theme

Global design rules such as fonts and colors.

### Template

Page layout structure.

### Scene

Atmosphere or environmental styling for a page or module.

Examples: - cosmic starscape - ocean sunset - cloud environment

------------------------------------------------------------------------

## Hierarchy

Basic hierarchy:

Person → Island → Expression → Page → Block

Additional optional layers inside expressions:

-   collection
-   sequence
-   item
-   module
-   lesson

------------------------------------------------------------------------

## Theme, Template, Scene

These are separate layers.

Theme = design language\
Template = page layout\
Scene = mood / environment

Pages inherit from higher levels but can override settings.

------------------------------------------------------------------------

## Renderer Philosophy

The renderer is the frontend application that reads island data.

The structured island content should be the **source of truth**, not the
renderer.

------------------------------------------------------------------------

## Discovery Philosophy

Future Islands systems should support:

-   user‑controlled home layouts
-   intentional discovery
-   summaries instead of noisy feeds
-   the ability to continue where you left off

Spaces should be immersive once entered.

------------------------------------------------------------------------

## Governance Vision

Eventually Islands may support:

-   self‑governing islands
-   community voting
-   portable identity
-   decentralized ownership

But early versions will use normal centralized infrastructure.

------------------------------------------------------------------------

## Development Rules

1.  Build real projects as schema specimens.
2.  Keep content separate from rendering.
3.  Prefer simple readable structures.
4.  Avoid premature abstraction.
5.  Use a small set of reusable components.
6.  Keep the object model explicit.

------------------------------------------------------------------------

## Immediate Relevance

The **User Manual** project is the first specimen built using the
Islands model.

It will test:

-   expression structure
-   page rendering
-   themes/templates/scenes
-   file organization

------------------------------------------------------------------------

## Success Criteria

Early work succeeds if:

-   structured content renders cleanly
-   the expression model works
-   the file structure stays understandable
-   the system can evolve into a broader Islands runtime
