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
  // 是否正在执行任务
  const [running, setRunning] = createSignal(false);
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
    setRunning(true);
    setLog([]);
    setImages([]);
    await invoke("run_task", { name: task });
    setRunning(false);
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
    <div class="flex-1 flex w-full max-h-full box-border gap-4">
      {/* Screen part */}
      <Card class="flex-1 flex flex-col gap-2 h-full items-center justify-stretch">
        <div class="flex items-center justify-between border-box ml-2 mr-2">
          <span>Screen</span>
          <Show when={screenUpdating()} fallback={<IconButton onClick={updateScreen}>
            <Refresh />
          </IconButton>}>
            <CircularProgress color="inherit" />
          </Show>
        </div>
        <canvas ref={canvas} class="w-full" />
        <Show when={images().length > 0} fallback={<></>}>
          <div>
            <Button variant="outlined" onClick={() => setCurrentImageIndex((i) => Math.max(i - 1, 0))}>上一张</Button>
            <Button variant="outlined" onClick={() => setCurrentImageIndex((i) => Math.min(i + 1, images().length - 1))}>下一张</Button>
          </div>
        </Show>
        {/* 打印执行信息的地方 */}
        <Card class="w-full pl-4 h-full m-2 flex-1 flex">
          <div class="overflow-y-auto w-full">
            <span>任务执行情况：</span>
            <div>正在执行的任务是：{currentTask()}</div>
            <code>
              <For each={log()}>{(logItem) => <div>{logItem}</div>}</For>
            </code>
          </div>
        </Card>
      </Card>
      {/* Right part */}
      <div class="h-full flex flex-col gap-4">
        <Card class="flex flex-col p-2">
          <div class="mb-4 flex items-center justify-between">
            <span>Tasks</span>
            <Show when={taskUpdating()} fallback={<IconButton onClick={async () => {
              setTaskUpdating(true);
              await invoke("reload_resources");
              setTasks(await invoke("get_tasks"));
              setTaskUpdating(false);
            }}>
              <Refresh />
            </IconButton>}>
              <CircularProgress color="inherit" />
            </Show>
          </div>
          <div class="flex flex-col overflow-y-auto gap-2 min-w-60">
            <For each={tasks()}>
              {(task) => (
                <div class="flex justify-between items-center">
                  <span>{task}</span>
                  <Button variant="contained" onClick={() => { onRunTask(task) }} disabled={running()}>执行任务</Button>
                </div>
              )}
            </For>
          </div>
        </Card>
        <Card class="p-4 flex flex-none gap-24 items-center">
          <span>Analyzers</span>
          <Button variant="contained" onClick={getAnalyzeResult}>分析部署</Button>
        </Card>
      </div>
    </div>
  </>
}

export default MainPage;