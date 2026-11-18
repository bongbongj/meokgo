-- 작성자: 정효림

CREATE TABLE `device_user` (
    `user_id` BIGINT NOT NULL AUTO_INCREMENT,
    `device_key` VARCHAR(100) NOT NULL,
    `nickname` VARCHAR(10) NULL,
    `first_launch_yn` BIT(1) NOT NULL,
    `nickname_updated_at` DATETIME(6) NULL,
    `created_at` DATETIME(6) NOT NULL,
    `updated_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`user_id`),
    CONSTRAINT `uk_device_user_device_key` UNIQUE (`device_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `region` (
    `region_id` BIGINT NOT NULL AUTO_INCREMENT,
    `parent_region_id` BIGINT NULL,
    `region_name` VARCHAR(50) NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `region_level` VARCHAR(20) NOT NULL,
    `display_order` INT NOT NULL,
    `active_yn` BIT(1) NOT NULL,
    `created_at` DATETIME(6) NOT NULL,
    `updated_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`region_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `quest` (
    `quest_id` BIGINT NOT NULL AUTO_INCREMENT,
    `quest_title` VARCHAR(100) NOT NULL,
    `quest_description` VARCHAR(500) NOT NULL,
    `quest_type` ENUM('COMMON','COOPERATIVE','REVISIT','TRANSITION') NOT NULL,
    `schedule_type` ENUM('CAFE','MEAL','PUB','SECOND_ROUND') NOT NULL,
    `time_slot` ENUM('ANY','DINNER','LATE_NIGHT','LUNCH') NULL,
    `drinking_option` ENUM('ANY','AVAILABLE','NONE') NULL,
    `food_keywords` VARCHAR(500) NULL,
    `excluded_keywords` VARCHAR(500) NULL,
    `forced_preference_yn` BIT(1) NOT NULL,
    `risky_competition_yn` BIT(1) NOT NULL,
    `activity_yn` BIT(1) NOT NULL,
    `active_yn` BIT(1) NOT NULL,
    `created_at` DATETIME(6) NOT NULL,
    `updated_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`quest_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `retention_stage` (
    `stage_id` BIGINT NOT NULL AUTO_INCREMENT,
    `stage_code` VARCHAR(30) NOT NULL,
    `stage_name` VARCHAR(50) NOT NULL,
    `achievement_condition` VARCHAR(300) NOT NULL,
    `reward_description` VARCHAR(300) NOT NULL,
    `display_order` INT NOT NULL,
    `active_yn` BIT(1) NOT NULL,
    PRIMARY KEY (`stage_id`),
    CONSTRAINT `uk_retention_stage_code` UNIQUE (`stage_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `story_template` (
    `template_id` BIGINT NOT NULL AUTO_INCREMENT,
    `template_name` VARCHAR(50) NOT NULL,
    `preview_url` VARCHAR(500) NOT NULL,
    `active_yn` BIT(1) NOT NULL,
    `display_order` INT NOT NULL,
    `created_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `exploration_room` (
    `room_id` BIGINT NOT NULL AUTO_INCREMENT,
    `host_user_id` BIGINT NOT NULL,
    `region_id` BIGINT NOT NULL,
    `room_code` VARCHAR(20) NOT NULL,
    `room_status` ENUM('EXPIRED','FINISHED','IN_PROGRESS','QUEST_CONFIRMED','VOTE_CLOSED','VOTING','WAITING') NOT NULL,
    `max_participant_count` INT NOT NULL,
    `vote_started_at` DATETIME(6) NULL,
    `vote_closed_at` DATETIME(6) NULL,
    `vote_reopened_yn` BIT(1) NOT NULL,
    `last_host_action_at` DATETIME(6) NULL,
    `host_takeover_available_at` DATETIME(6) NULL,
    `expired_at` DATETIME(6) NOT NULL,
    `created_at` DATETIME(6) NOT NULL,
    `updated_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`room_id`),
    CONSTRAINT `uk_exploration_room_code` UNIQUE (`room_code`),
    CONSTRAINT `fk_exploration_room_host_user` FOREIGN KEY (`host_user_id`) REFERENCES `device_user` (`user_id`),
    CONSTRAINT `fk_exploration_room_region` FOREIGN KEY (`region_id`) REFERENCES `region` (`region_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `exploration_condition` (
    `condition_id` BIGINT NOT NULL AUTO_INCREMENT,
    `room_id` BIGINT NOT NULL,
    `schedule_type` ENUM('CAFE','MEAL','PUB','SECOND_ROUND') NOT NULL,
    `time_slot` ENUM('ANY','DINNER','LATE_NIGHT','LUNCH') NULL,
    `drinking_option` ENUM('ANY','AVAILABLE','NONE') NOT NULL,
    `avoid_foods` VARCHAR(500) NULL,
    `recognized_avoid_keywords` JSON NOT NULL,
    `dictionary_version` VARCHAR(30) NOT NULL,
    `created_at` DATETIME(6) NOT NULL,
    `updated_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`condition_id`),
    CONSTRAINT `uk_exploration_condition_room` UNIQUE (`room_id`),
    CONSTRAINT `fk_exploration_condition_room` FOREIGN KEY (`room_id`) REFERENCES `exploration_room` (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `invite_link` (
    `invite_link_id` BIGINT NOT NULL AUTO_INCREMENT,
    `room_id` BIGINT NOT NULL,
    `invite_token` VARCHAR(100) NOT NULL,
    `active_yn` BIT(1) NOT NULL,
    `expired_at` DATETIME(6) NOT NULL,
    `created_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`invite_link_id`),
    CONSTRAINT `uk_invite_link_token` UNIQUE (`invite_token`),
    CONSTRAINT `fk_invite_link_room` FOREIGN KEY (`room_id`) REFERENCES `exploration_room` (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `room_participant` (
    `participant_id` BIGINT NOT NULL AUTO_INCREMENT,
    `room_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `nickname` VARCHAR(10) NOT NULL,
    `participant_role` ENUM('HOST','MEMBER') NOT NULL,
    `participant_status` ENUM('EXPLORING','FINISHED','LEFT','READY','VOTING','WAITING') NOT NULL,
    `avatar_color` VARCHAR(20) NULL,
    `restored_from_device_yn` BIT(1) NOT NULL,
    `vote_submitted_yn` BIT(1) NOT NULL,
    `vote_submitted_at` DATETIME(6) NULL,
    `vote_updated_at` DATETIME(6) NULL,
    `last_connected_at` DATETIME(6) NULL,
    `joined_at` DATETIME(6) NOT NULL,
    `left_at` DATETIME(6) NULL,
    PRIMARY KEY (`participant_id`),
    CONSTRAINT `uk_room_participant_user` UNIQUE (`room_id`, `user_id`),
    CONSTRAINT `uk_room_participant_nickname` UNIQUE (`room_id`, `nickname`),
    CONSTRAINT `fk_room_participant_room` FOREIGN KEY (`room_id`) REFERENCES `exploration_room` (`room_id`),
    CONSTRAINT `fk_room_participant_user` FOREIGN KEY (`user_id`) REFERENCES `device_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `room_quest_candidate` (
    `candidate_id` BIGINT NOT NULL AUTO_INCREMENT,
    `room_id` BIGINT NOT NULL,
    `quest_id` BIGINT NOT NULL,
    `candidate_order` INT NOT NULL,
    `selected_reason` VARCHAR(200) NULL,
    `suppressed_by_history_yn` BIT(1) NOT NULL,
    `completed_participant_count` INT NOT NULL,
    `created_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`candidate_id`),
    CONSTRAINT `uk_room_candidate_quest` UNIQUE (`room_id`, `quest_id`),
    CONSTRAINT `uk_room_candidate_order` UNIQUE (`room_id`, `candidate_order`),
    CONSTRAINT `fk_room_candidate_room` FOREIGN KEY (`room_id`) REFERENCES `exploration_room` (`room_id`),
    CONSTRAINT `fk_room_candidate_quest` FOREIGN KEY (`quest_id`) REFERENCES `quest` (`quest_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vote` (
    `vote_id` BIGINT NOT NULL AUTO_INCREMENT,
    `room_id` BIGINT NOT NULL,
    `vote_status` ENUM('CLOSED','OPEN') NOT NULL,
    `min_select_count` INT NOT NULL,
    `max_select_count` INT NOT NULL,
    `not_voted_count_at_close` INT NULL,
    `close_confirmed_yn` BIT(1) NOT NULL,
    `closed_at` DATETIME(6) NULL,
    `tie_break_candidate_ids` JSON NULL,
    `tie_break_host_participant_id` BIGINT NULL,
    `started_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`vote_id`),
    CONSTRAINT `uk_vote_room` UNIQUE (`room_id`),
    CONSTRAINT `fk_vote_room` FOREIGN KEY (`room_id`) REFERENCES `exploration_room` (`room_id`),
    CONSTRAINT `fk_vote_tie_break_host` FOREIGN KEY (`tie_break_host_participant_id`) REFERENCES `room_participant` (`participant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vote_item` (
    `vote_item_id` BIGINT NOT NULL AUTO_INCREMENT,
    `vote_id` BIGINT NOT NULL,
    `participant_id` BIGINT NOT NULL,
    `candidate_id` BIGINT NOT NULL,
    `voted_at` DATETIME(6) NOT NULL,
    `updated_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`vote_item_id`),
    CONSTRAINT `uk_vote_item_selection` UNIQUE (`vote_id`, `participant_id`, `candidate_id`),
    CONSTRAINT `fk_vote_item_vote` FOREIGN KEY (`vote_id`) REFERENCES `vote` (`vote_id`),
    CONSTRAINT `fk_vote_item_participant` FOREIGN KEY (`participant_id`) REFERENCES `room_participant` (`participant_id`),
    CONSTRAINT `fk_vote_item_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `room_quest_candidate` (`candidate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `final_quest` (
    `final_quest_id` BIGINT NOT NULL AUTO_INCREMENT,
    `room_id` BIGINT NOT NULL,
    `candidate_id` BIGINT NOT NULL,
    `rank_no` INT NOT NULL,
    `vote_count` INT NOT NULL,
    `tie_break_order` INT NULL,
    `selected_by_host_participant_id` BIGINT NULL,
    `tie_group_no` INT NULL,
    `selection_reason` ENUM('HOST_TIE_BREAK','VOTE_RANK') NULL,
    `confirmed_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`final_quest_id`),
    CONSTRAINT `uk_final_quest_candidate` UNIQUE (`room_id`, `candidate_id`),
    CONSTRAINT `uk_final_quest_rank` UNIQUE (`room_id`, `rank_no`),
    INDEX `idx_final_quest_tie_group` (`room_id`, `tie_group_no`),
    CONSTRAINT `fk_final_quest_room` FOREIGN KEY (`room_id`) REFERENCES `exploration_room` (`room_id`),
    CONSTRAINT `fk_final_quest_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `room_quest_candidate` (`candidate_id`),
    CONSTRAINT `fk_final_quest_selected_host` FOREIGN KEY (`selected_by_host_participant_id`) REFERENCES `room_participant` (`participant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `quest_progress` (
    `progress_id` BIGINT NOT NULL AUTO_INCREMENT,
    `final_quest_id` BIGINT NOT NULL,
    `participant_id` BIGINT NOT NULL,
    `progress_status` ENUM('CANCELED','DONE','TODO') NOT NULL,
    `completed_at` DATETIME(6) NULL,
    `updated_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`progress_id`),
    CONSTRAINT `uk_quest_progress_participant` UNIQUE (`final_quest_id`, `participant_id`),
    INDEX `idx_progress_quest_status` (`final_quest_id`, `progress_status`),
    CONSTRAINT `fk_quest_progress_final_quest` FOREIGN KEY (`final_quest_id`) REFERENCES `final_quest` (`final_quest_id`),
    CONSTRAINT `fk_quest_progress_participant` FOREIGN KEY (`participant_id`) REFERENCES `room_participant` (`participant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `exploration_record` (
    `record_id` BIGINT NOT NULL AUTO_INCREMENT,
    `room_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `region_id` BIGINT NOT NULL,
    `participant_count` INT NOT NULL,
    `completed_quest_count` INT NOT NULL,
    `record_memo` VARCHAR(500) NULL,
    `story_selected_yn` BIT(1) NOT NULL,
    `created_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`record_id`),
    INDEX `idx_record_user_created` (`user_id`, `created_at`),
    CONSTRAINT `fk_exploration_record_room` FOREIGN KEY (`room_id`) REFERENCES `exploration_room` (`room_id`),
    CONSTRAINT `fk_exploration_record_user` FOREIGN KEY (`user_id`) REFERENCES `device_user` (`user_id`),
    CONSTRAINT `fk_exploration_record_region` FOREIGN KEY (`region_id`) REFERENCES `region` (`region_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `record_photo` (
    `photo_id` BIGINT NOT NULL AUTO_INCREMENT,
    `record_id` BIGINT NOT NULL,
    `photo_url` VARCHAR(500) NOT NULL,
    `photo_order` INT NOT NULL,
    `storage_provider` VARCHAR(10) NOT NULL,
    `stored_path` VARCHAR(500) NOT NULL,
    `expired_at` DATETIME(6) NOT NULL,
    `deleted_yn` BIT(1) NOT NULL,
    `created_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`photo_id`),
    CONSTRAINT `uk_record_photo_order` UNIQUE (`record_id`, `photo_order`),
    INDEX `idx_photo_expiration` (`deleted_yn`, `expired_at`),
    CONSTRAINT `fk_record_photo_record` FOREIGN KEY (`record_id`) REFERENCES `exploration_record` (`record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `story_image` (
    `story_image_id` BIGINT NOT NULL AUTO_INCREMENT,
    `record_id` BIGINT NOT NULL,
    `template_id` BIGINT NOT NULL,
    `story_image_url` VARCHAR(500) NOT NULL,
    `image_ratio` VARCHAR(10) NOT NULL,
    `storage_provider` VARCHAR(10) NOT NULL,
    `stored_path` VARCHAR(500) NOT NULL,
    `expired_at` DATETIME(6) NOT NULL,
    `deleted_yn` BIT(1) NOT NULL,
    `created_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`story_image_id`),
    INDEX `idx_story_expiration` (`deleted_yn`, `expired_at`),
    CONSTRAINT `fk_story_image_record` FOREIGN KEY (`record_id`) REFERENCES `exploration_record` (`record_id`),
    CONSTRAINT `fk_story_image_template` FOREIGN KEY (`template_id`) REFERENCES `story_template` (`template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_quest_history` (
    `history_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `quest_id` BIGINT NOT NULL,
    `room_id` BIGINT NOT NULL,
    `completed_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`history_id`),
    INDEX `idx_history_user_quest` (`user_id`, `quest_id`),
    CONSTRAINT `fk_user_quest_history_user` FOREIGN KEY (`user_id`) REFERENCES `device_user` (`user_id`),
    CONSTRAINT `fk_user_quest_history_quest` FOREIGN KEY (`quest_id`) REFERENCES `quest` (`quest_id`),
    CONSTRAINT `fk_user_quest_history_room` FOREIGN KEY (`room_id`) REFERENCES `exploration_room` (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_recent_region` (
    `recent_region_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `region_id` BIGINT NOT NULL,
    `selected_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`recent_region_id`),
    CONSTRAINT `fk_recent_region_user` FOREIGN KEY (`user_id`) REFERENCES `device_user` (`user_id`),
    CONSTRAINT `fk_recent_region_region` FOREIGN KEY (`region_id`) REFERENCES `region` (`region_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_retention_stage` (
    `user_stage_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `stage_id` BIGINT NOT NULL,
    `region_id` BIGINT NULL,
    `achieved_at` DATETIME(6) NOT NULL,
    PRIMARY KEY (`user_stage_id`),
    CONSTRAINT `uk_user_retention_stage` UNIQUE (`user_id`, `stage_id`),
    CONSTRAINT `fk_user_retention_stage_user` FOREIGN KEY (`user_id`) REFERENCES `device_user` (`user_id`),
    CONSTRAINT `fk_user_retention_stage_stage` FOREIGN KEY (`stage_id`) REFERENCES `retention_stage` (`stage_id`),
    CONSTRAINT `fk_user_retention_stage_region` FOREIGN KEY (`region_id`) REFERENCES `region` (`region_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
