import { useEffect } from 'react';

const APP_NAME = 'Knowledge Base Portal';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title]);
}
