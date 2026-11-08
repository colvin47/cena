import { ArrowLeft, ExternalLink, Flag, Mail, ShieldCheck, Users } from "lucide-react";
import { Link, useLocation } from "wouter";

const sections = {
  termos: {
    eyebrow: "acordo de convivência",
    title: "Termos de uso",
    intro: "O CENA existe para fazer a música independente circular com respeito, autoria e contexto local.",
    blocks: [
      ["Uso do serviço", "Você pode ouvir, descobrir, compartilhar e interagir com conteúdos publicados no CENA. O acesso de artista é destinado a quem representa o projeto, banda, coletivo, selo ou evento informado no perfil."],
      ["Responsabilidade pelo conteúdo", "Quem envia uma faixa, capa, foto, texto ou evento declara que possui os direitos necessários ou autorização para publicar o material. Créditos devem ser informados de forma honesta e completa."],
      ["Sem anúncios no piloto", "O CENA não exibe anúncios no MVP. Links de apoio direto, Pix, merch, Bandcamp e vaquinhas são informados pelo próprio artista e não representam intermediação ou garantia do CENA."],
      ["Remoção e moderação", "Conteúdos podem ser ocultados durante uma apuração, removidos por violação de direitos ou cancelados quando um evento não acontecer. Denúncias devem ser feitas com contexto e boa-fé."],
    ],
  },
  privacidade: {
    eyebrow: "transparência",
    title: "Privacidade",
    intro: "O piloto usa apenas os dados necessários para personalizar a cena, publicar perfis e operar a agenda.",
    blocks: [
      ["Dados usados", "Podemos armazenar identificação da conta, e-mail fornecido pelo provedor de login, cidade/UF, preferências musicais, perfis, faixas, eventos, playlists, follows, interesses e métricas de reprodução."],
      ["Dados públicos", "Nome artístico, cidade/UF, bio, capa, faixas, créditos, agenda e links de apoio ficam públicos quando o artista escolhe publicar. Não publique dados pessoais sensíveis no perfil ou nos créditos."],
      ["Arquivos e segurança", "Áudios e imagens são armazenados em infraestrutura do projeto. O servidor valida autorização, tipos e limites de upload; nunca envie senhas, documentos ou chaves privadas como conteúdo artístico."],
      ["Controle", "Você pode solicitar correção ou remoção de informações pelo canal de contato do projeto. Durante o piloto, pedidos são tratados manualmente pela equipe responsável pelo CENA."],
    ],
  },
  comunidade: {
    eyebrow: "regras da cena",
    title: "Regras da comunidade",
    intro: "A cena só é coletiva quando pessoas diferentes conseguem ocupar o mesmo espaço com segurança.",
    blocks: [
      ["Não toleramos", "Racismo, LGBTfobia, misoginia, capacitismo, xenofobia, assédio, perseguição, ameaça, violência, exposição de dados pessoais ou discurso de ódio."],
      ["Espaço seguro", "Ao divulgar um evento, informe acessibilidade, classificação, condições de entrada e qualquer recurso de acolhimento disponível. Um selo de espaço seguro é uma responsabilidade de produção, não um adereço."],
      ["Créditos e consentimento", "Dê crédito a vozes, beats, produção, gravação, mixagem, masterização, arte, foto e vídeo. Não associe uma pessoa a um projeto sem consentimento ou use material de terceiros sem autorização."],
      ["Como denunciar", "Use a ação de denúncia em faixa, perfil ou evento e explique o problema. Em risco imediato, procure os serviços locais de emergência; o CENA não substitui autoridades ou equipes profissionais de segurança."],
    ],
  },
  direitos: {
    eyebrow: "autoria",
    title: "Direitos autorais",
    intro: "O CENA é uma vitrine de música independente, não um atalho para publicar material sem autorização.",
    blocks: [
      ["Antes de enviar", "Confirme que você é titular, integrante autorizado, representante do selo/coletivo ou possui licença para publicar a gravação e a arte. Se houver sample, beat, participação ou imagem de terceiros, resolva as permissões antes do upload."],
      ["Créditos mínimos", "Informe intérpretes, compositores quando aplicável, beatmaker, produção, gravação, mixagem, masterização e arte. Use a descrição para explicar splits, compilações e colaborações."],
      ["Notificação", "Uma denúncia fundamentada pode levar a conteúdo pendente de revisão, suspensão temporária ou remoção. A equipe pode solicitar comprovação de autorização e preservar o registro da decisão."],
      ["Boa prática", "Mantenha os arquivos-fonte, contratos, autorizações e créditos fora da plataforma. O CENA ajuda a comunicar autoria, mas não substitui aconselhamento jurídico."],
    ],
  },
  contato: {
    eyebrow: "fale com a equipe",
    title: "Contato e suporte",
    intro: "Durante o piloto, o melhor suporte é um relato objetivo com cidade, perfil, faixa/evento e o que aconteceu.",
    blocks: [
      ["Para artistas", "Inclua o nome do projeto, cidade/UF, formato do arquivo, mensagem de erro e, se possível, o horário da tentativa. Não envie senha, token ou documento."],
      ["Para denúncias", "Use a denúncia dentro do app quando disponível. Para situações urgentes, informe o link do conteúdo, motivo, evidências e se existe risco imediato para alguém."],
      ["Canal do piloto", "Defina o e-mail oficial de suporte antes da divulgação aberta. Até lá, use o canal de contato combinado com a equipe responsável pelo projeto e registre os pedidos para não perder histórico."],
    ],
  },
} as const;

