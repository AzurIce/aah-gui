use std::{io::Cursor, path::Path};

use aah_core::AAH;
use image::ImageFormat;

use crate::state::core_instance;

#[tauri::command]
pub fn connect(serial: String) -> Result<(), String> {
    let mut core = core_instance().lock().unwrap();
    let connected_aah = AAH::connect(serial, "./resources/").map_err(|err| format!("{}", err))?;
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

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn foo() {
        let serial = String::from("127.0.0.1:16384");

        // 调用 connect 函数进行连接
        let result = connect(serial.clone());

        // 验证连接操作的结果
        match result {
            Ok(()) => {
                println!("Device connected successfully!");
                // 这里可以添加更多的断言或验证连接后的操作
            }
            Err(err) => {
                eprintln!("Failed to connect to device: {}", err);
                // 在连接失败的情况下，可以记录错误信息或者处理其他逻辑
                panic!("Test failed: Connection error");
            }
        }

        // 调用 get_screen() 函数获取屏幕数据
        let result1 = get_screen();

        // 这是个sb操作，保持注释就好
        // println!("{:?}", result1);
    }
}
