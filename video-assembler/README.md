# Video Assembler

A powerful, modular video editing application built with Electron, React, and TypeScript. This application provides professional-grade video editing capabilities with a focus on lossless operations and scriptable workflows.

## Features

- **Lossless Video Operations**
  - Cut and merge videos without re-encoding
  - Extract and manipulate individual streams
  - Support for high-resolution content (4K, 8K)
  - Multiple format support (mp4, mov, mp3, wav, etc.)

- **Advanced Timeline Management**
  - Multi-track video and audio editing
  - Frame-accurate cutting
  - Waveform visualization
  - Thumbnail previews

- **Effects and Filters**
  - Real-time video effects
  - Chroma key processing
  - Text overlays
  - Blur and transform effects

- **Scripting Capabilities**
  - Fully scriptable interface
  - Custom automation workflows
  - Batch processing support
  - Template system for common operations

## Prerequisites

- Node.js (v16 or higher)
- pnpm (v7 or higher)
- FFmpeg (required for video processing)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/video-assembler.git
   cd video-assembler
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Install FFmpeg:
   - **Windows**: Download from [FFmpeg website](https://ffmpeg.org/download.html)
   - **macOS**: `brew install ffmpeg`
   - **Linux**: `sudo apt install ffmpeg`

## Development

Start the development server:
```bash
pnpm electron:dev
```

This will launch the application in development mode with hot reload support.

## Building

Build the application:
```bash
pnpm electron:build
```

This will create distributable packages in the `dist` directory.

## Project Structure

```
video-assembler/
├── electron/               # Electron main process code
│   ├── main/              # Main process entry point
│   └── preload/           # Preload scripts
├── src/
│   ├── components/        # React components
│   │   ├── controls/     # Control components
│   │   ├── effects/      # Effect components
│   │   ├── preview/      # Video preview components
│   │   └── timeline/     # Timeline components
│   ├── services/         # Core services
│   │   ├── FFmpegService.ts
│   │   ├── LosslessVideoService.ts
│   │   ├── ScriptingService.ts
│   │   └── TimelineService.ts
│   ├── store/            # State management
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main application component
│   └── main.tsx         # Application entry point
├── types/                # TypeScript type definitions
└── package.json         # Project configuration
```

## Configuration

### FFmpeg Setup

The application requires FFmpeg to be properly configured. By default, it will look for FFmpeg in the system PATH. You can configure custom FFmpeg paths in the application settings.

### Development Configuration

- `electron.vite.config.ts`: Electron and Vite configuration
- `tsconfig.json`: TypeScript configuration
- `tailwind.config.js`: Tailwind CSS configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- FFmpeg for video processing capabilities
- Electron for the desktop application framework
- React for the user interface
- TypeScript for type safety
- All other open-source contributors

## Support

For support, please open an issue in the GitHub repository or contact the maintainers directly.

## Roadmap

See the [open issues](https://github.com/yourusername/video-assembler/issues) for a list of proposed features and known issues.

## Security

For security concerns, please review our security policy in SECURITY.md.