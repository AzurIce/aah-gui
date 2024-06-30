use std::{io::Cursor, path::Path, time::Instant};

use aah_core::{vision::analyzer::deploy::DeployAnalyzerOutput, AAH};
use image::{ImageBuffer, ImageFormat};

use crate::state::core_instance;

#[tauri::command]
pub fn connect(serial: String) -> Result<(), String> {
    let mut core = core_instance().lock().unwrap();
    let connected_aah = AAH::connect(serial, "./resources/").map_err(|err| format!("{}", err))?;
    *core = Some(connected_aah);
    Ok(())
}

#[tauri::command]
pub fn get_tasks() -> Result<Vec<String>, String> {
    let mut core = core_instance().lock().unwrap();
    if core.is_none() {
        return Err("No device connected".to_string());
    }
    let core = core.as_mut().unwrap();

    // 调用核心实例的 get_tasks 方法获取任务名称
    let tasks = core.get_tasks();

    Ok(tasks)
}

#[tauri::command]
pub fn reload_resources() -> Result<(), String> {
    let mut core = core_instance().lock().unwrap();
    if core.is_none() {
        return Err("No device connected".to_string());
    }
    let core = core.as_mut().unwrap();

    core.reload_resources()
}

#[tauri::command]
pub fn run_task(name: String) -> Result<(), String> {
    let mut core = core_instance().lock().unwrap();
    if core.is_none() {
        return Err("No device connected".to_string());
    }
    let core = core.as_mut().unwrap();

    core.run_task(name)
}

#[tauri::command]
pub fn update_screen() -> Result<(), String> {
    let mut core = core_instance().lock().unwrap();
    if core.is_none() {
        return Err("No device connected".to_string());
    }
    let core = core.as_mut().unwrap();

    core.update_screen()
}

#[tauri::command]
pub fn get_deploy_analyze_result() -> Result<DeployAnalyzerOutput, String> {
    let mut core = core_instance().lock().unwrap();
    if core.is_none() {
        return Err("No device connected".to_string());
    }
    let core = core.as_mut().unwrap();

    let res = core.analyze_deploy().unwrap();
    Ok(res)
}

#[tauri::command]
pub fn get_screen(
    windows: tauri::Window,
    request: tauri::ipc::Request,
) -> Result<tauri::ipc::Response, String> {
    let start = Instant::now();
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
    // println!("elapsed {:?}", start.elapsed());
    Ok(tauri::ipc::Response::new(buf))
}

#[tauri::command]
pub fn get_image() -> Result<Vec<u8>, String> {
    let imgx = 800;
    let imgy = 800;

    let scalex = 3.0 / imgx as f32;
    let scaley = 3.0 / imgy as f32;

    // Create a new ImgBuf with width: imgx and height: imgy
    let mut imgbuf = ImageBuffer::new(imgx, imgy);

    // Iterate over the coordinates and pixels of the image
    for (x, y, pixel) in imgbuf.enumerate_pixels_mut() {
        let r = (0.3 * x as f32) as u8;
        let b = (0.3 * y as f32) as u8;
        *pixel = image::Rgb([r, 0, b]);
    }

    // A redundant loop to demonstrate reading image data
    for x in 0..imgx {
        for y in 0..imgy {
            let cx = y as f32 * scalex - 1.5;
            let cy = x as f32 * scaley - 1.5;

            let c = num_complex::Complex::new(-0.4, 0.6);
            let mut z = num_complex::Complex::new(cx, cy);

            let mut i = 0;
            while i < 255 && z.norm() <= 2.0 {
                z = z * z + c;
                i += 1;
            }

            let pixel = imgbuf.get_pixel_mut(x, y);
            let image::Rgb(data) = *pixel;
            *pixel = image::Rgb([data[0], i as u8, data[2]]);
        }
    }

    // 创建一个内存缓冲区，用于写入图像数据
    let mut buf = Vec::new();

    // 使用 Cursor 包装 buf，使其实现了 Seek trait
    let mut cursor = Cursor::new(&mut buf);

    // 将图像数据以 JPEG 格式写入到 buf 中
    imgbuf
        .write_to(&mut cursor, ImageFormat::Bmp)
        .map_err(|e| format!("编码图像失败: {:?}", e))?;

    // 将包含图像数据的 Vec<u8> 返回给前端
    Ok(buf)
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn screenshot() {
        let mut core = AAH::connect("127.0.0.1:16384", "./resources").unwrap();

        core.update_screen().unwrap();
        let screen = core.get_screen().unwrap();

        let dir = Path::new("./resources/templates/MUMU-1920x1080");
        screen.save(dir.join("mission-day.png")).unwrap();
    }

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
    }
}
