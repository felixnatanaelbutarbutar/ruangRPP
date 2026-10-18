import time
from .rag import cleanup_next, index_next

if __name__ == '__main__':
    while True:
        try:
            if not index_next():
                cleanup_next()
                time.sleep(3)
        except Exception as exc:
            print(f'Worker RAG menunggu: {type(exc).__name__}', flush=True)
            time.sleep(5)
