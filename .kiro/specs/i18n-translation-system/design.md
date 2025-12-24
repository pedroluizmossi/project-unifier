# Design Document - i18n Translation System

## Overview

The i18n Translation System provides a centralized, context-based approach to managing translations throughout Project Unifier. The system automatically detects the user's browser language preference and displays content in English or Portuguese. Users can manually switch languages, with their preference persisted to browser storage. The architecture uses React Context for global state management and a custom hook for component-level access to translations.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         TranslationProvider (Context)                │   │
│  │  - Manages active locale state                       │   │
│  │  - Detects browser language on init                  │   │
│  │  - Persists language preference to localStorage      │   │
│  │  - Provides setLocale function to children           │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         useTranslation Hook                          │   │
│  │  - Returns t() function for translation lookup       │   │
│  │  - Returns current locale                            │   │
│  │  - Returns setLocale function                        │   │
│  │  - Triggers re-render on locale change              │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Components (App, LandingPage, etc.)          │   │
│  │  - Call useTranslation hook                          │   │
│  │  - Use t() to retrieve translated strings            │   │
│  │  - Render translated content                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Translation Data Layer                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  en.json         │  │  pt.json         │                 │
│  │  (English)       │  │  (Portuguese)    │                 │
│  │                  │  │                  │                 │
│  │  {               │  │  {               │                 │
│  │    "hero": {     │  │    "hero": {     │                 │
│  │      "title": "" │  │      "title": "" │                 │
│  │    }             │  │    }             │                 │
│  │  }               │  │  }               │                 │
│  └──────────────────┘  └──────────────────┘                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### TranslationContext

```typescript
interface TranslationContextType {
  locale: 'en' | 'pt';
  setLocale: (locale: 'en' | 'pt') => void;
  t: (key: string, defaultValue?: string) => string;
}

const TranslationContext = React.createContext<TranslationContextType | undefined>(undefined);
```

### TranslationProvider Component

```typescript
interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  // Detects browser language on mount
  // Restores saved preference from localStorage
  // Provides context value to children
  // Handles locale changes and persistence
}
```

### useTranslation Hook

```typescript
export const useTranslation = (): TranslationContextType => {
  // Returns context value
  // Throws error if used outside TranslationProvider
  // Triggers re-render on locale change
}
```

### Translation Objects Structure

```typescript
interface Translations {
  [key: string]: string | Translations;
}

// Example structure:
const en: Translations = {
  hero: {
    title: "Transform Your Codebase",
    description: "...",
    cta: "Select Directory"
  },
  controls: {
    ignorePatterns: "Ignore Patterns",
    maxFileSize: "Max File Size"
  }
};
```

## Data Models

### Locale Type
- Supported values: `'en'` (English), `'pt'` (Portuguese)
- Default: `'en'` (English)
- Stored in: React Context state and browser localStorage

### Translation Keys
- Hierarchical dot-notation: `"hero.title"`, `"controls.ignorePatterns"`
- Organized by component/section
- Must exist in English translation file
- Optional in other language files (falls back to English)

### Browser Language Detection
- Source: `navigator.language` property
- Examples: `"en"`, `"en-US"`, `"pt"`, `"pt-BR"`, `"pt-PT"`
- Logic: If starts with `"pt"`, use Portuguese; otherwise use English

### Storage
- Key: `"app-locale"` in browser localStorage
- Value: `"en"` or `"pt"`
- Persisted when user manually changes language
- Restored on application reload

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Portuguese Language Detection
*For any* browser language code, if it is "pt" or starts with "pt-", the system should set the active locale to Portuguese.
**Validates: Requirements 1.2**

### Property 2: Fallback to English
*For any* browser language code that is not Portuguese, the system should set the active locale to English.
**Validates: Requirements 1.3**

### Property 3: Translation Key Lookup
*For any* translation key that exists in the current locale, calling the translation function should return the translated string for that key.
**Validates: Requirements 2.2**

### Property 4: English Fallback for Missing Keys
*For any* translation key that does not exist in the current locale but exists in English, the translation function should return the English translation.
**Validates: Requirements 2.3**

### Property 5: Locale Change Propagation
*For any* component using the useTranslation hook, when the active locale changes, the component should re-render with the new locale value.
**Validates: Requirements 4.4**

### Property 6: Language Persistence Round Trip
*For any* locale value, when the user sets the locale and the application reloads, the system should restore the same locale value.
**Validates: Requirements 3.4**

### Property 7: Hook API Completeness
*For any* component calling the useTranslation hook, the hook should return an object containing the translation function, current locale, and setLocale function.
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 8: Context Initialization
*For any* application startup, the TranslationProvider should initialize the context with either the saved locale from localStorage or the detected browser language.
**Validates: Requirements 5.1**

### Property 9: Language Switch Robustness
*For any* sequence of locale changes, the system should not throw runtime errors and should correctly update the active locale each time.
**Validates: Requirements 7.4**

### Property 10: All Keys Exist in English
*For any* translation key used in the application, that key should exist in the English translation file.
**Validates: Requirements 7.3**

## Error Handling

### Missing Translation Keys
- **Scenario**: A component requests a translation key that doesn't exist in any locale
- **Handling**: Return the key itself as a fallback (e.g., "hero.title" if not found)
- **Logging**: Log a warning to console in development mode

### Invalid Locale
- **Scenario**: An invalid locale is passed to setLocale
- **Handling**: Ignore the change and keep the current locale
- **Logging**: Log a warning to console

### Context Not Available
- **Scenario**: useTranslation hook is called outside TranslationProvider
- **Handling**: Throw an error with a helpful message
- **Message**: "useTranslation must be used within a TranslationProvider"

### localStorage Unavailable
- **Scenario**: Browser doesn't support localStorage or it's disabled
- **Handling**: Fall back to browser language detection on each load
- **Behavior**: Language preference won't persist across sessions

## Testing Strategy

### Unit Testing
- Test language detection logic with various browser language codes
- Test translation key lookup with existing and missing keys
- Test fallback behavior when keys don't exist in current locale
- Test localStorage persistence and retrieval
- Test hook API returns correct values

### Property-Based Testing
- **Property 1**: Generate random browser language codes and verify Portuguese detection
- **Property 2**: Generate random non-Portuguese language codes and verify English fallback
- **Property 3**: Generate random translation keys and verify correct lookup
- **Property 4**: Generate random missing keys and verify English fallback
- **Property 5**: Generate random locale changes and verify component re-renders
- **Property 6**: Generate random locales, persist, reload, and verify restoration
- **Property 7**: Verify hook returns all required functions and values
- **Property 8**: Verify context initializes with correct locale
- **Property 9**: Generate sequences of locale changes and verify no errors
- **Property 10**: Verify all used keys exist in English translation file

### Testing Framework
- Use **Vitest** for unit and property-based testing
- Use **fast-check** library for property-based test generation
- Configure each property-based test to run minimum 100 iterations
- Tag each property-based test with format: `**Feature: i18n-translation-system, Property {number}: {property_text}**`

### Integration Testing
- Test that all components render correctly with translations
- Test language switching across multiple components
- Test that localStorage persistence works end-to-end
- Test that browser language detection works on initial load
