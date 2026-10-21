# ==============================================================================
# StockMeta Pro Studio v3.31 - Cloud Dockerfile
# Optimized for 100% Free 24/7 Deployment on Render.com & Cloud Platforms
# ==============================================================================

FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies:
# - exiftool: Native Linux ExifTool for binary XMP/IPTC embedding
# - ghostscript: For PostScript / EPS vector rasterization
# - python3, python3-pil: Pre-compiled Pillow package for fast EPS preview rendering
RUN apt-get update --fix-missing && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    exiftool \
    ghostscript \
    python3 \
    python3-pil \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy ONLY package.json (lets npm resolve Linux native binaries instead of Windows lockfile)
COPY package.json ./

# Install dependencies cleanly for Linux platform
RUN npm install --legacy-peer-deps --no-audit

# Copy application source code
COPY . .

# Build client production bundle
RUN npm run build

# Cloud Port & Environment (Render sets PORT=10000)
ENV PORT=10000 \
    DOCKER_CONTAINER=true \
    NO_AUTO_OPEN=true

EXPOSE 10000 7860 3000

# Start server
CMD ["npm", "run", "dev"]
