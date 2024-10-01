use std::collections::HashMap;


use chrono::{Datelike, Duration, NaiveDate, NaiveTime, Weekday};
use rust_xlsxwriter::*;

use crate::database::schemas::user_schema::{HourData, UserExternal};

/// Generates an Excel report based on user attendance data.
///
/// # Arguments
///
/// * `date_start` - The start date for the report in "dd/mm/yyyy" format.
/// * `date_end` - The end date for the report in "dd/mm/yyyy" format.
/// * `entry_time` - The expected entry time in "HH:MM" format.
/// * `lunch_break` - The expected lunch break time in "HH:MM" format.
/// * `exit_time` - The expected exit time in "HH:MM" format.
/// * `tolerance` - The tolerance in minutes for early or late entries.
/// * `users` - A HashMap containing user data.
///
/// # Returns
///
/// * `Result<bool, ()>` - Returns `Ok(true)` if the report is successfully created, otherwise returns `Err(())`.
#[tauri::command]
pub(crate) fn create_excel_relatory(
    date_start: String,
    date_end: String,
    entry_time: String,
    exit_time: String,
    tolerance: String,
    users: HashMap<String, UserExternal>,
) -> Result<bool, ()> {
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    // Write the header row
    let bold = Format::new().set_bold().set_font_size(14.0);
    worksheet.write_string_with_format(0, 0, "Nome", &bold).unwrap();
    worksheet.write_string_with_format(0, 1, "Dia", &bold).unwrap();
    worksheet.write_string_with_format(0, 2, "Entrada", &bold).unwrap();
    worksheet.write_string_with_format(0, 3, "Almoço - Saída", &bold).unwrap();
    worksheet.write_string_with_format(0, 4, "Almoço - Retorno", &bold).unwrap();
    worksheet.write_string_with_format(0, 5, "Saída", &bold).unwrap();

    // Define formats for early and late entries
    let early_color = Format::new()
        .set_background_color(Color::Green)
        .set_border(FormatBorder::Thin); // Early entries
    let late_color = Format::new()
        .set_background_color(Color::Red)
        .set_border(FormatBorder::Thin); // Late entries
    let unregistered_color = Format::new()
        .set_background_color(Color::Purple)
        .set_border(FormatBorder::Thin); // Unregistered entries

    // Write the legend row as a color guide
    worksheet
        .write_string_with_format(0, 8, "Legenda", &Format::new().set_bold())
        .unwrap();
    worksheet
        .write_string_with_format(1, 8, "Entrada antecipada", &early_color)
        .unwrap();
    worksheet
        .write_string_with_format(2, 8, "Entrada atrasada/Saida antecipada", &late_color)
        .unwrap();
    worksheet
        .write_string_with_format(3, 8, "Dia não registrado", &unregistered_color)
        .unwrap();
    worksheet
        .write_string(4, 8, "Domingos não são registrados!")
        .unwrap();


    worksheet
        .write_string(6, 8, "Horários Configurados:")
        .unwrap();
    worksheet
        .write_string(7, 8, format!("Entrada: {}", entry_time).as_str())
        .unwrap();
    worksheet
        .write_string(8, 8, format!("Saída: {}", exit_time).as_str())
        .unwrap();
    worksheet
        .write_string(9, 8, format!("Tolerância: {} minutos", tolerance).as_str())
        .unwrap();

    // Set column widths
    worksheet.set_column_width(0, 30).unwrap();
    worksheet.set_column_width(1, 12).unwrap();
    worksheet.set_column_width(2, 10).unwrap();
    worksheet.set_column_width(3, 18).unwrap();
    worksheet.set_column_width(4, 18).unwrap();
    worksheet.set_column_width(5, 10).unwrap();
    worksheet.set_column_width(8, 30).unwrap();

    // Collect data rows within the date range
    let mut data_rows: Vec<(String, String, HourData)> = Vec::new();
    for (name, user) in users.iter() {
        for (date_str, hour_data) in user.hour_data.clone().unwrap_or_default() {
            // Parse date string into NaiveDate for comparison
            let date =
                NaiveDate::parse_from_str(&date_str, "%d/%m/%Y").expect("Invalid date format");
            if date
                >= NaiveDate::parse_from_str(&date_start, "%d/%m/%Y").expect("Invalid date format")
                && date
                <= NaiveDate::parse_from_str(&date_end, "%d/%m/%Y")
                .expect("Invalid date format")
            {
                data_rows.push((name.clone(), date_str.clone(), hour_data.clone()));
            }
        }
    }

    // Sort data rows by date and name
    data_rows.sort_by(|a, b| {
        let name_cmp = a.0.cmp(&b.0);
        if name_cmp == std::cmp::Ordering::Equal {
            // Names are equal, compare dates
            a.1.cmp(&b.1)
        } else {
            // Names are not equal, sort by name
            name_cmp
        }
    });

    // Convert tolerance to minutes
    let tolerance_minutes = tolerance.parse::<i32>().map_err(|_| ())?;

    // Write the Excel file, filtering by name and date.
    let start_date = NaiveDate::parse_from_str(&date_start, "%d/%m/%Y").unwrap();
    let end_date = NaiveDate::parse_from_str(&date_end, "%d/%m/%Y").unwrap();
    let dates = generate_dates_range(start_date, end_date);

    let mut row = 1;
    let mut last_user = String::new();
    for (name, users) in users.iter() {
        if !last_user.is_empty() && last_user != *name {
            row += 1; // Increment row for the blank row
        }

        for date in &dates {
            let date_str = date.format("%d/%m/%Y").to_string();

            let hour_data = users
                .hour_data
                .clone()
                .unwrap_or_default()
                .get(&date_str)
                .cloned();

            if let Some(hour_data) = hour_data {
                let entry_time = NaiveTime::parse_from_str(&entry_time, "%H:%M:%S").unwrap();
                let exit_time = NaiveTime::parse_from_str(&exit_time, "%H:%M:%S").unwrap();

                let clock_in = if hour_data.clock_in == "N/A" {
                    None
                } else {
                    Some(NaiveTime::parse_from_str(&hour_data.clock_in, "%H:%M:%S").unwrap())
                };
                // Check if the clocked_out is N/A
                let clocked_out = if hour_data.clocked_out == "N/A" {
                    None
                } else {
                    Some(NaiveTime::parse_from_str(&hour_data.clocked_out, "%H:%M:%S").unwrap())
                };

                let is_early = clock_in.map_or(false, |clock_in| {
                    clock_in
                        .signed_duration_since(entry_time)
                        .num_minutes()
                        .abs()
                        <= tolerance_minutes as i64
                });

                let is_late = clock_in.map_or(false, |clock_in| {
                    clock_in
                        .signed_duration_since(entry_time)
                        .num_minutes()
                        .abs()
                        > tolerance_minutes as i64
                });

                let left_too_early = clocked_out.map_or(false, |clocked_out| {
                    clocked_out.signed_duration_since(exit_time).num_minutes() < 0
                });

                worksheet
                    .write_string_with_format(
                        row,
                        0,
                        name,
                        &Format::new().set_border(FormatBorder::Thin),
                    )
                    .unwrap();
                worksheet
                    .write_string_with_format(
                        row,
                        1,
                        &date_str,
                        &Format::new().set_border(FormatBorder::Thin),
                    )
                    .unwrap();
                worksheet
                    .write_string_with_format(
                        row,
                        3,
                        &hour_data.lunch_break_out,
                        &Format::new().set_border(FormatBorder::Thin),
                    )
                    .unwrap();
                worksheet
                    .write_string_with_format(
                        row,
                        4,
                        &hour_data.lunch_break_return,
                        &Format::new().set_border(FormatBorder::Thin),
                    )
                    .unwrap();

                if is_early {
                    worksheet
                        .write_string_with_format(row, 2, &hour_data.clock_in, &early_color)
                        .unwrap();
                } else if is_late {
                    worksheet
                        .write_string_with_format(row, 2, &hour_data.clock_in, &late_color)
                        .unwrap();
                } else {
                    worksheet
                        .write_string_with_format(
                            row,
                            2,
                            &hour_data.clock_in,
                            &Format::new().set_border(FormatBorder::Thin),
                        )
                        .unwrap();
                }

                if left_too_early {
                    worksheet
                        .write_string_with_format(row, 5, &hour_data.clocked_out, &late_color)
                        .unwrap();
                } else {
                    worksheet
                        .write_string_with_format(
                            row,
                            5,
                            &hour_data.clocked_out,
                            &Format::new().set_border(FormatBorder::Thin),
                        )
                        .unwrap();
                }

                row += 1;
            } else {
                // Write missing day with placeholder data
                worksheet
                    .write_string_with_format(row, 0, name, &unregistered_color)
                    .unwrap();
                worksheet
                    .write_string_with_format(row, 1, &date_str, &unregistered_color)
                    .unwrap();
                worksheet
                    .write_string_with_format(row, 2, "N/A", &unregistered_color)
                    .unwrap(); // Placeholder for missing entry
                worksheet
                    .write_string_with_format(row, 3, "N/A", &unregistered_color)
                    .unwrap(); // Placeholder for missing lunch break
                worksheet
                    .write_string_with_format(row, 4, "N/A", &unregistered_color)
                    .unwrap(); // Placeholder for missing clock-out
                worksheet
                    .write_string_with_format(row, 5, "N/A", &unregistered_color)
                    .unwrap(); // Placeholder for missing total hours

                row += 1;
            }
        }

        last_user = name.clone(); // Update the last_user to current name
    }

    // Define the path to save the Excel file
    let path = dirs::document_dir().unwrap().join("PontuAll/relatory.xlsx");

    // Create directory if it doesn't exist, otherwise remove the existing file
    if !path.exists() {
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
    } else {
        std::fs::remove_file(&path).unwrap();
    }

    // Save the workbook
    workbook.save(path).unwrap();

    Ok(true)
}

