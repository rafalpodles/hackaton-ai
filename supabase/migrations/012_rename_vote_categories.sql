-- Rename vote categories to match Garage Rules
-- Old: best_overall, best_demo_ux, most_creative
-- New: concept_to_reality, creativity, usefulness

-- Drop old constraint
alter table votes drop constraint if exists votes_category_check;

-- Migrate existing votes
update votes set category = 'concept_to_reality' where category = 'best_overall';
update votes set category = 'creativity' where category = 'best_demo_ux';
update votes set category = 'usefulness' where category = 'most_creative';

-- Add new constraint
alter table votes add constraint votes_category_check
  check (category in ('concept_to_reality', 'creativity', 'usefulness'));
