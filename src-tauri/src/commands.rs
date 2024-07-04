use crate::state::core_instance;
use aah_core::task::TaskEvt;
use aah_core::AAH;
use image::{ImageBuffer, ImageFormat};
use std::{fmt::format, io::Cursor, path::Path, time::Instant};
use tauri::{Manager, Window};

// 连接设备
#[tauri::command]
pub async fn connect(serial: String, window: Window) -> Result<(), String> {
    let mut core = core_instance().lock().unwrap();
    // 定义任务事件回调函数
    let on_task_env = move |event: TaskEvt| {
        match event {
            // 使用Tauri中的emit方法将信息发送到前端
            TaskEvt::Log(message) => {
                window.emit("log_event", message).unwrap();
            }
            TaskEvt::AnnotatedImg(img) => {
                let image = img;
                let mut buf = Vec::new();
                image
                    .write_to(&mut Cursor::new(&mut buf), ImageFormat::Png)
                    .map_err(|e| format!("编码图像失败: {:?}", e));
                window.emit("image_event", buf).unwrap();
            }
        }
    };
    // resources绝对路径
    let connected_aah = AAH::connect(serial, "../../azur-arknights-helper/resources", on_task_env)
        .map_err(|err| format!("{}", err))?;
    *core = Some(connected_aah);
    Ok(())
}

// 获得任务名称
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

// 重新加载资源
#[tauri::command]
pub async fn reload_resources() -> Result<(), String> {
    let mut core = core_instance().lock().unwrap();
    if core.is_none() {
        return Err("No device connected".to_string());
    }
    let core = core.as_mut().unwrap();

    core.reload_resources()
}

// 执行任务
#[tauri::command]
pub async fn run_task(name: String) -> Result<(), String> {
    let mut core = core_instance().lock().unwrap();
    if core.is_none() {
        return Err("No device connected".to_string());
    }
    let core = core.as_mut().unwrap();

    core.run_task(name)
}

// 获得部署分析结果
#[tauri::command]
pub async fn get_deploy_analyze_result(window: Window) -> Result<tauri::ipc::Response, String> {
    let mut core = core_instance().lock().unwrap();
    let core = core.as_mut().ok_or("No device connected".to_string())?;

    let res = core.analyze_deploy().unwrap();

    let image = res.annotated_screen;

    let mut buf = Vec::new();
    image
        .write_to(&mut Cursor::new(&mut buf), ImageFormat::Png)
        .map_err(|e| format!("编码图像失败: {:?}", e))?;

    Ok(tauri::ipc::Response::new(buf))
}

// 获得屏幕画面
#[tauri::command]
pub async fn get_screen(request: tauri::ipc::Request<'_>) -> Result<tauri::ipc::Response, String> {
    // ! cost 818.778076171875 ms (total) =  700ms + 100ms(Serialize ad Deserialize and transport)
    // ) -> Result<Vec<u8>, String> { // ! cost 1276.532958984375 ms (total) = 700ms + 400ms(Serialize ad Deserialize and transport)
    let start = Instant::now();
    let mut core = core_instance().lock().unwrap();
    let core = core.as_mut().ok_or("No device connected".to_string())?;

    // ! screenshot 700ms
    let screen = core.get_raw_screen()?; // 假设 get_screen 返回的是 DynamicImage 类型

    // let mut buf = Vec::new();
    // screen
    //     .write_to(&mut Cursor::new(&mut buf), ImageFormat::Png)
    //     .map_err(|e| format!("编码图像失败: {:?}", e))?;
    println!("elapsed {:?}", start.elapsed());

    // windows.emit("get-screen", "get-screen-succeed");
    // Ok(())
    Ok(tauri::ipc::Response::new(screen))
    // Ok(screen)
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn screenshot() {
        let mut core = AAH::connect(
            "127.0.0.1:16384",
            "../../azur-arknights-helper\\resources",
            |_| {},
        )
        .unwrap();

        let screen = core.get_screen().unwrap();
        // resources绝对路径
        let dir =
            Path::new("E:\\summer\\azur-arknights-helper\\resources\\templates\\MUMU-1920x1080");
        screen.save(dir.join("choose-time.png")).unwrap();
    }
}
