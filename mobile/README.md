# CENA para Android

O app Expo/React Native usa a API do projeto CENA — cópia de desenvolvimento: `https://cenacopy-rjglbygs.manus.space`. Descoberta, busca, agenda, reprodução e favoritos locais foram preservados; o app não cria outro banco de faixas, usuários ou uploads.

## Login Manus

No Android, **Entrar com Manus** abre o navegador do sistema. O app valida um `state` próprio, recebe apenas um ticket opaco de curta duração pelo deep link e troca esse ticket por uma sessão Bearer na API CENA. O código OAuth fica no servidor; o JWT não entra no deep link e a sessão do Android é guardada no `SecureStore`. O app não tenta associar contas automaticamente por e-mail.

O app usa o scheme `cena` (`cena://oauth/callback`). O backend nativo foi preparado no repositório GitHub CENA no commit `ea2ca9f`, com migration aditiva `drizzle/0015_mobile_oauth_tickets.sql`. O domínio alvo confirmado na conversa é `cenacopy-rjglbygs.manus.space`; o fallback OAuth local também foi corrigido para esse domínio. O projeto Webdev `wdp_d86254bcd5a66ebd554a6e5a` é a cópia certa, mas o painel desta sessão continua vinculado a outro projeto (`wdp_946...`). A tarefa `Site Cenacopy` está acessível e sua execução atual trata troca de áudio/foto de capa; não iniciei uma segunda execução concorrente. O código OAuth ainda não foi aplicado/publicado no Webdev certo e a migration ainda não foi executada no banco do site; login e upload não estão operacionais ponta a ponta.

A rota usa `CENA_PUBLIC_BASE_URL` (padrão: `https://cenacopy-rjglbygs.manus.space`) e permite schemes definidos em `CENA_MOBILE_APP_CALLBACK_URIS`; sem essa configuração, aceita `cena://oauth/callback`.

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

Defina `EXPO_PUBLIC_CENA_API_BASE_URL` com `https://cenacopy-rjglbygs.manus.space`. O perfil EAS `preview` produz um APK interno. Não coloque tokens ou segredos em variáveis `EXPO_PUBLIC_*`.

O APK anterior continua intacto. A branch `manus-cenacopy-preview` recebe as alterações do app. Gere a próxima build `preview` somente após o backend e a migration estarem publicados, para validar login/upload contra as novas rotas. A conta Expo tem acesso de admin ao projeto `cena`, conectado ao repositório `colvin47/cena` com base `/mobile`.
