CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  base_url TEXT,
  license TEXT,
  terms_url TEXT,
  extraction_method TEXT,
  priority_rank INT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cuisines (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  description TEXT,
  region TEXT,
  wikidata_qid TEXT UNIQUE,
  wikipedia_title TEXT,
  dbpedia_uri TEXT,
  sort_order INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  description TEXT,
  category_kind TEXT NOT NULL,
  parent_category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  wikidata_qid TEXT UNIQUE,
  wikipedia_title TEXT,
  dbpedia_uri TEXT,
  sort_order INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dish_families (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  description TEXT,
  primary_category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  primary_cuisine_id TEXT REFERENCES cuisines(id) ON DELETE SET NULL,
  wikidata_qid TEXT UNIQUE,
  wikipedia_title TEXT,
  dbpedia_uri TEXT,
  popularity_rank INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dishes (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  description TEXT,
  dish_family_id TEXT NOT NULL REFERENCES dish_families(id) ON DELETE CASCADE,
  primary_category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  primary_cuisine_id TEXT REFERENCES cuisines(id) ON DELETE SET NULL,
  wikidata_qid TEXT UNIQUE,
  wikipedia_title TEXT,
  dbpedia_uri TEXT,
  origin_text TEXT,
  is_notable BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE variations (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  description TEXT,
  dish_id TEXT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  parent_variation_id TEXT REFERENCES variations(id) ON DELETE SET NULL,
  variation_type TEXT NOT NULL,
  source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
  source_url TEXT,
  attribution_text TEXT,
  author_name TEXT,
  location_text TEXT,
  is_canonical BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ingredients (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  description TEXT,
  ingredient_kind TEXT,
  foodon_id TEXT UNIQUE,
  wikidata_qid TEXT UNIQUE,
  wikipedia_title TEXT,
  dbpedia_uri TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE techniques (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  description TEXT,
  technique_kind TEXT,
  foodon_id TEXT UNIQUE,
  wikidata_qid TEXT UNIQUE,
  wikipedia_title TEXT,
  dbpedia_uri TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cuisine_categories (
  cuisine_id TEXT NOT NULL REFERENCES cuisines(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  sort_order INT,
  PRIMARY KEY (cuisine_id, category_id)
);

CREATE TABLE dish_family_categories (
  dish_family_id TEXT NOT NULL REFERENCES dish_families(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (dish_family_id, category_id)
);

CREATE TABLE dish_family_cuisines (
  dish_family_id TEXT NOT NULL REFERENCES dish_families(id) ON DELETE CASCADE,
  cuisine_id TEXT NOT NULL REFERENCES cuisines(id) ON DELETE CASCADE,
  relation_kind TEXT NOT NULL DEFAULT 'associated',
  PRIMARY KEY (dish_family_id, cuisine_id)
);

CREATE TABLE dish_family_ingredients (
  dish_family_id TEXT NOT NULL REFERENCES dish_families(id) ON DELETE CASCADE,
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  role TEXT,
  is_core BOOLEAN NOT NULL DEFAULT FALSE,
  weight NUMERIC(6,3),
  PRIMARY KEY (dish_family_id, ingredient_id)
);

CREATE TABLE dish_family_techniques (
  dish_family_id TEXT NOT NULL REFERENCES dish_families(id) ON DELETE CASCADE,
  technique_id TEXT NOT NULL REFERENCES techniques(id) ON DELETE CASCADE,
  role TEXT,
  is_core BOOLEAN NOT NULL DEFAULT FALSE,
  weight NUMERIC(6,3),
  PRIMARY KEY (dish_family_id, technique_id)
);

CREATE TABLE dish_relations (
  from_dish_id TEXT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  to_dish_id TEXT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  weight NUMERIC(6,3),
  PRIMARY KEY (from_dish_id, to_dish_id, relation_type)
);

CREATE TABLE aliases (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  language_code TEXT NOT NULL DEFAULT 'en',
  source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
  is_preferred BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE provenance (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
  source_url TEXT,
  source_record_id TEXT,
  source_title TEXT,
  extraction_method TEXT,
  extraction_confidence NUMERIC(4,3),
  license TEXT,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_hash TEXT,
  raw_payload JSONB
);

CREATE INDEX idx_categories_parent ON categories(parent_category_id);
CREATE INDEX idx_dish_families_category ON dish_families(primary_category_id);
CREATE INDEX idx_dishes_family ON dishes(dish_family_id);
CREATE INDEX idx_variations_dish ON variations(dish_id);
CREATE INDEX idx_aliases_entity ON aliases(entity_type, entity_id);
CREATE INDEX idx_aliases_norm ON aliases(normalized_alias);
CREATE INDEX idx_provenance_entity ON provenance(entity_type, entity_id);
