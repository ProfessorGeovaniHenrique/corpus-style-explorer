# 🔐 Guia Completo de Teste - Sistema de Autenticação VersoAustral

## 📋 Pré-requisitos

✅ **Antes de começar, certifique-se:**
- [ ] Supabase Auth configurado com `auto_confirm_email = true`
- [ ] Todas as migrations foram executadas com sucesso
- [ ] Frontend compilando sem erros
- [ ] Você tem acesso ao Lovable Cloud Dashboard

---

## 🎯 PARTE 1: Configuração Inicial do Primeiro Admin

### **Passo 1.1: Criar sua conta de admin**

1. Acesse a aplicação: `http://localhost` ou sua URL de preview
2. Clique no botão **"Entrar"** (canto superior direito)
3. Vá para a tab **"Cadastro"**
4. Preencha:
   - **Email**: seu email pessoal (ex: `admin@versoaustral.com`)
   - **Senha**: escolha uma senha forte (mínimo 6 caracteres)
   - **Confirmar Senha**: repita a senha
5. Clique em **"Criar Conta"**
6. ✅ Você verá a mensagem: *"Conta criada! Você já pode fazer login."*

---

### **Passo 1.2: Encontrar seu User ID no Supabase**

1. Abra o **Lovable Cloud Dashboard**
2. Navegue para: **Database → Tables → auth.users**
3. Localize seu email na lista de usuários
4. **Copie o UUID** da coluna `id` (exemplo: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

**OU use SQL Editor:**
```sql
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
```

---

### **Passo 1.3: Tornar-se Admin via SQL**

1. No **Lovable Cloud Dashboard**, vá para **Database → SQL Editor**
2. Abra o arquivo: `scripts/seed-first-admin.sql` (neste repositório)
3. **Substitua** `'SEU_USER_ID_AQUI'` pelo UUID que você copiou
4. Execute o SQL modificado:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,  -- SEU UUID AQUI
  'admin'::app_role
)
ON CONFLICT (user_id, role) DO NOTHING;
```

5. ✅ Confirme que deu certo:
```sql
SELECT ur.role, u.email 
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'admin';
```

**Você deve ver:**
```
role  | email
------+------------------------
admin | admin@versoaustral.com
```

---

### **Passo 1.4: Fazer Login como Admin**

1. Volte para a página `/auth`
2. Na tab **"Login"**, insira:
   - **Email**: o email que você cadastrou
   - **Senha**: a senha que você criou
3. Clique em **"Entrar"**
4. ✅ Você será redirecionado para `/dashboard-mvp`
5. ✅ No canto superior direito, você verá:
   - Seu avatar com a primeira letra do email
   - Ao clicar, o dropdown mostrará:
     - Seu email
     - **"Administrador"** (indicando sua role)
     - Opção **"Painel Admin"**

---

## 🎯 PARTE 2: Testar Painel Admin e Geração de Convites

### **Passo 2.1: Acessar Painel Admin**

1. Estando logado como admin, clique no **avatar** (canto superior direito)
2. Clique em **"Painel Admin"**
3. ✅ Você será redirecionado para `/admin/dashboard`
4. ✅ Você deve ver:
   - Título: **"Painel Administrativo"**
   - 3 cards de estatísticas:
     - Total de Convites: `0`
     - Convites Usados: `0`
     - Convites Disponíveis: `0`
   - Botão verde: **"Gerar Novo Convite"**
   - Tabela vazia de convites

---

### **Passo 2.2: Gerar Primeiro Convite**

1. Clique no botão **"Gerar Novo Convite"**
2. Um modal se abrirá com:
   - **Data de Expiração (Opcional)**: deixe vazio para sem expiração
   - **Notas (Opcional)**: escreva `"Convite para Avaliador 1"`
3. Clique em **"Gerar Convite"**
4. ✅ Você verá a mensagem: *"Convite criado com sucesso!"*
5. ✅ A tabela agora mostra:
   - **Código**: algo como `VA-A3F2-B7D9` (aleatório)
   - **Status**: Badge azul **"Ativo"**
   - **Criado em**: data/hora atual
   - **Expira em**: `-` (sem expiração)
   - Botão de **copiar** (ícone)

---

### **Passo 2.3: Copiar Código do Convite**

1. Na linha do convite criado, clique no **ícone de copiar** (📋)
2. ✅ Você verá a mensagem: *"Código copiado!"*
3. ✅ O ícone mudará temporariamente para um **check verde** ✓
4. **Cole o código** em um bloco de notas (você usará no próximo passo)

---

### **Passo 2.4: Testar Filtros de Convites**

1. Clique nas tabs de filtro:
   - **"Todos"**: deve mostrar 1 convite
   - **"Ativos"**: deve mostrar 1 convite
   - **"Usados"**: deve estar vazio (0 convites)
   - **"Expirados"**: deve estar vazio (0 convites)
2. ✅ Os números entre parênteses devem corresponder à quantidade correta

---

### **Passo 2.5: Gerar Convite com Expiração**

1. Clique em **"Gerar Novo Convite"** novamente
2. Preencha:
   - **Data de Expiração**: escolha uma data/hora PASSADA (ex: ontem)
   - **Notas**: `"Teste de convite expirado"`
3. Clique em **"Gerar Convite"**
4. ✅ Agora você tem 2 convites
5. Clique na tab **"Expirados"**
6. ✅ Você deve ver o convite com:
   - **Status**: Badge vermelho **"Expirado"**
   - Botão de copiar **desabilitado**

---

## 🎯 PARTE 3: Testar Cadastro com Convite (Avaliador)

### **Passo 3.1: Fazer Logout**

1. Clique no **avatar** (canto superior direito)
2. Clique em **"Sair"**
3. ✅ Você será deslogado e redirecionado para a home (`/`)

---

### **Passo 3.2: Criar Conta de Avaliador com Convite**

1. Clique no botão **"Entrar"** (canto superior direito)
2. Vá para a tab **"Convite"**
3. Preencha:
   - **Email**: um email diferente (ex: `avaliador1@exemplo.com`)
   - **Senha**: uma senha segura
   - **Código do Convite**: **cole o código** que você copiou no Passo 2.3 (ex: `VA-A3F2-B7D9`)
4. Clique em **"Criar Conta com Convite"**
5. ✅ Você verá: *"Conta criada com sucesso! Faça login para continuar."*
6. ✅ Você será automaticamente levado para a tab **"Login"**

---

### **Passo 3.3: Fazer Login como Avaliador**

1. Na tab **"Login"**, insira:
   - **Email**: `avaliador1@exemplo.com`
   - **Senha**: a senha que você criou
2. Clique em **"Entrar"**
3. ✅ Você será redirecionado para `/dashboard-mvp`
4. ✅ No dropdown do avatar, você verá:
   - Seu email
   - **"Avaliador"** (role)
   - **NÃO** verá a opção "Painel Admin" (apenas admins veem)

---

### **Passo 3.4: Verificar Status do Convite no Admin**

1. Faça logout do avaliador
2. Faça login novamente como **admin**
3. Acesse o **Painel Admin** (`/admin/dashboard`)
4. ✅ Você verá:
   - **Convites Usados**: agora mostra `1`
   - **Convites Disponíveis**: agora mostra `0` (o ativo foi usado)
5. Na tabela, o convite usado mostra:
   - **Status**: Badge verde **"Usado"**
   - **Usado por**: data/hora de uso
   - Botão de copiar **desabilitado**

---

## 🎯 PARTE 4: Testar Proteção de Rotas

### **Passo 4.1: Testar Acesso Negado (Avaliador → Admin)**

1. Faça login como **avaliador** (não admin)
2. Tente acessar manualmente: `/admin/dashboard`
3. ✅ Você verá uma tela de **"Acesso Negado"** com:
   - Ícone de alerta 🛡️
   - Mensagem: *"Você não tem permissão para acessar esta página"*
   - *"Esta área requer privilégios de Administrador"*
   - Botão: **"Voltar ao Dashboard"**
4. Clique no botão e confirme que volta para `/dashboard-mvp`

---

### **Passo 4.2: Testar Redirect (Não Logado → Rota Protegida)**

1. Faça **logout**
2. Tente acessar manualmente: `/advanced-mode`
3. ✅ Você será **automaticamente redirecionado** para `/auth`
4. Faça login novamente (admin ou avaliador)
5. ✅ Você consegue acessar `/advanced-mode` estando autenticado

---

### **Passo 4.3: Verificar Proteção de Rotas Admin**

Estando logado como **admin**, teste estas URLs:

- ✅ `/admin/dashboard` → Acesso permitido
- ✅ `/admin/lexicon-setup` → Acesso permitido

Agora faça logout e tente novamente:

- ✅ `/admin/dashboard` → Redirect para `/auth`
- ✅ `/admin/lexicon-setup` → Redirect para `/auth`

---

## 🎯 PARTE 5: Testar Edge Cases e Validações

### **Teste 5.1: Código de Convite Inválido**

1. Faça logout e vá para `/auth` → tab **"Convite"**
2. Tente criar conta com código: `VA-XXXX-XXXX` (inexistente)
3. ✅ Você verá erro: *"Código de convite inválido ou já utilizado"*

---

### **Teste 5.2: Convite Já Usado**

1. Tente criar outra conta usando o **mesmo código** do Passo 3.2
2. ✅ Você verá erro: *"Código de convite inválido ou já utilizado"*

---

### **Teste 5.3: Convite Expirado**

1. Faça login como **admin** e gere um novo convite com:
   - **Data de Expiração**: ontem
2. Copie o código
3. Faça logout
4. Tente criar conta com este código expirado
5. ✅ Você verá erro: *"Código de convite expirado"*

---

### **Teste 5.4: Validação de Email/Senha**

Na página de cadastro/login, teste:

- **Email inválido** (ex: `teste@`): ✅ Erro *"Email inválido"*
- **Senha < 6 caracteres** (ex: `12345`): ✅ Erro *"Senha deve ter no mínimo 6 caracteres"*
- **Senhas não coincidem**: ✅ Erro *"As senhas não coincidem"*

---

### **Teste 5.5: Redirect Automático (Já Logado)**

1. Estando **logado**, tente acessar `/auth`
2. ✅ Você será **automaticamente redirecionado** para `/dashboard-mvp`

---

## 📊 Checklist de Validação Final

Marque ✅ para cada item testado com sucesso:

### **Autenticação Básica**
- [ ] Criar conta via signup
- [ ] Fazer login com credenciais corretas
- [ ] Logout funciona e limpa sessão
- [ ] Sessão persiste após refresh da página
- [ ] Redirect automático de `/auth` quando já logado

### **Sistema de Roles**
- [ ] Admin pode ver "Painel Admin" no dropdown
- [ ] Avaliador NÃO vê "Painel Admin"
- [ ] Admin pode acessar `/admin/dashboard`
- [ ] Avaliador recebe "Acesso Negado" em `/admin/*`

### **Sistema de Convites**
- [ ] Admin pode gerar convites
- [ ] Códigos são únicos (formato `VA-XXXX-XXXX`)
- [ ] Copiar código funciona
- [ ] Filtros (Todos/Ativos/Usados/Expirados) funcionam
- [ ] Estatísticas (Total/Usados/Disponíveis) atualizadas corretamente

### **Cadastro com Convite**
- [ ] Cadastro com convite válido funciona
- [ ] Role de "evaluator" é atribuída automaticamente
- [ ] Convite é marcado como "usado" após cadastro
- [ ] Convite usado não pode ser reutilizado
- [ ] Convite expirado não pode ser usado

### **Proteção de Rotas**
- [ ] Usuário não logado é redirecionado para `/auth`
- [ ] Usuário sem role adequada vê "Acesso Negado"
- [ ] Rotas públicas (`/`, `/auth`) acessíveis sem login
- [ ] Rotas protegidas exigem autenticação

### **Validações e Erros**
- [ ] Email inválido mostra erro
- [ ] Senha curta mostra erro
- [ ] Senhas não coincidem mostra erro
- [ ] Código de convite inválido mostra erro
- [ ] Mensagens de erro são claras e em português

---

## 🐛 Problemas Comuns e Soluções

### **Problema: "Infinite recursion detected in policy"**
**Solução**: As policies usam a função `has_role()` que é `SECURITY DEFINER`. Já está correto na migration.

### **Problema: "Row violates row-level security policy"**
**Solução**: Certifique-se de que o usuário está autenticado e tem a role correta no `user_roles`.

### **Problema: Convite não marca role automaticamente**
**Solução**: Verifique se o trigger `on_invite_key_used` existe na tabela `invite_keys`.

### **Problema: "Confirm email" aparecendo**
**Solução**: No Lovable Cloud Dashboard → Users → Auth Settings, certifique-se de que `auto_confirm_email = true`.

---

## 🎉 Conclusão

Se todos os itens do checklist estão ✅, seu **sistema de autenticação está 100% funcional**!

**Créditos gastos estimados**: ~6 créditos (abaixo do previsto de 14!)

**Próximos passos sugeridos**:
- Finalizar features do MVP
- Adicionar recuperação de senha (opcional)
- Implementar OAuth (Google) se necessário
- Ajustar permissões RLS conforme necessário

---

**Documentação atualizada em**: 2025-11-17  
**Versão do Sistema**: 1.0.0 - MVP Auth Complete
