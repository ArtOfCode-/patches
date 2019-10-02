create database if not exists `patches`;

use `patches`;

create table if not exists `metadata` (
    `id` bigint primary key auto_increment,
    `name` varchar(255) not null,
    `val` varchar(255),

    index index_metadata_on_name (`name`)
) character set utf8mb4 collate utf8mb4_unicode_ci;

create table if not exists `users` (
    `id` bigint primary key auto_increment,
    `username` varchar(255) not null,
    `email` varchar(255) not null,
    `password` varchar(255) not null,
    `site_admin` tinyint(1) not null default 0,
    `created_at` datetime not null default current_timestamp,
    `updated_at` datetime not null default current_timestamp,

    constraint unique_users_email unique (`email`),
    index index_users_on_email (`email`)
) character set utf8mb4 collate utf8mb4_unicode_ci;

create table if not exists `resource_types` (
    `id` bigint primary key auto_increment,
    `name` varchar(255) not null,
    `description` text,
    `created_at` datetime not null default current_timestamp,
    `updated_at` datetime not null default current_timestamp,

    index index_resource_types_on_name (`name`)
) character set utf8mb4 collate utf8mb4_unicode_ci;

create table if not exists `resource_statuses` (
    `id` bigint primary key auto_increment,
    `name` varchar(255) not null,
    `description` text,
    `created_at` datetime not null default current_timestamp,
    `updated_at` datetime not null default current_timestamp,

    index index_resource_statuses_on_name (`name`)
) character set utf8mb4 collate utf8mb4_unicode_ci;

create table if not exists `resources` (
    `id` bigint primary key auto_increment,
    `name` varchar(255) not null,
    `type_id` bigint not null,
    `base_lat` decimal(11, 8) not null,
    `base_lng` decimal(11, 8) not null,
    `lat` decimal(11, 8) not null,
    `lng` decimal(11, 8) not null,
    `status_id` bigint not null,
    `created_at` datetime not null default current_timestamp,
    `updated_at` datetime not null default current_timestamp,

    index index_resources_on_name (`name`),
    constraint fk_resources_types foreign key (`type_id`) references `resource_types` (`id`),
    index index_resources_on_type_id (`type_id`),
    constraint fk_resources_statuses foreign key (`status_id`) references `resource_statuses` (`id`),
    index index_resources_on_status_id (`status_id`)
) character set utf8mb4 collate utf8mb4_unicode_ci;

create table if not exists `incident_statuses` (
    `id` bigint primary key auto_increment,
    `name` varchar(255) not null,
    `description` text,
    `created_at` datetime not null default current_timestamp,
    `updated_at` datetime not null default current_timestamp,

    index index_incident_statuses_on_name (`name`)
) character set utf8mb4 collate utf8mb4_unicode_ci;

create table if not exists `incidents` (
    `id` bigint primary key auto_increment,
    `lat` decimal(11, 8) not null,
    `lng` decimal(11, 8) not null,
    `priority` tinyint(2) not null,
    `description` text not null,
    `status_id` bigint not null,
    `created_at` datetime not null default current_timestamp,
    `updated_at` datetime not null default current_timestamp,

    index index_incidents_on_priority (`priority`),
    constraint fk_incidents_statuses foreign key (`status_id`) references `incident_statuses` (`id`)
) character set utf8mb4 collate utf8mb4_unicode_ci;

create table if not exists `resource_assignments` (
    `resource_id` bigint not null,
    `incident_id` bigint not null,
    `user_id` bigint not null,
    `created_at` datetime not null default current_timestamp,
    `updated_at` datetime not null default current_timestamp,

    primary key (`resource_id`, `incident_id`),
    constraint fk_assignments_resources foreign key (`resource_id`) references `resources` (`id`),
    index index_assigments_on_resource_id (`resource_id`),
    constraint fk_assigments_incidents foreign key (`incident_id`) references `incidents` (`id`),
    index index_assigments_on_incident_id (`incident_id`),
    constraint fk_assignments_users foreign key (`user_id`) references `users` (`id`),
    index index_assignments_on_user_id (`user_id`)
) character set utf8mb4 collate utf8mb4_unicode_ci;

