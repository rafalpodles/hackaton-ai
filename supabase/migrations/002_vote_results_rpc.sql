create or replace function get_vote_results()
returns table (
  project_id uuid,
  project_name text,
  team_members text[],
  category text,
  vote_count bigint
) as $$
begin
  return query
    select
      p.id as project_id,
      p.name as project_name,
      array_agg(distinct pr.display_name) as team_members,
      v.category,
      count(v.id) as vote_count
    from votes v
    join projects p on p.id = v.project_id
    join profiles pr on pr.project_id = p.id
    group by p.id, p.name, v.category
    order by v.category, count(v.id) desc;
end;
$$ language plpgsql security definer;
