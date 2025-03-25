# Chinese Language Learning App

A web application to help learners of Mandarin Chinese memorize characters using the Mandarin Blueprint method, which combines actors, sets, and props to create memorable scenes for each character.

## Features

- Interactive phonetic chart for learning Mandarin pronunciation
- Character lookup and scene generation
- Visual memory aids using the Mandarin Blueprint method
- Support for tone recognition and pinyin parsing

## Project Structure

```
client/               # Angular frontend application
├── src/
│   ├── app/
│   │   ├── components/     # Angular components
│   │   ├── services/       # Services for data handling
│   │   ├── interfaces/     # TypeScript interfaces
│   │   └── constants/      # Shared constants
│   ├── assets/            # Static assets
│   └── environments/      # Environment configurations
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Angular CLI (`npm install -g @angular/cli`)

### Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd language-learning
```

2. Install dependencies:

```bash
cd client
npm install
```

3. Start the development server:

```bash
ng serve
```

4. Open your browser and navigate to `http://localhost:4200`

## Development

### Running Tests

```bash
# Run all tests
ng test

# Run specific test file
ng test --include=src/app/services/data.service.pinyin.spec.ts
```

### Code Organization

- **Components**: UI components are in `src/app/components/`
- **Services**: Data and business logic in `src/app/services/`
- **Constants**: Shared constants like pinyin mappings in `src/app/constants/`
- **Interfaces**: TypeScript interfaces in `src/app/interfaces/`

## Technical Details

### Pinyin Processing

The application includes sophisticated pinyin processing capabilities:

- Tone mark removal and recognition
- Initial and final parsing
- Special case handling for complex syllables
- Mapping to actors and sets based on phonetic components

### Testing

The project uses:

- Jasmine for unit testing
- Karma as the test runner
- Angular TestBed for component testing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