create table if not exists `capabilities` (
    `id` bigint primary key auto_increment,
    `name` varchar(255) not null,
    `description` text,
    `created_at` datetime not null default current_timestamp,
    `updated_at` datetime not null default current_timestamp,

    index index_capabilities_on_name (`name`)
) character set utf8mb4 collate utf8mb4_unicode_ci;

create table if not exists `resources_capabilities` (
    `resource_type_id` bigint not null,
    `capability_id` bigint not null,
    `created_at` datetime not null default current_timestamp,
    `updated_at` datetime not null default current_timestamp,

    primary key (`resource_type_id`, `capability_id`),
    constraint fk_rc_resource_types foreign key (`resource_type_id`) references `resource_types` (`id`),
    index index_rc_on_resource_type_id (`resource_type_id`),
    constraint fk_rc_capabilities foreign key (`capability_id`) references `capabilities` (`id`),
    index index_rc_on_capability_id (`capability_id`)
) character set utf8mb4 collate utf8mb4_unicode_ci;

create table if not exists `audits` (
    `id` bigint primary key auto_increment,
    `event_type` varchar(255) not null,
    `reference_type` varchar(255) not null,
    `reference_id` bigint not null,
    `user_id` bigint not null,
    `comment` text,
    `created_at` datetime not null default current_timestamp,
    `updated_at` datetime not null default current_timestamp,

    index index_audits_on_reference (`reference_type`, `reference_id`),
    index index_audits_on_event_type (`event_type`),
    constraint fk_audits_users foreign key (`user_id`) references `users` (`id`),
    index index_audits_on_user_id (`user_id`)
) character set utf8mb4 collate utf8mb4_unicode_ci;


--------------------------------------------------------------------------------------------------
-- SEED DATA -------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------

insert into `resource_statuses` (`id`, `name`, `description`) values
    (1, 'Clear', 'Available for jobs.'),
    (2, 'Assigned En Route', 'Assigned to a job, currently en route.'),
    (3, 'Assigned On Scene', 'Assigned to a job, currently attending scene.'),
    (4, 'Assigned In Transport', 'Assigned to a job, currently transporting patient to handover'),
    (5, 'Handover', 'Handing over or awaiting handover patient to further care; clearance imminent.'),
    (6, 'Break', 'On a break, unavailable for jobs.');

insert into `incident_statuses` (`id`, `name`, `description`) values
    (1, 'Open', 'Active incident; response still in progress.'),
    (2, 'Closed', 'Incident response completed; incident closed.');

insert into `resource_types` (`id`, `name`, `description`) values
    (1, 'RNLI ALB', 'All-weather lifeboat capability up to 250nm offshore.'),
    (2, 'RNLI ILB', 'Inshore lifeboat for inshore or short-range capability.'),
    (3, 'RNLI Hovercraft', 'Hovercraft rescue craft for mud or inshore capability.'),
    (4, 'LAS Ambulance', 'Double-crewed ambulance/transport with at least one paramedic aboard.'),
    (5, 'LAS Response Car', 'Fast response vehicle crewed by a single paramedic with no transport capacity.'),
    (6, 'LAS HART', 'Hazardous Area Response Team capabilities including at least one paramedic.'),
    (7, 'LAS Doctor Car', 'Fast response vehicle single or double-crewed with an ALS doctor on board.'),
    (8, 'LAS Motorcycle', 'Fast response motorcycle crewed by a single paramedic.'),
    (9, 'LAS Bicycle', 'City response bicycle crewed by a single paramedic.'),
    (10, 'LAA HEMS Helicopter', 'HEMS Doctor and fast transport capability, daylight hours only.'),
    (11, 'LAA HEMS Car', 'Fast response vehicle crewed by a HEMS Doctor and paramedic, dark hours only.');

