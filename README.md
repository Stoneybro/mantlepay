# mneepaymenthub

A monorepo containing a Next.js web application and Foundry smart contracts.

## Structure

```
mneepaymenthub/
├── apps/
│   └── web/          # Next.js application
└── packages/
    └── contracts/    # Foundry smart contracts
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for smart contracts)

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Development

Run the Next.js development server:

```bash
pnpm dev
```

### Smart Contracts

Build contracts:

```bash
pnpm contracts:build
```

Test contracts:

```bash
pnpm contracts:test
```

### Code Formatting

Format all files:

```bash
pnpm format
```

Check formatting:

```bash
pnpm format:check
```

## Apps and Packages

### apps/web

Next.js application with:
- TypeScript
- App Router
- ESLint
- Tailwind CSS

### packages/contracts

Foundry project for smart contract development.

## Commands

- `pnpm dev` - Start Next.js dev server
- `pnpm build` - Build Next.js application
- `pnpm start` - Start Next.js production server
- `pnpm lint` - Lint Next.js application
- `pnpm format` - Format all files with Prettier
- `pnpm contracts:build` - Build smart contracts
- `pnpm contracts:test` - Test smart contracts
