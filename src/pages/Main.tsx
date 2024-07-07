import { Component, Show, For, createSignal, createEffect, onMount, onCleanup } from "solid-js";
import { Refresh } from "@suid/icons-material";
import { Button, IconButton, Card, CircularProgress } from "@suid/material";
import { invoke } from "@tauri-apps/api/core";
import { UnlistenFn, listen } from "@tauri-apps/api/event";

const MainPage: Component = () => {
  // 画布 canvas
  let canvas: HTMLCanvasElement | undefined;
  // 更新屏幕状态
  const [screenUpdating, setScreenUpdating] = createSignal(false);
  // 更新任务状态
  const [taskUpdating, setTaskUpdating] = createSignal(false);
  // 执行任务情况的日志信息
  const [log, setLog] = createSignal<string[]>([]);
  // 任务列表（字符串型数组）
  const [tasks, setTasks] = createSignal<string[]>([]);
  // 当前正在执行的任务
  const [currentTask, setCurrentTask] = createSignal("");
  // 存储执行任务过程中接收到的图像数据
  const [images, setImages] = createSignal<Uint8Array[]>([]);
  // 存储当前显示的执行任务过程中的图像索引
  const [currentImageIndex, setCurrentImageIndex] = createSignal(0);

  // 将 imageData 绘制在 canvas 上
  const drawImage = async (imageData: Uint8Array) => {
    const ctx = canvas!.getContext("bitmaprenderer");
    const blob = new Blob([imageData], { type: "image/png" });
    const bitmap = await createImageBitmap(blob);
    ctx?.transferFromImageBitmap(bitmap);
  }

  // 更新屏幕
  const updateScreen = async () => {
    setScreenUpdating(true);
    const imageData: Uint8Array = new Uint8Array(await invoke("get_screen"));
    drawImage(imageData);
    setScreenUpdating(false);
  }

  // 获得分析部署后的结果
  async function getAnalyzeResult() {
    const imageData: Uint8Array = new Uint8Array(await invoke("get_deploy_analyze_result"));
    drawImage(imageData);
  }

  // 运行任务时执行的函数
  const onRunTask = async (task: string) => {
    setCurrentTask(task);
    setLog([]);
    setImages([]);
    await invoke("run_task", { name: task });
  }

  // 监听后端发来的日志信息
  let unlistenLog: UnlistenFn | null;
  // 监听后端发来的图片信息
  let UnlistenImage: UnlistenFn | null;

  onMount(async () => {
    // 在前端 Card 显示日志信息
    unlistenLog = await listen<string>('log_event', (event) => {
      setLog((prevLog) => [...prevLog, event.payload]);
    })
    // 在前端 canvas 显示图片
    UnlistenImage = await listen<any>('image_event', (event) => {
      const imageData: Uint8Array = new Uint8Array(event.payload);
      setImages((prevImages) => [...prevImages, imageData]);
      // 显示新添加的图像
      setCurrentImageIndex(images().length - 1);
    })
  })

  // 清理监听器
  onCleanup(() => {
    if (unlistenLog) {
      unlistenLog();
    }
    if (UnlistenImage) {
      UnlistenImage();
    }
  })

  createEffect(async () => {
    updateScreen();
    setScreenUpdating(false);
    setTasks(await invoke("get_tasks"));
  });

  createEffect(() => {
    if (images().length > 0) {
      drawImage(images()[currentImageIndex()]);
    }
  })

  return <>
  </>
}

export default MainPage;