insert into `capabilities` (`id`, `name`, `description`) values
    (1, 'Medical - First Aid', 'Basic first aid equipment and skills.'),
    (2, 'Medical - Advanced First Aid', 'Experienced first aiders with a good selection of equipment.'),
    (3, 'Medical - AED', 'Public-facing first aid defibrillator available.'),
    (4, 'Medical - Defibrillator', 'Full manual medical defibrillator and operator available.'),
    (5, 'Medical - Paramedic', 'Paramedic skills and full range of equipment.'),
    (6, 'Medical - Cycle Paramedic', 'Paramedic skills with limited equipment.'),
    (7, 'Medical - ALS Doctor', 'ALS Doctor with full range of life-support and surgical equipment.'),
    (8, 'Medical - HEMS Doctor', 'HEMS Doctor with full range of equipment.'),
    (9, 'Transport - Road', 'Single patient road transport capacity.'),
    (10, 'Transport - Water', 'Single patient river transport capacity.'),
    (11, 'Transport - Fast Air', 'Single patient fast air transport capacity.'),
    (12, 'Rescue - Water', 'Water rescue equipment and operators.'),
    (13, 'Rescue - Rope', 'Rope rescue equipment and operators.'),
    (14, 'Rescue - AT', 'Equipment and operators for limited access situations caused by terrain.'),
    (15, 'Rescue - Confined', 'Confined space rescue equipment and operators.');

insert into `resources_capabilities` (`resource_type_id`, `capability_id`) values
    (1, 1), (1, 2), (1, 3), (1, 5), (1, 10), (1, 12), -- RNLI ALB
    (2, 1), (2, 2), (2, 3), (2, 10), (2, 12), -- RNLI ILB
    (3, 1), (3, 2), (3, 3), (3, 10), (3, 12), (3, 14), -- RNLI Hovercraft
    (4, 1), (4, 2), (4, 3), (4, 5), (4, 9), -- LAS Ambulance
    (5, 1), (5, 2), (5, 3), (5, 5), -- LAS Response Car
    (6, 1), (6, 2), (6, 3), (6, 5), (6, 12), (6, 13), (6, 14), (6, 15), -- LAS HART
    (7, 1), (7, 2), (7, 3), (7, 4), (7, 5), (7, 7), -- LAS Doctor Car
    (8, 1), (8, 2), (8, 3), (8, 6), -- LAS Motorcycle
    (9, 1), (9, 2), (9, 3), (9, 6), -- LAS Bicycle
    (10, 1), (10, 2), (10, 3), (10, 4), (10, 5), (10, 7), (10, 8), (10, 11), -- LAA HEMS Helicopter
    (11, 1), (11, 2), (11, 3), (11, 4), (11, 5), (11, 7), (11, 8); -- LAA HEMS Car

insert into `resources` (`name`, `type_id`, `base_lat`, `base_lng`, `lat`, `lng`, `status_id`) values
    ('E-01', 2, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('E-02', 2, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('B-878', 2, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('B-879', 2, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('A7040', 4, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('A7041', 4, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('A7042', 4, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('A7043', 4, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('R8010', 5, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('R8011', 5, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('HART1', 6, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('HART2', 6, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('D9020', 7, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('D9021', 7, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('M6030', 8, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('M6031', 8, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('M6032', 8, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('B5070', 9, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('B5071', 9, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('B5072', 9, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('HELIMED H85', 10, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1),
    ('HELIMED V85', 11, 51.50690609, -0.07414699, 51.50690609, -0.07414699, 1);

insert into `incidents` (`lat`, `lng`, `priority`, `description`, `status_id`) values
    (51.49925931, -0.12314558, 1, 'CF Person in the water around Houses of Parliament', 1),
    (51.53170419, 0.05028069, 1, 'AM GSW right thigh and abdomen, significant blood loss, LOC. Police in attendance with FA, scene safe.', 1),
    (51.62425133, -0.12305975, 2, 'AF 18% 2D burns from fat cooker flashover. C&B, FA in attendance.', 1),
    (51.59691119, -0.12941122, 1, 'AM Fall from height appx 16m, LOC, GCS 4. AFA in attendance, CPR in progress with timely AED.', 1),
    (51.59330214, -0.13259232, 3, 'TF Alcohol-related fall down steps, bruising and a number of deep cuts, FA in attendance.', 1);
