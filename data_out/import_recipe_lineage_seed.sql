BEGIN;

COPY sources FROM 'data_out/sources.csv' WITH (FORMAT csv, HEADER true);
COPY cuisines FROM 'data_out/cuisines.csv' WITH (FORMAT csv, HEADER true);
COPY categories FROM 'data_out/categories.csv' WITH (FORMAT csv, HEADER true);
COPY cuisine_categories FROM 'data_out/cuisine_categories.csv' WITH (FORMAT csv, HEADER true);
COPY dish_families FROM 'data_out/dish_families.csv' WITH (FORMAT csv, HEADER true);
COPY dish_family_categories FROM 'data_out/dish_family_categories.csv' WITH (FORMAT csv, HEADER true);
COPY dish_family_cuisines FROM 'data_out/dish_family_cuisines.csv' WITH (FORMAT csv, HEADER true);
COPY dishes FROM 'data_out/dishes.csv' WITH (FORMAT csv, HEADER true);
COPY variations FROM 'data_out/variations.csv' WITH (FORMAT csv, HEADER true);
COPY ingredients FROM 'data_out/ingredients.csv' WITH (FORMAT csv, HEADER true);
COPY techniques FROM 'data_out/techniques.csv' WITH (FORMAT csv, HEADER true);
COPY dish_family_ingredients FROM 'data_out/dish_family_ingredients.csv' WITH (FORMAT csv, HEADER true);
COPY dish_family_techniques FROM 'data_out/dish_family_techniques.csv' WITH (FORMAT csv, HEADER true);
COPY dish_relations FROM 'data_out/dish_relations.csv' WITH (FORMAT csv, HEADER true);
COPY aliases FROM 'data_out/aliases.csv' WITH (FORMAT csv, HEADER true);
COPY provenance FROM 'data_out/provenance.csv' WITH (FORMAT csv, HEADER true);

COMMIT;
