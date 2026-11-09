export type BrazilMunicipality = {
  id: number;
  name: string;
  uf: string;
};

export const BRAZIL_STATE_GROUPS = [
  {
    region: "Norte",
    states: [
      { uf: "AC", name: "Acre" },
      { uf: "AP", name: "Amapá" },
      { uf: "AM", name: "Amazonas" },
      { uf: "PA", name: "Pará" },
      { uf: "RO", name: "Rondônia" },
      { uf: "RR", name: "Roraima" },
      { uf: "TO", name: "Tocantins" },
    ],
  },
  {
    region: "Nordeste",
    states: [
      { uf: "AL", name: "Alagoas" },
      { uf: "BA", name: "Bahia" },
      { uf: "CE", name: "Ceará" },
      { uf: "MA", name: "Maranhão" },
      { uf: "PB", name: "Paraíba" },
      { uf: "PE", name: "Pernambuco" },
      { uf: "PI", name: "Piauí" },
      { uf: "RN", name: "Rio Grande do Norte" },
      { uf: "SE", name: "Sergipe" },
    ],
  },
  {
    region: "Centro-Oeste",
    states: [
      { uf: "DF", name: "Distrito Federal" },
      { uf: "GO", name: "Goiás" },
      { uf: "MS", name: "Mato Grosso do Sul" },
      { uf: "MT", name: "Mato Grosso" },
    ],
  },
  {
    region: "Sudeste",
    states: [
      { uf: "ES", name: "Espírito Santo" },
      { uf: "MG", name: "Minas Gerais" },
      { uf: "RJ", name: "Rio de Janeiro" },
      { uf: "SP", name: "São Paulo" },
    ],
  },
  {
    region: "Sul",
    states: [
      { uf: "PR", name: "Paraná" },
      { uf: "RS", name: "Rio Grande do Sul" },
      { uf: "SC", name: "Santa Catarina" },
    ],
  },
] as const;

export const BRAZIL_STATES = BRAZIL_STATE_GROUPS.flatMap(group =>
  group.states.map(state => ({ ...state, region: group.region })),
);

const FEATURED_CITIES_BY_UF: Record<string, string[]> = {
  AC: ["Rio Branco", "Cruzeiro do Sul"],
  AL: ["Maceió", "Arapiraca"],
  AP: ["Macapá", "Santana"],
  AM: ["Manaus", "Parintins"],
  BA: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Ilhéus"],
  CE: ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Sobral"],
  DF: ["Brasília"],
  ES: ["Vitória", "Vila Velha", "Serra", "Cariacica"],
  GO: ["Goiânia", "Aparecida de Goiânia", "Anápolis"],
  MA: ["São Luís", "Imperatriz"],
  MT: ["Cuiabá", "Várzea Grande", "Rondonópolis", "Sinop"],
  MS: ["Campo Grande", "Dourados", "Três Lagoas"],
  MG: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Montes Claros"],
  PA: ["Belém", "Ananindeua", "Santarém", "Marabá"],
  PB: ["João Pessoa", "Campina Grande"],
  PR: ["Curitiba", "Londrina", "Maringá", "Ponta Grossa"],
  PE: ["Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru", "Petrolina"],
  PI: ["Teresina", "Parnaíba", "Picos"],
  RJ: ["Rio de Janeiro", "Niterói", "Duque de Caxias", "São Gonçalo", "Campos dos Goytacazes"],
  RN: ["Natal", "Mossoró", "Parnamirim"],
  RS: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria"],
  RO: ["Porto Velho", "Ji-Paraná"],
  RR: ["Boa Vista"],
  SC: ["Florianópolis", "Joinville", "Blumenau", "Chapecó", "Itajaí"],
  SP: ["São Paulo", "Campinas", "Guarulhos", "Santos", "São José dos Campos", "Ribeirão Preto", "Sorocaba", "São Bernardo do Campo"],
  SE: ["Aracaju", "Nossa Senhora do Socorro", "Itabaiana"],
  TO: ["Palmas", "Araguaína", "Gurupi"],
};

export function normalizeBrazilCitySearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[,.\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getFeaturedBrazilCities(
  cities: BrazilMunicipality[],
  uf?: string,
): BrazilMunicipality[] {
  const states = uf ? [uf] : BRAZIL_STATES.map(state => state.uf);
  const byStateAndName = new Map(
    cities.map(city => [
      `${city.uf}:${normalizeBrazilCitySearch(city.name)}`,
      city,
    ]),
  );
  const seen = new Set<number>();
  const featured: BrazilMunicipality[] = [];

  for (const stateUf of states) {
    for (const name of FEATURED_CITIES_BY_UF[stateUf] ?? []) {
      const city = byStateAndName.get(`${stateUf}:${normalizeBrazilCitySearch(name)}`);
      if (city && !seen.has(city.id)) {
        seen.add(city.id);
        featured.push(city);
      }
    }
  }

  return featured;
}

export function filterBrazilCities(
  cities: BrazilMunicipality[],
  query: string,
  uf?: string,
): BrazilMunicipality[] {
  const tokens = normalizeBrazilCitySearch(query).split(" ").filter(Boolean);
  return cities
    .filter(city => {
      if (uf && city.uf !== uf) return false;
      if (tokens.length === 0) return true;
      const searchable = normalizeBrazilCitySearch(`${city.name} ${city.uf}`);
      return tokens.every(token => searchable.includes(token));
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
