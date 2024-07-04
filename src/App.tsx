import { createSignal, For, createEffect, onMount, onCleanup, Show } from "solid-js";
import { UnlistenFn, emit, listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { TextField, Button, IconButton, Card, CircularProgress } from "@suid/material";
import "./App.css";
import { Refresh } from "@suid/icons-material";
import { event } from "@tauri-apps/api";

const local = "127.0.0.1:16384";

function App() {
  let canvas: HTMLCanvasElement | undefined;

  // 设备序列号
  const [serial, setSerial] = createSignal("127.0.0.1:5555");
  // 当前连接状态
  const [connected, setConnected] = createSignal(false);
  const [connecting, setConnecting] = createSignal(false);
  // 更新屏幕状态
  const [screenUpdating, setScreenUpdating] = createSignal(false);
  // 更新任务状态
  const [taskUpdating, setTaskUpdating] = createSignal(false);
  // 执行任务情况的日志信息
  const [log, setLog] = createSignal<string>("");

  createEffect(async () => {
    if (connected()) {
      updateScreen();
      setScreenUpdating(false);

      setTasks(await invoke("get_tasks"));

    }
  })
  const onConnect = async () => {
    if (serial().length > 0 && !connected()) {
      try {
        setConnecting(true);
        await invoke('connect', { serial: serial() })
        setConnected(true);
      } catch (err) {
        console.log(`connect failed: ${err}`)
      } finally {
        setConnecting(false)
      }
    }
  }
  // 任务列表（字符串型数组）
  const [tasks, setTasks] = createSignal<string[]>([]);

  // 将 imageData 绘制在 canvas 上
  const drawImage = async (imageData: Uint8Array) => {
    const ctx = canvas!.getContext("bitmaprenderer");
    const blob = new Blob([imageData], { type: "image/png" });
    const bitmap = await createImageBitmap(blob);
    ctx?.transferFromImageBitmap(bitmap);
  }

  const updateScreen = async () => {
    console.time("get_screen")
    setScreenUpdating(true);
    const imageData: Uint8Array = new Uint8Array(await invoke("get_screen"));
    console.timeEnd("get_screen")
    drawImage(imageData);
    setScreenUpdating(false);
  }

  // 监听后端发来的日志信息
  let unlistenLog: UnlistenFn | null;
  // 监听后端发来的图片信息
  let UnlistenImage: UnlistenFn | null;
  onMount(async () => {
    // 在前端 Card 显示日志信息
    unlistenLog = await listen<string>('log_event', (event) => {
      setLog(event.payload);
    })
    // 在前端 canvas 显示图片
    unlistenLog = await listen('image_event', (event) => {

      const imageData: Uint8Array = new Uint8Array(event.payload);
      drawImage(imageData);
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

  // 获得分析部署后的结果
  async function getAnalyzeResult() {
    const imageData: Uint8Array = new Uint8Array(await invoke("get_deploy_analyze_result"));
    drawImage(imageData);
  }

  const ConnectView = () => <>
    <div class="flex gap-4 w-full justify-center items-center">
      <TextField
        label="序列号"
        variant="outlined"
        value={serial()}
        onChange={(e, v) => {
          setSerial(v);
        }}
      />
      <Button variant="contained" onClick={onConnect} disabled={connecting()}>建立连接</Button>
    </div>
  </>

  return (
    <div class="flex flex-col w-full h-full max-h-full items-center p-4 box-border overflow-hidden">
      <Show when={connected()} fallback={<ConnectView />}>
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
            {/* 打印执行信息的地方 */}
            <Card class="w-11/12 h-64">
              <div>任务执行情况：</div>
              <div>{log()}</div>
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
                      <Button variant="contained" onClick={async () => {
                        await invoke("run_task", { name: task });
                      }}>执行任务</Button>
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
      </Show>
    </div>
  );
}

export default App;
