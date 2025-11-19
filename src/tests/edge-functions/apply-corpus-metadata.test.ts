import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestUserToken, cleanupTestUsers } from '../utils/edge-function-helpers';
import { supabase } from '@/integrations/supabase/client';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/apply-corpus-metadata`;

describe('Edge Function: apply-corpus-metadata', () => {
  let adminToken: string;
  let userToken: string;
  let testAdminUserId: string;

  beforeAll(async () => {
    adminToken = await createTestUserToken('admin');
    userToken = await createTestUserToken('user');
    
    // Get admin user ID for history validation
    const { data: { user } } = await supabase.auth.getUser();
    if (user) testAdminUserId = user.id;
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  // Helper: mock validated songs
  const mockValidatedSongs = [
    {
      artista: 'Teixeirinha',
      musica: 'Coração de Luto',
      compositor: 'Teixeirinha',
      album: 'Coração de Luto',
      ano: '1960'
    },
    {
      artista: 'Luiz Marenco',
      musica: 'Querência Amada',
      compositor: 'Luiz Marenco',
      album: 'Canto Alegretense',
      ano: '1990'
    }
  ];

  describe('Autenticação e Autorização', () => {
    it('Deve bloquear requisições sem token JWT', async () => {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          corpusType: 'gaucho',
          validatedSongs: mockValidatedSongs,
          createBackup: true
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Missing authorization header');
    });

    it('Deve bloquear usuários não-admin', async () => {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          corpusType: 'gaucho',
          validatedSongs: mockValidatedSongs,
          createBackup: true
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Only admins can apply corpus metadata');
    });

    it('Deve permitir admins autenticados', async () => {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          corpusType: 'gaucho',
          validatedSongs: mockValidatedSongs,
          createBackup: true
        })
      });

      expect([200, 201]).toContain(response.status);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Sistema de Backup', () => {
    it('Deve criar backup quando createBackup=true', async () => {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          corpusType: 'gaucho',
          validatedSongs: mockValidatedSongs,
          createBackup: true
        })
      });

      const data = await response.json();
      expect(data.backupCreated).toBe(true);
      expect(data.backupVersionId).toBeDefined();

      // Verificar se backup foi inserido no DB
      const { data: backup, error } = await supabase
        .from('corpus_metadata_versions')
        .select('*')
        .eq('id', data.backupVersionId)
        .single();

      expect(error).toBeNull();
      expect(backup).toBeDefined();
      expect(backup?.corpus_type).toBe('gaucho');
      expect(backup?.metadata_count).toBe(mockValidatedSongs.length);
      expect(backup?.content_snapshot).toBeTruthy();
    });

    it('Não deve criar backup quando createBackup=false', async () => {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          corpusType: 'gaucho',
          validatedSongs: mockValidatedSongs,
          createBackup: false
        })
      });

      const data = await response.json();
      expect(data.backupCreated).toBe(false);
      expect(data.backupVersionId).toBeNull();
    });
  });

  describe('Geração de Corpus Atualizado', () => {
    it('Deve gerar corpus com metadados atualizados', async () => {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          corpusType: 'gaucho',
          validatedSongs: mockValidatedSongs,
          createBackup: false
        })
      });

      const data = await response.json();
      expect(data.updatedContent).toBeDefined();
      expect(typeof data.updatedContent).toBe('string');

      // Verificar se headers foram atualizados
      const hasUpdatedHeader1 = data.updatedContent.includes('Teixeirinha - Coração de Luto');
      const hasUpdatedHeader2 = data.updatedContent.includes('Luiz Marenco - Querência Amada');

      expect(hasUpdatedHeader1 || hasUpdatedHeader2).toBe(true);
    });

    it('Deve preservar formato do corpus original', async () => {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          corpusType: 'gaucho',
          validatedSongs: [mockValidatedSongs[0]],
          createBackup: false
        })
      });

      const data = await response.json();
      const lines = data.updatedContent.split('\n');

      // Verificar estrutura básica
      expect(lines.some((l: string) => l.startsWith('###'))).toBe(true); // Headers de música
      expect(lines.some((l: string) => l.trim() === '')).toBe(true); // Linhas vazias
    });
  });

  describe('Histórico de Aplicações', () => {
    it('Deve registrar aplicação no histórico', async () => {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          corpusType: 'gaucho',
          validatedSongs: mockValidatedSongs,
          createBackup: true
        })
      });

      const data = await response.json();
      expect(data.success).toBe(true);

      // Verificar histórico (aguardar alguns ms para inserção async)
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: history, error } = await supabase
        .from('metadata_application_history')
        .select('*')
        .eq('corpus_type', 'gaucho')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      expect(error).toBeNull();
      expect(history).toBeDefined();
      expect(history?.songs_updated).toBe(mockValidatedSongs.length);
      expect(history?.application_source).toBe('metadata-enrichment-interface');
    });

    it('Deve vincular histórico ao backup correto', async () => {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          corpusType: 'gaucho',
          validatedSongs: mockValidatedSongs,
          createBackup: true
        })
      });

      const data = await response.json();
      const backupId = data.backupVersionId;

      // Aguardar inserção
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verificar vínculo no histórico
      const { data: history } = await supabase
        .from('metadata_application_history')
        .select('*')
        .eq('backup_version_id', backupId)
        .single();

      expect(history).toBeDefined();
      expect(history?.backup_version_id).toBe(backupId);
    });
  });

  describe('Validação de Entrada', () => {
    it('Deve rejeitar corpus_type inválido', async () => {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          corpusType: 'invalid',
          validatedSongs: mockValidatedSongs,
          createBackup: true
        })
      });

      expect(response.status).toBe(400);
    });

    it('Deve aceitar metadados opcionais ausentes', async () => {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          corpusType: 'gaucho',
          validatedSongs: [
            {
              artista: 'Teixeirinha',
              musica: 'Coração de Luto'
              // Sem compositor, album, ano
            }
          ],
          createBackup: false
        })
      });

      expect([200, 201]).toContain(response.status);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('Deve processar lista com múltiplas músicas', async () => {
      const largeSongList = Array.from({ length: 10 }, (_, i) => ({
        artista: `Artista ${i}`,
        musica: `Música ${i}`,
        compositor: `Compositor ${i}`,
        album: `Album ${i}`,
        ano: `${2000 + i}`
      }));

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          corpusType: 'gaucho',
          validatedSongs: largeSongList,
          createBackup: false
        })
      });

      expect([200, 201]).toContain(response.status);
      const data = await response.json();
      expect(data.songsUpdated).toBe(10);
    });
  });
});
