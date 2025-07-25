# @mind-elixir/typescript-config

Shared TypeScript configuration for the Mind Elixir monorepo.

## Usage

This package provides shared TypeScript configurations that can be extended by other packages in the monorepo.

### Available Configurations

- **base.json**: Base TypeScript configuration with common compiler options
- **library.json**: Configuration for library packages (extends base.json with library-specific options)
- **app.json**: Configuration for application packages (extends base.json with app-specific options)

### How to Use

1. Install the package as a dev dependency:
```json
{
  "devDependencies": {
    "@mind-elixir/typescript-config": "workspace:*"
  }
}
```

2. Create a `tsconfig.json` in your package and extend the appropriate configuration:

**For library packages:**
```json
{
  "extends": "@mind-elixir/typescript-config/library.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**For application packages:**
```json
{
  "extends": "@mind-elixir/typescript-config/app.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Configuration Details

#### Base Configuration
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- Modern module resolution
- Support for importing TypeScript extensions
- JSON module resolution

#### Library Configuration
- Inherits all base configuration
- Enables declaration file generation
- Sets output directory to `./dist`
- Configured for library builds

#### App Configuration
- Inherits all base configuration
- Optimized for application builds
- No emit during type checking

### Benefits

- **Consistency**: All packages use the same TypeScript configuration
- **Maintainability**: Changes to TypeScript settings can be made in one place
- **Best Practices**: Configurations follow TypeScript and Turborepo best practices
- **Type Safety**: Strict mode and comprehensive type checking enabled across all packages