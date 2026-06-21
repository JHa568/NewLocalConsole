# Combined backend+frontend image for Playwright e2e tests.
# Build from repo root: docker build -f docker/e2e.Dockerfile -t patientia-e2e .
FROM mcr.microsoft.com/playwright:v1.56.1-jammy

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python-is-python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt backend/requirements-dev.txt backend/
RUN pip3 install --no-cache-dir -r backend/requirements-dev.txt

COPY frontend/package.json frontend/package-lock.json frontend/
RUN cd frontend && npm ci

COPY . .

WORKDIR /app/frontend
CMD ["npm", "run", "e2e"]
