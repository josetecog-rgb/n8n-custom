FROM node:lts-bookworm-slim

RUN apt-get update && \
    apt-get install -y ffmpeg python3-pip && \
    pip3 install edge-tts --break-system-packages && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g n8n@stable

USER node

ENV N8N_PORT=5678
ENV N8N_HOST=0.0.0.0
EXPOSE 5678

CMD ["n8n", "start"]
