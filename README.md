# Loob - The Post-Digital Lending Library

![Loob Platform](Loob_labs.png)

## Vision

Loob is an in dev platform designed to revitalize community spaces and strengthen social resilience in a post-COVID world. By creating a first-of-its-kind post-digital lending library, we're REDUCING FRICTION for underground communities and experience designers worldwide to access, share, and manage resources.

## Why Loob?

The COVID-19 pandemic has dramatically impacted our third spaces - those vital locations where community happens outside of home and work. As we navigate this new landscape, communities need innovative tools to:
- Rebuild and strengthen local connections
- Share resources efficiently
- Create transformative experiences
- Foster resilient community networks

## Core Features

### 🎯 The Loobrary
A peer-to-peer database connecting communities with:
- **Venues**: Underground spaces, pop-up locations, and community centers
- **Equipment**: From sound systems to workshop tools
- **Skills**: Community knowledge sharing and talent connection
- **Loobricates**: OUr word for community - Connecting like-minded people and initiatives

### 🤖 AI-Powered Matching
- Intelligent resource recommendations
- Context-aware community connections
- Experience design assistance
- Resource optimization suggestions

### 🗺️ Interactive Features
- Real-time resource mapping
- Community visualization with 3D representations
- Integrated chat system with AI assistance
- NFC integration for "PHYGITAL" interaction
- Anonymous browsing and engagementcapabilities

## Technology Stack

### Frontend
- **React/Next.js** with TypeScript
- **Tailwind CSS** for styling
- **Babylon.js** for 3D visualizations
- **Three.js/React Three Fiber** for 3D rendering
- **MapLibre GL** for mapping features
- **D3.js** for data visualization
- **Pusher** for real-time updates

### Backend
- **Node.js**
- **AstraDB** (Vector Database)
- **OpenAI Integration** for AI features
- **WebSocket support** via Pusher
- **UUID** for unique identifiers
- **Bcrypt** for security

### Key Libraries & Dependencies
- `@astrajs/collections`
- `@babylonjs/core`
- `@babylonjs/gui`
- `@babylonjs/loaders`
- `@babylonjs/materials`
- `@babylonjs/procedural-textures`
- `@chainsafe/persistent-merkle-tree`
- `@datastax/astra-db-ts`
- `@ffmpeg/ffmpeg`
- `@geist-ui/core`
- `@heroicons/react`
- `@next/bundle-analyzer`
- `@react-three/drei`
- `@react-three/fiber`
- `@tailwindcss/aspect-ratio`
- `@tailwindcss/forms`
- `@tailwindcss/line-clamp`
- `@tailwindcss/typography`
- `@types/leaflet`
- `ai`
- `axios`
- `babylonjs`
- `babylonjs-loaders`
- `bcryptjs`
- `busboy`
- `chart.js`
- `d3`
- `d3-cloud`
- `date-fns`
- `express`
- `ffmpeg-static`
- `fluent-ffmpeg`
- `formidable`
- `formidable-serverless`
- `framer-motion`
- `fs.promises`
- `geist`
- `glob`
- `langchain`
- `leaflet`
- `mapbox-gl`
- `maplibre-gl`
- `multer`
- `next-connect`
- `nodemailer`
- `noisejs`
- `openai`
- `p5`
- `pusher`
- `pusher-js`
- `react`
- `react-chartjs-2`
- `react-dom`
- `react-google-autocomplete`
- `react-icons`
- `react-leaflet`
- `react-map-gl`
- `react-markdown`
- `react-p5-wrapper`
- `recharts`
- `recorder-js`
- `remark-gfm`
- `rimraf`
- `static-ffmpeg`
- `three`
- `touch`
- `tree`
- `uuid`
- `whisper-nodejs`


## API Endpoints

### Authentication
- `POST /api/auth/loobricate-login` - Loobricate authentication
- `POST /api/loobrary-signup` - New user registration

### Chat
- `POST /api/chat` - AI chat interactions
- `GET /api/chat/testGenerateDocContext` - Test endpoint for generating document context

### Loobricates
- `GET /api/loobricates` - Fetch all Loobricate entries
- `GET /api/loobricates/:id` - Fetch a specific Loobricate entry by ID

### Map Data
- `GET /api/mapData` - Get geospatial resource data

### Vibe Entities
- `GET /api/vibe_entities` - Fetch visualization data for vibe entities

### Transcription
- `POST /api/transcribe` - Audio transcription


## Project Structure

loob/
├── app/ # Next.js app directory
│ ├── api/ # API routes
│ │ ├── auth/ # Authentication endpoints
│ │ ├── chat/ # Chat functionality
│ │ ├── loobricates/# Resource management
│ │ └── mapData/ # Geospatial data
├── components/ # React components
│ ├── ChatModal/ # Chat interface
│ ├── Map/ # Mapping components
│ ├── TorusSphere/ # 3D visualization
│ └── Profile/ # User profiles
├── public/ # Static assets
├── scripts/ # Utility scripts
└── types/ # TypeScript definitions


## Getting Started

### Prerequisites
- Node.js (v18.17.0 or higher)
- npm/yarn
- OpenAI API key
- AstraDB account
- Pusher account

### Environment Setup
Create a `.env.local` file with:

OPENAI_API_KEY=your_key
ASTRA_DB_APPLICATION_TOKEN=your_token
ASTRA_DB_ENDPOINT=your_endpoint
ASTRA_DB_NAMESPACE=your_namespace
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret


### Installation

1. Clone the repository

bash
git clone https://github.com/your-username/loob-beta.git
cd loob

2. Install dependencies

bash
npm install


3. Start development server

bash
npm run dev

## Development Status

Currently in active development with focus on:
- AI-powered resource matching
- Community visualization tools (3D "vibe-entities")
- Real-time communication systems
- Resource management interface
- User experience refinement

## Join the Movement

### Why Contribute?
- Combat the third spaces crisis
- Support community resilience
- Build innovative open-source solutions
- Connect with creative communities

### How to Get Involved
1. **Contribute Code**: Reach out to me at Bradroyes@gmail.com if you'd like to help develop the project.
2. **Share Ideas**: Open discussions - again, email me, we meet weekly1
3. **Test the Platform**: Provide feedback (also can be done via email).
4. **Spread the Word**: Help reach more communities (let me know which communities or gear yo would like to see on Loob)

## Connect With Us

- GitHub Discussions
- Discord: [Coming Soon]
- Email: bradroyes@gmail.com
- Twitter: [@seks.design](https://twitter.com/seks.design)

---

<p align="center">
Built with 💜 for underground communities worldwide
</p>