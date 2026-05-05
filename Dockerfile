FROM n8nio/n8n:stable
USER root
RUN apt-get update && \
    apt-get install -y ffmpeg python3-pip && \
    pip install edge-tts && \
    apt-get clean
USER node
