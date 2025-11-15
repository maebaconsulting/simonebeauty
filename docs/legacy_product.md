name text null,
selling_price_cents
duration_seconds
description
is_visible
"order" bigint
buying_price_cents
intro text null,
hygienic_precautions
contraindications
advises
is_for_entreprise_ready boolean
item_in_stock boolean null default false,
is_available boolean null default false,
weight_kg double precision null default '0'::double precision,
width double precision null default '0'::double precision,
height double precision null default '0'::double precision,
depth double precision null default '0'::double precision,
tags
providers_id
bare_code text null,
product_url text null,
primary_image_url text null,
secondary_image_url text[] null,
video_url text null,
for_men boolean null default false,
for_women boolean null default false,
for_kids boolean null default false,
is_treatment boolean null default false,
is_service boolean null default true,
is_additional_service boolean
list_of_contractor bigint[] null,
list_of_institut bigint[] null,
sub_categorie bigint null,
long_description text null,
your_session text null,
preparation text null,
suggestion text null,
has_many_session boolean null default false,
number_of_session smallint null default '1'::smallint,
