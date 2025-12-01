-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 13, 2025 at 01:25 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dar`
--

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `is_active` enum('Y','N') NOT NULL DEFAULT 'Y',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_by` int(11) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `driver_activity`
--

CREATE TABLE `driver_activity` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `departure_at` datetime DEFAULT NULL,
  `origin` varchar(255) DEFAULT NULL,
  `origin_photo` longtext DEFAULT NULL,
  `origin_latitude` decimal(10,8) DEFAULT NULL,
  `origin_longitude` decimal(11,8) DEFAULT NULL,
  `odometer_before` decimal(10,2) DEFAULT NULL,
  `arrival_at` datetime DEFAULT NULL,
  `destination` varchar(255) DEFAULT NULL,
  `destination_photo` longtext DEFAULT NULL,
  `destination_latitude` decimal(10,8) DEFAULT NULL,
  `destination_longitude` decimal(11,8) DEFAULT NULL,
  `odometer_after` decimal(10,2) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_by` int(11) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `driver_activity`
--

INSERT INTO `driver_activity` (`id`, `user_id`, `vehicle_id`, `departure_at`, `origin`, `origin_photo`, `origin_latitude`, `origin_longitude`, `odometer_before`, `arrival_at`, `destination`, `destination_photo`, `destination_latitude`, `destination_longitude`, `odometer_after`, `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_by`, `deleted_at`) VALUES
(1, 1, 1, '2025-10-13 17:53:32', 'Pabrik Utama Cikarang', NULL, -6.20000000, 106.80000000, 15000.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 10:53:32', NULL, '2025-10-13 10:53:32', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `driver_incident`
--

CREATE TABLE `driver_incident` (
  `id` bigint(20) NOT NULL,
  `driver_activity_id` bigint(20) NOT NULL,
  `incident_time` datetime DEFAULT NULL,
  `incident_name` varchar(255) NOT NULL,
  `incident_description` longtext DEFAULT NULL,
  `destination_latitude` decimal(10,8) DEFAULT NULL,
  `destination_longitude` decimal(11,8) DEFAULT NULL,
  `incident_cost` decimal(10,2) DEFAULT NULL,
  `incident_status` enum('Draft','Reported','Pending','Resolved','Cancelled') NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_by` int(11) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `driver_incident`
--

INSERT INTO `driver_incident` (`id`, `driver_activity_id`, `incident_time`, `incident_name`, `incident_description`, `destination_latitude`, `destination_longitude`, `incident_cost`, `incident_status`, `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_by`, `deleted_at`) VALUES
(1, 1, '2025-10-13 10:58:15', 'Ban Bocor di Tol KM 50', 'Ban depan kanan bocor, perlu diganti. Menghabiskan waktu 2 jam.', NULL, NULL, 500000.00, 'Reported', NULL, '2025-10-13 10:58:15', NULL, '2025-10-13 10:58:15', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `factories`
--

CREATE TABLE `factories` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `is_active` enum('Y','N') NOT NULL DEFAULT 'Y',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_by` int(11) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `factories`
--

INSERT INTO `factories` (`id`, `company_id`, `name`, `address`, `phone`, `is_active`, `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_by`, `deleted_at`) VALUES
(1, 1, 'Pabrik Cikarang Update', 'Jalan Industri Blok A', '0812345678', 'Y', 1, '2025-10-13 10:46:00', 1, '2025-10-13 11:21:47', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(20) NOT NULL,
  `password` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `company_id` int(11) DEFAULT NULL,
  `factory_id` int(11) DEFAULT NULL,
  `is_active` enum('Y','N') NOT NULL DEFAULT 'Y',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_by` int(11) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `email`, `company_id`, `factory_id`, `is_active`, `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_by`, `deleted_at`) VALUES
(1, 'bangdengki', 'securepassword', 'driver@test.com', 1, NULL, 'N', NULL, '2025-10-13 10:27:29', 1, '2025-10-13 11:04:05', NULL, NULL),
(3, 'galih', '12345678', 'galih@test.com', 1, NULL, 'Y', NULL, '2025-10-13 11:05:38', NULL, '2025-10-13 11:07:24', 1, '2025-10-13 11:07:24');

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` int(11) NOT NULL,
  `number_plate` varchar(10) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category` enum('Small','Medium','Large') NOT NULL,
  `current_odometer` bigint(20) DEFAULT NULL,
  `photo` longtext DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `factory_id` int(11) DEFAULT NULL,
  `is_active` enum('Y','N') NOT NULL DEFAULT 'Y',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_by` int(11) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`id`, `number_plate`, `name`, `category`, `current_odometer`, `photo`, `company_id`, `factory_id`, `is_active`, `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_by`, `deleted_at`) VALUES
(1, 'B 1234 XYZ', 'Isuzu Elf', 'Medium', 15000, NULL, 1, 1, 'Y', NULL, '2025-10-13 10:49:45', NULL, '2025-10-13 10:49:45', NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `driver_activity`
--
ALTER TABLE `driver_activity`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `driver_incident`
--
ALTER TABLE `driver_incident`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `factories`
--
ALTER TABLE `factories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `number_plate` (`number_plate`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `driver_activity`
--
ALTER TABLE `driver_activity`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `driver_incident`
--
ALTER TABLE `driver_incident`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `factories`
--
ALTER TABLE `factories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
