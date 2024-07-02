import { createSignal, For, createEffect, onMount, onCleanup, Show } from "solid-js";
import { UnlistenFn, emit, listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { TextField, Button, IconButton, Card } from "@suid/material";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@suid/material";
import "./App.css";
import { Refresh } from "@suid/icons-material";

const local = "127.0.0.1:16384";

function App() {
  let canvas: HTMLCanvasElement | undefined;

  // 设备序列号
  const [serial, setSerial] = createSignal("127.0.0.1:16384");
  // 当前连接状态
  const [connected, setConnected] = createSignal(false);
  const [connecting, setConnecting] = createSignal(false);
  createEffect(async () => {
    if (connected()) {
      updateScreen();
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
  const [tasks, setTasks] = createSignal<string[]>();

  // 将 imageData 绘制在 canvas 上
  const drawImage = async (imageData: Uint8Array) => {
    const ctx = canvas!.getContext("bitmaprenderer");
    const blob = new Blob([imageData], { type: "image/png" });
    const bitmap = await createImageBitmap(blob);
    ctx?.transferFromImageBitmap(bitmap);
  }

  const updateScreen = async () => {
    const imageData: Uint8Array = new Uint8Array(await invoke("get_screen"));
    drawImage(imageData);
  }

  // screen_updated 事件
  let unlisten: UnlistenFn | null;
  onMount(async () => {
    unlisten = await listen('screen_updated', updateScreen)
  })
  onCleanup(() => {
    if (unlisten) {
      unlisten();
    }
  })

  // 绘制屏幕画面
  async function drawImageOnCanvas(imageData: Uint8Array) {


    // // 获取设备像素比
    // const dpr = window.devicePixelRatio || 1;

    // // 获取目标画布的显示尺寸
    // const displayWidth = canvas!.clientWidth;
    // const displayHeight = canvas!.clientHeight;

    // // 设置目标画布的实际尺寸（考虑设备像素比）
    // canvas!.width = displayWidth * dpr;
    // canvas!.height = displayHeight * dpr;

    // // 创建离屏画布
    // const offscreenCanvas = document.createElement('canvas');
    // offscreenCanvas.width = canvas!.width;
    // offscreenCanvas.height = canvas!.height;
    // const offscreenCtx = offscreenCanvas.getContext("2d");

    // // 确保 offscreenCtx 存在
    // if (offscreenCtx) {
    //   // 清除离屏画布
    //   offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    //   // 加载第一张图片
    //   const img = new Image();
    //   img.src = "/image.PNG";
    //   img.onload = async () => {
    //     offscreenCtx.drawImage(img, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
    //   }

    //   // 设置透明度
    //   offscreenCtx.globalAlpha = 0.5;

    //   // 假设 imageData 是从后端接收到的 Uint8Array
    //   const blob = new Blob([imageData], { type: 'image/bmp' });
    //   const bitmap = await createImageBitmap(blob);

    //   // 在离屏画布上绘制图像
    //   offscreenCtx.drawImage(bitmap, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

    //   // 将离屏画布转换为 ImageBitmap
    //   const finalBitmap = await createImageBitmap(offscreenCanvas);

    //   // 获取 ImageBitmapRenderingContext 并绘制最终图像
    //   const ctx = canvas!.getContext('bitmaprenderer');
    //   if (ctx) {
    //     ctx.transferFromImageBitmap(finalBitmap);
    //   }
    // }
  }

  // 获得分析部署后的结果
  async function getAnalyzeResult() {
    const imageData: Uint8Array = new Uint8Array(await invoke("get_deploy_analyze_result"));
    drawImageOnCanvas(imageData);
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
    <div class="flex flex-col w-full h-full items-center justify-center p-4 box-border">
      <Show when={connected()} fallback={<ConnectView />}>
        <div class="flex-1 flex w-full box-border gap-4">
          <Card class="flex-1 flex flex-col gap-2 h-full items-start justify-stretch">
            <div class="flex items-center justify-between border-box ml-2 mr-2">
              <span>Screen</span>
              <IconButton onClick={updateScreen}>
                <Refresh />
              </IconButton>
            </div>
            <canvas ref={canvas} class="w-full h-full aspect-video" />
          </Card>
          <div class="h-full flex flex-col gap-4">
            <Card class="p-2 flex-1">
              <span>Tasks</span>
              <IconButton onClick={async () => {
                await invoke("reload_resource");
                setTasks(await invoke("get_tasks"));;
              }}>
                <Refresh />
              </IconButton>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 300 }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>任务名称</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <For each={tasks()}>
                      {(task) => (
                        <TableRow
                          sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                        >
                          <TableCell component="th" scope="row">{task}</TableCell>
                          <TableCell><Button variant="contained" onClick={async () => {
                            await invoke("run_task", { name: task });
                          }}>执行任务</Button></TableCell>
                        </TableRow>
                      )}
                    </For>
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
            <Card class="p-2 flex flex-col gap-2">
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
