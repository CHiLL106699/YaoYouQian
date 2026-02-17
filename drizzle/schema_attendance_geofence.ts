// 定位打卡系統 Schema 擴展
// 此檔案包含地理圍欄功能所需的資料表欄位擴展

import {
  pgTable, integer, real, varchar, timestamp, text, boolean,
} from "drizzle-orm/pg-core";

// 擴展 attendance_records 表 - 添加地理位置相關欄位
export const attendanceRecordsGeofence = pgTable("attendance_records", {
  // 原有欄位...
  
  // 地理位置欄位
  checkInLatitude: real("check_in_latitude"),
  checkInLongitude: real("check_in_longitude"),
  checkInAccuracy: real("check_in_accuracy"), // GPS 精確度 (米)
  checkInAddress: text("check_in_address"), // 反向地理編碼地址
  
  checkOutLatitude: real("check_out_latitude"),
  checkOutLongitude: real("check_out_longitude"),
  checkOutAccuracy: real("check_out_accuracy"),
  checkOutAddress: text("check_out_address"),
  
  // 地理圍欄驗證結果
  isWithinGeofence: boolean("is_within_geofence").default(true), // 是否在圍欄範圍內
  distanceFromClinic: real("distance_from_clinic"), // 與診所的距離 (米)
});

// 擴展 attendance_settings 表 - 添加地理圍欄設定
export const attendanceSettingsGeofence = pgTable("attendance_settings", {
  // 原有欄位...
  
  // 診所基準位置
  clinicLatitude: real("clinic_latitude"), // 診所緯度
  clinicLongitude: real("clinic_longitude"), // 診所經度
  
  // 地理圍欄設定
  validDistance: integer("valid_distance").default(100), // 有效打卡距離 (米)
  enableGeofence: boolean("enable_geofence").default(false), // 是否啟用地理圍欄驗證
  
  // 降級機制設定
  allowOfflineClockIn: boolean("allow_offline_clock_in").default(true), // 允許離線打卡
});
