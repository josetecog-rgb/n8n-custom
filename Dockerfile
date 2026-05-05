FROM n8nio/n8n:stable
USER root
RUN apk add --no-cache ffmpeg python3 py3-pip && \
    pip3 install --break-system-packages edge-tts
USER node
