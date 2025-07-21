# Ollama Local AI Setup for AXIOM Sentinel

## Overview

AXIOM Sentinel now uses Ollama for local AI earthquake predictions, eliminating the need for external API keys and providing full offline capability.

## Installation Steps

### 1. Install Ollama

**macOS/Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download and install from https://ollama.ai/download

### 2. Download the Model

Once Ollama is installed, download the Llama 3.2 model:
```bash
ollama pull llama3.2
```

### 3. Start Ollama Service

Start the Ollama service (it runs on port 11434 by default):
```bash
ollama serve
```

### 4. Verify Installation

Test that Ollama is running:
```bash
curl http://localhost:11434/api/version
```

## Usage in AXIOM Sentinel

Once Ollama is running with the llama3.2 model:

1. Go to the AXIOM Sentinel dashboard
2. Navigate to the AI Prediction Panel
3. Click "Generate Ollama AI Prediction"
4. The system will analyze real earthquake data using local AI

## Features

- **Local Processing**: No external API calls required
- **Real-time Data**: Uses live USGS earthquake data
- **Scientific Analysis**: Applies seismological principles
- **Detailed Reasoning**: Provides AI-generated explanations
- **Model Training**: Continuous learning with new data

## Fallback Mode

If Ollama is not available, the system automatically falls back to statistical analysis using the same earthquake data, ensuring the application remains functional.

## Troubleshooting

**Issue**: "Connection refused" error
- **Solution**: Make sure Ollama service is running: `ollama serve`

**Issue**: Model not found
- **Solution**: Download the model: `ollama pull llama3.2`

**Issue**: Port already in use
- **Solution**: Ollama uses port 11434, make sure it's not blocked

**Issue**: Low performance
- **Solution**: Ollama works best with at least 8GB RAM for the llama3.2 model