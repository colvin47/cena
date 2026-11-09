import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import {
  BRAZIL_STATE_GROUPS,
  BRAZIL_STATES,
  filterBrazilCities,
  getFeaturedBrazilCities,
  type BrazilMunicipality,
} from "@/lib/brazil-city-data";

type BrazilCityPickerProps = {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
};

type RawCity = {
  id?: unknown;
  name?: unknown;
  uf?: unknown;
  nome?: unknown;
  microrregiao?: {
    mesorregiao?: {
      UF?: { sigla?: unknown };
    };
  };
};

let cachedCities: BrazilMunicipality[] | null = null;
let citiesPromise: Promise<BrazilMunicipality[]> | null = null;

function normalizeCityRecords(records: unknown): BrazilMunicipality[] {
  if (!Array.isArray(records)) return [];
  return records.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const record = item as RawCity;
    const name = typeof record.name === "string" ? record.name : record.nome;
    const uf = typeof record.uf === "string" ? record.uf : record.microrregiao?.mesorregiao?.UF?.sigla;
    const id = Number(record.id ?? index + 1);
    if (typeof name !== "string" || !name.trim() || typeof uf !== "string" || !/^[A-Z]{2}$/.test(uf) || !Number.isFinite(id)) return [];
    return [{ id, name: name.trim(), uf }];
  }).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

async function fetchBrazilCities(): Promise<BrazilMunicipality[]> {
  if (cachedCities) return cachedCities;
  if (!citiesPromise) {
    citiesPromise = (async () => {
      try {
        const localResponse = await fetch("/brazil-cities.json", { headers: { Accept: "application/json" } });
        if (!localResponse.ok) throw new Error("Catálogo municipal local indisponível");
        const localCities = normalizeCityRecords(await localResponse.json());
        if (localCities.length >= 5000) return localCities;
      } catch {
        // A lista local é prioritária; o IBGE é apenas uma contingência.
      }

      const ibgeResponse = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios", {
        headers: { Accept: "application/json" },
      });
      if (!ibgeResponse.ok) throw new Error("Não foi possível carregar o catálogo do IBGE");
      const ibgeCities = normalizeCityRecords(await ibgeResponse.json());
      if (ibgeCities.length < 5000) throw new Error("Catálogo municipal incompleto");
      return ibgeCities;
    })()
      .then(cities => {
        cachedCities = cities;
        return cities;
      })
      .catch(error => {
        citiesPromise = null;
        throw error;
      });
  }
  return citiesPromise;
}

function extractUf(value: string): string {
  const match = value.trim().match(/,\s*([A-Z]{2})$/);
  return match?.[1] ?? "";
}

function formatCity(city: BrazilMunicipality): string {
  return `${city.name}, ${city.uf}`;
}

