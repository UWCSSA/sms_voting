create database smsvoting;

use smsvoting;

DROP TABLE IF EXISTS `candidates`;
CREATE TABLE `candidates` (
  `c_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `c_name` varchar(11) NOT NULL DEFAULT '',
  PRIMARY KEY (`c_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
 
DROP TABLE IF EXISTS `config`;
CREATE TABLE `config` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `attribute` varchar(11) NOT NULL DEFAULT '',
  `value` varchar(32) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `judges`;
CREATE TABLE `judges` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(11) DEFAULT NULL,
  `password` varchar(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `reg_key`;
CREATE TABLE `reg_key` (
  `reg_key` char(8) NOT NULL DEFAULT '',
  `used` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`reg_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `scores`;
CREATE TABLE `scores` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `cid` int(11) unsigned NOT NULL,
  `round` int(11) unsigned NOT NULL,
  `judge` int(11) unsigned NOT NULL,
  `score` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `single_vote`;
CREATE TABLE `single_vote` (
  `c_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `score` int(11) unsigned NOT NULL,
  `votes` int(11) unsigned NOT NULL,
  `c_name` varchar(20) NOT NULL DEFAULT '',
  PRIMARY KEY (`c_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `timed_duel`;
CREATE TABLE `timed_duel` (
  `round_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `cids` text NOT NULL,
  `timer` int(11) unsigned NOT NULL DEFAULT '60',
  PRIMARY KEY (`round_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `timed_duel_result`;
CREATE TABLE `timed_duel_result` (
  `c_id` int(11) unsigned NOT NULL,
  `round_id` int(11) unsigned NOT NULL,
  `score` int(11) unsigned NOT NULL,
  `votes` int(11) unsigned NOT NULL,
  PRIMARY KEY (`c_id`,`round_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `voters`;
CREATE TABLE `voters` (
  `phone_number` varchar(15) NOT NULL DEFAULT '',
  `reg_key` char(8) NOT NULL DEFAULT '',
  PRIMARY KEY (`phone_number`),
  UNIQUE KEY `key` (`reg_key`),
  UNIQUE KEY `phone_number` (`phone_number`),
  CONSTRAINT `KeyValidation` FOREIGN KEY (`reg_key`) REFERENCES `reg_key` (`reg_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `votes`;
CREATE TABLE `votes` (
  `round` int(11) NOT NULL,
  `cid` int(11) NOT NULL,
  `voter` varchar(15) NOT NULL DEFAULT '',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`round`,`voter`),
  KEY `VoterValidation` (`voter`),
  CONSTRAINT `VoterValidation` FOREIGN KEY (`voter`) REFERENCES `voters` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
