# Como publicar a CENA a partir do GitHub

## Situação atual

O código-fonte está em [`diego47colvin-debug/cena`](https://github.com/diego47colvin-debug/cena), branch `main`. A branch contém as mudanças de cidades e rotas de detalhe introduzidas no commit `7aa05db`.

O repositório **não tem um workflow de publicação em GitHub Actions**. Um `commit` ou `push` atualiza o código armazenado no GitHub, mas não compila nem publica o site.

A cópia Webdev nova está hospedada no Manus em `https://cenaapp-rgtrg8.manus.space`. A configuração confirmada para essa cópia usa o repositório gerenciado pelo Manus e publicação automática a partir de checkpoints desse projeto. Ela não está conectada à branch `main` do repositório GitHub acima. O domínio antigo `https://cena-kn4vk68m.manus.space` pertence a outro projeto e não é substituído por esta cópia.

## O que significa cada etapa

1. **Commit:** salva uma alteração no histórico local do Git.
2. **Push:** envia o commit para uma branch do GitHub, como `main`.
3. **Deploy/publicação:** compila e inicia o aplicativo em um serviço de hospedagem para que o público acesse o site.

Hoje, as etapas 1 e 2 no GitHub não executam a etapa 3 automaticamente.

## Como atualizar o código no GitHub

No site ou aplicativo do GitHub, abra o repositório `diego47colvin-debug/cena`, confira a branch `main`, edite os arquivos ou envie as mudanças e crie um commit. Isso atualiza o repositório. Para editar pelo computador, o fluxo comum é:

```bash
git clone https://github.com/diego47colvin-debug/cena.git
cd cena
# faça e revise as alterações
git add <arquivos>
git commit -m "descrição da alteração"
git push origin main
```

Não use `git add .` sem revisar os arquivos. Nunca inclua `.env`, credenciais, `node_modules`, dados privados ou arquivos gerados de produção.

## Como a publicação funciona hoje no Manus

Para publicar a cópia nova pelo Manus, o código precisa estar no projeto Webdev que serve `cenaapp-rgtrg8.manus.space`. Abra esse projeto, confira a **Prévia** e use **Publicar** para publicar a versão salva. A configuração atual também indica publicação automática quando o próprio projeto registra um novo checkpoint na branch principal gerenciada pelo Manus.

**Atenção:** clicar em **Publicar** não busca o código de `diego47colvin-debug/cena`. Alterações que existam somente no GitHub ainda precisam ser sincronizadas com o projeto Webdev antes de uma publicação. Como a cópia atual usa o repositório do Manus, não há sincronização automática entre esse GitHub existente e o site novo.

## Como habilitar publicação realmente iniciada pelo GitHub

É necessário escolher e configurar um serviço de hospedagem que faça deploy de um container a partir do GitHub. O `Dockerfile` deste repositório já prepara a aplicação, mas o serviço também precisa de um banco MySQL gerenciado, armazenamento de arquivos e variáveis secretas de execução. Esses valores devem ser cadastrados no serviço de hospedagem, nunca no repositório.

GitHub Pages não é suficiente: ele hospeda arquivos estáticos, enquanto a CENA também precisa do backend Express/tRPC e do banco de dados. Também não há hoje uma Action que publique esse container.

Antes de criar essa automação, defina:

- qual serviço será o destino do deploy;
- qual site/domínio deve receber a nova versão — o domínio antigo ou a cópia nova;
- onde ficarão o banco MySQL e os arquivos enviados;
- como guardar as credenciais de produção e como fazer rollback.

Até essas escolhas serem feitas e testadas, mantenha os domínios separados e não publique no site antigo por engano.
