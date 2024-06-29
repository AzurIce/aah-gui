use std::io::Cursor;

use aah_core::AAH;
use image::ImageFormat;

use crate::state::core_instance;

#[tauri::command]
pub fn connect(serial: String) -> Result<(), String> {
    let mut core = core_instance().lock().unwrap();
    let connected_aah = AAH::connect(serial,"./resource").map_err(|err| format!("{}", err))?;
    *core = Some(connected_aah);
    Ok(())
}

#[tauri::command]
pub fn get_screen() -> Result<Vec<u8>, String> {
    let mut core = core_instance().lock().unwrap();
    if core.is_none() {
        return Err("No device connected".to_string());
    }
    let core = core.as_mut().unwrap();

    let screen = core.get_screen()?;

    let mut buf = Vec::new();
    screen
        .write_to(&mut Cursor::new(&mut buf), ImageFormat::Bmp)
        .map_err(|e| format!("编码图像失败: {:?}", e))?;

    Ok(buf)
}
