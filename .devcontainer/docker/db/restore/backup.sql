-- MariaDB dump 10.19-11.3.2-MariaDB, for debian-linux-gnu (aarch64)
--
-- Host: localhost    Database: web_rag_db
-- ------------------------------------------------------
-- Server version	11.3.2-MariaDB-1:11.3.2+maria~ubu2204

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `web_rag_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `web_rag_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `web_rag_db`;

--
-- Table structure for table `application_config`
--

DROP TABLE IF EXISTS `application_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `application_config` (
  `application_config_key` varchar(100) NOT NULL,
  `application_config_value` varchar(100) NOT NULL,
  PRIMARY KEY (`application_config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='アプリケーション設定\n- FrontAppVersion -> x.x.x';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chat_room`
--

DROP TABLE IF EXISTS `chat_room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat_room` (
  `chat_room_id` int(11) NOT NULL COMMENT 'チャットルームID',
  `chat_room_name` varchar(100) NOT NULL COMMENT 'チャットルーム名',
  `create_session_user_id` varchar(128) NOT NULL COMMENT '作成セッションユーザーID',
  `create_datetime` datetime NOT NULL COMMENT '作成日時',
  `is_logical_delete` bit(1) NOT NULL COMMENT '論理削除されているか',
  PRIMARY KEY (`chat_room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chat_room_message`
--

DROP TABLE IF EXISTS `chat_room_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat_room_message` (
  `chat_room_id` int(11) NOT NULL COMMENT 'チャットルームID',
  `chat_room_message_id` int(11) NOT NULL COMMENT 'チャットルームメッセージID',
  `is_sender_bot` bit(1) NOT NULL COMMENT 'チャットボットかが送信したものか',
  `message_content` text NOT NULL COMMENT 'メッセージ内容',
  `send_datetime` datetime NOT NULL COMMENT '送信日時',
  `is_logical_delete` bit(1) NOT NULL COMMENT '論理削除されているか',
  PRIMARY KEY (`chat_room_id`,`chat_room_message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `session_user`
--

DROP TABLE IF EXISTS `session_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `session_user` (
  `session_user_id` varchar(128) NOT NULL COMMENT 'セッションユーザーID',
  `session_user_data` text NOT NULL COMMENT 'セッションデータをjson文字列で保持する',
  `session_user_last_access_datetime` datetime NOT NULL COMMENT 'セッションユーザー最終アクセス日時',
  `session_user_name` varchar(100) DEFAULT NULL COMMENT 'セッションユーザー名',
  `is_logical_delete` bit(1) NOT NULL COMMENT '論理削除されているか',
  PRIMARY KEY (`session_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unanswered_content`
--

DROP TABLE IF EXISTS `unanswered_content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unanswered_content` (
  `unanswered_content_id` int(11) NOT NULL COMMENT '回答できなかった内容ID',
  `unanswered_content_text` text NOT NULL COMMENT '回答できなかった内容テキスト',
  `unanswered_content_chat_room_id` int(11) NOT NULL COMMENT '回答できなかった内容のチャットルームID',
  PRIMARY KEY (`unanswered_content_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='回答できなかった内容';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-06-01 15:54:39
