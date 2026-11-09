import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BRAZIL_STATES,
  filterBrazilCities,
  getFeaturedBrazilCities,
  type BrazilMunicipality,
} from "./brazil-city-data";

const cities = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../public/brazil-cities.json", import.meta.url)), "utf8"),
) as BrazilMunicipality[];

const format = (city: BrazilMunicipality) => `${city.name}, ${city.uf}`;

describe("Brazil city directory", () => {
  it("contains all 5,570 municipalities and all 27 federative units", () => {
    expect(cities).toHaveLength(5570);
    expect(new Set(cities.map(city => city.uf)).size).toBe(27);
    expect(new Set(cities.map(city => city.uf))).toEqual(new Set(BRAZIL_STATES.map(state => state.uf)));
  });

  it("offers capital and regional-city shortcuts for every state", () => {
    const featured = getFeaturedBrazilCities(cities);
    const featuredUfs = new Set(featured.map(city => city.uf));
    expect(featuredUfs.size).toBe(27);
    expect(featured.map(format)).toContain("Rio Branco, AC");
    expect(featured.map(format)).toContain("Manaus, AM");
    expect(featured.map(format)).toContain("São Paulo, SP");
    expect(featured.map(format)).toContain("Porto Alegre, RS");
    expect(featured.map(format)).toContain("Brasília, DF");
  });

  it("shows regional highlights and the full municipality list for a selected state", () => {
    const featuredInSp = getFeaturedBrazilCities(cities, "SP");
    expect(featuredInSp.map(format)).toContain("Campinas, SP");
    expect(featuredInSp.map(format)).toContain("Santos, SP");
    expect(filterBrazilCities(cities, "", "SP")).toHaveLength(645);
  });

  it("finds accented city names without requiring accents and accepts UF terms", () => {
    expect(filterBrazilCities(cities, "ribeirao preto", "SP").map(format)).toContain("Ribeirão Preto, SP");
    expect(filterBrazilCities(cities, "campinas sp").map(format)).toContain("Campinas, SP");
    expect(filterBrazilCities(cities, "joao pessoa pb").map(format)).toContain("João Pessoa, PB");
  });
});
