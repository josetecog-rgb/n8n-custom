FROM alpine:3.21 AS builder

RUN apk add --no-cache ffmpeg python3 py3-pip bash && \
    pip install --break-system-packages edge-tts && \
    mkdir -p /opt/ffmpeg /opt/tts

RUN cp /usr/bin/ffmpeg /usr/bin/ffprobe /opt/ffmpeg/ && \
    cp /usr/bin/python3 /opt/tts/ && \
    cp -r /usr/lib/python3* /opt/tts/lib/ 2>/dev/null; cp -r /usr/local /opt/tts/local 2>/dev/null; \
    ldd /usr/bin/ffmpeg | grep "=> /" | awk '{print $3}' | xargs -I '{}' sh -c 'mkdir -p /opt/ffmpeg/libs/$(dirname {}) && cp {} /opt/ffmpeg/libs/{}' 2>/dev/null; \
    echo "done"

FROM n8nio/n8n:stable

USER root

COPY --from=builder /opt/ffmpeg/ffmpeg /usr/local/bin/ffmpeg
COPY --from=builder /opt/ffmpeg/ffprobe /usr/local/bin/ffprobe
COPY --from=builder /opt/tts/ /opt/tts/

RUN ln -s /opt/tts/python3 /usr/local/bin/python3 2>/dev/null; \
    ln -s /opt/tts/local/bin/edge-tts /usr/local/bin/edge-tts 2>/dev/null; \
    echo "installed"

USER node
