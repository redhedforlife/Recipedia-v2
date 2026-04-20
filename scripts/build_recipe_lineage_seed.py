#!/usr/bin/env python3
"""Build a graph-first recipe lineage starter dataset and PostgreSQL seed bundle."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote, unquote, urlparse

import requests
from bs4 import BeautifulSoup

try:
    import rdflib
    from rdflib.namespace import RDFS
except Exception:  # pragma: no cover - optional at runtime
    rdflib = None
    RDFS = None

try:
    from SPARQLWrapper import JSON as SPARQL_JSON
    from SPARQLWrapper import SPARQLWrapper
except Exception:  # pragma: no cover - optional at runtime
    SPARQLWrapper = None
    SPARQL_JSON = None


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_OUT_DIR = BASE_DIR / "data_out"
DATA_STAGE_DIR = BASE_DIR / "data_stage"
RAW_DIRS = {
    "wikipedia": BASE_DIR / "raw_wikipedia",
    "wikidata": BASE_DIR / "raw_wikidata",
    "foodon": BASE_DIR / "raw_foodon",
    "mealdb": BASE_DIR / "raw_mealdb",
    "dbpedia": BASE_DIR / "raw_dbpedia",
}
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
USER_AGENT = "Recipedia recipe-lineage seed builder/0.1 (local development)"
DEFAULT_TIMEOUT = 45

SOURCE_ROWS = [
    {
        "id": "src-wikipedia-en",
        "slug": "wikipedia-en",
        "name": "English Wikipedia",
        "source_type": "encyclopedia",
        "base_url": "https://en.wikipedia.org/",
        "license": "CC BY-SA 4.0",
        "terms_url": "https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use",
        "extraction_method": "mediawiki-api-and-html",
        "priority_rank": 1,
        "is_active": True,
        "created_at": GENERATED_AT,
    },
    {
        "id": "src-wikidata",
        "slug": "wikidata",
        "name": "Wikidata Query Service",
        "source_type": "knowledge-graph",
        "base_url": "https://query.wikidata.org/",
        "license": "CC0 1.0",
        "terms_url": "https://www.wikidata.org/wiki/Wikidata:Data_access",
        "extraction_method": "sparql",
        "priority_rank": 2,
        "is_active": True,
        "created_at": GENERATED_AT,
    },
    {
        "id": "src-foodon",
        "slug": "foodon",
        "name": "FoodOn",
        "source_type": "ontology",
        "base_url": "https://foodon.org/",
        "license": "CC BY 4.0",
        "terms_url": "https://github.com/FoodOntology/foodon",
        "extraction_method": "owl-and-tsv",
        "priority_rank": 3,
        "is_active": True,
        "created_at": GENERATED_AT,
    },
    {
        "id": "src-mealdb",
        "slug": "the-meal-db",
        "name": "TheMealDB API",
        "source_type": "api",
        "base_url": "https://www.themealdb.com/api/json/v1/1/",
        "license": "TheMealDB API terms apply",
        "terms_url": "https://www.themealdb.com/api.php",
        "extraction_method": "json-api",
        "priority_rank": 4,
        "is_active": True,
        "created_at": GENERATED_AT,
    },
    {
        "id": "src-dbpedia",
        "slug": "dbpedia",
        "name": "DBpedia",
        "source_type": "knowledge-graph",
        "base_url": "https://lookup.dbpedia.org/",
        "license": "CC BY-SA 3.0",
        "terms_url": "https://www.dbpedia.org/resources/faq/",
        "extraction_method": "lookup-and-sparql",
        "priority_rank": 5,
        "is_active": True,
        "created_at": GENERATED_AT,
    },
    {
        "id": "src-serious-eats",
        "slug": "serious-eats",
        "name": "Serious Eats",
        "source_type": "curated-recipe-site",
        "base_url": "https://www.seriouseats.com/",
        "license": "Source attribution retained; recipe text not stored wholesale.",
        "terms_url": "https://www.seriouseats.com/terms-of-use-7101496",
        "extraction_method": "recipe-scrapers-json-ld-bs4-playwright",
        "priority_rank": 6,
        "is_active": True,
        "created_at": GENERATED_AT,
    },
]

WIKIPEDIA_SEED_PAGES = [
    "https://en.wikipedia.org/wiki/List_of_cuisines",
    "https://en.wikipedia.org/wiki/Outline_of_cuisines",
    "https://en.wikipedia.org/wiki/Lists_of_prepared_foods",
    "https://en.wikipedia.org/wiki/Lists_of_foods",
    "https://en.wikipedia.org/wiki/Category:Prepared_foods_by_main_ingredient",
    "https://en.wikipedia.org/wiki/Category:Lists_of_foods_by_ingredient",
    "https://en.wikipedia.org/wiki/List_of_sandwiches",
    "https://en.wikipedia.org/wiki/List_of_pasta_dishes",
    "https://en.wikipedia.org/wiki/List_of_hamburgers",
    "https://en.wikipedia.org/wiki/List_of_noodle_dishes",
    "https://en.wikipedia.org/wiki/List_of_soups",
    "https://en.wikipedia.org/wiki/List_of_stews",
    "https://en.wikipedia.org/wiki/List_of_rice_dishes",
    "https://en.wikipedia.org/wiki/List_of_regional_dishes_of_the_United_States",
]

STARTER_CUISINES = [
    ("Afghan", "Central Asia"),
    ("Albanian", "Europe"),
    ("Algerian", "North Africa"),
    ("American", "North America"),
    ("Argentine", "South America"),
    ("Armenian", "West Asia"),
    ("Australian", "Oceania"),
    ("Austrian", "Europe"),
    ("Bangladeshi", "South Asia"),
    ("Belgian", "Europe"),
    ("Brazilian", "South America"),
    ("British", "Europe"),
    ("Cambodian", "Southeast Asia"),
    ("Canadian", "North America"),
    ("Caribbean", "Caribbean"),
    ("Chilean", "South America"),
    ("Chinese", "East Asia"),
    ("Colombian", "South America"),
    ("Cuban", "Caribbean"),
    ("Czech", "Europe"),
    ("Egyptian", "North Africa"),
    ("Ethiopian", "East Africa"),
    ("Filipino", "Southeast Asia"),
    ("French", "Europe"),
    ("Georgian", "West Asia"),
    ("German", "Europe"),
    ("Greek", "Europe"),
    ("Hungarian", "Europe"),
    ("Indian", "South Asia"),
    ("Indonesian", "Southeast Asia"),
    ("Iranian", "West Asia"),
    ("Iraqi", "West Asia"),
    ("Irish", "Europe"),
    ("Israeli", "West Asia"),
    ("Italian", "Europe"),
    ("Japanese", "East Asia"),
    ("Jordanian", "West Asia"),
    ("Korean", "East Asia"),
    ("Lebanese", "West Asia"),
    ("Malaysian", "Southeast Asia"),
    ("Mediterranean", "Mediterranean"),
    ("Mexican", "North America"),
    ("Moroccan", "North Africa"),
    ("Nepalese", "South Asia"),
    ("Nigerian", "West Africa"),
    ("Pakistani", "South Asia"),
    ("Peruvian", "South America"),
    ("Polish", "Europe"),
    ("Portuguese", "Europe"),
    ("Russian", "Europe"),
    ("Spanish", "Europe"),
    ("Sri Lankan", "South Asia"),
    ("Syrian", "West Asia"),
    ("Taiwanese", "East Asia"),
    ("Thai", "Southeast Asia"),
    ("Tunisian", "North Africa"),
    ("Turkish", "West Asia"),
    ("Ukrainian", "Europe"),
    ("Uzbek", "Central Asia"),
    ("Vietnamese", "Southeast Asia"),
]

CATEGORY_TREE = [
    ("Sandwiches", ["Open-face sandwiches", "Closed sandwiches", "Grilled sandwiches", "Fried sandwiches", "Submarine sandwiches", "Breakfast sandwiches"]),
    ("Burgers", ["Beef burgers", "Chicken burgers", "Fish burgers", "Vegetable burgers", "Stuffed burgers", "Slider burgers"]),
    ("Wraps and rolls", ["Flatbread wraps", "Burritos", "Spring rolls", "Egg rolls", "Lettuce wraps", "Stuffed rolls"]),
    ("Flatbreads and pizzas", ["Leavened flatbreads", "Unleavened flatbreads", "Topped flatbreads", "Stuffed flatbreads", "Regional pizzas", "Griddled flatbreads"]),
    ("Breads and loaves", ["Yeast breads", "Quick breads", "Steamed breads", "Braided breads", "Sweet loaves", "Savory loaves"]),
    ("Dumplings and buns", ["Boiled dumplings", "Steamed dumplings", "Pan-fried dumplings", "Stuffed buns", "Soup dumplings", "Dumpling soups"]),
    ("Noodle dishes", ["Stir-fried noodles", "Noodle soups", "Cold noodles", "Sauced noodles", "Baked noodles", "Hand-pulled noodles"]),
    ("Pasta dishes", ["Long pasta dishes", "Stuffed pasta dishes", "Baked pasta dishes", "Pasta salads", "Creamy pasta dishes", "Tomato pasta dishes"]),
    ("Rice dishes", ["Pilafs", "Fried rice dishes", "Risotto-like dishes", "Rice porridges", "Rice casseroles", "Stuffed rice dishes"]),
    ("Soups", ["Clear soups", "Pureed soups", "Bean soups", "Noodle soups", "Chilled soups", "Seafood soups"]),
    ("Stews", ["Meat stews", "Vegetable stews", "Bean stews", "Seafood stews", "Chile stews", "Slow braises"]),
    ("Curries", ["Coconut curries", "Dry curries", "Lentil curries", "Meat curries", "Fish curries", "Curry noodle dishes"]),
    ("Salads", ["Green salads", "Grain salads", "Noodle salads", "Potato salads", "Bread salads", "Composed salads"]),
    ("Dips and spreads", ["Bean dips", "Yogurt dips", "Chile dips", "Nut spreads", "Fish spreads", "Herb spreads"]),
    ("Sauces and condiments", ["Emulsified sauces", "Tomato sauces", "Chile sauces", "Pickles", "Relishes", "Chutneys"]),
    ("Skewers and grilled dishes", ["Kebabs", "Satay", "Barbecue skewers", "Whole grilled fish", "Grilled meats", "Grilled vegetables"]),
    ("Braises and roasts", ["Pot roasts", "Oven roasts", "Wine braises", "Tagines", "Confits", "Glazed roasts"]),
    ("Fried dishes and fritters", ["Tempura", "Cutlets", "Croquettes", "Fritters", "Fried chicken dishes", "Fried seafood dishes"]),
    ("Casseroles and bakes", ["Gratins", "Layered casseroles", "Stuffed bakes", "Savory pies", "Hotdish", "Breakfast bakes"]),
    ("Egg dishes", ["Omelets", "Scrambled egg dishes", "Egg curries", "Custardy egg dishes", "Filled omelets", "Egg drop dishes"]),
    ("Breakfast dishes", ["Porridge breakfasts", "Griddle breakfasts", "Stuffed breakfasts", "Breakfast sandwiches", "Fried breakfasts", "Sweet breakfasts"]),
    ("Pancakes and crepes", ["Savory pancakes", "Sweet pancakes", "Filled crepes", "Fermented pancakes", "Stuffed pancakes", "Fritter pancakes"]),
    ("Pies and pastries", ["Savory pies", "Sweet pies", "Tarts", "Turnovers", "Hand pies", "Layered pastries"]),
    ("Cakes and gateaux", ["Sponge cakes", "Butter cakes", "Cheesecakes", "Steamed cakes", "Flourless cakes", "Snack cakes"]),
    ("Cookies and biscuits", ["Drop cookies", "Rolled cookies", "Sandwich cookies", "Shortbread", "Crackers", "Tea biscuits"]),
    ("Puddings and custards", ["Baked puddings", "Stovetop puddings", "Custards", "Jellies", "Rice puddings", "Bread puddings"]),
    ("Confections and sweets", ["Candies", "Nougats", "Fudge", "Halva-like sweets", "Syrup sweets", "Chocolate sweets"]),
    ("Snacks and street food", ["Fritter snacks", "Stuffed snacks", "Roasted snacks", "Skewered snacks", "Chip snacks", "Savory pastries"]),
    ("Seafood dishes", ["Shellfish dishes", "Fish curries", "Grilled fish dishes", "Raw seafood dishes", "Seafood rice dishes", "Preserved seafood dishes"]),
    ("Vegetable and legume mains", ["Stuffed vegetables", "Bean patties", "Braised greens", "Tofu dishes", "Chickpea mains", "Lentil mains"]),
]

TECHNIQUE_GROUPS = {
    "preparation": [
        "brunoise", "chiffonade", "chop", "crush", "cube", "debone", "deglaze", "dice", "fillet", "fold", "grate",
        "julienne", "knead", "marinate", "mash", "mince", "mix", "peel", "pickle", "pipe", "poach-prep", "press",
        "puree", "rest", "roll", "rough chop", "score", "season", "shred", "sieve", "slice", "slurry", "smash",
        "soak", "spatchcock", "sprinkle", "stuff", "temper", "tenderize", "toast spices", "truss", "whisk", "zest",
    ],
    "heat": [
        "air fry", "bake", "barbecue", "blanch", "boil", "braise", "broil", "char", "confit", "deep fry", "double fry",
        "griddle", "grill", "hot smoke", "pan fry", "pan roast", "poach", "pressure cook", "roast", "saute", "sear",
        "shallow fry", "simmer", "slow cook", "smoke", "steam", "stew", "stir fry", "toast", "warm", "wok fry",
    ],
    "dough-and-shaping": [
        "laminate", "proof", "ferment dough", "shape loaf", "shape dumplings", "fold pastry", "stretch dough",
        "dust with flour", "blind bake", "dock dough", "par-bake", "steam dough", "stuff pastry", "seal dumplings",
        "roll thin", "crimp edges", "brush wash", "score dough", "fill crepes", "form patties", "stuff breads",
    ],
    "sauce-and-emulsion": [
        "emulsify", "reduce", "mount with butter", "thicken", "clarify", "infuse", "defat", "glaze", "caramelize",
        "sweat aromatics", "bloom spices", "temper eggs", "whip cream", "curdle intentionally", "dehydrate sauce",
        "blend smooth", "strain sauce", "finish with acid", "coat pasta", "bind filling", "set custard",
    ],
    "preservation": [
        "cure", "dry", "freeze", "freeze-dry", "lacto-ferment", "pack in oil", "preserve in syrup", "salt", "sun dry",
        "vacuum seal", "water-bath can", "smoke cure", "dry age", "wet age", "brine", "cold smoke", "dehydrate",
        "compress", "quick pickle", "candy", "crystallize",
    ],
    "finishing": [
        "baste", "broil to finish", "dust", "finish with herbs", "finish with oil", "fold in garnish", "froth", "garnish",
        "glaze to finish", "gratin", "torch", "rest after cooking", "slice to serve", "plate", "dress salad",
        "season to finish", "thicken at finish", "crack spice", "drizzle", "spritz", "top with crumbs",
    ],
}

CATEGORY_SOURCE_TITLE = {
    "Sandwiches": "List of sandwiches",
    "Burgers": "List of hamburgers",
    "Noodle dishes": "List of noodle dishes",
    "Pasta dishes": "List of pasta dishes",
    "Soups": "List of soups",
    "Stews": "List of stews",
    "Rice dishes": "List of rice dishes",
    "Seafood dishes": "Category:Prepared foods by main ingredient",
    "Vegetable and legume mains": "Category:Lists of foods by ingredient",
}

CATEGORY_REGEX_RULES = [
    (r"\b(sandwich|po'boy|sub|banh mi|croque|muffuletta|panini|toastie)\b", "Sandwiches"),
    (r"\b(burger|hamburger|slider)\b", "Burgers"),
    (r"\b(wrap|burrito|roll|shawarma|gyro|quesadilla)\b", "Wraps and rolls"),
    (r"\b(pizza|flatbread|focaccia|lahmacun|manakish)\b", "Flatbreads and pizzas"),
    (r"\b(bread|loaf|bun|bagel|brioche|pretzel)\b", "Breads and loaves"),
    (r"\b(dumpling|gyoza|momo|pierogi|wonton|bao|siomai|shumai)\b", "Dumplings and buns"),
    (r"\b(noodle|ramen|udon|soba|pho|mein|yakisoba|lo mein|chow mein)\b", "Noodle dishes"),
    (r"\b(pasta|spaghetti|fettuccine|lasagna|lasagne|macaroni|penne|carbonara|alfredo|ravioli|gnocchi)\b", "Pasta dishes"),
    (r"\b(rice|risotto|pilaf|pilau|biryani|paella|congee|jollof|kichadi|khichdi)\b", "Rice dishes"),
    (r"\b(soup|bisque|chowder|broth|borscht|gazpacho)\b", "Soups"),
    (r"\b(stew|goulash|ragout|ragu|hotpot|hot pot|chili|tagine|cassoulet)\b", "Stews"),
    (r"\b(curry|korma|vindaloo|masala|rendang)\b", "Curries"),
    (r"\b(salad|slaw|ceviche|tabbouleh|tabouli)\b", "Salads"),
    (r"\b(hummus|dip|spread|guacamole|pate|tapenade)\b", "Dips and spreads"),
    (r"\b(sauce|salsa|chutney|pickle|relish|aioli|pesto|mole)\b", "Sauces and condiments"),
    (r"\b(kebab|satay|yakitori|skewer|barbecue|bbq|grill)\b", "Skewers and grilled dishes"),
    (r"\b(roast|confit|braise|bourguignon|coq au vin)\b", "Braises and roasts"),
    (r"\b(fried|tempura|karaage|fritter|croquette|cutlet|schnitzel)\b", "Fried dishes and fritters"),
    (r"\b(gratin|casserole|bake|moussaka|hotdish)\b", "Casseroles and bakes"),
    (r"\b(omelet|omelette|frittata|shakshuka|egg)\b", "Egg dishes"),
    (r"\b(breakfast|porridge|waffle|granola)\b", "Breakfast dishes"),
    (r"\b(pancake|crepe|crêpe|blini|dosa|injera)\b", "Pancakes and crepes"),
    (r"\b(pie|tart|pastry|turnover|empanada|samosa|baklava)\b", "Pies and pastries"),
    (r"\b(cake|gateau|gâteau|cheesecake)\b", "Cakes and gateaux"),
    (r"\b(cookie|biscuit|cracker|shortbread)\b", "Cookies and biscuits"),
    (r"\b(pudding|custard|flan|jelly|mousse)\b", "Puddings and custards"),
    (r"\b(candy|fudge|nougat|halva|halvah|chocolate)\b", "Confections and sweets"),
    (r"\b(snack|chaat|nachos|fries|pakora|bhaji)\b", "Snacks and street food"),
    (r"\b(fish|shrimp|prawn|lobster|clam|oyster|mussel|crab|salmon|tuna|cod)\b", "Seafood dishes"),
    (r"\b(bean|lentil|tofu|paneer|vegetable|aubergine|eggplant|chickpea)\b", "Vegetable and legume mains"),
]

LIST_PAGE_CATEGORY_MAP = {
    "List of sandwiches": "Sandwiches",
    "List of hamburgers": "Burgers",
    "List of noodle dishes": "Noodle dishes",
    "List of pasta dishes": "Pasta dishes",
    "List of soups": "Soups",
    "List of stews": "Stews",
    "List of rice dishes": "Rice dishes",
    "List of regional dishes of the United States": "Snacks and street food",
}

COUNTRY_TO_CUISINE = {
    "afghanistan": "Afghan",
    "albania": "Albanian",
    "algeria": "Algerian",
    "argentina": "Argentine",
    "armenia": "Armenian",
    "australia": "Australian",
    "austria": "Austrian",
    "bangladesh": "Bangladeshi",
    "belgium": "Belgian",
    "brazil": "Brazilian",
    "britain": "British",
    "united kingdom": "British",
    "cambodia": "Cambodian",
    "canada": "Canadian",
    "caribbean": "Caribbean",
    "chile": "Chilean",
    "china": "Chinese",
    "colombia": "Colombian",
    "cuba": "Cuban",
    "czech republic": "Czech",
    "czechia": "Czech",
    "egypt": "Egyptian",
    "ethiopia": "Ethiopian",
    "philippines": "Filipino",
    "france": "French",
    "georgia": "Georgian",
    "germany": "German",
    "greece": "Greek",
    "hungary": "Hungarian",
    "india": "Indian",
    "indonesia": "Indonesian",
    "iran": "Iranian",
    "iraq": "Iraqi",
    "ireland": "Irish",
    "israel": "Israeli",
    "italy": "Italian",
    "japan": "Japanese",
    "jordan": "Jordanian",
    "korea": "Korean",
    "south korea": "Korean",
    "lebanon": "Lebanese",
    "malaysia": "Malaysian",
    "mediterranean": "Mediterranean",
    "mexico": "Mexican",
    "morocco": "Moroccan",
    "nepal": "Nepalese",
    "nigeria": "Nigerian",
    "pakistan": "Pakistani",
    "peru": "Peruvian",
    "poland": "Polish",
    "portugal": "Portuguese",
    "russia": "Russian",
    "spain": "Spanish",
    "sri lanka": "Sri Lankan",
    "syria": "Syrian",
    "taiwan": "Taiwanese",
    "thailand": "Thai",
    "tunisia": "Tunisian",
    "turkey": "Turkish",
    "ukraine": "Ukrainian",
    "uzbekistan": "Uzbek",
    "vietnam": "Vietnamese",
    "united states": "American",
    "usa": "American",
    "united states of america": "American",
}

CATEGORY_TO_INGREDIENTS = {
    "Sandwiches": ["bread", "lettuce", "tomato"],
    "Burgers": ["beef", "bun", "onion"],
    "Wraps and rolls": ["flour tortilla", "cabbage", "green onion"],
    "Flatbreads and pizzas": ["flour", "olive oil", "cheese"],
    "Breads and loaves": ["flour", "yeast", "salt"],
    "Dumplings and buns": ["flour", "pork", "green onion"],
    "Noodle dishes": ["noodles", "soy sauce", "green onion"],
    "Pasta dishes": ["pasta", "olive oil", "cheese"],
    "Rice dishes": ["rice", "onion", "garlic"],
    "Soups": ["onion", "garlic", "stock"],
    "Stews": ["onion", "garlic", "tomato"],
    "Curries": ["onion", "garlic", "ginger", "cumin"],
    "Salads": ["olive oil", "lemon", "tomato"],
    "Dips and spreads": ["chickpeas", "olive oil", "garlic"],
    "Sauces and condiments": ["vinegar", "garlic", "chile pepper"],
    "Skewers and grilled dishes": ["meat", "onion", "pepper"],
    "Braises and roasts": ["beef", "onion", "wine"],
    "Fried dishes and fritters": ["flour", "oil", "egg"],
    "Casseroles and bakes": ["cheese", "cream", "onion"],
    "Egg dishes": ["egg", "butter", "green onion"],
    "Breakfast dishes": ["egg", "bread", "milk"],
    "Pancakes and crepes": ["flour", "egg", "milk"],
    "Pies and pastries": ["flour", "butter", "sugar"],
    "Cakes and gateaux": ["flour", "egg", "sugar"],
    "Cookies and biscuits": ["flour", "butter", "sugar"],
    "Puddings and custards": ["milk", "egg", "sugar"],
    "Confections and sweets": ["sugar", "nuts", "chocolate"],
    "Snacks and street food": ["potato", "chile pepper", "flour"],
    "Seafood dishes": ["fish", "lemon", "garlic"],
    "Vegetable and legume mains": ["lentils", "beans", "onion"],
}

CATEGORY_TO_TECHNIQUES = {
    "Sandwiches": ["slice", "toast", "assemble"],
    "Burgers": ["form patties", "grill", "rest after cooking"],
    "Wraps and rolls": ["fill crepes", "roll", "stuff"],
    "Flatbreads and pizzas": ["knead", "proof", "bake"],
    "Breads and loaves": ["knead", "proof", "bake"],
    "Dumplings and buns": ["shape dumplings", "steam", "seal dumplings"],
    "Noodle dishes": ["boil", "stir fry", "season to finish"],
    "Pasta dishes": ["boil", "coat pasta", "emulsify"],
    "Rice dishes": ["simmer", "steam", "rest"],
    "Soups": ["simmer", "puree", "season to finish"],
    "Stews": ["brown", "braise", "slow cook"],
    "Curries": ["bloom spices", "simmer", "finish with herbs"],
    "Salads": ["chop", "dress salad", "season"],
    "Dips and spreads": ["blend smooth", "whisk", "drizzle"],
    "Sauces and condiments": ["reduce", "pickle", "emulsify"],
    "Skewers and grilled dishes": ["marinate", "grill", "baste"],
    "Braises and roasts": ["sear", "braise", "rest after cooking"],
    "Fried dishes and fritters": ["deep fry", "drain", "season to finish"],
    "Casseroles and bakes": ["layer", "bake", "gratin"],
    "Egg dishes": ["whisk", "saute", "set custard"],
    "Breakfast dishes": ["griddle", "fry", "toast"],
    "Pancakes and crepes": ["whisk", "griddle", "fold"],
    "Pies and pastries": ["laminate", "blind bake", "brush wash"],
    "Cakes and gateaux": ["whisk", "fold", "bake"],
    "Cookies and biscuits": ["cream", "roll", "bake"],
    "Puddings and custards": ["temper eggs", "set custard", "chill"],
    "Confections and sweets": ["caramelize", "crystallize", "cool"],
    "Snacks and street food": ["fry", "grill", "assemble"],
    "Seafood dishes": ["grill", "poach", "pan fry"],
    "Vegetable and legume mains": ["braise", "stew", "roast"],
}

CUISINE_TO_INGREDIENTS = {
    "Italian": ["olive oil", "tomato", "parmesan cheese"],
    "Mexican": ["corn", "beans", "chile pepper"],
    "Japanese": ["soy sauce", "rice", "seaweed"],
    "Chinese": ["soy sauce", "ginger", "green onion"],
    "Indian": ["cumin", "garam masala", "ginger"],
    "Thai": ["fish sauce", "lime", "coconut milk"],
    "French": ["butter", "wine", "shallot"],
    "Greek": ["olive oil", "feta", "oregano"],
    "Lebanese": ["chickpeas", "tahini", "parsley"],
}

CUISINE_TO_TECHNIQUES = {
    "Italian": ["coat pasta", "reduce", "mount with butter"],
    "Mexican": ["toast spices", "braise", "griddle"],
    "Japanese": ["steam", "grill", "slice"],
    "Chinese": ["stir fry", "steam", "wok fry"],
    "Indian": ["bloom spices", "simmer", "temper"],
    "Thai": ["pound paste", "simmer", "finish with herbs"],
    "French": ["sweat aromatics", "braise", "mount with butter"],
    "Greek": ["grill", "roast", "dress salad"],
    "Lebanese": ["grill", "stuff", "dress salad"],
}

DBPEDIA_LOOKUP_LIMIT = 5


def normalize_whitespace(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_name(value: Any) -> str:
    text = unicodedata.normalize("NFKD", normalize_whitespace(value))
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.replace("’", "'").replace("‘", "'").replace("–", "-").replace("—", "-")
    text = text.lower()
    text = re.sub(r"^(a|an|the)\s+", "", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def slugify(value: Any) -> str:
    text = unicodedata.normalize("NFKD", normalize_whitespace(value))
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower().replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def stable_id(prefix: str, preferred: str, extra: str | None = None) -> str:
    preferred_slug = slugify(preferred)[:48] or "item"
    digest = hashlib.sha1(f"{prefix}|{preferred}|{extra or ''}".encode("utf-8")).hexdigest()[:8]
    return f"{prefix}-{preferred_slug}-{digest}"


def parse_wikipedia_title(url: str) -> str:
    return unquote(url.rsplit("/", 1)[-1]).replace("_", " ")


def wikipedia_page_url(title: str) -> str:
    return f"https://en.wikipedia.org/wiki/{quote(title.replace(' ', '_'))}"


def wikidata_entity_url(qid: str) -> str:
    return f"https://www.wikidata.org/wiki/{qid}"


def json_hash(payload: Any) -> str:
    return hashlib.sha1(
        json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()


def ensure_dirs() -> None:
    DATA_OUT_DIR.mkdir(parents=True, exist_ok=True)
    DATA_STAGE_DIR.mkdir(parents=True, exist_ok=True)
    for directory in RAW_DIRS.values():
        directory.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            normalized_row = {}
            for field in fieldnames:
                value = row.get(field, "")
                if isinstance(value, (dict, list)):
                    value = json.dumps(value, ensure_ascii=False, sort_keys=True)
                elif value is True:
                    value = "true"
                elif value is False:
                    value = "false"
                elif value is None:
                    value = ""
                normalized_row[field] = value
            writer.writerow(normalized_row)


def fetch_text(
    url: str,
    cache_path: Path,
    refresh: bool = False,
    headers: dict[str, str] | None = None,
    timeout: int = DEFAULT_TIMEOUT,
) -> str:
    if cache_path.exists() and not refresh:
        return cache_path.read_text(encoding="utf-8")
    session = requests.Session()
    response = session.get(
        url,
        timeout=timeout,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/json;q=0.9,*/*;q=0.8",
            **(headers or {}),
        },
    )
    response.raise_for_status()
    cache_path.write_text(response.text, encoding="utf-8")
    return response.text


def fetch_json(
    url: str,
    cache_path: Path,
    refresh: bool = False,
    headers: dict[str, str] | None = None,
    timeout: int = DEFAULT_TIMEOUT,
) -> Any:
    if cache_path.exists() and not refresh:
        return json.loads(cache_path.read_text(encoding="utf-8"))
    session = requests.Session()
    response = session.get(
        url,
        timeout=timeout,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json,text/plain;q=0.9,*/*;q=0.8",
            **(headers or {}),
        },
    )
    response.raise_for_status()
    payload = response.json()
    write_json(cache_path, payload)
    return payload


def run_sparql_query(query: str, cache_path: Path, refresh: bool = False) -> Any:
    if cache_path.exists() and not refresh:
        return json.loads(cache_path.read_text(encoding="utf-8"))
    if SPARQLWrapper is None:
        raise RuntimeError("SPARQLWrapper is not installed.")
    wrapper = SPARQLWrapper("https://query.wikidata.org/sparql", agent=USER_AGENT)
    wrapper.setQuery(query)
    wrapper.setReturnFormat(SPARQL_JSON)
    wrapper.addCustomHttpHeader("Accept", "application/sparql-results+json")
    payload = wrapper.query().convert()
    write_json(cache_path, payload)
    return payload


def clean_foodon_literal(value: str) -> str:
    text = normalize_whitespace(value)
    if text.startswith('"') and '"@' in text:
        text = text[1:text.rfind('"@')]
    elif text.startswith('"') and text.endswith('"'):
        text = text[1:-1]
    elif text.endswith("@en"):
        text = text[:-3]
    return normalize_whitespace(text)


def qid_from_uri(uri: str | None) -> str | None:
    if not uri:
        return None
    tail = uri.rstrip("/").rsplit("/", 1)[-1]
    return tail if re.fullmatch(r"Q\d+", tail) else None


def uri_to_foodon_id(uri: str | None) -> str | None:
    if not uri:
        return None
    uri = uri.strip("<>")
    match = re.search(r"/([^/]+)$", uri)
    return match.group(1) if match else None


def get_binding_value(binding: dict[str, Any], key: str) -> str | None:
    slot = binding.get(key)
    if not slot:
        return None
    return slot.get("value")


def append_alias(
    aliases: list[dict[str, Any]],
    seen: set[tuple[str, str, str]],
    entity_type: str,
    entity_id: str,
    alias: str,
    source_id: str | None,
    is_preferred: bool = False,
) -> None:
    cleaned = normalize_whitespace(alias)
    normalized_alias = normalize_name(cleaned)
    if not cleaned or not normalized_alias:
        return
    key = (entity_type, entity_id, normalized_alias)
    if key in seen:
        return
    seen.add(key)
    aliases.append(
        {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "alias": cleaned,
            "normalized_alias": normalized_alias,
            "language_code": "en",
            "source_id": source_id,
            "is_preferred": is_preferred,
        }
    )


def append_provenance(
    provenance_rows: list[dict[str, Any]],
    entity_type: str,
    entity_id: str,
    source_id: str | None,
    source_url: str | None,
    source_record_id: str | None,
    source_title: str | None,
    extraction_method: str | None,
    extraction_confidence: float | None,
    license_text: str | None,
    raw_payload: Any,
) -> None:
    provenance_rows.append(
        {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "source_id": source_id,
            "source_url": source_url,
            "source_record_id": source_record_id,
            "source_title": source_title,
            "extraction_method": extraction_method,
            "extraction_confidence": f"{extraction_confidence:.3f}" if extraction_confidence is not None else "",
            "license": license_text or "",
            "retrieved_at": GENERATED_AT,
            "raw_hash": json_hash(raw_payload),
            "raw_payload": raw_payload,
        }
    )


def canonical_category_slug(name: str) -> str:
    return slugify(name)


def build_category_rows() -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    rows: list[dict[str, Any]] = []
    lookup: dict[str, dict[str, Any]] = {}
    sort_order = 10
    for parent_name, children in CATEGORY_TREE:
        parent_slug = canonical_category_slug(parent_name)
        parent_id = stable_id("cat", parent_slug, "parent")
        parent_source_title = CATEGORY_SOURCE_TITLE.get(parent_name, "Lists of prepared foods")
        parent_row = {
            "id": parent_id,
            "slug": parent_slug,
            "name": parent_name,
            "normalized_name": normalize_name(parent_name),
            "description": f"Reusable structural bucket for {parent_name.lower()} in the starter taxonomy.",
            "category_kind": "structural-parent",
            "parent_category_id": "",
            "wikidata_qid": "",
            "wikipedia_title": parent_source_title,
            "dbpedia_uri": "",
            "sort_order": sort_order,
            "created_at": GENERATED_AT,
            "updated_at": GENERATED_AT,
        }
        rows.append(parent_row)
        lookup[parent_name] = parent_row
        lookup[parent_slug] = parent_row
        sort_order += 10
        child_order = 1
        for child_name in children:
            child_slug = canonical_category_slug(child_name)
            child_row = {
                "id": stable_id("cat", child_slug, parent_slug),
                "slug": child_slug,
                "name": child_name,
                "normalized_name": normalize_name(child_name),
                "description": f"Subtype of {parent_name.lower()} covering {child_name.lower()}.",
                "category_kind": "structural-child",
                "parent_category_id": parent_id,
                "wikidata_qid": "",
                "wikipedia_title": parent_source_title,
                "dbpedia_uri": "",
                "sort_order": sort_order + child_order,
                "created_at": GENERATED_AT,
                "updated_at": GENERATED_AT,
            }
            rows.append(child_row)
            lookup[child_name] = child_row
            lookup[child_slug] = child_row
            child_order += 1
    return rows, lookup


def harvest_wikipedia_pages(refresh: bool = False) -> tuple[dict[str, Any], dict[str, set[str]]]:
    page_payloads: dict[str, Any] = {}
    dish_membership: dict[str, set[str]] = defaultdict(set)
    for url in WIKIPEDIA_SEED_PAGES:
        page_title = parse_wikipedia_title(url)
        api_url = (
            "https://en.wikipedia.org/w/api.php?action=parse"
            f"&page={quote(page_title.replace(' ', '_'))}"
            "&prop=text|links|categories|sections&format=json"
        )
        cache_path = RAW_DIRS["wikipedia"] / f"{slugify(page_title)}.json"
        payload = fetch_json(api_url, cache_path, refresh=refresh)
        parse = payload.get("parse", {})
        html = parse.get("text", {}).get("*", "")
        soup = BeautifulSoup(html, "html.parser")
        list_items: list[dict[str, str]] = []
        for li in soup.select(".mw-parser-output li"):
            if li.find_parent(class_=lambda value: value and any(
                token in " ".join(value) if isinstance(value, list) else token in str(value)
                for token in ("navbox", "toc", "thumb", "hatnote", "reflist", "infobox", "metadata")
            )):
                continue
            text = normalize_whitespace(li.get_text(" ", strip=True))
            first_link = li.find("a")
            link_title = normalize_whitespace(first_link.get("title", "")) if first_link else ""
            if len(text) < 2 or len(text) > 120:
                continue
            if any(marker in text for marker in ("[", "]")):
                continue
            list_items.append({"text": text, "link_title": link_title})
            if page_title in LIST_PAGE_CATEGORY_MAP and link_title:
                dish_membership[normalize_name(link_title)].add(LIST_PAGE_CATEGORY_MAP[page_title])
        parse["extracted_list_items"] = list_items
        parse["source_url"] = url
        page_payloads[page_title] = parse
    return page_payloads, dish_membership


def harvest_wikidata(refresh: bool = False, limit: int = 2400) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    cuisines_query = """
SELECT DISTINCT ?cuisine ?cuisineLabel WHERE {
  ?cuisine wdt:P31/wdt:P279* wd:Q1778821 .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?cuisineLabel
"""
    dishes_query = f"""
SELECT DISTINCT ?dish ?dishLabel ?originLabel ?cuisineLabel ?article WHERE {{
  ?dish wdt:P31/wdt:P279* wd:Q746549 .
  ?article schema:about ?dish ;
           schema:isPartOf <https://en.wikipedia.org/> .
  OPTIONAL {{ ?dish wdt:P495 ?origin . }}
  OPTIONAL {{ ?dish wdt:P2012 ?cuisine . }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
LIMIT {limit}
"""
    cuisine_payload = run_sparql_query(cuisines_query, RAW_DIRS["wikidata"] / "cuisines.json", refresh=refresh)
    dish_payload = run_sparql_query(dishes_query, RAW_DIRS["wikidata"] / "dishes.json", refresh=refresh)
    cuisine_rows = cuisine_payload.get("results", {}).get("bindings", [])
    dish_rows = dish_payload.get("results", {}).get("bindings", [])
    return cuisine_rows, dish_rows


def harvest_mealdb(refresh: bool = False) -> dict[str, Any]:
    endpoints = {
        "categories": "https://www.themealdb.com/api/json/v1/1/categories.php",
        "category-list": "https://www.themealdb.com/api/json/v1/1/list.php?c=list",
        "area-list": "https://www.themealdb.com/api/json/v1/1/list.php?a=list",
        "ingredient-list": "https://www.themealdb.com/api/json/v1/1/list.php?i=list",
    }
    payloads = {}
    for name, url in endpoints.items():
        payloads[name] = fetch_json(url, RAW_DIRS["mealdb"] / f"{name}.json", refresh=refresh)
    return payloads


def harvest_dbpedia(names: list[str], refresh: bool = False, limit: int = DBPEDIA_LOOKUP_LIMIT) -> dict[str, str]:
    resolved: dict[str, str] = {}
    for name in names[:limit]:
        lookup_url = f"https://lookup.dbpedia.org/api/search?format=JSON&query={quote(name)}"
        cache_path = RAW_DIRS["dbpedia"] / f"{slugify(name)}.json"
        try:
            payload = fetch_json(
                lookup_url,
                cache_path,
                refresh=refresh,
                headers={"Accept": "application/json"},
                timeout=12,
            )
        except Exception:
            continue
        docs = payload.get("docs") or []
        if not docs:
            continue
        first = docs[0]
        label = normalize_name(first.get("label", ""))
        if label == normalize_name(name):
            uri = (first.get("resource") or [""])[0]
            if uri:
                resolved[name] = uri
    return resolved


def harvest_foodon(refresh: bool = False, parse_owl: bool = True) -> tuple[dict[str, Any], dict[str, str], dict[str, list[str]]]:
    synonyms_url = "https://raw.githubusercontent.com/FoodOntology/foodon/master/foodon-synonyms.tsv"
    owl_url = "https://raw.githubusercontent.com/FoodOntology/foodon/master/foodon.owl"
    synonyms_path = RAW_DIRS["foodon"] / "foodon-synonyms.tsv"
    owl_path = RAW_DIRS["foodon"] / "foodon.owl"
    synonyms_text = fetch_text(synonyms_url, synonyms_path, refresh=refresh)
    if parse_owl:
        try:
            fetch_text(owl_url, owl_path, refresh=refresh)
        except Exception:
            parse_owl = False

    records: dict[str, dict[str, Any]] = {}
    label_to_id: dict[str, str] = {}
    synonym_map: dict[str, list[str]] = defaultdict(list)
    reader = csv.reader(synonyms_text.splitlines(), delimiter="\t")
    next(reader, None)
    for row in reader:
        if len(row) < 4:
            continue
        class_uri, parent_uri, type_value, label_value = row[:4]
        if "FOODON_" not in class_uri:
            continue
        foodon_id = uri_to_foodon_id(class_uri)
        if not foodon_id:
            continue
        record = records.setdefault(
            foodon_id,
            {"foodon_id": foodon_id, "class_uri": class_uri, "parent_uri": parent_uri or "", "label": "", "synonyms": []},
        )
        literal = clean_foodon_literal(label_value)
        if not literal:
            continue
        if normalize_whitespace(type_value).strip('"') == "label":
            record["label"] = literal
            label_to_id[normalize_name(literal)] = foodon_id
        else:
            if literal not in record["synonyms"]:
                record["synonyms"].append(literal)
                synonym_map[normalize_name(literal)].append(foodon_id)

    if parse_owl and rdflib is not None:
        try:
            graph = rdflib.Graph()
            graph.parse(str(owl_path))
            for subject, _, label in graph.triples((None, RDFS.label, None)):
                subject_text = str(subject)
                if "FOODON_" not in subject_text:
                    continue
                foodon_id = uri_to_foodon_id(subject_text)
                if not foodon_id:
                    continue
                label_text = normalize_whitespace(label)
                if not label_text:
                    continue
                record = records.setdefault(
                    foodon_id,
                    {"foodon_id": foodon_id, "class_uri": subject_text, "parent_uri": "", "label": "", "synonyms": []},
                )
                if not record["label"]:
                    record["label"] = label_text
                label_to_id.setdefault(normalize_name(label_text), foodon_id)
        except Exception:
            pass

    return records, label_to_id, synonym_map


def build_cuisine_rows(
    wikidata_cuisine_bindings: list[dict[str, Any]],
    dbpedia_lookup: dict[str, str],
    aliases: list[dict[str, Any]],
    alias_seen: set[tuple[str, str, str]],
    provenance_rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    wikidata_by_label = {}
    for binding in wikidata_cuisine_bindings:
        label = get_binding_value(binding, "cuisineLabel") or ""
        qid = qid_from_uri(get_binding_value(binding, "cuisine"))
        if not label or not qid:
            continue
        normalized = normalize_name(label)
        wikidata_by_label[normalized] = qid
        wikidata_by_label[re.sub(r"\s+cuisine$", "", normalized)] = qid
    rows = []
    for index, (name, region) in enumerate(STARTER_CUISINES, start=1):
        normalized = normalize_name(name)
        qid = wikidata_by_label.get(normalized) or ""
        cuisine_id = f"cui-wd-{qid.lower()}" if qid else stable_id("cui", name, region)
        row = {
            "id": cuisine_id,
            "slug": slugify(name),
            "name": name,
            "normalized_name": normalized,
            "description": f"{name} cuisine starter node sourced from English-language canonical taxonomy references.",
            "region": region,
            "wikidata_qid": qid,
            "wikipedia_title": f"{name} cuisine" if name != "Mediterranean" else "Mediterranean cuisine",
            "dbpedia_uri": dbpedia_lookup.get(name, ""),
            "sort_order": index,
            "created_at": GENERATED_AT,
            "updated_at": GENERATED_AT,
        }
        rows.append(row)
        append_alias(aliases, alias_seen, "cuisine", cuisine_id, name, "src-wikipedia-en", True)
        append_provenance(
            provenance_rows,
            "cuisine",
            cuisine_id,
            "src-wikipedia-en",
            wikipedia_page_url(row["wikipedia_title"]),
            row["wikipedia_title"],
            "List of cuisines",
            "mediawiki-api-and-html",
            0.950,
            "CC BY-SA 4.0",
            row,
        )
        if qid:
            append_provenance(
                provenance_rows,
                "cuisine",
                cuisine_id,
                "src-wikidata",
                wikidata_entity_url(qid),
                qid,
                name,
                "sparql",
                0.980,
                "CC0 1.0",
                {"qid": qid, "label": name},
            )
    return rows


def guess_cuisine_id(
    name: str,
    cuisine_label: str | None,
    origin_label: str | None,
    cuisine_rows: list[dict[str, Any]],
) -> str | None:
    cuisine_by_name = {normalize_name(row["name"]): row["id"] for row in cuisine_rows}
    for candidate in (cuisine_label, origin_label, name):
        normalized = normalize_name(candidate or "")
        if normalized in cuisine_by_name:
            return cuisine_by_name[normalized]
        mapped = COUNTRY_TO_CUISINE.get(normalized)
        if mapped and normalize_name(mapped) in cuisine_by_name:
            return cuisine_by_name[normalize_name(mapped)]
    return None


def guess_category_id(
    dish_name: str,
    wikipedia_title: str | None,
    dish_membership: dict[str, set[str]],
    category_lookup: dict[str, dict[str, Any]],
) -> str | None:
    membership = dish_membership.get(normalize_name(wikipedia_title or dish_name)) or dish_membership.get(normalize_name(dish_name))
    if membership:
        category_name = sorted(membership)[0]
        category_row = category_lookup.get(category_name)
        if category_row:
            return category_row["id"]
    normalized_name = normalize_name(dish_name)
    for pattern, category_name in CATEGORY_REGEX_RULES:
        if re.search(pattern, normalized_name):
            category_row = category_lookup.get(category_name)
            if category_row:
                return category_row["id"]
    return None


def description_for_dish(dish_name: str, origin_label: str | None, cuisine_label: str | None) -> str:
    parts = [f"Canonical starter dish entry for {dish_name}."]
    if cuisine_label:
        parts.append(f"Associated cuisine: {cuisine_label}.")
    if origin_label and origin_label != cuisine_label:
        parts.append(f"Origin: {origin_label}.")
    parts.append("Seeded from Wikidata with an English Wikipedia sitelink.")
    return " ".join(parts)


def add_manual_ingredient(
    ingredient_rows: list[dict[str, Any]],
    ingredient_lookup: dict[str, dict[str, Any]],
    aliases: list[dict[str, Any]],
    alias_seen: set[tuple[str, str, str]],
    provenance_rows: list[dict[str, Any]],
    name: str,
    ingredient_kind: str = "manual-core",
) -> dict[str, Any]:
    normalized = normalize_name(name)
    existing = ingredient_lookup.get(normalized)
    if existing:
        return existing
    row = {
        "id": stable_id("ing", name, ingredient_kind),
        "slug": slugify(name),
        "name": name,
        "normalized_name": normalized,
        "description": "Curated canonical ingredient used to anchor dish-family relationships.",
        "ingredient_kind": ingredient_kind,
        "foodon_id": "",
        "wikidata_qid": "",
        "wikipedia_title": "",
        "dbpedia_uri": "",
        "created_at": GENERATED_AT,
        "updated_at": GENERATED_AT,
    }
    ingredient_rows.append(row)
    ingredient_lookup[normalized] = row
    append_alias(aliases, alias_seen, "ingredient", row["id"], name, "src-wikipedia-en", True)
    append_provenance(
        provenance_rows,
        "ingredient",
        row["id"],
        "src-wikipedia-en",
        "",
        "",
        "Lists of foods",
        "manual-canonical-seed",
        0.700,
        "CC BY-SA 4.0",
        row,
    )
    return row


def build_ingredient_rows(
    mealdb_payloads: dict[str, Any],
    foodon_records: dict[str, Any],
    foodon_label_map: dict[str, str],
    foodon_synonym_map: dict[str, list[str]],
    aliases: list[dict[str, Any]],
    alias_seen: set[tuple[str, str, str]],
    provenance_rows: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    rows: list[dict[str, Any]] = []
    lookup: dict[str, dict[str, Any]] = {}
    meals = mealdb_payloads.get("ingredient-list", {}).get("meals") or []
    for item in meals:
        name = normalize_whitespace(item.get("strIngredient"))
        if not name:
            continue
        normalized = normalize_name(name)
        foodon_id = foodon_label_map.get(normalized)
        row = {
            "id": f"ing-mealdb-{item.get('idIngredient')}",
            "slug": slugify(name),
            "name": name,
            "normalized_name": normalized,
            "description": normalize_whitespace(item.get("strDescription"))[:600],
            "ingredient_kind": normalize_whitespace(item.get("strType")) or "mealdb-ingredient",
            "foodon_id": foodon_id or "",
            "wikidata_qid": "",
            "wikipedia_title": "",
            "dbpedia_uri": "",
            "created_at": GENERATED_AT,
            "updated_at": GENERATED_AT,
        }
        rows.append(row)
        lookup[normalized] = row
        append_alias(aliases, alias_seen, "ingredient", row["id"], name, "src-mealdb", True)
        append_provenance(
            provenance_rows,
            "ingredient",
            row["id"],
            "src-mealdb",
            "https://www.themealdb.com/api/json/v1/1/list.php?i=list",
            str(item.get("idIngredient")),
            name,
            "json-api",
            0.900,
            "TheMealDB API terms apply",
            item,
        )
        if foodon_id and foodon_id in foodon_records:
            append_provenance(
                provenance_rows,
                "ingredient",
                row["id"],
                "src-foodon",
                "https://foodon.org/",
                foodon_id,
                foodon_records[foodon_id].get("label") or name,
                "owl-and-tsv",
                0.850,
                "CC BY 4.0",
                foodon_records[foodon_id],
            )
            for synonym in foodon_records[foodon_id].get("synonyms", [])[:3]:
                append_alias(aliases, alias_seen, "ingredient", row["id"], synonym, "src-foodon")

    def is_foodon_ingredient_candidate(normalized: str) -> bool:
        blocked = (
            "container", "process", "carcass", "family", "made product", "material", "organism", "plant",
            "product", "food source", "amphibian", "package", "equipment", "carafe", "resin",
        )
        if not normalized or normalized.endswith(" en"):
            return False
        return not any(token in normalized for token in blocked)

    def foodon_score(record: dict[str, Any]) -> tuple[int, int, str]:
        label = normalize_whitespace(record.get("label"))
        normalized = normalize_name(label)
        generic_penalty = 0 if is_foodon_ingredient_candidate(normalized) else 1
        length_penalty = 1 if len(normalized.split()) > 4 else 0
        return (generic_penalty, length_penalty, normalized)

    sorted_foodon = sorted(foodon_records.values(), key=foodon_score)
    for record in sorted_foodon:
        if len(rows) >= 1050:
            break
        label = normalize_whitespace(record.get("label"))
        if not label:
            continue
        normalized = normalize_name(label)
        if not normalized or normalized in lookup:
            continue
        if not is_foodon_ingredient_candidate(normalized):
            continue
        row = {
            "id": f"ing-foodon-{record['foodon_id'].lower()}",
            "slug": slugify(label),
            "name": label,
            "normalized_name": normalized,
            "description": "FoodOn ingredient or food product class used for normalization.",
            "ingredient_kind": "foodon-product",
            "foodon_id": record["foodon_id"],
            "wikidata_qid": "",
            "wikipedia_title": "",
            "dbpedia_uri": "",
            "created_at": GENERATED_AT,
            "updated_at": GENERATED_AT,
        }
        rows.append(row)
        lookup[normalized] = row
        append_alias(aliases, alias_seen, "ingredient", row["id"], label, "src-foodon", True)
        for synonym in record.get("synonyms", [])[:3]:
            append_alias(aliases, alias_seen, "ingredient", row["id"], synonym, "src-foodon")
        append_provenance(
            provenance_rows,
            "ingredient",
            row["id"],
            "src-foodon",
            "https://foodon.org/",
            record["foodon_id"],
            label,
            "owl-and-tsv",
            0.820,
            "CC BY 4.0",
            record,
        )
    return rows, lookup


def build_technique_rows(
    foodon_records: dict[str, Any],
    foodon_label_map: dict[str, str],
    foodon_synonym_map: dict[str, list[str]],
    aliases: list[dict[str, Any]],
    alias_seen: set[tuple[str, str, str]],
    provenance_rows: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    rows = []
    lookup = {}
    for group_name, names in TECHNIQUE_GROUPS.items():
        for name in names:
            display_name = normalize_whitespace(name).replace("poach-prep", "poach prep")
            normalized = normalize_name(display_name)
            foodon_id = foodon_label_map.get(normalized)
            if not foodon_id:
                foodon_ids = foodon_synonym_map.get(normalized) or []
                foodon_id = foodon_ids[0] if foodon_ids else ""
            row = {
                "id": stable_id("tec", display_name, group_name),
                "slug": slugify(display_name),
                "name": display_name.title() if display_name == display_name.lower() else display_name,
                "normalized_name": normalized,
                "description": f"{group_name.replace('-', ' ').title()} technique used to normalize graph relationships.",
                "technique_kind": group_name,
                "foodon_id": foodon_id or "",
                "wikidata_qid": "",
                "wikipedia_title": "",
                "dbpedia_uri": "",
                "created_at": GENERATED_AT,
                "updated_at": GENERATED_AT,
            }
            rows.append(row)
            lookup[normalized] = row
            append_alias(aliases, alias_seen, "technique", row["id"], row["name"], "src-foodon" if foodon_id else "src-wikipedia-en", True)
            append_provenance(
                provenance_rows,
                "technique",
                row["id"],
                "src-foodon" if foodon_id else "src-wikipedia-en",
                "https://foodon.org/" if foodon_id else wikipedia_page_url("Lists of prepared foods"),
                foodon_id or row["slug"],
                row["name"],
                "owl-and-tsv" if foodon_id else "manual-canonical-seed",
                0.780 if foodon_id else 0.680,
                "CC BY 4.0" if foodon_id else "CC BY-SA 4.0",
                foodon_records.get(foodon_id, row) if foodon_id else row,
            )
    return rows, lookup


def build_family_and_dish_rows(
    dish_bindings: list[dict[str, Any]],
    cuisine_rows: list[dict[str, Any]],
    category_lookup: dict[str, dict[str, Any]],
    dish_membership: dict[str, set[str]],
    dbpedia_lookup: dict[str, str],
    aliases: list[dict[str, Any]],
    alias_seen: set[tuple[str, str, str]],
    provenance_rows: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    family_rows = []
    dish_rows = []
    variations = []
    family_categories = []
    family_cuisines = []

    seen_candidates: set[tuple[str, str, str, str]] = set()
    sorted_bindings = sorted(
        dish_bindings,
        key=lambda binding: normalize_name(get_binding_value(binding, "dishLabel") or ""),
    )
    for rank, binding in enumerate(sorted_bindings, start=1):
        name = normalize_whitespace(get_binding_value(binding, "dishLabel"))
        dish_uri = get_binding_value(binding, "dish")
        qid = qid_from_uri(dish_uri)
        wikipedia_article = get_binding_value(binding, "article") or ""
        wikipedia_title = unquote(wikipedia_article.rsplit("/", 1)[-1]).replace("_", " ") if wikipedia_article else ""
        origin_label = normalize_whitespace(get_binding_value(binding, "originLabel"))
        cuisine_label = normalize_whitespace(get_binding_value(binding, "cuisineLabel"))
        category_id = guess_category_id(name, wikipedia_title or name, dish_membership, category_lookup)
        cuisine_id = guess_cuisine_id(name, cuisine_label, origin_label, cuisine_rows)
        key = (qid, "", "", "") if qid else ("", normalize_name(name), category_id or "", cuisine_id or "")
        if key in seen_candidates:
            continue
        seen_candidates.add(key)

        family_id = f"fam-wd-{qid.lower()}" if qid else stable_id("fam", name, wikipedia_title)
        dish_id = f"dish-wd-{qid.lower()}" if qid else stable_id("dish", name, wikipedia_title)
        dbpedia_uri = dbpedia_lookup.get(name, "")
        family_row = {
            "id": family_id,
            "slug": slugify(name),
            "name": name,
            "normalized_name": normalize_name(name),
            "description": description_for_dish(name, origin_label or None, cuisine_label or None),
            "primary_category_id": category_id or "",
            "primary_cuisine_id": cuisine_id or "",
            "wikidata_qid": qid or "",
            "wikipedia_title": wikipedia_title,
            "dbpedia_uri": dbpedia_uri,
            "popularity_rank": rank,
            "created_at": GENERATED_AT,
            "updated_at": GENERATED_AT,
        }
        dish_row = {
            "id": dish_id,
            "slug": slugify(name),
            "name": name,
            "normalized_name": normalize_name(name),
            "description": description_for_dish(name, origin_label or None, cuisine_label or None),
            "dish_family_id": family_id,
            "primary_category_id": category_id or "",
            "primary_cuisine_id": cuisine_id or "",
            "wikidata_qid": qid or "",
            "wikipedia_title": wikipedia_title,
            "dbpedia_uri": dbpedia_uri,
            "origin_text": origin_label,
            "is_notable": True,
            "created_at": GENERATED_AT,
            "updated_at": GENERATED_AT,
        }
        family_rows.append(family_row)
        dish_rows.append(dish_row)
        if category_id:
            family_categories.append({"dish_family_id": family_id, "category_id": category_id, "is_primary": True})
        if cuisine_id:
            family_cuisines.append({"dish_family_id": family_id, "cuisine_id": cuisine_id, "relation_kind": "associated"})

        source_id = "src-wikidata" if qid else "src-wikipedia-en"
        source_url = wikidata_entity_url(qid) if qid else wikipedia_page_url(wikipedia_title or name)
        variations.append(
            {
                "id": stable_id("var", name, qid or wikipedia_title),
                "slug": slugify(name),
                "name": name,
                "normalized_name": normalize_name(name),
                "description": "Canonical reference variation anchored to the source-backed dish record.",
                "dish_id": dish_id,
                "parent_variation_id": "",
                "variation_type": "canonical_reference",
                "source_id": source_id,
                "source_url": source_url,
                "attribution_text": "Canonical starter reference",
                "author_name": "",
                "location_text": origin_label,
                "is_canonical": True,
                "created_at": GENERATED_AT,
                "updated_at": GENERATED_AT,
            }
        )
        append_alias(aliases, alias_seen, "dish_family", family_id, name, source_id, True)
        append_alias(aliases, alias_seen, "dish", dish_id, name, source_id, True)
        if wikipedia_title and wikipedia_title != name:
            append_alias(aliases, alias_seen, "dish_family", family_id, wikipedia_title, "src-wikipedia-en")
            append_alias(aliases, alias_seen, "dish", dish_id, wikipedia_title, "src-wikipedia-en")
        append_provenance(
            provenance_rows,
            "dish_family",
            family_id,
            source_id,
            source_url,
            qid or wikipedia_title or name,
            wikipedia_title or name,
            "sparql" if qid else "mediawiki-api-and-html",
            0.980 if qid else 0.900,
            "CC0 1.0" if qid else "CC BY-SA 4.0",
            binding,
        )
        append_provenance(
            provenance_rows,
            "dish",
            dish_id,
            source_id,
            source_url,
            qid or wikipedia_title or name,
            wikipedia_title or name,
            "sparql" if qid else "mediawiki-api-and-html",
            0.980 if qid else 0.900,
            "CC0 1.0" if qid else "CC BY-SA 4.0",
            binding,
        )
    return family_rows, dish_rows, variations, family_categories, family_cuisines


def supplement_from_wikipedia_lists(
    wikipedia_payloads: dict[str, Any],
    cuisine_rows: list[dict[str, Any]],
    category_lookup: dict[str, dict[str, Any]],
    aliases: list[dict[str, Any]],
    alias_seen: set[tuple[str, str, str]],
    provenance_rows: list[dict[str, Any]],
    family_rows: list[dict[str, Any]],
    dish_rows: list[dict[str, Any]],
    variation_rows: list[dict[str, Any]],
    family_category_rows: list[dict[str, Any]],
    family_cuisine_rows: list[dict[str, Any]],
    max_additional: int = 200,
) -> None:
    existing_names = {row["normalized_name"] for row in dish_rows}
    additions = 0
    american_cuisine_id = next((row["id"] for row in cuisine_rows if row["name"] == "American"), "")
    for page_title, page in wikipedia_payloads.items():
        if page_title not in LIST_PAGE_CATEGORY_MAP or additions >= max_additional:
            continue
        category_name = LIST_PAGE_CATEGORY_MAP[page_title]
        category_id = category_lookup[category_name]["id"]
        for item in page.get("extracted_list_items", []):
            if additions >= max_additional:
                break
            display_name = normalize_whitespace(item.get("link_title"))
            if not display_name or len(display_name) > 80:
                continue
            normalized_display = normalize_name(display_name)
            if any(marker in normalized_display for marker in ("list of", "history of", "outline of", "cuisine of")):
                continue
            if normalized_display.endswith(" cuisine") or normalized_display in {"national dish"}:
                continue
            if ":" in display_name or "page does not exist" in normalized_display:
                continue
            if any(marker in normalized_display for marker in (" in the united states", " style", " dishes", "traditional food", "soul food")):
                continue
            normalized = normalized_display
            if not normalized or normalized in existing_names:
                continue
            existing_names.add(normalized)
            cuisine_id = american_cuisine_id if page_title == "List of regional dishes of the United States" else ""
            family_id = stable_id("fam", display_name, page_title)
            dish_id = stable_id("dish", display_name, page_title)
            family_rows.append(
                {
                    "id": family_id,
                    "slug": slugify(display_name),
                    "name": display_name,
                    "normalized_name": normalized,
                    "description": f"Canonical starter dish family seeded from the English Wikipedia page {page_title}.",
                    "primary_category_id": category_id,
                    "primary_cuisine_id": cuisine_id,
                    "wikidata_qid": "",
                    "wikipedia_title": display_name,
                    "dbpedia_uri": "",
                    "popularity_rank": len(family_rows) + 1,
                    "created_at": GENERATED_AT,
                    "updated_at": GENERATED_AT,
                }
            )
            dish_rows.append(
                {
                    "id": dish_id,
                    "slug": slugify(display_name),
                    "name": display_name,
                    "normalized_name": normalized,
                    "description": f"Canonical starter dish entry seeded from the English Wikipedia page {page_title}.",
                    "dish_family_id": family_id,
                    "primary_category_id": category_id,
                    "primary_cuisine_id": cuisine_id,
                    "wikidata_qid": "",
                    "wikipedia_title": display_name,
                    "dbpedia_uri": "",
                    "origin_text": "",
                    "is_notable": True,
                    "created_at": GENERATED_AT,
                    "updated_at": GENERATED_AT,
                }
            )
            variation_rows.append(
                {
                    "id": stable_id("var", display_name, page_title),
                    "slug": slugify(display_name),
                    "name": display_name,
                    "normalized_name": normalized,
                    "description": "Canonical reference variation anchored to the English Wikipedia starter list.",
                    "dish_id": dish_id,
                    "parent_variation_id": "",
                    "variation_type": "canonical_reference",
                    "source_id": "src-wikipedia-en",
                    "source_url": wikipedia_page_url(display_name),
                    "attribution_text": "Canonical starter reference",
                    "author_name": "",
                    "location_text": "",
                    "is_canonical": True,
                    "created_at": GENERATED_AT,
                    "updated_at": GENERATED_AT,
                }
            )
            family_category_rows.append({"dish_family_id": family_id, "category_id": category_id, "is_primary": True})
            if cuisine_id:
                family_cuisine_rows.append({"dish_family_id": family_id, "cuisine_id": cuisine_id, "relation_kind": "associated"})
            append_alias(aliases, alias_seen, "dish_family", family_id, display_name, "src-wikipedia-en", True)
            append_alias(aliases, alias_seen, "dish", dish_id, display_name, "src-wikipedia-en", True)
            append_provenance(
                provenance_rows,
                "dish_family",
                family_id,
                "src-wikipedia-en",
                wikipedia_page_url(display_name),
                display_name,
                page_title,
                "mediawiki-api-and-html",
                0.880,
                "CC BY-SA 4.0",
                item,
            )
            append_provenance(
                provenance_rows,
                "dish",
                dish_id,
                "src-wikipedia-en",
                wikipedia_page_url(display_name),
                display_name,
                page_title,
                "mediawiki-api-and-html",
                0.880,
                "CC BY-SA 4.0",
                item,
            )
            additions += 1


def build_family_feature_links(
    family_rows: list[dict[str, Any]],
    category_rows: list[dict[str, Any]],
    cuisine_rows: list[dict[str, Any]],
    ingredient_rows: list[dict[str, Any]],
    ingredient_lookup: dict[str, dict[str, Any]],
    technique_lookup: dict[str, dict[str, Any]],
    aliases: list[dict[str, Any]],
    alias_seen: set[tuple[str, str, str]],
    provenance_rows: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    category_by_id = {row["id"]: row for row in category_rows}
    cuisine_by_id = {row["id"]: row for row in cuisine_rows}
    ingredient_links = []
    technique_links = []
    dish_relations = []

    for family in family_rows:
        category_name = category_by_id.get(family["primary_category_id"], {}).get("name")
        cuisine_name = cuisine_by_id.get(family["primary_cuisine_id"], {}).get("name")
        ingredients = list(CATEGORY_TO_INGREDIENTS.get(category_name, []))
        techniques = list(CATEGORY_TO_TECHNIQUES.get(category_name, []))
        ingredients.extend(CUISINE_TO_INGREDIENTS.get(cuisine_name, []))
        techniques.extend(CUISINE_TO_TECHNIQUES.get(cuisine_name, []))

        seen_ingredients = set()
        for offset, ingredient_name in enumerate(ingredients[:5]):
            ingredient = add_manual_ingredient(
                ingredient_rows,
                ingredient_lookup,
                aliases,
                alias_seen,
                provenance_rows,
                ingredient_name,
            )
            if ingredient["id"] in seen_ingredients:
                continue
            seen_ingredients.add(ingredient["id"])
            ingredient_links.append(
                {
                    "dish_family_id": family["id"],
                    "ingredient_id": ingredient["id"],
                    "role": "core" if offset < 2 else "supporting",
                    "is_core": offset < 2,
                    "weight": f"{max(0.300, 1.0 - offset * 0.120):.3f}",
                }
            )

        seen_techniques = set()
        for offset, technique_name in enumerate(techniques[:4]):
            normalized = normalize_name(technique_name)
            technique = technique_lookup.get(normalized)
            if not technique or technique["id"] in seen_techniques:
                continue
            seen_techniques.add(technique["id"])
            technique_links.append(
                {
                    "dish_family_id": family["id"],
                    "technique_id": technique["id"],
                    "role": "core" if offset < 2 else "supporting",
                    "is_core": offset < 2,
                    "weight": f"{max(0.300, 1.0 - offset * 0.150):.3f}",
                }
            )

    families_by_category = defaultdict(list)
    for family in family_rows:
        if family["primary_category_id"]:
            families_by_category[family["primary_category_id"]].append(family)
    for family_list in families_by_category.values():
        family_list.sort(key=lambda item: item["popularity_rank"])
        for left, right in zip(family_list, family_list[1:]):
            dish_relations.append(
                {
                    "from_dish_id": left["id"].replace("fam-", "dish-", 1) if left["id"].startswith("fam-") else stable_id("dish", left["name"]),
                    "to_dish_id": right["id"].replace("fam-", "dish-", 1) if right["id"].startswith("fam-") else stable_id("dish", right["name"]),
                    "relation_type": "same_category_neighbor",
                    "weight": "0.350",
                }
            )
            if len(dish_relations) >= 500:
                break
        if len(dish_relations) >= 500:
            break
    return ingredient_links, technique_links, dish_relations


def build_cuisine_category_rows(
    cuisine_rows: list[dict[str, Any]],
    family_rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    counter: Counter[tuple[str, str]] = Counter()
    for family in family_rows:
        if family["primary_cuisine_id"] and family["primary_category_id"]:
            counter[(family["primary_cuisine_id"], family["primary_category_id"])] += 1
    rows = []
    ordered = sorted(counter.items(), key=lambda item: (-item[1], item[0][0], item[0][1]))
    sort_tracker: dict[str, int] = defaultdict(int)
    for (cuisine_id, category_id), _count in ordered:
        sort_tracker[cuisine_id] += 1
        rows.append({"cuisine_id": cuisine_id, "category_id": category_id, "sort_order": sort_tracker[cuisine_id]})
    return rows


def assign_bigserial_ids(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    assigned = []
    for index, row in enumerate(rows, start=1):
        assigned.append({"id": index, **row})
    return assigned


def build_stage_rows(
    cuisine_rows: list[dict[str, Any]],
    category_rows: list[dict[str, Any]],
    family_rows: list[dict[str, Any]],
    ingredient_rows: list[dict[str, Any]],
    technique_rows: list[dict[str, Any]],
    aliases: list[dict[str, Any]],
) -> None:
    write_csv(
        DATA_STAGE_DIR / "stage_cuisines.csv",
        cuisine_rows,
        ["id", "name", "normalized_name", "region", "wikidata_qid", "wikipedia_title", "dbpedia_uri"],
    )
    write_csv(
        DATA_STAGE_DIR / "stage_categories.csv",
        category_rows,
        ["id", "name", "normalized_name", "category_kind", "parent_category_id", "wikipedia_title"],
    )
    write_csv(
        DATA_STAGE_DIR / "stage_dish_candidates.csv",
        family_rows,
        ["id", "name", "normalized_name", "primary_category_id", "primary_cuisine_id", "wikidata_qid", "wikipedia_title"],
    )
    write_csv(
        DATA_STAGE_DIR / "stage_ingredients.csv",
        ingredient_rows,
        ["id", "name", "normalized_name", "ingredient_kind", "foodon_id"],
    )
    write_csv(
        DATA_STAGE_DIR / "stage_techniques.csv",
        technique_rows,
        ["id", "name", "normalized_name", "technique_kind", "foodon_id"],
    )
    write_csv(
        DATA_STAGE_DIR / "stage_aliases.csv",
        aliases,
        ["entity_type", "entity_id", "alias", "normalized_alias", "language_code", "source_id", "is_preferred"],
    )


def build_graph_exports(
    cuisine_rows: list[dict[str, Any]],
    category_rows: list[dict[str, Any]],
    family_rows: list[dict[str, Any]],
    dish_rows: list[dict[str, Any]],
    variation_rows: list[dict[str, Any]],
    ingredient_rows: list[dict[str, Any]],
    technique_rows: list[dict[str, Any]],
    cuisine_category_rows: list[dict[str, Any]],
    family_category_rows: list[dict[str, Any]],
    family_cuisine_rows: list[dict[str, Any]],
    family_ingredient_rows: list[dict[str, Any]],
    family_technique_rows: list[dict[str, Any]],
    dish_relation_rows: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    nodes = []
    edges = []
    for row in cuisine_rows:
        nodes.append({"id": row["id"], "label": row["name"], "node_type": "cuisine", "parent_id": "", "cuisine_id": row["id"], "category_id": "", "family_id": "", "size_hint": 16})
    for row in category_rows:
        nodes.append({"id": row["id"], "label": row["name"], "node_type": "category", "parent_id": row["parent_category_id"], "cuisine_id": "", "category_id": row["id"], "family_id": "", "size_hint": 11})
    for row in family_rows:
        nodes.append({"id": row["id"], "label": row["name"], "node_type": "dish_family", "parent_id": row["primary_category_id"], "cuisine_id": row["primary_cuisine_id"], "category_id": row["primary_category_id"], "family_id": row["id"], "size_hint": 9})
    for row in dish_rows:
        nodes.append({"id": row["id"], "label": row["name"], "node_type": "dish", "parent_id": row["dish_family_id"], "cuisine_id": row["primary_cuisine_id"], "category_id": row["primary_category_id"], "family_id": row["dish_family_id"], "size_hint": 8})
    for row in variation_rows:
        nodes.append({"id": row["id"], "label": row["name"], "node_type": "variation", "parent_id": row["dish_id"], "cuisine_id": "", "category_id": "", "family_id": "", "size_hint": 6})
    for row in ingredient_rows:
        nodes.append({"id": row["id"], "label": row["name"], "node_type": "ingredient", "parent_id": "", "cuisine_id": "", "category_id": "", "family_id": "", "size_hint": 5})
    for row in technique_rows:
        nodes.append({"id": row["id"], "label": row["name"], "node_type": "technique", "parent_id": "", "cuisine_id": "", "category_id": "", "family_id": "", "size_hint": 4})

    for row in cuisine_category_rows:
        edges.append({"source": row["cuisine_id"], "target": row["category_id"], "edge_type": "cuisine_category", "weight": "1.000"})
    for row in family_category_rows:
        edges.append({"source": row["category_id"], "target": row["dish_family_id"], "edge_type": "category_family", "weight": "1.000"})
    for row in family_cuisine_rows:
        edges.append({"source": row["cuisine_id"], "target": row["dish_family_id"], "edge_type": "cuisine_family", "weight": "0.850"})
    for row in dish_rows:
        edges.append({"source": row["dish_family_id"], "target": row["id"], "edge_type": "family_dish", "weight": "1.000"})
    for row in variation_rows:
        edges.append({"source": row["dish_id"], "target": row["id"], "edge_type": "dish_variation", "weight": "1.000"})
    for row in family_ingredient_rows[:2500]:
        edges.append({"source": row["dish_family_id"], "target": row["ingredient_id"], "edge_type": "family_ingredient", "weight": row["weight"]})
    for row in family_technique_rows[:1500]:
        edges.append({"source": row["dish_family_id"], "target": row["technique_id"], "edge_type": "family_technique", "weight": row["weight"]})
    for row in dish_relation_rows:
        edges.append({"source": row["from_dish_id"], "target": row["to_dish_id"], "edge_type": row["relation_type"], "weight": row["weight"]})

    return nodes, edges


def write_import_sql(path: Path) -> None:
    path.write_text(
        """BEGIN;

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
""",
        encoding="utf-8",
    )


def export_final_bundle(bundle: dict[str, list[dict[str, Any]]]) -> None:
    field_orders = {
        "sources": ["id", "slug", "name", "source_type", "base_url", "license", "terms_url", "extraction_method", "priority_rank", "is_active", "created_at"],
        "cuisines": ["id", "slug", "name", "normalized_name", "description", "region", "wikidata_qid", "wikipedia_title", "dbpedia_uri", "sort_order", "created_at", "updated_at"],
        "categories": ["id", "slug", "name", "normalized_name", "description", "category_kind", "parent_category_id", "wikidata_qid", "wikipedia_title", "dbpedia_uri", "sort_order", "created_at", "updated_at"],
        "cuisine_categories": ["cuisine_id", "category_id", "sort_order"],
        "dish_families": ["id", "slug", "name", "normalized_name", "description", "primary_category_id", "primary_cuisine_id", "wikidata_qid", "wikipedia_title", "dbpedia_uri", "popularity_rank", "created_at", "updated_at"],
        "dish_family_categories": ["dish_family_id", "category_id", "is_primary"],
        "dish_family_cuisines": ["dish_family_id", "cuisine_id", "relation_kind"],
        "dishes": ["id", "slug", "name", "normalized_name", "description", "dish_family_id", "primary_category_id", "primary_cuisine_id", "wikidata_qid", "wikipedia_title", "dbpedia_uri", "origin_text", "is_notable", "created_at", "updated_at"],
        "variations": ["id", "slug", "name", "normalized_name", "description", "dish_id", "parent_variation_id", "variation_type", "source_id", "source_url", "attribution_text", "author_name", "location_text", "is_canonical", "created_at", "updated_at"],
        "ingredients": ["id", "slug", "name", "normalized_name", "description", "ingredient_kind", "foodon_id", "wikidata_qid", "wikipedia_title", "dbpedia_uri", "created_at", "updated_at"],
        "techniques": ["id", "slug", "name", "normalized_name", "description", "technique_kind", "foodon_id", "wikidata_qid", "wikipedia_title", "dbpedia_uri", "created_at", "updated_at"],
        "dish_family_ingredients": ["dish_family_id", "ingredient_id", "role", "is_core", "weight"],
        "dish_family_techniques": ["dish_family_id", "technique_id", "role", "is_core", "weight"],
        "dish_relations": ["from_dish_id", "to_dish_id", "relation_type", "weight"],
        "aliases": ["id", "entity_type", "entity_id", "alias", "normalized_alias", "language_code", "source_id", "is_preferred"],
        "provenance": ["id", "entity_type", "entity_id", "source_id", "source_url", "source_record_id", "source_title", "extraction_method", "extraction_confidence", "license", "retrieved_at", "raw_hash", "raw_payload"],
        "graph_nodes": ["id", "label", "node_type", "parent_id", "cuisine_id", "category_id", "family_id", "size_hint"],
        "graph_edges": ["source", "target", "edge_type", "weight"],
    }
    for table_name, rows in bundle.items():
        if table_name == "recipe_lineage_seed":
            continue
        write_csv(DATA_OUT_DIR / f"{table_name}.csv", rows, field_orders[table_name])
    write_json(DATA_OUT_DIR / "recipe_lineage_seed.json", bundle["recipe_lineage_seed"])
    write_import_sql(DATA_OUT_DIR / "import_recipe_lineage_seed.sql")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh", action="store_true", help="Refetch cached remote source data.")
    parser.add_argument("--skip-foodon-owl", action="store_true", help="Skip parsing the full FoodOn OWL file.")
    parser.add_argument("--wikidata-limit", type=int, default=2400, help="Limit on Wikidata dish candidates.")
    parser.add_argument("--dbpedia-limit", type=int, default=DBPEDIA_LOOKUP_LIMIT, help="Maximum number of DBpedia fallback lookups.")
    args = parser.parse_args()

    ensure_dirs()

    wikipedia_payloads, dish_membership = harvest_wikipedia_pages(refresh=args.refresh)
    wikidata_cuisine_rows, wikidata_dish_rows = harvest_wikidata(refresh=args.refresh, limit=args.wikidata_limit)
    mealdb_payloads = harvest_mealdb(refresh=args.refresh)
    foodon_records, foodon_label_map, foodon_synonym_map = harvest_foodon(
        refresh=args.refresh,
        parse_owl=not args.skip_foodon_owl,
    )

    aliases: list[dict[str, Any]] = []
    alias_seen: set[tuple[str, str, str]] = set()
    provenance_rows: list[dict[str, Any]] = []

    category_rows, category_lookup = build_category_rows()
    notable_dbpedia_names = [name for name, _region in STARTER_CUISINES]
    notable_dbpedia_names.extend(
        [item["text"] for page in wikipedia_payloads.values() for item in page.get("extracted_list_items", [])[:4]]
    )
    dbpedia_lookup = harvest_dbpedia(
        list(dict.fromkeys(notable_dbpedia_names)),
        refresh=args.refresh,
        limit=args.dbpedia_limit,
    )

    cuisine_rows = build_cuisine_rows(wikidata_cuisine_rows, dbpedia_lookup, aliases, alias_seen, provenance_rows)
    ingredient_rows, ingredient_lookup = build_ingredient_rows(
        mealdb_payloads,
        foodon_records,
        foodon_label_map,
        foodon_synonym_map,
        aliases,
        alias_seen,
        provenance_rows,
    )
    technique_rows, technique_lookup = build_technique_rows(
        foodon_records,
        foodon_label_map,
        foodon_synonym_map,
        aliases,
        alias_seen,
        provenance_rows,
    )

    family_rows, dish_rows, variation_rows, family_category_rows, family_cuisine_rows = build_family_and_dish_rows(
        wikidata_dish_rows,
        cuisine_rows,
        category_lookup,
        dish_membership,
        dbpedia_lookup,
        aliases,
        alias_seen,
        provenance_rows,
    )
    supplement_from_wikipedia_lists(
        wikipedia_payloads,
        cuisine_rows,
        category_lookup,
        aliases,
        alias_seen,
        provenance_rows,
        family_rows,
        dish_rows,
        variation_rows,
        family_category_rows,
        family_cuisine_rows,
    )
    family_ingredient_rows, family_technique_rows, dish_relation_rows = build_family_feature_links(
        family_rows,
        category_rows,
        cuisine_rows,
        ingredient_rows,
        ingredient_lookup,
        technique_lookup,
        aliases,
        alias_seen,
        provenance_rows,
    )
    cuisine_category_rows = build_cuisine_category_rows(cuisine_rows, family_rows)

    for category in category_rows:
        source_title = category["wikipedia_title"] or "Lists of prepared foods"
        append_alias(aliases, alias_seen, "category", category["id"], category["name"], "src-wikipedia-en", True)
        append_provenance(
            provenance_rows,
            "category",
            category["id"],
            "src-wikipedia-en",
            wikipedia_page_url(source_title),
            source_title,
            source_title,
            "mediawiki-api-and-html",
            0.860,
            "CC BY-SA 4.0",
            category,
        )

    alias_rows = assign_bigserial_ids(sorted(aliases, key=lambda row: (row["entity_type"], row["entity_id"], row["normalized_alias"])))
    provenance_rows = assign_bigserial_ids(
        sorted(
            provenance_rows,
            key=lambda row: (row["entity_type"], row["entity_id"], row.get("source_id") or "", row.get("source_record_id") or ""),
        )
    )

    build_stage_rows(cuisine_rows, category_rows, family_rows, ingredient_rows, technique_rows, aliases)

    graph_nodes, graph_edges = build_graph_exports(
        cuisine_rows,
        category_rows,
        family_rows,
        dish_rows,
        variation_rows,
        ingredient_rows,
        technique_rows,
        cuisine_category_rows,
        family_category_rows,
        family_cuisine_rows,
        family_ingredient_rows,
        family_technique_rows,
        dish_relation_rows,
    )

    bundle = {
        "sources": SOURCE_ROWS,
        "cuisines": cuisine_rows,
        "categories": category_rows,
        "cuisine_categories": cuisine_category_rows,
        "dish_families": family_rows,
        "dish_family_categories": family_category_rows,
        "dish_family_cuisines": family_cuisine_rows,
        "dishes": dish_rows,
        "variations": variation_rows,
        "ingredients": ingredient_rows,
        "techniques": technique_rows,
        "dish_family_ingredients": family_ingredient_rows,
        "dish_family_techniques": family_technique_rows,
        "dish_relations": dish_relation_rows,
        "aliases": alias_rows,
        "provenance": provenance_rows,
        "graph_nodes": graph_nodes,
        "graph_edges": graph_edges,
    }
    bundle["recipe_lineage_seed"] = {key: value for key, value in bundle.items()}

    export_final_bundle(bundle)

    print(
        json.dumps(
            {
                "generated_at": GENERATED_AT,
                "counts": {
                    "sources": len(SOURCE_ROWS),
                    "cuisines": len(cuisine_rows),
                    "categories": len(category_rows),
                    "dish_families": len(family_rows),
                    "dishes": len(dish_rows),
                    "variations": len(variation_rows),
                    "ingredients": len(ingredient_rows),
                    "techniques": len(technique_rows),
                    "aliases": len(alias_rows),
                    "provenance": len(provenance_rows),
                },
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
