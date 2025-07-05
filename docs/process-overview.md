# How the Platform Works - Process and Algorithms

## Table of Contents
- [Introduction](#introduction)
- [Core Processes](#core-processes)
  - [User Authentication](#user-authentication)
  - [File Upload and Processing](#file-upload-and-processing)
  - [Chatbot Creation and Customization](#chatbot-creation-and-customization)
  - [Chat Flow](#chat-flow)
  - [Data Source Management](#data-source-management)
- [Algorithmic Details](#algorithmic-details)
  - [Vector Embeddings Generation](#vector-embeddings-generation)
  - [Response Generation using Google Gemini](#response-generation-using-google-gemini)
  - [Context Retrieval](#context-retrieval)
- [Error Handling](#error-handling)

## Introduction

This document details the processes and algorithms that enable the AI Chatbot Platform to function seamlessly. It covers user interactions, data processing, chatbot management, and the algorithms powering responses.

## Core Processes

### User Authentication
- **Flow Overview**: Uses Supabase Auth for managing identity and permissions.
- **Purpose**: Ensures secure and isolated access for users belonging to different companies.
- **Key Steps**:
  1. User signs up or logs in through the platform.
  2. Supabase creates and manages user sessions with JWT tokens.
  3. User access is mediated based on the role and company association.

### File Upload and Processing
- **Flow Overview**: Users upload various document types to form knowledge bases.
- **Purpose**: Feeds data to chatbots making them context aware.
- **Key Steps**:
  1. Upload documents through the dashboard.
  2. Files are stored in Supabase Storage.
  3. Documents are processed to extract text content.
  4. Processed text is transformed into vector embeddings stored in Pinecone.

### Chatbot Creation and Customization
- **Flow Overview**: Create chatbots tailored to specific business needs.
- **Purpose**: Allow dynamic interaction with AI tailored specifically for a business.
- **Key Steps**:
  1. Users create or modify chatbots via dashboard interfaces.
  2. Set chatbot features like personality, theme, and data source linkage.
  3. Configure public or internal access, enabling authentication where necessary.

### Chat Flow
- **Flow Overview**: Manages incoming messages and generates AI-driven responses.
- **Purpose**: Deliver efficient and intelligent interactions with end-users.
- **Key Steps**:
  1. User messages are received via API calls.
  2. Messages are transformed into vector embeddings.
  3. Embeddings are used to retrieve context from Pinecone using RAG techniques.
  4. Google Gemini API constructs a context-aware response.
  5. Responses are stored and returned to the user's interface.

### Data Source Management
- **Flow Overview**: Handles CRUD operations for chatbot data sources.
- **Purpose**: Integrate diverse data inputs for chatbot training and context awareness.
- **Key Steps**:
  1. Users can add, update, or remove data sources on the platform.
  2. Supports various formats including manual inputs and web scraping.
  3. Manages the status and visibility of each data source.

## Algorithmic Details

### Vector Embeddings Generation
- **Library Used**: Hugging Face API.
- **Process**: Converts text input from messages and data sources into numerical vector representations.
- **Purpose**: Facilitates semantic similarity retrieval in Pinecone.
- **Challenges**: Handle variable input sizes, ensuring API compatibility.

### Response Generation using Google Gemini
- **Library Used**: Google Generative AI.
- **Process**: Constructs responses based on current user queries and retrieved context.
- **Purpose**: Deliver meaningful and relevant interactions aligning with the designed personality of the chatbot.
- **Key Functions**: `generateChatResponse`, `generateChatResponseStream`.

### Context Retrieval
- **Library Used**: Pinecone.
- **Process**: Utilizes embeddings to search for semantically pertinent content.
- **Purpose**: Provide relevant information to the AI model for accurate response generation.
- **Algorithm**: Searches chunks for top-k most relevant results with configurable threshold.

## Error Handling

### Primary Methods
- **Logging**: Track all processing issues and user interactions for auditing and debugging.
- **User Feedback**: Display appropriate error messages in UI for a seamless user experience.
- **Retries**: Implement retries for recoverable operations like buffering or storage API calls.

### Example Errors
- **File Upload Errors**: Address issues like format validation and size restrictions.
- **API Errors**: Many service calls are wrapped in try-catch blocks for robust API communication.
- **Network Errors**: Incorporate exponential backoff policies to manage temporary connectivity issues.
