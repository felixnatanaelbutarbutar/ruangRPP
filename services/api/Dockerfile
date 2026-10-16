FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && groupadd --gid 10001 ruangrpp \
    && useradd --uid 10001 --gid ruangrpp --no-create-home ruangrpp \
    && mkdir -p /data/uploads \
    && chown -R ruangrpp:ruangrpp /data/uploads
COPY app ./app
COPY tests ./tests
USER ruangrpp
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
