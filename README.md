# Vibeplay

A desktop application that lets you play classic board games against AI opponents powered by various Language Learning Models (LLMs).

Built by Vibing with claude code

## Features

- 🎮 Supported Games:
  - TicTacToe
  - Connect4
- 🤖 Multiple LLM Provider Support:
  - OpenAI
  - Anthropic
  - Azure OpenAI
  - Google
  - Amazon Bedrock
  - Ollama (local LLMs)
- ⚙️ Configurable settings for each provider
- 🖥️ Cross-platform desktop application (Windows, macOS, Linux)

## Tech Stack

- Electron - Cross-platform desktop framework
- React - UI framework
- TypeScript - Type-safe JavaScript
- Vite - Build tool

## Project Setup

### Prerequisites

- Node.js (LTS version recommended)
- pnpm package manager

### Install Dependencies

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For Windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Structure

```
src/
├── main/           # Electron main process
│   ├── games/      # Game logic implementations
│   └── providers/  # LLM provider implementations
├── renderer/       # Electron renderer process (React)
│   ├── games/     # Game UI components
│   └── components/# Shared React components
├── preload/       # Preload scripts for IPC
└── types/         # TypeScript type definitions
