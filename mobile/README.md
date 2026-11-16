# CENA para Android

O app Expo/React Native é a experiência principal de descoberta e reprodução do CENA. O site responsivo é complementar: continua sendo a página pública e o espaço de gestão de perfis, catálogo e agenda. Ambos apontam para a mesma API CENA; o app não cria uma cópia do banco, dos usuários ou dos uploads.

## O que o app faz

- Descobre faixas, artistas e eventos por cidade e gênero.
- Reproduz áudio e mantém favoritos locais no aparelho.
- Abre páginas de artistas, eventos, endereço no mapa e destinos externos.
- Mostra lotes de ingresso e merchandise como informação; não vende, reserva nem processa pagamento.
- Permite entrar/criar uma conta CENA por e-mail; a confirmação e a recuperação da palavra-passe são feitas por e-mail. Manus OAuth continua opcional no site durante a transição.
- Favoritos continuam locais e privados neste aparelho; não há sincronização de favoritos, upload nem recolha de localização do dispositivo nesta versão.

## Executar e verificar

Requisitos: Node.js 22 e pnpm 10.18.0. Na pasta `mobile/`:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm check
corepack pnpm start
```

Preencha `EXPO_PUBLIC_CENA_API_BASE_URL` com a origem HTTPS da API desta cópia antes de iniciar o Expo localmente; no EAS, a variável já está definida em texto simples apenas para `preview` com o URL `https://cenacopy-rjglbygs.manus.space`. Não existe fallback para o domínio do site anterior. Não coloque tokens ou segredos em variáveis `EXPO_PUBLIC_*`.

## APK e AAB

`eas.json` declara o perfil `preview` como distribuição interna Android em formato **APK** instalável e o perfil `production` como **AAB**. `mobile/app.json` está vinculado ao projeto `@colvindiegoss-team/cena`, slug `cena` e projectId `20f42d9f-0388-4563-8601-f6c579bbbafb`. O EAS está ligado à branch existente `feat/native-first-app-commerce`, que não contém todas as atualizações desta cópia. A branch separada `manus-cenacopy-preview` deve conter o app atualizado, sem alterar `main` nem a branch existente. O perfil `preview` já aponta para a API pública desta cópia; ainda não existe APK novo. A compilação nativa é remota pelo Dashboard EAS; não executar EAS Build dentro do Sandbox.

## Dependência de publicação da API

A cadeia de migrations, incluindo `0015_cena_mobile_commerce_analytics.sql` e `0016_email_auth.sql`, já foi aplicada apenas ao MySQL novo e inicialmente vazio desta cópia. A base e o site publicados anteriores não foram tocados. A API da cópia está publicada em `https://cenacopy-rjglbygs.manus.space`; o novo APK ainda aguarda o build remoto da branch atualizada. Não executar migrations contra a base antiga sem autorização explícita do ambiente e revisão operacional correspondente.
