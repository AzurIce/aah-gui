import { createSignal, onMount, For, createEffect } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { TextField, Button, IconButton } from "@suid/material";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
} from "@suid/material";
import "./App.css";
import { Refresh } from "@suid/icons-material";

const local = "127.0.0.1:16384";

function App() {
  let canvas: HTMLCanvasElement | undefined;

  // 设备序列号
  const [serial, setSerial] = createSignal("");
  // 当前连接状态
  const [connected, setConnected] = createSignal(false);
  // 任务列表（字符串型数组）
  const [tasks, setTasks] = createSignal<string[]>();

  createEffect(async () => {
    if (connected()) {
      updateTasks();
      renderScreen();
    }
  })


  // 输入序列号，点击确认按钮，获取屏幕画面
  async function getScreen() {
    try {
      await invoke("connect", { serial: serial() });
      // 确保在连接成功后设置状态为true
      setConnected(true)
    } catch (error) {
      console.error("Failed to connect or get screen:", error);
    }

  }

  async function renderScreen() {
    // 连接设备并获取图像数据
    // 等待连接成功后再获取并绘制屏幕数据
    if (connected()) {
      console.time("aaa")
      const imageData: Uint8Array = new Uint8Array(await invoke("get_screen"));
      console.timeLog("aaa")
      drawImageOnCanvas(imageData);
      console.timeEnd("aaa")
    }
  }
  // 绘制屏幕画面
  async function drawImageOnCanvas(imageData: Uint8Array) {
    const ctx = canvas!.getContext("bitmaprenderer");
    // 假设imageData是从后端接收到的Uint8Array
    const blob = new Blob([imageData], { type: "image/bmp" });
    const bitmap = await createImageBitmap(blob);
    ctx?.transferFromImageBitmap(bitmap);
  }
  // 更新屏幕画面
  async function updateScreen() {
    await invoke("update_screen")
    renderScreen()
  }
  // 更新任务列表
  async function updateTasks() {
    setTasks(await invoke("get_tasks"));
  }
  // 获得分析部署后的结果
  async function getAnalyzeResult() {
    const imageData: Uint8Array = new Uint8Array(await invoke("get_deploy_analyze_result"));
    drawImageOnCanvas(imageData);
  }
  return (
    <div class="container">
      <IconButton onClick={async () => {
        await invoke("reload_resource");
        updateTasks();
      }}>
        <Refresh />
      </IconButton>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
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
      {/* 将TextField与serial()绑定 */}
      <TextField
        label="序列号"
        variant="outlined"
        value={serial()}
        onChange={(e) => {
          const newSerial = e.currentTarget.value;
          setSerial(newSerial);
          console.log("现在的序列号是：", newSerial);
        }}
      />
      <Button variant="contained" onClick={getScreen}>建立连接</Button>
      <canvas ref={canvas} style={{
        width: '100%',
        height: '100%',
        "aspect-ratio": "1920/1080"
      }}></canvas>
      <Button variant="contained" onClick={getAnalyzeResult}>分析部署</Button>
      <Button variant="outlined" onClick={updateScreen}>更新画面</Button>
    </div>
  );
}

export default App;
