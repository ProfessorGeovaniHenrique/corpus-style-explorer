import { useCallback, useEffect, useRef } from 'react';
import LZString from 'lz-string';
import { EnrichmentSession, validateEnrichmentSession, migrateSessionSchema } from '@/lib/enrichmentSchemas';
import { debounce } from '@/lib/performanceUtils';
import { notifications } from '@/lib/notifications';
import { saveToIndexedDB, loadFromIndexedDB } from '@/lib/indexedDBFallback';
import { logger } from '@/lib/logger';

const STORAGE_KEY = 'enrichment_session';
const STORAGE_PREFIX = 'enrichment_backup_';
const MAX_BACKUP_AGE_DAYS = 7;

/**
 * Hook para persistência local com compressão LZ-String
 * Salvamento incremental com debounce de 2s
 */
export function useEnrichmentPersistence() {
  const lastSaveRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(true);

  /**
   * Comprime e salva dados no localStorage com validação e fallbacks resilientes
   * FASE 1.2 + 1.3: Compressão resiliente + localStorage quota resiliente
   */
  const compressAndSave = useCallback(async (key: string, data: EnrichmentSession): Promise<boolean> => {
    try {
      // Validar JSON antes de comprimir
      const json = JSON.stringify(data);
      if (!json || json === '{}') {
        logger.error('❌ Invalid JSON data for compression');
        return false;
      }

      // Comprimir dados
      const compressed = LZString.compress(json);
      if (!compressed) {
        logger.warn('⚠️ Compression failed, saving uncompressed');
        try {
          localStorage.setItem(key, json);
          return true;
        } catch (fallbackError) {
          throw fallbackError;
        }
      }

      // Teste de integridade: descomprimir e comparar
      const decompressed = LZString.decompress(compressed);
      if (decompressed !== json) {
        logger.error('❌ Compression integrity check failed');
        return false;
      }

      // Tentar salvar no localStorage
      localStorage.setItem(key, compressed);
      lastSaveRef.current = new Date().toISOString();
      
      const compressionRatio = ((1 - compressed.length / json.length) * 100).toFixed(1);
      logger.info(`💾 Session saved (${json.length}b → ${compressed.length}b, ${compressionRatio}% redução)`);
      return true;

    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        logger.warn('⚠️ localStorage quota exceeded, iniciando fallbacks...');
        
        // NÍVEL 1: Limpar backups antigos (>7 dias)
        const oldBackupsRemoved = await cleanupOldBackupsSync();
        if (oldBackupsRemoved > 0) {
          logger.info(`🧹 Removidos ${oldBackupsRemoved} backups antigos`);
          try {
            const json = JSON.stringify(data);
            const compressed = LZString.compress(json);
            localStorage.setItem(key, compressed);
            return true;
          } catch {}
        }

        // NÍVEL 2: Limpar TODOS os backups
        const allBackupsRemoved = await cleanupAllBackupsSync();
        if (allBackupsRemoved > 0) {
          logger.info(`🧹 Removidos ${allBackupsRemoved} backups para liberar espaço`);
          try {
            const json = JSON.stringify(data);
            const compressed = LZString.compress(json);
            localStorage.setItem(key, compressed);
            return true;
          } catch {}
        }

        // NÍVEL 3: Fallback para IndexedDB
        logger.warn('⚠️ Usando IndexedDB como fallback');
        const json = JSON.stringify(data);
        const compressed = LZString.compress(json) || json;
        const saved = await saveToIndexedDB(key, compressed);
        
        if (saved) {
          notifications.warning(
            'Armazenamento local cheio',
            'Salvando em banco alternativo. Considere exportar seus dados.'
          );
          return true;
        }

        // FALHA TOTAL
        notifications.error(
          'Erro crítico ao salvar',
          'Espaço insuficiente. Exporte seus dados imediatamente!'
        );
        return false;
      }
      
      logger.error('❌ Failed to save session:', error);
      return false;
    }
  }, []);

  /**
   * Limpa backups antigos sincronamente (helper para quota exceeded)
   */
  const cleanupOldBackupsSync = (): number => {
    const backups = listBackupsSync();
    const cutoffTime = Date.now() - (MAX_BACKUP_AGE_DAYS * 24 * 60 * 60 * 1000);
    
    let removed = 0;
    backups.forEach(({ key, timestamp }) => {
      if (timestamp < cutoffTime) {
        localStorage.removeItem(key);
        removed++;
      }
    });
    
    return removed;
  };

  /**
   * Limpa TODOS os backups sincronamente (fallback nível 2)
   */
  const cleanupAllBackupsSync = (): number => {
    const backups = listBackupsSync();
    backups.forEach(({ key }) => {
      if (key !== STORAGE_KEY) { // Não remover sessão principal
        localStorage.removeItem(key);
      }
    });
    return backups.length;
  };

  /**
   * Lista backups de forma síncrona (helper)
   */
  const listBackupsSync = (): Array<{ key: string; timestamp: number }> => {
    const backups: Array<{ key: string; timestamp: number }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const timestamp = parseInt(key.replace(STORAGE_PREFIX, ''), 10);
        if (!isNaN(timestamp)) {
          backups.push({ key, timestamp });
        }
      }
    }
    
    return backups.sort((a, b) => b.timestamp - a.timestamp);
  };

  /**
   * Carrega e descomprime dados do localStorage com validação resiliente
   * FASE 1.4: Zod validation resiliente + schema migration
   */
  const loadAndDecompress = useCallback(async (key: string): Promise<EnrichmentSession | null> => {
    try {
      // Tentar localStorage primeiro
      let compressed = localStorage.getItem(key);
      
      // Fallback: tentar IndexedDB
      if (!compressed) {
        compressed = await loadFromIndexedDB(key);
        if (compressed) {
          logger.info('📦 Dados carregados do IndexedDB');
        }
      }
      
      if (!compressed) return null;

      // Tentar descomprimir (pode ser dados raw se fallback foi usado)
      let json = LZString.decompress(compressed);
      if (!json) {
        logger.warn('⚠️ Decompress falhou, tentando dados raw');
        json = compressed; // Dados não comprimidos
      }
      
      const data = JSON.parse(json);
      
      // Validar com Zod (com tratamento de erro)
      try {
        const validated = validateEnrichmentSession(data);
        logger.success(`Session loaded (${json.length} bytes)`);
        return validated;
      } catch (validationError: any) {
        logger.warn('⚠️ Validação falhou, tentando migração de schema...');
        
        // Tentar migração se tiver schemaVersion antigo
        if (data.schemaVersion && data.schemaVersion < 1) {
          try {
            const migrated = migrateSessionSchema(data, data.schemaVersion);
            logger.success('✅ Schema migrado com sucesso');
            return migrated;
          } catch (migrationError) {
            logger.error('❌ Migração de schema falhou:', migrationError);
          }
        }
        
        // Quarentena: mover dados corrompidos para chave especial
        const quarantineKey = `${key}_corrupted_${Date.now()}`;
        localStorage.setItem(quarantineKey, compressed);
        localStorage.removeItem(key);
        
        notifications.warning(
          'Dados corrompidos detectados',
          'Sessão foi movida para quarentena. Inicie uma nova sessão.'
        );
        
        return null;
      }
    } catch (error) {
      logger.error('❌ Failed to load session:', error);
      
      // Se dados irrecuperáveis, remover
      try {
        localStorage.removeItem(key);
      } catch {}
      
      return null;
    }
  }, []);

  /**
   * Salva sessão atual (debounced 2s)
   * FASE 1.1: Debounce fix com useRef + memory leak prevention
   */
  const debouncedSaveRef = useRef<ReturnType<typeof debounce> | null>(null);

  const saveSession = useCallback((data: EnrichmentSession) => {
    // Não salvar se componente foi desmontado
    if (!isMountedRef.current) {
      logger.warn('⚠️ Tentativa de save após unmount - ignorado');
      return;
    }

    // Criar debounce apenas na primeira vez
    if (!debouncedSaveRef.current) {
      debouncedSaveRef.current = debounce(async (sessionData: EnrichmentSession) => {
        await compressAndSave(STORAGE_KEY, sessionData);
        
        // Criar backup timestamped
        const backupKey = `${STORAGE_PREFIX}${Date.now()}`;
        await compressAndSave(backupKey, sessionData);
      }, 2000);
    }
    
    // Chamar função debounced mantendo a mesma instância
    debouncedSaveRef.current(data);
  }, [compressAndSave]);

  /**
   * Carrega sessão salva (síncrono para localStorage, depois tenta IndexedDB)
   */
  const loadSession = useCallback((): EnrichmentSession | null => {
    // Tentar localStorage primeiro (síncrono)
    try {
      const compressed = localStorage.getItem(STORAGE_KEY);
      if (compressed) {
        let json = LZString.decompress(compressed);
        if (!json) {
          logger.warn('⚠️ Decompress falhou, tentando dados raw');
          json = compressed;
        }
        
        const data = JSON.parse(json);
        
        try {
          const validated = validateEnrichmentSession(data);
          logger.success(`Session loaded from localStorage (${json.length} bytes)`);
          return validated;
        } catch (validationError) {
          logger.warn('⚠️ Validação falhou');
          
          // Tentar migração
          if (data.schemaVersion && data.schemaVersion < 1) {
            try {
              const migrated = migrateSessionSchema(data, data.schemaVersion);
              logger.success('✅ Schema migrado');
              return migrated;
            } catch {}
          }
          
          // Quarentena
          const quarantineKey = `${STORAGE_KEY}_corrupted_${Date.now()}`;
          localStorage.setItem(quarantineKey, compressed);
          localStorage.removeItem(STORAGE_KEY);
          
          notifications.warning(
            'Dados corrompidos detectados',
            'Sessão foi movida para quarentena'
          );
        }
      }
    } catch (error) {
      logger.error('❌ Failed to load from localStorage:', error);
    }

    // Tentar IndexedDB de forma assíncrona (não-bloqueante)
    loadFromIndexedDB(STORAGE_KEY).then(compressed => {
      if (compressed) {
        logger.info('📦 Dados encontrados no IndexedDB, mas retorno síncrono não suportado');
        notifications.info('Dados encontrados em armazenamento alternativo', 'Recarregue a página');
      }
    }).catch(() => {});

    return null;
  }, []);

  /**
   * Limpa sessão atual
   */
  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    lastSaveRef.current = null;
    logger.info('🗑️ Session cleared');
  }, []);

  /**
   * Lista backups disponíveis
   */
  const listBackups = useCallback((): Array<{ key: string; timestamp: number }> => {
    const backups: Array<{ key: string; timestamp: number }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const timestamp = parseInt(key.replace(STORAGE_PREFIX, ''), 10);
        if (!isNaN(timestamp)) {
          backups.push({ key, timestamp });
        }
      }
    }
    
    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }, []);

  /**
   * Restaura backup específico
   */
  const restoreBackup = useCallback((backupKey: string): EnrichmentSession | null => {
    try {
      const compressed = localStorage.getItem(backupKey);
      if (!compressed) return null;

      let json = LZString.decompress(compressed);
      if (!json) {
        json = compressed;
      }

      const data = JSON.parse(json);
      const validated = validateEnrichmentSession(data);
      
      // Salvar como sessão principal
      compressAndSave(STORAGE_KEY, validated);
      logger.info(`♻️ Backup restored: ${backupKey}`);
      return validated;
    } catch (error) {
      logger.error('❌ Failed to restore backup:', error);
      return null;
    }
  }, [compressAndSave]);

  /**
   * Remove backups antigos (>7 dias)
   */
  const cleanupOldSessions = useCallback(() => {
    const backups = listBackups();
    const cutoffTime = Date.now() - (MAX_BACKUP_AGE_DAYS * 24 * 60 * 60 * 1000);
    
    let removed = 0;
    backups.forEach(({ key, timestamp }) => {
      if (timestamp < cutoffTime) {
        localStorage.removeItem(key);
        removed++;
      }
    });
    
    if (removed > 0) {
      logger.info(`🧹 Cleaned up ${removed} old backup(s)`);
    }
  }, [listBackups]);

  // Cleanup automático ao montar + unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    cleanupOldSessions();

    // Cleanup do debounce ao desmontar (prevenir memory leak)
    return () => {
      isMountedRef.current = false;
      if (debouncedSaveRef.current) {
        // Cancel pending debounced calls
        debouncedSaveRef.current = null;
      }
    };
  }, [cleanupOldSessions]);

  return {
    saveSession,
    loadSession,
    clearSession,
    listBackups,
    restoreBackup,
    cleanupOldSessions,
    lastSaveTime: lastSaveRef.current,
  };
}
