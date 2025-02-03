-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create the dataset table
create table if not exists dataset (
    id uuid default uuid_generate_v4() primary key,
    filename text not null unique,
    url text,
    label_data jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes
create index if not exists dataset_filename_idx on dataset(filename);
create index if not exists dataset_created_at_idx on dataset(created_at);

-- Enable Row Level Security (RLS)
alter table dataset enable row level security;

-- Create policies
create policy "Enable read access for all users" on dataset
    for select using (true);

create policy "Enable insert for authenticated users" on dataset
    for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on dataset
    for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" on dataset
    for delete using (auth.role() = 'authenticated');

-- Create storage bucket for dataset images
insert into storage.buckets (id, name, public)
values ('dataset-images', 'dataset-images', true)
on conflict (id) do nothing;

-- Enable storage policies
create policy "Public read access for dataset images"
    on storage.objects for select
    using (bucket_id = 'dataset-images');

create policy "Authenticated users can upload dataset images"
    on storage.objects for insert
    with check (
        bucket_id = 'dataset-images'
        and auth.role() = 'authenticated'
    );

create policy "Authenticated users can update dataset images"
    on storage.objects for update
    using (
        bucket_id = 'dataset-images'
        and auth.role() = 'authenticated'
    );

create policy "Authenticated users can delete dataset images"
    on storage.objects for delete
    using (
        bucket_id = 'dataset-images'
        and auth.role() = 'authenticated'
    ); 