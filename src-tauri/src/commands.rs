use std::{io::Cursor, os::windows, path::Path, time::Instant};

use crate::state::core_instance;
use aah_core::{vision::analyzer::deploy::DeployAnalyzerOutput, AAH};
use image::{DynamicImage, ImageBuffer, ImageFormat};
use tauri::{window, Manager, Window};

#[tauri::command]
pub async fn connect(serial: String) -> Result<(), String> {
    let mut core = core_instance().lock().unwrap();
    // resources绝对路径
    let connected_aah = AAH::connect(serial, "E:\\summer\\azur-arknights-helper\\resources")
        .map_err(|err| format!("{}", err))?;
    *core = Some(connected_aah);
    Ok(())
}

#[tauri::command]
pub async fn get_tasks() -> Result<Vec<String>, String> {
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
pub async fn reload_resources() -> Result<(), String> {
    let mut core = core_instance().lock().unwrap();
    if core.is_none() {
        return Err("No device connected".to_string());
    }
    let core = core.as_mut().unwrap();

    core.reload_resources()
}

#[tauri::command]
pub async fn run_task(name: String) -> Result<(), String> {
    let mut core = core_instance().lock().unwrap();
    if core.is_none() {
        return Err("No device connected".to_string());
    }
    let core = core.as_mut().unwrap();

    core.run_task(name)
}

#[tauri::command]
pub async fn update_screen() -> Result<(), String> {
    let mut core = core_instance().lock().unwrap();
    if core.is_none() {
        return Err("No device connected".to_string());
    }
    let core = core.as_mut().unwrap();

    core.update_screen()
}
#[tauri::command]
pub async fn serialization_picture(buf: Vec<u8>) -> Result<tauri::ipc::Response, String> {
    Ok(tauri::ipc::Response::new(buf))
}

#[tauri::command]
// pub async fn get_deploy_analyze_result(windows: Window) -> Result<tauri::ipc::Response, String> {
pub async fn get_deploy_analyze_result(windows: Window) -> Result<(), String> {
    let mut core = core_instance().lock().unwrap();
    if core.is_none() {
        return Err("No device connected".to_string());
    }
    let core = core.as_mut().unwrap();

    let res = core.analyze_deploy().unwrap();

    let image = res.res_screen;

    let mut buf = Vec::new();
    image
        .write_to(&mut Cursor::new(&mut buf), ImageFormat::Bmp)
        .map_err(|e| format!("编码图像失败: {:?}", e))?;

    let _ = windows.emit("analyze-result", buf);
    Ok(())
    // println!("elapsed {:?}", start.elapsed());
    //Ok(tauri::ipc::Response::new(buf))
}

#[tauri::command]
pub async fn get_screen(
    windows: tauri::Window,
    request: tauri::ipc::Request<'_>,
) -> Result<(), String> {
    let start = Instant::now();
    let mut core = core_instance().lock().unwrap();
    if core.is_none() {
        return Err("No device connected".to_string());
    }
    let core = core.as_mut().unwrap();

    let screen = core.get_screen()?;
    let mut buf = Vec::new();
    screen
        .write_to(&mut Cursor::new(&mut buf), ImageFormat::Png)
        .map_err(|e| format!("编码图像失败: {:?}", e))?;
    println!("elapsed {:?}", start.elapsed());
    
    windows.emit("get-screen", buf);
    Ok(())
    // Ok(tauri::ipc::Response::new(buf))
}

#[tauri::command]
pub async fn get_image() -> Result<Vec<u8>, String> {
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
        let mut core = AAH::connect(
            "127.0.0.1:16384",
            "E:\\summer\\azur-arknights-helper\\resources",
        )
        .unwrap();

        core.update_screen().unwrap();
        let screen = core.get_screen().unwrap();
        // resources绝对路径
        let dir =
            Path::new("E:\\summer\\azur-arknights-helper\\resources\\templates\\MUMU-1920x1080");
        screen.save(dir.join("choose-time.png")).unwrap();
    }

    #[test]
    fn foo() {
        let serial = String::from("127.0.0.1:16384");

        // 调用 connect 函数进行连接
        let result = connect(serial.clone());

        // 验证连接操作的结果
        // match result {
        //     Ok(()) => {
        //         println!("Device connected successfully!");
        //         // 这里可以添加更多的断言或验证连接后的操作
        //     }
        //     Err(err) => {
        //         eprintln!("Failed to connect to device: {}", err);
        //         // 在连接失败的情况下，可以记录错误信息或者处理其他逻辑
        //         panic!("Test failed: Connection error");
        //     }
        // }
    }
}