export function BrazilCityPicker({ value, onChange, compact = false }: BrazilCityPickerProps) {
  const [cities, setCities] = useState<BrazilMunicipality[]>(cachedCities ?? []);
  const [loading, setLoading] = useState(!cachedCities);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState(value);
  const [stateFilter, setStateFilter] = useState(() => extractUf(value));
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [visibleCount, setVisibleCount] = useState(48);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suppressOpenOnFocusRef = useRef(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({
    position: "fixed",
    top: 8,
    left: 8,
    width: 360,
    maxHeight: 420,
    visibility: "hidden",
    zIndex: 1100,
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError(false);
    fetchBrazilCities()
      .then(items => {
        if (mounted) setCities(items);
      })
      .catch(() => {
        if (mounted) setLoadError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [retry]);

  useEffect(() => {
    if (!open) {
      setQuery(value);
      setStateFilter(extractUf(value));
    }
  }, [open, value]);

  const searchTerm = query.trim() === value.trim() ? "" : query;
  const searching = searchTerm.trim().length > 0;
  const allFilteredCities = useMemo(() => {
    if (searching || showAll) return filterBrazilCities(cities, searchTerm, stateFilter || undefined);
    return getFeaturedBrazilCities(cities, stateFilter || undefined);
  }, [cities, searchTerm, searching, showAll, stateFilter]);
  const visibleCities = allFilteredCities.slice(0, visibleCount);
  const selectedState = BRAZIL_STATES.find(state => state.uf === stateFilter);
  const municipalityCount = stateFilter
    ? cities.filter(city => city.uf === stateFilter).length
    : cities.length;

  useEffect(() => {
    setVisibleCount(48);
    setActiveIndex(0);
  }, [searchTerm, stateFilter, showAll]);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(compact ? 420 : 460, window.innerWidth - 16);
      const maxHeight = Math.min(560, window.innerHeight - 24);
      const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - 8);
      const spaceAbove = Math.max(0, rect.top - 8);
      const placeAbove = spaceBelow < Math.min(maxHeight, 320) && spaceAbove > spaceBelow;
      const availableHeight = Math.max(160, Math.min(maxHeight, placeAbove ? spaceAbove : spaceBelow));
      const top = placeAbove ? Math.max(8, rect.top - availableHeight - 8) : Math.min(rect.bottom + 8, window.innerHeight - availableHeight - 8);
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
      setPopoverStyle({ position: "fixed", top, left, width, maxHeight: availableHeight, zIndex: 1100 });
    };

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (inputRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
      setShowAll(false);
    };

    updatePosition();
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [compact, open]);

  useEffect(() => {
    const activeOption = document.getElementById(`${listId}-option-${activeIndex}`);
    activeOption?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, listId, visibleCities.length]);

  const chooseCity = (city: BrazilMunicipality) => {
    const formatted = formatCity(city);
    onChange(formatted);
    setQuery(formatted);
    setStateFilter(city.uf);
    setOpen(false);
    setShowAll(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(index => Math.min(index + 1, Math.max(visibleCities.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(index => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && visibleCities[activeIndex]) {
      event.preventDefault();
      chooseCity(visibleCities[activeIndex]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      setShowAll(false);
    }
  };

  const popover = open && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={popoverRef}
          id={`${listId}-popover`}
          className={`city-picker-popover${compact ? " city-picker-popover-compact" : ""}`}
          style={popoverStyle}
        >
          <div className="city-picker-popover-header">
            <div>
              <strong>{selectedState ? `Cidades em ${selectedState.name}` : "Cidades do Brasil"}</strong>
              <span>{selectedState ? `${municipalityCount.toLocaleString("pt-BR")} municípios em ${selectedState.uf}` : `${cities.length.toLocaleString("pt-BR")} municípios · 27 UFs`}</span>
            </div>
            <button type="button" className="city-picker-close" onClick={() => { setOpen(false); setShowAll(false); suppressOpenOnFocusRef.current = true; inputRef.current?.focus(); window.setTimeout(() => { suppressOpenOnFocusRef.current = false; }, 0); }} aria-label="Fechar lista de cidades">×</button>
          </div>

          <label className="city-picker-state-label">
            <span>Filtrar por estado</span>
            <select value={stateFilter} onChange={event => setStateFilter(event.target.value)}>
              <option value="">Brasil inteiro</option>
              {BRAZIL_STATE_GROUPS.map(group => (
                <optgroup key={group.region} label={group.region}>
                  {group.states.map(state => (
                    <option key={state.uf} value={state.uf}>{state.name} ({state.uf})</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <div className="city-picker-list-heading">
            <span>{searching ? `${allFilteredCities.length.toLocaleString("pt-BR")} resultados` : showAll ? `Municípios ${selectedState ? `de ${selectedState.name}` : "do Brasil"}` : selectedState ? `Capitais e centros regionais de ${selectedState.name}` : "Capitais e centros regionais"}</span>
            {!searching && (
              <button type="button" onClick={() => setShowAll(current => !current)}>
                {showAll ? "Ver destaques" : `Ver todos (${municipalityCount.toLocaleString("pt-BR")})`}
              </button>
            )}
          </div>

          {loading ? (
            <p className="city-picker-status" role="status">Carregando municípios do Brasil…</p>
          ) : loadError ? (
            <div className="city-picker-status" role="alert">
              <span>Não foi possível carregar a lista de cidades.</span>
              <button type="button" onClick={() => setRetry(count => count + 1)}>Tentar novamente</button>
            </div>
          ) : allFilteredCities.length === 0 ? (
            <p className="city-picker-status" role="status">Nenhuma cidade encontrada. Tente outro nome ou selecione “Brasil inteiro”.</p>
          ) : (
            <div id={listId} className="city-picker-results" role="listbox" aria-label="Municípios disponíveis">
              {visibleCities.map((city, index) => (
                <button
                  type="button"
                  role="option"
                  id={`${listId}-option-${index}`}
                  key={`${city.uf}-${city.id}`}
                  aria-selected={`${city.name}, ${city.uf}` === value}
                  tabIndex={-1}
                  className={`city-picker-option${index === activeIndex ? " is-active" : ""}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => chooseCity(city)}
                >
                  <span>{city.name}</span>
                  <span className="city-picker-option-uf">{city.uf}</span>
                </button>
              ))}
            </div>
          )}

          {!loading && !loadError && allFilteredCities.length > visibleCities.length && (
            <button type="button" className="city-picker-more" onClick={() => setVisibleCount(count => count + 48)}>
              Mostrar mais {Math.min(48, allFilteredCities.length - visibleCities.length)} de {allFilteredCities.length.toLocaleString("pt-BR")}
            </button>
          )}
          {selectedState && !searching && !showAll && (
            <p className="city-picker-nearby-note">Você também pode abrir todos os municípios desta UF para encontrar cidades da sua região.</p>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <input
        ref={inputRef}
        className={compact ? "city-picker-input" : "city-picker-input city-picker-input-form"}
        role="combobox"
        aria-label="Escolher cidade brasileira"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && visibleCities.length > 0 ? `${listId}-option-${activeIndex}` : undefined}
        autoComplete="off"
        placeholder="Cidade, UF"
        value={query}
        onFocus={() => {
          if (suppressOpenOnFocusRef.current) return;
          setQuery(value);
          setOpen(true);
        }}
        onClick={() => setOpen(true)}
        onChange={event => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />
      {popover}
    </>
  );
}
