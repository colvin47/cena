

## Décima sexta rodada — integração MySQL e validação de produção

Foi adicionada a suíte opcional `server/collective.invites.integration.test.ts`, executada somente quando `DATABASE_URL` está configurada. Ela cria dados temporários isolados e valida contra MySQL real:

- criação de convite;
- prévia do convite;
- aceite único;
- rejeição de replay;
- ocultação de convite expirado;
- limpeza dos dados temporários ao final.

Novo comando:

```bash
pnpm test:integration
```

No ambiente atual, sem `DATABASE_URL`, os testes ficam marcados como skipped de forma explícita, sem mascarar aprovação. A suíte padrão continua funcionando:

```text
pnpm check
pnpm test
```

Resultado local: TypeScript aprovado, 19 testes aprovados, 2 testes de integração skipped por ausência de banco.

## Décima sétima rodada — preferências granulares de alertas
Foi adicionado ao perfil autenticado um painel de preferências locais para o piloto:
- novos lançamentos;
- shows na cidade escolhida;
- mudanças e cancelamentos;
- resumo semanal.

As escolhas usam opt-in explícito, ficam salvas no dispositivo e não solicitam permissão do navegador automaticamente. A entrega de notificações continua dependente do canal in-app/backend já existente; este painel não promete push enquanto essa camada não estiver habilitada.

## Décima oitava rodada — perfil e rascunho de upload
Foram implementadas as melhorias de baixo risco que não dependem de dados externos:
- upload de foto do projeto e capa do perfil pelo estúdio do artista;
- prévia das imagens antes de continuar editando;
- validação de imagem e limite de 10 MB;
- salvamento automático local dos campos textuais do rascunho de upload;
- recuperação do rascunho após recarregar a página, sem fingir que arquivos binários foram preservados;
- limpeza automática do rascunho depois de uma publicação concluída.

Ainda dependem de uma próxima migração/validação operacional: release com múltiplas faixas, data de lançamento/visibilidade, créditos estruturados, upload retomável com progresso real, teste autenticado com banda real e densidade de catálogo/eventos da cidade-piloto.

## Décima nona rodada — controles de release
O upload agora permite:
- escolher publicação pública ou rascunho privado;
- definir uma data futura de lançamento;
- esconder faixas privadas e agendadas da descoberta pública, busca e detalhe;
- evitar notificações aos seguidores antes de um lançamento público estar disponível;
- preservar compatibilidade com faixas existentes, que seguem públicas e imediatas por padrão.

A migração `0013_release_controls` adiciona os campos `releaseDate` e `visibility` ao catálogo MySQL.

## Vigésima rodada — recomendações explicáveis
A home agora ordena as faixas por uma pontuação local e transparente, combinando:
- cidade do ouvinte;
- gêneros favoritos;
- artistas seguidos;
- faixas salvas;
- histórico recente, com redução de repetição;
- ordem editorial de fallback para contas novas.

A interface informa quando a ordem usa o radar da pessoa e quando ainda é apenas curadoria local. O restante do catálogo continua acessível pela busca; a recomendação não cria uma bolha fechada.

## Vigésima primeira rodada — entrada clara e radar de agenda
A barra superior agora exibe `Entrar` e `Criar perfil` para visitantes. O modal explica dois caminhos:
- ouvinte, para descobrir, seguir, salvar e acompanhar eventos;
- criador/distribuidor, para artista, banda, MC, produtor, coletivo, selo, venue ou projeto cultural.

O cadastro ainda usa Manus OAuth, mas a intenção da ação fica clara antes do acesso. Depois do login criador, o perfil define o formato específico do projeto.

As recomendações também passaram a considerar artistas associados a eventos que a pessoa marcou como “Tenho interesse”, aproximando música e agenda.

## Vigésima segunda rodada — player sob demanda
O player não carrega mais a faixa demo automaticamente ao abrir o CENA. O dock inferior só aparece enquanto existe reprodução ativa, evitando erro visual e liberando espaço nas telas de criação de perfil e envio de conteúdo. O áudio só recebe `src` depois de uma ação explícita de tocar uma faixa.
