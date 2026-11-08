# Diagnóstico de perfil e autenticação — CENA

## Causa confirmada

O problema principal não estava no SQL de edição de perfil. O fluxo de criação e edição chama as mutations corretas, envia campos opcionais vazios como `undefined`, valida nome, handle e cidade e persiste no MySQL. O defeito estava no tratamento global de sessão: qualquer mutation ou query que recebesse `UNAUTHORIZED` acionava `startLogin()` automaticamente em `client/src/main.tsx`. Quando o navegador ou WebView não enviava `webdev_app_session`, salvar perfil parecia sair da conta, voltar ao início ou iniciar OAuth de novo.

Os logs publicados registraram repetidamente `[Auth] Missing session cookie`. Isso confirma que algumas requisições protegidas chegam sem a sessão. O endpoint correto do projeto, `https://cena-s494x52h.manus.space/api/health`, respondeu 200, e `/api/oauth/start` respondeu 302 com o cookie temporário `__Host-oauth_state`. O teste anterior que retornou 404 usou por engano o host `cena-s494x52htpWYr5Qi68YCS.manus.space`, que não é o domínio publicado.

Havia uma segunda fragilidade no Android: o papel escolhido antes do OAuth fica em `localStorage` e é reaplicado automaticamente depois do login. Em caso de falha de sessão, a tentativa permanecia salva e podia ser repetida em re-renderizações, deixando a criação inicial presa.

## Correção aplicada

1. Removido o redirecionamento OAuth automático para erros globais de query/mutation. Login agora só começa por ação explícita do usuário.
2. Mantida a mensagem do erro no formulário por meio de toast, sem desmontar a tela nem apagar o rascunho.
3. Adicionado tratamento de erro para escolher papel, criar perfil de artista e salvar perfil de público.
4. Impedida a repetição infinita do papel pendente após falha; o estado pendente é removido e o usuário pode tentar novamente conscientemente.
5. O salvamento de artista continua usando `updateArtistProfile`, sem alterar upload, player, agenda, biblioteca ou recomendações.
6. O cookie de sessão continua `HttpOnly; Secure; SameSite=None`, necessário para o Preview HTTPS embutido e compatível com o domínio publicado.

## Limite específico do APK/WebView

Se o APK for um wrapper que bloqueia cookies, nenhum frontend pode recuperar uma sessão HttpOnly que o WebView não armazena. O APK precisa abrir o OAuth no Chrome Custom Tab/Trusted Web Activity ou habilitar cookies persistentes para `cena-s494x52h.manus.space`. Se for o PWA instalado pelo Chrome, remova a versão antiga e instale novamente a partir do domínio canônico para eliminar service workers e dados antigos.

A versão corrigida não deixa mais o usuário preso em loop: se a sessão estiver ausente, permanece no formulário, mostra que a sessão expirou e permite iniciar o login de forma explícita. Para concluir o cadastro, o ambiente precisa aceitar o cookie de sessão.

## Comparação de produto

O SoundCloud separa edição de perfil de upload de imagem e apresenta ações explícitas de salvar. A documentação oficial também diferencia requisitos de avatar e header e informa limites de arquivo. [1]

O Spotify cria o perfil de artista quando a música é entregue por distribuidor e depois permite reivindicar e personalizar a presença. O CENA, por ser uma plataforma de publicação direta, precisa manter o passo explícito de criação de perfil, mas deve oferecer estados claros de rascunho, validação e publicação. [2]

O Bandcamp combina perfil, catálogo e apoio direto ao artista. Ele reforça a proposta de relacionamento com fãs e suporte financeiro, que é coerente com Pix, Bandcamp, merch, manifesto e agenda no CENA. [3]

## Validação

Validações executadas após a correção:

```text
pnpm check  — aprovado
pnpm build  — aprovado
pnpm test   — 19 aprovados, 2 integrações ignoradas sem DATABASE_URL
GET /api/health no domínio canônico — HTTP 200
GET /api/oauth/start no domínio canônico — HTTP 302 e cookie __Host-oauth_state
```

O teste automatizado não consegue concluir uma conta Google sem interação do proprietário. A correção foi feita no caminho comum às contas de ouvinte e criador e deve ser validada com uma conta real no Chrome e no APK atualizado.

## Próximo teste prático

No Chrome, abrir o domínio canônico, criar acesso como artista, concluir Google/Manus, escolher banda, criar o perfil, abrir o estúdio, alterar somente a bio e salvar. Depois sair, entrar novamente e confirmar a persistência. No PWA/APK, repetir o mesmo roteiro. Se apenas o APK falhar e o Chrome funcionar, a causa restante é a política de cookies do wrapper, não a mutation de perfil.

## Referências

[1]: https://help.soundcloud.com/hc/en-us/articles/115003450007-Update-Your-Profile-Image-and-Header "SoundCloud — Update Your Profile Image and Header"
[2]: https://support.spotify.com/us/artists/article/creating-an-artist-profile-on-spotify/ "Spotify for Artists — Creating an artist profile"
[3]: https://bandcamp.com/artists "Bandcamp — Bandcamp for Artists"


## Diagnóstico adicional do upload

O salvamento do perfil usa tRPC. O upload de áudio, porém, usa `fetch("/api/upload")` diretamente. No Preview e em alguns WebViews Android, o runtime mantém o token de sessão em `sessionStorage` como `manus-cookie` e o cliente tRPC o encaminha como `Authorization: Bearer ...`. O upload direto não fazia esse encaminhamento; dependia apenas do cookie, que pode ser bloqueado. O servidor registrou exatamente `[Upload] Failed: Invalid session cookie`.

A correção faz o upload direto enviar o mesmo Bearer fallback do tRPC e também usar `credentials: "include"`. A rota agora responde `401` com mensagem clara para sessão expirada, em vez de transformar o problema em `502`/Cloudflare. O cliente também traduz respostas não-JSON, limite de 50 MB e erros 5xx para mensagens compreensíveis.

Teste local do endpoint sem sessão após a correção:

```text
HTTP/1.1 401 Unauthorized
{"error":"Sua sessão expirou. Entre novamente antes de enviar o arquivo."}
```
