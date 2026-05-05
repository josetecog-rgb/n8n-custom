FROM n8nio/n8n:stable
USER root
RUN apk add --no-cache ffmpeg python3 py3-pip && \
    pip install edge-tts
USER node
ENV PATH="/home/node/.local/bin:$PATH"
