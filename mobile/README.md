# CENA para Android

O app Expo/React Native usa a API existente da cópia CENA (`https://cenacopy-rjglbygs.manus.space`). Descoberta, busca, agenda, reprodução e favoritos locais foram preservados; o app não cria outro banco de faixas, usuários ou uploads.

## Login Manus

No Android, **Entrar com Manus** abre o navegador do sistema. O app valida um `state` próprio, recebe apenas um ticket opaco de curta duração pelo deep link e troca esse ticket por uma sessão Bearer na API CENA. O código OAuth fica no servidor; o JWT não entra no deep link e a sessão do Android é guardada no `SecureStore`. O app não tenta associar contas automaticamente por e-mail.

O app espera o scheme `cena` desta branch (`cena://oauth/callback`). O backend precisa conter as rotas nativas, `auth.exchangeMobileOAuthTicket` e a tabela `mobileOAuthTickets` da migration `drizzle/0016_silly_doctor_strange.sql`. O código da migration foi gerado, mas **não foi aplicado ao banco publicado**, e as alterações de backend **ainda não foram implantadas**. Até essa implantação, o login Manus nativo não estará operacional.

A rota usa `CENA_PUBLIC_BASE_URL` (padrão: `https://cenacopy-rjglbygs.manus.space`) e permite schemes definidos em `CENA_MOBILE_APP_CALLBACK_URIS`; sem essa configuração, aceita apenas `cena://oauth/callback`. Para permitir também a cópia WebDev, inclua o callback dela na allowlist do servidor, sem substituir `cena://oauth/callback`.

## Envio de música

O envio exige login Manus validado pela API, conta com perfil artístico, perfil de artista/banda, título, áudio e confirmação de direitos. Áudio: MP3, WAV, M4A ou OGG, até 50 MB. Capa é opcional: JPG, JPEG, PNG ou WebP, até 10 MB. O formulário reutiliza o endpoint `/api/upload`, o storage oficial e `scene.createTrack`; preserva metadados existentes (álbum, gênero, cidade, descrição, tipo/data de lançamento, visibilidade, créditos e coletivo quando a conta tem permissão `owner` ou `editor`). O servidor valida novamente sessão, tipo/tamanho, propriedade dos arquivos, perfil e permissões.

Após uma resposta de publicação ambígua, os arquivos são preservados e a mesma chave de idempotência é reutilizada se a pessoa tentar novamente sem alterar o formulário. Se o app for fechado durante o envio, confira primeiro no site/catálogo se a faixa foi publicada antes de iniciar outra tentativa. Nenhum arquivo real foi enviado durante a validação local.

## Executar e verificar

Requisitos e versões estão pinados em `mobile/package.json` e `mobile/pnpm-lock.yaml` (`pnpm@10.18.0`). Na pasta `mobile/`:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm check
corepack pnpm start
```

Defina `EXPO_PUBLIC_CENA_API_BASE_URL` com a origem HTTPS da API CENA. O perfil EAS `preview` já usa `https://cenacopy-rjglbygs.manus.space`; não coloque tokens ou segredos em variáveis `EXPO_PUBLIC_*`.

Os testes do backend e das regras de upload ficam na raiz do repositório CENA (`corepack pnpm test`). O APK anterior continua sendo de teste e não foi substituído. A branch `manus-cenacopy-preview` recebe as alterações do app; o perfil `preview` produz APK e fixa a imagem `latest`, exigida por builds disparados do GitHub. A conta Expo tem acesso de admin ao projeto `cena`, que já está conectado a `colvin47/cena` com base `/mobile`; porém, nas configurações pessoais do Expo, o GitHub ainda aparece como **Not connected**. Conecte nessa conta o usuário GitHub com acesso ao repositório e aprove as permissões do Expo GitHub App antes de disparar o próximo build.