/// Generates a range of dates between the start and end dates, excluding Sundays.
///
/// # Arguments
///
/// * `start_date` - The start date.
/// * `end_date` - The end date.
///
/// # Returns
///
/// * `Vec<NaiveDate>` - A vector of dates between the start and end dates.
fn generate_dates_range(start_date: NaiveDate, end_date: NaiveDate) -> Vec<NaiveDate> {
    let mut dates = Vec::new();
    let mut current_date = start_date;

    while current_date <= end_date {
        if current_date.weekday() != Weekday::Sun {
            dates.push(current_date);
        }
        current_date = current_date + Duration::days(1);
    }

    dates
}

#[cfg(test)]
mod tests {
    use crate::cache::get::get_cache;
    use crate::cache::set::get_users_and_cache;
    use crate::database::connect::create_db_connection;
    use crate::excel::create::create_excel_relatory;

    /// Tests the `create_excel_relatory` function.
    #[tokio::test]
    async fn test_create_excel_relatory() {
        let db = create_db_connection("mongodb://localhost:27017")
            .await
            .unwrap();
        get_users_and_cache(db).await;
        let users = get_cache();

        let users = get_cache();
        let create = create_excel_relatory(
            "01/08/2024".to_string(),
            "31/08/2024".to_string(),
            "08:00".to_string(),
            "18:00".to_string(),
            "10".to_string(),
            users,
        )
            .unwrap();

        assert_eq!(create, true);
    }
}
