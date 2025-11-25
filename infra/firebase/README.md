# Firebase Infrastructure

This directory contains Nx project configuration for Firebase infrastructure management.

## Available Targets

- `nx run firebase-infra:deploy:rules` - Deploy Firestore and Storage rules
- `nx run firebase-infra:deploy:indexes` - Deploy Firestore indexes
- `nx run firebase-infra:deploy:all` - Deploy all Firebase resources
- `nx run firebase-infra:emulators` - Start all Firebase emulators
- `nx run firebase-infra:emulators:functions` - Start emulators with functions, firestore, and auth

## Note

All Firebase tasks are managed through Nx to ensure consistent task execution, caching, and dependency management.
