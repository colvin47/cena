# CENA para Android

O app Expo/React Native é a experiência principal de descoberta e reprodução do CENA. O site responsivo é complementar: continua sendo a página pública e o espaço de gestão de perfis, catálogo e agenda. Ambos apontam para a mesma API CENA; o app não cria uma cópia do banco, dos usuários ou dos uploads.

## O que o app faz

- Descobre faixas, artistas e eventos por cidade e gênero.
- Reproduz áudio e mantém favoritos locais no aparelho.
- Abre páginas de artistas, eventos, endereço no mapa e destinos externos.
- Mostra lotes de ingresso e merchandise como informação; não vende, reserva nem processa pagamento.
- Usa apenas consultas públicas HTTPS. Login nativo e escritas autenticadas (seguir, interesse, upload e gestão) ainda não fazem parte desta versão; localização do aparelho não é coletada.

## Executar e verificar

Requisitos: Node.js 22 e pnpm 10.18.0. Na pasta `mobile/`:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm check
corepack pnpm test
corepack pnpm start
```

O valor opcional `EXPO_PUBLIC_CENA_API_BASE_URL` define a origem HTTPS da API e, se omitido, usa `https://cena-kn4vk68m.manus.space`. Não coloque tokens ou segredos em variáveis `EXPO_PUBLIC_*`.

## APK e AAB

`eas.json` declara o perfil `preview` como distribuição interna Android em formato **APK** instalável e o perfil `production` como **AAB**. Este app aponta para o projeto Expo original `@colvindiegos-team/cena-mobile` (`projectId` `ca3f0db2-b66a-4625-9c3d-7687501a6393`) e preserva o pacote `com.cena.mobile`. Gerar o APK apenas nesse projeto, mantendo a chave Android original; não criar outra chave nem usar o projeto alternativo `@colvindiegoss-team/cena`. Se o painel original exigir, use o diretório-base `mobile`, o branch `feat/native-first-app-commerce` e o perfil `preview` para Android. Nenhum APK/AAB está incluído neste repositório até o build terminar.

## Dependência de publicação da API

A API da CENA precisa publicar os endpoints de lotes, merchandise e endereço de evento, com o schema da migration `drizzle/0015_cena_mobile_commerce_analytics.sql` aplicado ao banco do ambiente de destino. A migration foi gerada no código, mas não aplicada aqui. Antes da publicação do backend, recursos que dependem dessas rotas podem permanecer indisponíveis no app. Não executar migration contra o banco compartilhado sem a autorização/revisão operacional correspondente.
