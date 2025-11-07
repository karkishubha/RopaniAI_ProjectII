# Ropani AI Frontend

AI-powered land-selling platform frontend built with React and Vite.

## 🚀 Features

### 1. **Intelligent Chatbot** 🤖
- Multi-turn conversational AI powered by RAG (Retrieval Augmented Generation)
- Document upload and ingestion (PDF, TXT)
- Context-aware responses with source citations
- Session-based memory management
- Real-time streaming responses

### 2. **OCR Document Scanner** 📄
- Drag-and-drop document upload
- Automatic information extraction from land documents
- Extract owner details, plot numbers, boundaries, registration info
- Export extracted data as PDF
- Save to database for future reference

### 3. **Price Dashboard** 📊
- Interactive charts and visualizations
- Real-time land price trends across municipalities
- Transaction volume analysis
- Land use distribution (Residential, Commercial, Agricultural, Industrial)
- Comparative price analysis between cities
- Market insights and predictions

### 4. **AI Price Predictor** 🔮
- ML-powered price estimation
- Multiple input factors:
  - Location (Municipality, Ward)
  - Land area and unit conversion
  - Land type (Residential/Commercial/Agricultural/Industrial)
  - Road access and width
  - Available facilities (Water, Electricity, Drainage, Internet)
- Confidence score display
- Factor-wise price breakdown
- Instant predictions

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router 6** - Client-side routing
- **Axios** - HTTP client for API calls
- **Recharts** - Data visualization library
- **React Icons** - Icon library
- **CSS3** - Styling with gradients and animations

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Navigation bar component
│   │   └── Navbar.css
│   ├── pages/
│   │   ├── Home.jsx             # Landing page
│   │   ├── Home.css
│   │   ├── Chatbot.jsx          # RAG chatbot interface
│   │   ├── Chatbot.css
│   │   ├── OCRForm.jsx          # Document OCR page
│   │   ├── OCRForm.css
│   │   ├── Dashboard.jsx        # Price analytics dashboard
│   │   ├── Dashboard.css
│   │   ├── PricePredictor.jsx   # ML price prediction
│   │   └── PricePredictor.css
│   ├── services/
│   │   └── api.js               # API service layer
│   ├── App.jsx                  # Main app component with routing
│   ├── App.css                  # Global utility styles
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles
├── index.html                   # HTML entry point
├── vite.config.js              # Vite configuration
└── package.json                # Dependencies

```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ (20.19+ recommended)
- npm or yarn
- Backend API running on `http://localhost:8000`

### Installation

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## 🔌 API Integration

The frontend connects to the FastAPI backend through a Vite proxy configured in `vite.config.js`:

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  }
}
```

### API Endpoints Used

- `POST /api/chat/query` - Send chat messages
- `POST /api/ingest/upload` - Upload documents
- `POST /api/booking/create` - Create bookings

## 🎨 Design Features

- **Gradient Theme**: Purple-to-pink gradient throughout (`#667eea` to `#764ba2`)
- **Responsive Design**: Mobile-first approach, works on all devices
- **Smooth Animations**: Fade-in, slide-in, and hover effects
- **Modern UI**: Cards, glassmorphism, and clean typography
- **Dark Scrollbars**: Custom-styled scrollbars for better aesthetics

## 📱 Pages Overview

### Home Page (`/`)
- Hero section with gradient title
- Feature cards with links to all sections
- About section highlighting platform benefits

### Chatbot Page (`/chatbot`)
- Sidebar with document management
- Main chat interface with message bubbles
- Document upload functionality
- Session-based conversations
- Suggested questions for new users

### OCR Form Page (`/ocr`)
- Drag-and-drop upload zone
- Document preview
- Extracted data display in organized grid
- Export and save options

### Dashboard Page (`/dashboard`)
- Municipality selector
- Stats cards (Current Price, Average, Transactions)
- Line chart for price trends
- Bar chart for transaction volume
- Pie chart for land use distribution
- City comparison bars
- Market insights section

### Price Predictor Page (`/predictor`)
- Input form with multiple fields
- Real-time validation
- AI-powered price calculation
- Confidence score visualization
- Factor-wise breakdown
- Disclaimer and notes

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend directory (optional):

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Proxy Configuration

Modify `vite.config.js` if your backend runs on a different port:

```javascript
server: {
  proxy: {
    '/api': 'http://localhost:YOUR_PORT'
  }
}
```

## 🐛 Troubleshooting

### Port Already in Use

If port 5173 is already in use:

```bash
# Kill the process using the port
npx kill-port 5173

# Or specify a different port
npm run dev -- --port 3000
```

### API Connection Errors

1. Ensure backend is running on `http://localhost:8000`
2. Check CORS settings in FastAPI backend
3. Verify proxy configuration in `vite.config.js`

### Module Not Found Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🚀 Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## 📝 License

This project is part of the Ropani AI platform.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

For issues and questions, please open an issue in the GitHub repository.

---

**Built with ❤️ for the land-selling industry in Nepal**
