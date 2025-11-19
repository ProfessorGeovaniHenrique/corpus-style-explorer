/**
 * Fallback para IndexedDB quando localStorage está cheio
 * Sistema de armazenamento resiliente
 */

const DB_NAME = 'enrichment_storage';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

let dbInstance: IDBDatabase | null = null;

/**
 * Inicializa conexão com IndexedDB
 */
async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Salva dados no IndexedDB
 */
export async function saveToIndexedDB(key: string, data: string): Promise<boolean> {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.put(data, key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ IndexedDB save failed:', error);
    return false;
  }
}

/**
 * Carrega dados do IndexedDB
 */
export async function loadFromIndexedDB(key: string): Promise<string | null> {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ IndexedDB load failed:', error);
    return null;
  }
}

/**
 * Remove dados do IndexedDB
 */
export async function removeFromIndexedDB(key: string): Promise<boolean> {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ IndexedDB remove failed:', error);
    return false;
  }
}