type LegalKey = keyof typeof sections;

function keyFromPath(path: string): LegalKey {
  const key = path.split("/")[1] as LegalKey;
  return key in sections ? key : "termos";
}

export default function Legal() {
  const [location, navigate] = useLocation();
  const key = keyFromPath(location);
  const section = sections[key];
  return <main className="legal-page">
    <div className="legal-shell">
      <header className="legal-header">
        <button className="brand-lockup legal-brand" onClick={() => navigate("/")} aria-label="Voltar para o CENA"><span className="brand-mark">C</span><span>CENA<span className="brand-dot">.</span></span></button>
        <Link href="/" className="legal-back"><ArrowLeft size={15} /> voltar para a cena</Link>
      </header>
      <div className="legal-layout">
        <aside className="legal-nav" aria-label="Documentos do piloto">
          <span className="eyebrow">documentos do piloto</span>
          <Link href="/termos" className={key === "termos" ? "active" : ""}><ShieldCheck size={15} /> Termos de uso</Link>
          <Link href="/privacidade" className={key === "privacidade" ? "active" : ""}><ShieldCheck size={15} /> Privacidade</Link>
          <Link href="/comunidade" className={key === "comunidade" ? "active" : ""}><Users size={15} /> Regras da comunidade</Link>
          <Link href="/direitos" className={key === "direitos" ? "active" : ""}><Flag size={15} /> Direitos autorais</Link>
          <Link href="/contato" className={key === "contato" ? "active" : ""}><Mail size={15} /> Contato e suporte</Link>
        </aside>
        <article className="legal-content">
          <span className="eyebrow lime">{section.eyebrow}</span>
          <h1>{section.title}</h1>
          <p className="legal-intro">{section.intro}</p>
          <div className="legal-blocks">{section.blocks.map(([title, text]) => <section key={title}><h2>{title}</h2><p>{text}</p></section>)}</div>
          <div className="legal-note"><ShieldCheck size={18} /><span>Documento de piloto. Revise com a pessoa responsável pelo projeto e com orientação jurídica adequada antes de uma abertura pública em larga escala.</span></div>
          <Link href="/" className="primary-button legal-cta">Voltar para o CENA <ExternalLink size={15} /></Link>
        </article>
      </div>
    </div>
  </main>;
}
